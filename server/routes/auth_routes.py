from flask import Blueprint, request, jsonify, current_app
from config.settings import supabase, supabase_service_role_client, supabase_anon_client
import datetime
import json
from gotrue.errors import AuthApiError
from functools import wraps

from utils.sessions import create_session_id, store_session_data, get_session_data, update_session_activity, update_session_tokens
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
REFRESH_TOKEN_TIMEOUT = 7 * 24 * 60 * 60  # 7 days

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
            'expires_at': datetime.utcnow() + datetime.timedelta(days=7),
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
        # Check for existing session first
        session_id = request.cookies.get('session_id')
        if session_id:
            existing_session = get_session_data(session_id)
            if existing_session:
                update_session_activity(session_id)
                user_data = {
                    'id': existing_session.get('user_id'),
                    'email': existing_session.get('email'),
                    'role': existing_session.get('role'),
                    'firstname': existing_session.get('firstname'),
                    'lastname': existing_session.get('lastname'),
                    'specialty': existing_session.get('specialty'),
                    'license_number': existing_session.get('license_number'),
                    'phone_number': existing_session.get('phone_number'),
                }
                
                current_app.logger.info(f"AUDIT: User {existing_session.get('email')} reused existing session from IP {request.remote_addr}")
                
                return jsonify({
                    "status": "success",
                    "message": "Already logged in with existing session",
                    "user": user_data,
                    "expires_at": existing_session.get('expires_at'),
                }), 200

        # Get login credentials
        data = request.json or {}
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400

        current_app.logger.info(f"Attempting login for email: {email}")
        
        try:
            # Use the correct client object (not function call!)
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            
            if not auth_response or not auth_response.user:
                current_app.logger.error(f"AUDIT: No user returned from Supabase for {email}")
                return jsonify({
                    "status": "error",
                    "message": "Invalid email or password"
                }), 401
                
            if not auth_response.session:
                current_app.logger.error(f"AUDIT: No session returned from Supabase for {email}")
                return jsonify({
                    "status": "error",
                    "message": "Authentication failed - no session"
                }), 401
            
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
            
            # Create session in Redis
            session_id = create_session_id()
            session_data = {
                "user_id": auth_response.user.id,
                **user_data,
                **supabase_tokens
            }
            
            store_session_data(session_id, session_data)
            
            current_app.logger.info(f"AUDIT: User {email} logged in successfully from IP {request.remote_addr} - Session: {session_id}")
            
            response = jsonify({
                "status": "success",
                "message": "Login successful!",
                "user": user_data,
                "expires_at": auth_response.session.expires_at,
                "session_id": session_id,
            })

            # Set cookies
            secure_cookie = request.is_secure
            cookie_samesite = "None" if secure_cookie else "Lax"

            response.set_cookie(
                'session_id',
                session_id,
                httponly=True,
                secure=secure_cookie,
                samesite=cookie_samesite,
                max_age=SESSION_TIMEOUT,
                path="/",
            )

            response.set_cookie(
                REFRESH_COOKIE,
                auth_response.session.refresh_token,
                httponly=True,
                secure=secure_cookie,
                samesite=cookie_samesite,
                max_age=REFRESH_TOKEN_TIMEOUT,
                path="/",
            )

            return response, 200

        except AuthApiError as auth_error:
            current_app.logger.error(f"AUDIT: Supabase AuthApiError for {email} from IP {request.remote_addr} - Error: {str(auth_error)}")
            return jsonify({
                "status": "error",
                "message": f"Authentication failed: {str(auth_error)}"
            }), 401
            
        except Exception as supabase_error:
            current_app.logger.error(f"AUDIT: Supabase connection error for {email} from IP {request.remote_addr} - Error: {str(supabase_error)}")
            return jsonify({
                "status": "error",
                "message": "Authentication service temporarily unavailable"
            }), 503

    except Exception as e:
        current_app.logger.error(f"AUDIT: Login failed for {email if 'email' in locals() else 'unknown'} from IP {request.remote_addr} - Error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred during login"
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
            "license_number": session_data.get("license_number"),
            "phone_number": session_data.get("phone_number")
        }

        return jsonify({
            "status": "success",
            "message": "Session data retrieved",
            "user": user_data
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": "Failed to fetch session data", 
            "details": str(e)}), 500


# Token refresh endpoint
@auth_bp.route('/token/refresh', methods=['POST'])
def refresh_token():
    """Refresh the user's session token"""
    try:
        # Get the current session ID
        session_id = request.cookies.get('session_id')
        refresh_token = request.cookies.get(REFRESH_COOKIE)
        
        if not session_id or not refresh_token:
            return jsonify({
                "status": "error",
                "message": "No valid session found"
            }), 401
            
        try:
            # Get the existing session data
            session_data = get_session_data(session_id)
            if not session_data:
                return jsonify({
                    "status": "error",
                    "message": "Session expired"
                }), 401
                
            print(f"Debug - Attempting to refresh with token: {refresh_token}")
            
            # Create a new session with the refresh token
            auth_response = supabase.auth.refresh_session({
                "refresh_token": refresh_token
            })
            
            if not auth_response or not auth_response.session:
                print("Debug - Failed to get new session from Supabase")
                return jsonify({
                    "status": "error",
                    "message": "Failed to refresh session"
                }), 401
                
            print(f"Debug - Got new session from Supabase: {auth_response.session.access_token[:20]}...")
                
            # Update the tokens in Redis
            supabase_tokens = {
                'access_token': auth_response.session.access_token,
                'refresh_token': auth_response.session.refresh_token,
                'expires_at': auth_response.session.expires_at,
            }
            
            # Update session with new tokens
            update_session_tokens(session_id, supabase_tokens)
            
            response = jsonify({
                "status": "success",
                "message": "Session refreshed successfully",
                "user": session_data,
                "expires_at": auth_response.session.expires_at
            })
            
            # Update cookies
            secure_cookie = request.is_secure
            cookie_samesite = "None" if secure_cookie else "Lax"
            # Set both cookies with consistent settings
            for cookie_name, cookie_value in [
                ('session_id', session_id),
                (REFRESH_COOKIE, auth_response.session.refresh_token)
            ]:
                response.set_cookie(
                    cookie_name,
                    cookie_value,
                    httponly=True,
                    secure=secure_cookie,
                    samesite=cookie_samesite,
                    max_age=SESSION_TIMEOUT,
                    path="/",
                    domain=None  # Let browser set automatically
                )
            print(f"Debug - Set cookies: session_id and {REFRESH_COOKIE}")
            
            return response, 200
            
        except AuthApiError as auth_error:
            current_app.logger.error(f"AUDIT: Token refresh failed - Error: {str(auth_error)}")
            return jsonify({
                "status": "error",
                "message": str(auth_error)
            }), 401
            
    except Exception as e:
        current_app.logger.error(f"AUDIT: Token refresh failed - Error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to refresh token",
            "details": str(e)
        }), 500


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
    
# Assign facility admin to facility
@auth_bp.route('/admin/<facility_id>/add_facility_admin', methods=['POST'])
@require_auth
@require_role('admin')
def add_facility_admin(facility_id):
    data = request.json or {}
    current_user = request.current_user
    
    email = data.get('email')
    role = data.get('role', 'facility_admin')
    start_date = data.get('start_date') # Optional, default current date naa sa stored procedure
    end_date = data.get('end_date') # Optional rani, if NULL—means permanent
    
    try:
        current_app.logger.info(f"AUDIT: Admin {current_user.get('email')} attempting to assign {email} to facility {facility_id} as {role}")
        # Fetch the user_id from the users table in Supabase by email
        user_resp = supabase.table('users').select('*').eq('email', email).execute()
        
        if not user_resp.data:
            return jsonify({
                "status": "error",
                "message": f"User with email {email} not found"
            }), 404
            
        user_data = user_resp.data[0]
        user_id = user_data['user_id']
        
        if not user_data.get('is_active', False):
            return jsonify({
                "status": "error",
                "message": f"User {email} is not active."
            })
        current_app.logger.info(f"Found user: {user_id} ({email})")
        current_app.logger.info(f"Assigning user {user_id} to facility {facility_id} as {role}")
        
        # Verify facility exists and is active
        facility_resp = supabase.table('healthcare_facilities').select('facility_id, facility_name, subscription_status').eq('facility_id', facility_id).execute()
        
        if not facility_resp.data:
            return jsonify({
                "status": "error",
                "message": f"Facility with ID {facility_id} not found"
            }), 404
            
        facility_data = facility_resp.data[0]
        if facility_data.get('subscription_status') != 'active':
            return jsonify({
                "status": "error",
                "message": f"Facility {facility_data.get('facility_name')} is not active"
            }), 400
            
        # Prepare parameters for the stored procedure
        proc_params = {
            'p_facility_id': facility_id,
            'p_user_id': user_id,
            'p_role': role,
            'p_assigned_by': current_user.get('id')
        }
        # Add optional parameters if provided
        if start_date:
            proc_params['p_start_date'] = start_date
        if end_date:
            proc_params['p_end_date'] = end_date
            
        assign_response = supabase_service_role_client().rpc('assign_user_to_facility', proc_params).execute()
        
        if assign_response.data:
            # The stored procedure returns a table with success, message, and facility_user_record
            result = assign_response.data[0] if assign_response.data else {}
            
            if result.get('success'):
                current_app.logger.info(f"AUDIT: Successfully assigned {email} to facility {facility_id} as {role} by admin {current_user.get('email')}")
                
                return jsonify({
                    "status": "success",
                    "message": result.get('message', 'User assigned to facility successfully'),
                    "assignment_details": result.get('facility_user_record')
                }), 200
            else:
                current_app.logger.error(f"AUDIT: Failed to assign {email} to facility {facility_id}: {result.get('message')}")
                
                return jsonify({
                    "status": "error",
                    "message": result.get('message', 'Failed to assign user to facility')
                }), 400
        else:
            # Check if there was an error in the response
            if assign_response.error:
                current_app.logger.error(f"AUDIT: Supabase error assigning {email} to facility {facility_id}: {assign_response.error}")
                
                return jsonify({
                    "status": "error",
                    "message": f"Database error: {assign_response.error}"
                }), 500
            else:
                return jsonify({
                    "status": "error",
                    "message": "No response from assignment procedure"
                }), 500
            
        
        return jsonify({
            "status": "success",
            "message": "User assigned to facility successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Exception in add_facility_admin for facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign user: {str(e)}"
        }), 500