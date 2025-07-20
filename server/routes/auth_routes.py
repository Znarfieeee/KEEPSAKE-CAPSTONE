from flask import Blueprint, request, jsonify, session, current_app
from config.settings import supabase, supabase_service_role_client
import datetime
import redis, json, logging
from gotrue.errors import AuthApiError
from functools import wraps

from utils.sessions import create_session_id, store_session_data, get_session_data, update_session_activity
from utils.redis_client import redis_client
from utils.access_control import require_auth, require_role
from utils.audit_logger import audit_access
from utils.token_utils import verify_supabase_jwt, SupabaseJWTError

# Use project-specific cookie names instead of the Supabase defaults
ACCESS_COOKIE = "keepsake_session"      # short-lived JWT
REFRESH_COOKIE = "keepsake_session"    # long-lived refresh token
SESSION_PREFIX = "keepsake_session:"
CACHE_PREFIX = "patient_cache:"
SESSION_TIMEOUT = 1800 #30 minutes

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

        # Authenticate with Supabase
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            
            user_metadata = auth_response.user.user_metadata or {}

            user_data = {
                'id': auth_response.user.id,
                'email': auth_response.user.email,
                'role': user_metadata.get('role'),
                'firstname': user_metadata.get('firstname', ''),
                'lastname': user_metadata.get('lastname', ''),
                'specialty': user_metadata.get('specialty', ''),
                'license_number': user_metadata.get('license_number', ''),
                'phone_number': user_metadata.get('phone_number', ''),
            }
            
            supabase_tokens = {
                'access_token': auth_response.session.access_token,
                'refresh_token': auth_response.session.refresh_token,
                'expires_at': auth_response.session.expires_at,
            }
            
            #Create session in Redis
            session_id = create_session_id()
            store_session_data(session_id, user_data, supabase_tokens)
            
            current_app.logger.info(f"AUDIT: User {email} logged in from IP {request.remote_addr} - Session: {session_id}")                        
            
            response = jsonify(
                {
                    "status": "success",
                    "message": "Login successful!",
                    "user": user_data,
                    "user_detail": user_data,  # kept for backward compatibility
                    "expires_at": auth_response.session.expires_at,
                }
            )
            print(response)

            # Set cookies
            secure_cookie = request.is_secure
            access_expires = datetime.datetime.utcfromtimestamp(
                auth_response.session.expires_at
            )
            
            response.set_cookie(
                'session_id',
                session_id,
                httponly = True,
                secure = secure_cookie,
                samesite = "Lax",
                max_age = SESSION_TIMEOUT,
                path = "/",
            )

            # Refresh token (long-lived)
            response.set_cookie(
                REFRESH_COOKIE,
                auth_response.session.refresh_token,
                httponly=True,
                secure=secure_cookie,
                samesite="Lax",
                max_age=SESSION_TIMEOUT,
                path="/",
            )

            return response, 200

        except AuthApiError as auth_error:
            current_app.logger.error(f"AUDIT: Login failed for user {email} from IP {request.remote_addr} - Error: {str(auth_error)}")
            return jsonify({
                "status": "error",
                "message": str(auth_error)
            }), 401

    except Exception as e:
        current_app.logger.error(f"AUDIT: Login failed for user {email} from IP {request.remote_addr} - Error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred during login",
            "details": str(e)
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    try:
        session_id = request.cookies.get('session_id')
        user_id = request.current_user.get('id')
        
        # Remove session from Redis
        if session_id:
            redis_client.delete(f"{SESSION_PREFIX}{session_id}")
        
        # Clear cached patient data for this current user
        pattern = f"{CACHE_PREFIX}{user_id}*"
        cached_keys = redis_client.keys(pattern)
        if cached_keys:
            redis_client.delete(*cached_keys)
        
        current_app.logger.info(f"AUDIT: User {user_id} logged out from IP {request.remote_addr}")
        
        response = jsonify({
            "status": "success",
            "message": "Logged out successfully",
        })
        
        # Clear session cookie
        secure_cookie = request.is_secure
        response.delete_cookie(
            'session_id',
            path="/",
            secure=secure_cookie,
            samesite="Lax",
        )
        response.delete_cookie(
            'keepsake_session',
            path="/",
            secure=secure_cookie,
            samesite="Lax",
        )

        return response, 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Logout failed for user {user_id} from IP {request.remote_addr} - Error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Error during logout",
            "details": str(e)
        }), 500
        
@auth_bp.route('/session', methods=['GET'])
def get_session():
    """Get the current user's Redis session data"""
    try:
        session_id = request.cookies.get('session_id')
        if not session_id:
            return jsonify({
                "status": "error",
                "message": "No session found"
            }), 401
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "status": "error", 
                "message": "Session expired"
            }), 401
            
        update_session_activity(session_id)
        
        # Return user data from session
        user_data = {
            "id": session_data.get("user_id"),
            "email": session_data.get("email"),
            "role": session_data.get("role"),
            "firstname": session_data.get("firstname"),
            "lastname": session_data.get("lastname"),
            "specialty": session_data.get("specialty"),
        }

        return jsonify({
            "status": "success",
            "message": "Session data retrieved",
            "session": session_data
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": "Failed to fetch session data", 
            "details": str(e)}), 500

# Session management endpoints
@auth_bp.route('/admin/sessions', methods=['GET'])
@require_auth
@require_role('admin')
def list_active_sessions():
    """List all active sessions (admin only)"""
    try:
        pattern = f"{SESSION_PREFIX}*"
        session_keys = redis_client.keys(pattern)
        
        active_sessions = []
        for key in session_keys:
            session_data = redis_client.get(key)
            if session_data:
                data = json.loads(session_data)
                active_sessions.append({
                    'session_id': key.replace(SESSION_PREFIX, ''),
                    'user_id': data.get('user_id'),
                    'email': data.get('email'),
                    'role': data.get('role'),
                    'created_at': data.get('created_at'),
                    'last_activity': data.get('last_activity')
                })
        
        return jsonify({
            "active_sessions": active_sessions,
            "count": len(active_sessions)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500