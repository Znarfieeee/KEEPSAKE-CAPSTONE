from flask import Blueprint, request, jsonify
from config.settings import supabase, supabase_service_role_client
import datetime
import redis, json, logging
from gotrue.errors import AuthApiError
from functools import wraps

# Import token verification helper
from utils.token_utils import verify_supabase_jwt, SupabaseJWTError

# Use project-specific cookie names instead of the Supabase defaults
ACCESS_COOKIE = "keepsake_session"      # short-lived JWT
REFRESH_COOKIE = "keepsake_session"    # long-lived refresh token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/add_user', methods=['POST'])
def add_user():
    """Register a new user in Supabase Auth and mirror the data in the public.users table."""

    data = request.json or {}

    # ------------------------------------------------------------------
    # Extract parameters from request body
    # ------------------------------------------------------------------
    email = data.get("email")
    password = data.get("password")
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    specialty = data.get("specialty")
    role = data.get("role")  # e.g. doctor, parent, admin, etc.
    license_number = data.get("license_number")
    phone_number = data.get("phone_number")

    # Basic validation
    if not email or not password:
        return (
            jsonify({"status": "error", "message": "Email and password are required."}),
            400,
        )
        
    if not firstname or not lastname or not phone_number:
        return (
            jsonify({"status": "error", "message": "Firstname, lastname, and phone number are required."}),
            400,
        )
        
    try:
        # ------------------------------------------------------------------
        # 1) Create the user in Supabase Auth with optional user metadata
        # ------------------------------------------------------------------
        signup_resp = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "firstname": firstname,
                        "lastname": lastname,
                        "specialty": specialty,
                        "role": role,
                        "license_number": license_number,
                        "phone_number": phone_number,
                    }
                },
            }
        )

        # Supabase returns None for user when email confirmation is required.
        if signup_resp.user is None:
            return (
                jsonify({
                    "status": "pending",
                    "message": "Signup successful. Please confirm your email to activate your account.",
                }),
                202,
            )

        user_id = signup_resp.user.id

        return (
            jsonify({
                "status": "success",
                "message": "User created successfully.",
                "user": {
                    "id": user_id,
                    "email": email,
                    "firstname": firstname,
                    "lastname": lastname,
                    "role": role,
                    "metadata": signup_resp.user.user_metadata,
                },
            }),
            201,
        )

    except AuthApiError as auth_error:
        # Specific Supabase Auth failures (e.g., duplicate email)
        return (
            jsonify({"status": "error", "message": str(auth_error)}),
            400,
        )
    except Exception as e:
        # Generic failures
        return (
            jsonify({"status": "error", "message": f"Failed to create user: {str(e)}"}),
            500,
        )

# Invite new user to the platform via email
@auth_bp.route('/create_invite', methods=['POST'])
def create_invite():
    """Create an invitation for a new user using Supabase's invite system"""
    data = request.json
    email = data.get('email')
    child_id = data.get('child_id')
    created_by = data.get('created_by')
    role = data.get('role')
    
    try:
        invite_result = supabase.table('INVITE_TOKENS').insert({
            'email': email,
            'child_id': child_id,
            'token': None,  # Supabase will handle the actual invite token
            'expires_at': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'created_by': created_by,
            'role': role
        }).execute()

        if invite_result.get('error'):
            raise Exception(invite_result.get('error'))

        # Use Supabase's invite user functionality
        invite = supabase.auth.admin.invite_user({
            'email': email,
            'data': {
                'invite_id': invite_result.data[0]['invite_id']
            }
        })
        
        return jsonify({
            "message": "Invite sent successfully",
            "status": "success"
        }), 201

    except Exception as e:
        return jsonify({
            "message": f"Failed to create invite: {str(e)}",
            "status": "error"
        }), 400
        
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        try:
            # Use service role client to bypass RLS
            sr_client = supabase_service_role_client().auth.admin
 
            user_record_resp = (
                supabase_service_role_client()
                .table("users")
                .select("*")
                .eq("email", email)
                .single()
                .execute()
            )
 
            if user_record_resp and user_record_resp.data:
                # We expect only one record per e-mail. Grab the first.
                user_record = user_record_resp.data
 
                # Build a camel-cased payload that is easier to consume on
                # the frontend (AccountPlaceholder expects these keys).
                user_detail = {
                    "firstname": user_record.get("firstname"),
                    "lastname": user_record.get("lastname"),
                    "specialty": user_record.get("specialty"),
                    "role": user_record.get("role"),
                    "id": user_record.get("id") or user_record.get("id"),
                }
 
            # Extract role for downstream logic if available
            user_role = user_detail.get("role") if user_detail else None
 
        except Exception as e:
            # In case of any error (e.g., table doesn't exist), fall back to None.
            print(f"Error fetching user details: {str(e)}")
            user_role = None
            user_detail = None

        # Attempt to sign in
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })

            # ------------------------------------------------------------
            # Build the JSON payload
            # ------------------------------------------------------------
            # Prefer a `role` stored in user_metadata; fall back to the value
            # fetched from the `USERS` table if present.
            metadata_role = (auth_response.user.user_metadata or {}).get("role")
            role = metadata_role or user_role
            
            response = jsonify(
                {
                    "status": "success",
                    "message": "Login successful!",
                    "user": {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "role": role,
                        "metadata": auth_response.user.user_metadata,
                    },
                    "user_detail": user_detail,
                    "expires_at": auth_response.session.expires_at,
                }
            )
            
            access_expires = datetime.datetime.utcfromtimestamp(
                auth_response.session.expires_at
            )

            # Decide whether to mark cookies as "secure" (HTTPS only)
            secure_cookie = request.is_secure  # False on http://localhost

            # Access token (short-lived)
            response.set_cookie(
                ACCESS_COOKIE,
                auth_response.session.access_token,
                httponly=True,
                secure=secure_cookie,
                samesite="Lax",
                expires=access_expires,
                path="/",
            )

            # Refresh token (long-lived)
            response.set_cookie(
                REFRESH_COOKIE,
                auth_response.session.refresh_token,
                httponly=True,
                secure=secure_cookie,
                samesite="Lax",
                max_age=60 * 60 * 24 * 7,
                path="/",
            )

            return response, 200

        except AuthApiError as auth_error:
            # Handle specific Supabase auth errors
            return jsonify({
                "status": "error",
                "message": str(auth_error)
            }), 401

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "An error occurred during login",
            "details": str(e)
        }), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        response = jsonify({
            "status": "success",
            "message": "Logged out successfully",
        })
        
        secure_cookie = request.is_secure
        response.delete_cookie(
            ACCESS_COOKIE,
            path="/",
            secure=secure_cookie,
            samesite="Lax",
        )
        response.delete_cookie(
            REFRESH_COOKIE,
            path="/",
            secure=secure_cookie,
            samesite="Lax",
        )

        return response, 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Error during logout",
            "details": str(e)
        }), 500

@auth_bp.route('/session', methods=['GET'])
def get_session():
    """Return the currently authenticated user if a valid cookie-based session exists."""
    try:
        token = request.cookies.get(ACCESS_COOKIE)
        print(token)
        if not token:
            return jsonify({"status": "error", "message": "No active session"}), 401

        # First, verify the token signature locally for quick fail-fast.
        try:
            claims = verify_supabase_jwt(token)
        except SupabaseJWTError as e:
            return jsonify({"status": "error", "message": str(e)}), 401
        
        sr_client = supabase_service_role_client()

        # Retrieve latest user info from Supabase (optional but gives metadata)
        user_resp = sr_client.auth.get_user(token)
        if user_resp.user is None:
            return jsonify({"status": "error", "message": "Invalid session"}), 401

        user = user_resp.user

        # ------------------------------------------------------------
        # Optionally enrich with additional details from the USERS table
        # ------------------------------------------------------------
        user_detail = None
        try:
            user_record_resp = (
                supabase_service_role_client()
                .table("users")
                .select("*")
                .eq("id", user.id)
                .single()
                .execute()
            )
            if user_record_resp and user_record_resp.data:
                usr = user_record_resp.data
                user_detail = {
                    "firstname": usr.get("firstname"),
                    "lastname": usr.get("lastname"),
                    "specialty": usr.get("specialty"),
                    "role": usr.get("role"),
                    "id": usr.get("id"),
                }
        except Exception as e:
            print(f"Error fetching user details: {str(e)}")

        role = (user.user_metadata or {}).get("role") or (user_detail.get("role") if user_detail else None)

        return (
            jsonify(
                {
                    "status": "success",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": role,
                        "metadata": user.user_metadata,
                    },
                    "user_detail": user_detail,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to fetch session", "details": str(e)}), 500


# ------------------------------------------------------------------
# Token refresh endpoint – uses the refresh token cookie to mint new JWTs
# ------------------------------------------------------------------


@auth_bp.route('/token/refresh', methods=['POST'])
def refresh_token():
    """Issue a new access token using the refresh token stored in the cookie."""
    try:
        refresh_tok = request.cookies.get(REFRESH_COOKIE)
        if not refresh_tok:
            return jsonify({"status": "error", "message": "No refresh token"}), 401

        # Refresh the session with Supabase
        try:
            refreshed = supabase.auth.refresh_session(refresh_tok)
        except Exception as exc:
            return jsonify({"status": "error", "message": f"Failed to refresh session: {exc}"}), 401

        # Generate response and set the new cookies
        response = jsonify({
            "status": "success",
            "message": "Session refreshed",
            "expires_at": refreshed.session.expires_at,
        })

        access_expires = datetime.datetime.utcfromtimestamp(refreshed.session.expires_at)
        secure_cookie = request.is_secure

        response.set_cookie(
            ACCESS_COOKIE,
            refreshed.session.access_token,
            httponly=True,
            secure=secure_cookie,
            samesite="Lax",
            expires=access_expires,
            path="/",
        )

        response.set_cookie(
            REFRESH_COOKIE,
            refreshed.session.refresh_token,
            httponly=True,
            secure=secure_cookie,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7,
            path="/",
        )

        return response, 200

    except Exception as e:
        return jsonify({"status": "error", "message": "Unexpected error during refresh", "details": str(e)}), 500