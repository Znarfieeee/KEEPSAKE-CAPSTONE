from flask import Blueprint, request, jsonify, current_app, make_response
from config.settings import supabase, supabase_service_role_client
import datetime
import json
from gotrue.errors import AuthApiError
from functools import wraps
from authlib.integrations.flask_client import OAuth
from urllib.parse import urlencode
import os

from utils.sessions import create_session_id, store_session_data, get_session_data, update_session_activity, update_session_tokens
from utils.redis_client import redis_client
from utils.access_control import require_auth, require_role
from utils.audit_logger import audit_access
from utils.token_utils import verify_supabase_jwt, SupabaseJWTError

# Use project-specific cookie names instead of the Supabase defaults
ACCESS_COOKIE = "flask_session"      # short-lived JWT
REFRESH_COOKIE = "flask_session"    # long-lived refresh token
SESSION_PREFIX = "flask_session:"
CACHE_PREFIX = "patient_cache:"
SESSION_TIMEOUT = int(os.environ.get('SESSION_TIMEOUT', 86400 * 30))  # 30 days - no auto-logout for inactive sessions
REFRESH_TOKEN_TIMEOUT = SESSION_TIMEOUT  # Match SESSION_TIMEOUT to prevent premature logout

auth_bp = Blueprint('auth', __name__)

def is_first_login(last_sign_in_at, user_id=None):
    """
    Detect if this is the user's first login based on last_sign_in_at value.
    If last_sign_in_at is NULL/empty, the user hasn't completed their first login yet.

    Args:
        last_sign_in_at: The last_sign_in_at timestamp from users table
        user_id: Optional user_id for logging purposes

    Returns:
        bool: True if this is the first login, False otherwise
    """
    try:
        is_first = last_sign_in_at is None or last_sign_in_at == ''

        if user_id:
            current_app.logger.info(f"FIRST LOGIN CHECK: user_id={user_id}, last_sign_in_at={last_sign_in_at}, is_first_login={is_first}")

        return is_first
    except Exception as e:
        # If there's an error checking, assume not first login for safety
        if user_id:
            current_app.logger.error(f"Error checking first login status for user {user_id}: {str(e)}")
        return False
oauth = OAuth()

def init_google_oauth(app):
    """Initialize Google OAuth with the application"""
    oauth.init_app(app)

    # Check if Google OAuth credentials are configured
    if not os.environ.get('GOOGLE_CLIENT_ID') or not os.environ.get('GOOGLE_CLIENT_SECRET'):
        app.logger.warning("Google OAuth credentials not configured - Google sign-in will be disabled")
        return None

    try:
        google_client = oauth.register(
            name='google',
            client_id=os.environ.get('GOOGLE_CLIENT_ID'),
            client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            authorize_url='https://accounts.google.com/o/oauth2/auth',
            authorize_params=None,
            token_url='https://accounts.google.com/o/oauth2/token',
            access_token_url='https://accounts.google.com/o/oauth2/token',
            refresh_token_url=None,
            client_kwargs={
                'scope': 'openid email profile',
                'token_endpoint_auth_method': 'client_secret_post'
            }
        )
        app.logger.info("Google OAuth initialized successfully")
        return google_client
    except Exception as e:
        app.logger.error(f"Failed to initialize Google OAuth: {e}")
        raise

def render_popup_success(message):
    """Render a success page that communicates with the parent window"""
    # Ensure message is properly encoded
    success_message = "Authentication successful!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication Successful</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 40px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }}
            .container {{
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }}
            .success-icon {{
                font-size: 48px;
                margin-bottom: 20px;
            }}
            h1 {{
                margin: 0 0 10px 0;
                font-size: 24px;
            }}
            p {{
                margin: 0;
                opacity: 0.8;
            }}
            .spinner {{
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top: 2px solid white;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✅</div>
            <h1>Authentication Successful!</h1>
            <p>{success_message}</p>
            <div class="spinner"></div>
            <p style="font-size: 14px; margin-top: 20px;">Closing window...</p>
        </div>
        
        <script>
            // Send success message to parent window
            if (window.opener) {{
                window.opener.postMessage({{
                    type: 'GOOGLE_AUTH_COMPLETE',
                    success: true,
                    data: null
                }}, window.location.origin);
                
                // Close popup after a short delay
                setTimeout(() => {{
                    window.close();
                }}, 2000);
            }} else {{
                // Fallback if no opener (shouldn't happen in normal flow)
                setTimeout(() => {{
                    window.close();
                }}, 3000);
            }}
        </script>
    </body>
    </html>
    """
    
    # Create response with proper encoding
    response = make_response(html_content)
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    return response

def render_popup_error(error_message):
    """Render an error page that communicates with the parent window"""
    # Keep the original error message (don't override it)
    # Sanitize for XSS by escaping HTML characters
    import html
    error_message = html.escape(error_message) if error_message else "Authentication Failed"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication Failed</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 40px 20px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                text-align: center;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }}
            .container {{
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }}
            .error-icon {{
                font-size: 48px;
                margin-bottom: 20px;
            }}
            h1 {{
                margin: 0 0 10px 0;
                font-size: 24px;
            }}
            p {{
                margin: 10px 0;
                opacity: 0.9;
            }}
            .close-btn {{
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
                font-size: 14px;
            }}
            .close-btn:hover {{
                background: rgba(255, 255, 255, 0.3);
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error-icon">❌</div>
            <h1>Authentication Failed</h1>
            <p>{error_message}</p>
            <button class="close-btn" onclick="closeWindow()">Close Window</button>
        </div>
        
        <script>
            function closeWindow() {{
                window.close();
            }}
            
            // Send error message to parent window
            if (window.opener) {{
                window.opener.postMessage({{
                    type: 'GOOGLE_AUTH_COMPLETE',
                    success: false,
                    error: '{error_message}'
                }}, window.location.origin);
            }}
            
            // Auto-close after 10 seconds
            setTimeout(() => {{
                window.close();
            }}, 10000);
        </script>
    </body>
    </html>
    """
    
    # Create response with proper encoding
    response = make_response(html_content)
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    return response

@auth_bp.route('/auth/google', methods=['GET'])
def google_login():
    try:
        # Check if Google OAuth is configured
        if not hasattr(oauth, 'google'):
            current_app.logger.error("Google OAuth not initialized - missing credentials")
            return render_popup_error("Google Sign-In is not configured on this server. Please contact your administrator.")

        google = oauth.google

        # Use the request's scheme and host to build the redirect URI
        redirect_uri = request.url_root.rstrip('/') + '/auth/google/callback'

        current_app.logger.info(f"AUDIT: Google OAuth initiated from IP {request.remote_addr} - Redirect URI: {redirect_uri}")

        return google.authorize_redirect(redirect_uri)

    except AttributeError as e:
        current_app.logger.error(f"AUDIT: Google OAuth not configured - Error: {str(e)}")
        return render_popup_error("Google Sign-In is not available. Please use email and password to log in.")
    except Exception as e:
        current_app.logger.error(f"AUDIT: Google OAuth initiation failed from IP {request.remote_addr} - Error: {str(e)}")
        return render_popup_error("Failed to initiate Google authentication. Please try again.")

@auth_bp.route('/auth/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        # Check if Google OAuth is configured
        if not hasattr(oauth, 'google'):
            current_app.logger.error("Google OAuth not initialized - missing credentials")
            return render_popup_error("Google Sign-In is not configured on this server.")

        # Check for existing session first (same logic as regular login)
        session_id = request.cookies.get('session_id')
        if session_id:
            existing_session = get_session_data(session_id)
            if existing_session:
                # Check if this is first login using session data
                first_login = is_first_login(existing_session.get('last_sign_in_at'))

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
                    'last_sign_in_at': existing_session.get('last_sign_in_at'),
                    'is_first_login': first_login
                }

                current_app.logger.info(f"AUDIT: User {existing_session.get('email')} reused existing session via Google auth from IP {request.remote_addr}")

                return render_popup_success("Authentication successful")

        google = oauth.google
        token = google.authorize_access_token()
        
        if not token:
            current_app.logger.error(f"AUDIT: Google OAuth failed - no token received from IP {request.remote_addr}")
            return render_popup_error("Authentication failed - no token received")
        
        # Get user info from Google
        google_user_info = token.get('userinfo')
        if not google_user_info:
            # Fallback: fetch user info manually
            resp = google.parse_id_token(token)
            google_user_info = resp
            
        if not google_user_info or not google_user_info.get('email'):
            current_app.logger.error(f"AUDIT: Google OAuth failed - no user info from IP {request.remote_addr}")
            return render_popup_error("Failed to get user information from Google")
        
        google_email = google_user_info.get('email')
        google_given_name = google_user_info.get('given_name', '')
        google_family_name = google_user_info.get('family_name', '')
        
        current_app.logger.info(f"AUDIT: Google OAuth callback for {google_email} from IP {request.remote_addr}")
        
        # Check if user exists in Supabase
        try:
            user_query = supabase.table('users').select('*').eq('email', google_email).execute()
            
            if not user_query.data:
                current_app.logger.warning(f"AUDIT: Google OAuth attempted for unregistered email {google_email} from IP {request.remote_addr}")
                return render_popup_error("No account found with this email. Self-registration is disabled. Please contact your healthcare facility to register an account.")
            
            user_record = user_query.data[0]
            
            if not user_record.get('is_active', False):
                current_app.logger.warning(f"AUDIT: Google OAuth attempted for inactive account {google_email} from IP {request.remote_addr}")
                return render_popup_error("Your account has been deactivated. Please contact your healthcare facility administrator for assistance.")
            
            last_sign_in = datetime.datetime.utcnow().isoformat()

            # Check if this is the user's first login using data from user_record
            first_login = is_first_login(user_record.get('last_sign_in_at'), user_record['user_id'])

            # Get the user's facility_id from facility_users table
            get_facility_id = supabase.table('facility_users')\
                .select('facility_id')\
                .eq('user_id', user_record['user_id'])\
                .execute()

            facility_id = get_facility_id.data[0]['facility_id'] if get_facility_id.data else None

            # Create session in Redis (without Supabase tokens since this is Google auth)
            session_id = create_session_id()
            session_data = {
                "id": user_record['user_id'],
                "user_id": user_record['user_id'],
                'email': user_record['email'],
                'role': user_record.get('role'),
                'firstname': user_record.get('firstname', google_given_name),
                'lastname': user_record.get('lastname', google_family_name),
                'specialty': user_record.get('specialty', ''),
                'license_number': user_record.get('license_number', ''),
                'phone_number': user_record.get('phone_number', ''),
                'facility_id': facility_id,
                'last_sign_in_at': last_sign_in,
                'is_first_login': first_login,
                'access_token': None,  # Google auth doesn't use Supabase tokens
                'refresh_token': None,
                'expires_at': (datetime.datetime.utcnow() + datetime.timedelta(seconds=SESSION_TIMEOUT)).isoformat(),
                'auth_provider': 'google'
            }

            store_session_data(session_id, session_data)
            
            current_app.logger.info(f"AUDIT: User {google_email} logged in successfully via Google from IP {request.remote_addr} - Session: {session_id}")
            
            response = make_response(render_popup_success("Authentication successful"))
            
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

            return response
                
        except UnicodeDecodeError as unicode_error:
            current_app.logger.error(f"AUDIT: Unicode decode error during Google auth for {google_email} from IP {request.remote_addr} - Error: {str(unicode_error)}")
            # Clear corrupted sessions
            try:
                from utils.redis_client import clear_corrupted_sessions
                clear_corrupted_sessions()
            except:
                pass
            return render_popup_error("Session data error. Please try logging in again.")
        except Exception as db_error:
            current_app.logger.error(f"AUDIT: Database error during Google auth for {google_email} from IP {request.remote_addr} - Error: {str(db_error)}")
            return render_popup_error("Database connection error. Please try again later.")

    except UnicodeDecodeError as unicode_error:
        current_app.logger.error(f"AUDIT: Unicode decode error in Google OAuth callback from IP {request.remote_addr} - Error: {str(unicode_error)}")
        # Clear corrupted sessions
        try:
            from utils.redis_client import clear_corrupted_sessions
            clear_corrupted_sessions()
        except:
            pass
        return render_popup_error("Session encoding error. Please try logging in again.")
    except AttributeError as e:
        current_app.logger.error(f"AUDIT: Google OAuth not configured - Error: {str(e)}")
        return render_popup_error("Google Sign-In is not available. Please use email and password to log in.")
    except Exception as e:
        current_app.logger.error(f"AUDIT: Google OAuth callback failed from IP {request.remote_addr} - Error: {str(e)}")
        return render_popup_error("Authentication failed. Please try again.")


@auth_bp.route('/auth/cleanup-sessions', methods=['POST'])
def cleanup_sessions_endpoint():
    """Manual endpoint to clean up corrupted sessions - useful for testing"""
    try:
        from utils.redis_client import clear_corrupted_sessions
        corrupted_count = clear_corrupted_sessions()

        return jsonify({
            "status": "success",
            "message": f"Cleaned up {corrupted_count} corrupted sessions",
            "cleaned_count": corrupted_count
        }), 200

    except Exception as e:
        current_app.logger.error(f"Session cleanup failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Cleanup failed: {str(e)}"
        }), 500

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
                # Verify user account is still active before reusing session
                user_status = supabase.table('users')\
                    .select('is_active')\
                    .eq('user_id', existing_session.get('user_id'))\
                    .execute()

                if user_status.data and not user_status.data[0].get('is_active', True):
                    # Clear the invalid session
                    redis_client.delete(f"{SESSION_PREFIX}{session_id}")
                    current_app.logger.warning(f"AUDIT: Session reuse attempted for deactivating account {existing_session.get('email')} from IP {request.remote_addr}")
                    return jsonify({
                        "status": "error",
                        "message": "Your account has been deactivated. Please contact your administrator for assistance."
                    }), 401

                # Check if this is first login using session data
                first_login = is_first_login(existing_session.get('last_sign_in_at'))

                update_session_activity(session_id)
                user_data = {
                    'id': existing_session.get('user_id'),
                    'facility_id': existing_session.get('facility_id'),
                    'email': existing_session.get('email'),
                    'role': existing_session.get('role'),
                    'firstname': existing_session.get('firstname'),
                    'lastname': existing_session.get('lastname'),
                    'specialty': existing_session.get('specialty'),
                    'license_number': existing_session.get('license_number'),
                    'phone_number': existing_session.get('phone_number'),
                    'last_sign_in_at': existing_session.get('last_sign_in_at'),
                    'is_first_login': first_login,
                    'font_size': existing_session.get('font_size')
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
                "message": "Please enter both your email and password."
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
                    "message": "The email or password you entered is incorrect. Please check your credentials and try again."
                }), 401

            if not auth_response.session:
                current_app.logger.error(f"AUDIT: No session returned from Supabase for {email}")
                return jsonify({
                    "status": "error",
                    "message": "Authentication failed. Please try again."
                }), 401

            user_metadata = auth_response.user.user_metadata or {}

            # Consolidated query: Fetch user data with facility relation in ONE query
            # Note: user_2fa_settings is queried separately as it references auth.users, not public.users
            try:
                user_data_response = supabase.table('users').select('''
                    user_id,
                    email,
                    firstname,
                    lastname,
                    specialty,
                    license_number,
                    phone_number,
                    is_active,
                    font_size,
                    last_sign_in_at,
                    role,
                    facility_users!facility_users_user_id_fkey(facility_id)
                ''').eq('user_id', auth_response.user.id).single().execute()

                if not user_data_response.data:
                    current_app.logger.error(f"AUDIT: No user data found for {email}")
                    return jsonify({
                        "status": "error",
                        "message": "User data not found. Please contact your administrator."
                    }), 404

                user_record = user_data_response.data

                # Check if account is active
                if not user_record.get('is_active', True):
                    current_app.logger.warning(f"AUDIT: Login attempted for deactivated account {email} from IP {request.remote_addr}")
                    return jsonify({
                        "status": "error",
                        "message": "Your account has been deactivated. Please contact your administrator for assistance."
                    }), 401

                # Extract facility_id from nested relation (facility_users returns array)
                facility_id = user_record['facility_users'][0]['facility_id'] if user_record.get('facility_users') and len(user_record['facility_users']) > 0 else None

            except Exception as data_fetch_error:
                current_app.logger.error(f"AUDIT: Error fetching user data for {email}: {str(data_fetch_error)}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to retrieve user information. Please try again."
                }), 500

            # Check if user has 2FA enabled (separate query as it references auth.users, not public.users)
            try:
                twofa_response = supabase.table('user_2fa_settings')\
                    .select('is_enabled, method')\
                    .eq('user_id', auth_response.user.id)\
                    .execute()

                twofa_settings = twofa_response.data[0] if twofa_response.data else {}
                is_2fa_enabled = twofa_settings.get('is_enabled', False)

            except Exception as twofa_fetch_error:
                # If 2FA settings fetch fails, assume 2FA is not enabled and continue
                current_app.logger.warning(f"Could not fetch 2FA settings for {email}: {str(twofa_fetch_error)}")
                is_2fa_enabled = False
                twofa_settings = {}

            if is_2fa_enabled:
                # 2FA is enabled - generate verification code and send email
                try:
                    # Generate 2FA login code
                    code_result = supabase.rpc('generate_2fa_login_code', {
                        'p_user_id': auth_response.user.id,
                        'p_ip_address': request.remote_addr,
                        'p_user_agent': request.headers.get('User-Agent', 'Unknown')
                    }).execute()

                    if not code_result.data:
                        raise Exception("Failed to generate 2FA code")

                    code_data = code_result.data
                    code = code_data.get('code')

                    # Get user's name for email personalization
                    user_name = f"{user_metadata.get('firstname', '')} {user_metadata.get('lastname', '')}".strip()

                    # Send verification email via SMTP
                    from utils.email_service import EmailService

                    success, email_msg = EmailService.send_2fa_login_code(
                        recipient_email=email,
                        code=code,
                        user_name=user_name if user_name else None,
                        ip_address=request.remote_addr
                    )

                    if not success:
                        current_app.logger.error(f"Failed to send 2FA login email to {email}: {email_msg}")
                        return jsonify({
                            "status": "error",
                            "message": "Failed to send verification code. Please try again."
                        }), 500

                    current_app.logger.info(f"AUDIT: 2FA login code sent to {email} from IP {request.remote_addr}")

                    # Return 2FA required response
                    return jsonify({
                        "status": "2fa_required",
                        "message": "2FA verification required. Please check your email for verification code.",
                        "user_id": auth_response.user.id,
                        "email": email,
                        "requires_2fa": True
                    }), 200

                except Exception as twofa_error:
                    current_app.logger.error(f"Error during 2FA login flow: {str(twofa_error)}")
                    return jsonify({
                        "status": "error",
                        "message": "An error occurred during 2FA verification. Please try again."
                    }), 500

            # Get user's last sign in time from Supabase auth
            last_sign_in = auth_response.user.last_sign_in_at.isoformat() if auth_response.user.last_sign_in_at else None

            # Check if this is the user's first login using data from consolidated query
            first_login = is_first_login(user_record.get('last_sign_in_at'), auth_response.user.id)

            # Get font_size from consolidated query
            font_size = user_record.get('font_size', 16)

            user_data = {
                'id': auth_response.user.id,
                'email': auth_response.user.email,
                'facility_id': facility_id,
                'role': user_metadata.get('role'),
                'firstname': user_metadata.get('firstname', ''),
                'lastname': user_metadata.get('lastname', ''),
                'specialty': user_metadata.get('specialty', ''),
                'license_number': user_metadata.get('license_number', ''),
                'subscription_expires': user_metadata.get('subscription_expires', ''),
                'phone_number': user_metadata.get('phone_number', ''),
                'last_sign_in_at': last_sign_in,
                'is_first_login': first_login,
                'font_size': font_size,
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

            current_app.logger.info(f"AUDIT: User {email} logged in successfully from IP {request.remote_addr} - Session: {session_id} - is_first_login: {first_login}")

            response = jsonify({
                "status": "success",
                "message": "Login successful!",
                "user": user_data,
                "expires_at": auth_response.session.expires_at,
                "session_id": session_id,
            })

            # Set cookies
            secure_cookie = request.is_secure
            # Use 'None' for cross-origin requests (frontend on different port)
            # This requires secure=True in production but not in development
            cookie_samesite = "None" if secure_cookie else "Lax"

            response.set_cookie(
                'session_id',
                session_id,
                httponly=True,
                secure=secure_cookie,
                samesite=cookie_samesite,
                max_age=SESSION_TIMEOUT,
                path="/",
                domain=None,  # Let browser determine domain (allows localhost:5000 and 127.0.0.1:5000)
            )

            response.set_cookie(
                REFRESH_COOKIE,
                auth_response.session.refresh_token,
                httponly=True,
                secure=secure_cookie,
                samesite=cookie_samesite,
                max_age=REFRESH_TOKEN_TIMEOUT,  # 30 days - matches SESSION_TIMEOUT
                path="/",
                domain=None,  # Let browser determine domain
            )

            return response, 200

        except AuthApiError as auth_error:
            current_app.logger.error(f"AUDIT: Supabase AuthApiError for {email} from IP {request.remote_addr} - Error: {str(auth_error)}")

            # Provide user-friendly error messages based on the auth error
            error_message = str(auth_error).lower()
            if "invalid password" in error_message or "invalid credentials" in error_message:
                user_message = "The email or password you entered is incorrect. Please check your credentials and try again."
            elif "invalid email" in error_message or "email is not valid" in error_message:
                user_message = "Please enter a valid email address."
            elif "user not found" in error_message or "account not found" in error_message:
                user_message = "No account found with this email address. Please contact your administrator if you believe this is an error."
            elif "banned" in error_message or "user is banned" in error_message:
                user_message = "Your account has been suspended or deactivated. Please contact your administrator for assistance."
            elif "account is inactive" in error_message or "user is inactive" in error_message:
                user_message = "Your account has been deactivated. Please contact your administrator for assistance."
            elif "too many attempts" in error_message or "rate limit" in error_message:
                user_message = "Too many login attempts. Please wait a few minutes before trying again."
            else:
                user_message = "Authentication failed. Please verify your email and password."

            return jsonify({
                "status": "error",
                "message": user_message
            }), 401
            
        except Exception as supabase_error:
            current_app.logger.error(f"AUDIT: Supabase connection error for {email} from IP {request.remote_addr} - Error: {str(supabase_error)}")
            return jsonify({
                "status": "error",
                "message": "The authentication service is temporarily unavailable. Please try again in a few minutes."
            }), 503

    except Exception as e:
        current_app.logger.error(f"AUDIT: Login failed for {email if 'email' in locals() else 'unknown'} from IP {request.remote_addr} - Error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred. Please try again."
        }), 500

@auth_bp.route('/verify-2fa-login', methods=['POST'])
def verify_2fa_login():
    """Verify 2FA code during login and complete authentication"""
    try:
        data = request.json or {}
        user_id = data.get('user_id')
        code = data.get('code')

        if not user_id or not code:
            return jsonify({
                "status": "error",
                "message": "User ID and verification code are required"
            }), 400

        # Verify the 2FA login code
        try:
            result = supabase.rpc('verify_2fa_login_code', {
                'p_user_id': user_id,
                'p_code': code
            }).execute()

            if not result.data:
                return jsonify({
                    "status": "error",
                    "message": "Invalid verification code"
                }), 400

        except Exception as verify_error:
            error_msg = str(verify_error)
            current_app.logger.error(f"2FA login verification failed: {error_msg}")

            # Return user-friendly error messages
            if "expired" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Verification code has expired. Please login again."
                }), 400
            elif "invalid" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Invalid verification code. Please try again."
                }), 400
            else:
                return jsonify({
                    "status": "error",
                    "message": "Failed to verify code"
                }), 500

        # Code verified successfully - now complete the login
        # Get user data from Supabase
        user_response = supabase.table('users')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        if not user_response.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        user_record = user_response.data[0]

        # Get user from auth.users using service role client
        from config.settings import supabase_service_role_client
        supabase_admin = supabase_service_role_client()

        auth_user_response = supabase_admin.auth.admin.get_user_by_id(user_id)
        auth_user = auth_user_response.user

        # Create new Supabase session programmatically
        # We need to sign the user in again (they already entered correct password during initial login)
        # However, we can't sign them in again without password, so we'll create a session directly

        # Get facility_id
        get_facility_id = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', user_id)\
            .execute()

        facility_id = get_facility_id.data[0]['facility_id'] if get_facility_id.data else None

        # Check if this is the user's first login using data from user_record
        first_login = is_first_login(user_record.get('last_sign_in_at'), user_id)

        # Get user metadata
        user_metadata = auth_user.user_metadata or {}

        # Get last sign in time
        last_sign_in = auth_user.last_sign_in_at.isoformat() if auth_user.last_sign_in_at else None

        user_data = {
            'id': user_id,
            'email': auth_user.email,
            'facility_id': facility_id,
            'role': user_metadata.get('role'),
            'firstname': user_metadata.get('firstname', ''),
            'lastname': user_metadata.get('lastname', ''),
            'specialty': user_metadata.get('specialty', ''),
            'license_number': user_metadata.get('license_number', ''),
            'subscription_expires': user_metadata.get('subscription_expires', ''),
            'phone_number': user_metadata.get('phone_number', ''),
            'last_sign_in_at': last_sign_in,
            'is_first_login': first_login,
            'font_size': user_record.get('font_size', 16),
        }

        # Create a new Supabase auth session for the user
        # We'll use the service role to create a session since they've already authenticated
        # (supabase_admin already initialized above)

        # Create session tokens
        import time
        import jwt
        from datetime import datetime, timedelta

        # Generate JWT tokens (matching Supabase format)
        secret = os.environ.get('SUPABASE_JWT_SECRET')

        # Access token (short-lived)
        access_payload = {
            'aud': 'authenticated',
            'exp': int(time.time()) + 3600,  # 1 hour
            'sub': user_id,
            'email': auth_user.email,
            'role': 'authenticated',
            'user_metadata': user_metadata
        }
        access_token = jwt.encode(access_payload, secret, algorithm='HS256')

        # Refresh token (long-lived)
        refresh_payload = {
            'exp': int(time.time()) + (60 * 60 * 24 * 7),  # 7 days
            'sub': user_id
        }
        refresh_token = jwt.encode(refresh_payload, secret, algorithm='HS256')

        expires_at = int(time.time()) + 3600

        supabase_tokens = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_at': expires_at,
        }

        # Create session in Redis
        session_id = create_session_id()
        session_data = {
            "user_id": user_id,
            **user_data,
            **supabase_tokens
        }

        store_session_data(session_id, session_data)

        current_app.logger.info(f"AUDIT: User {auth_user.email} completed 2FA login from IP {request.remote_addr} - Session: {session_id}")

        response = jsonify({
            "status": "success",
            "message": "2FA verification successful!",
            "user": user_data,
            "expires_at": expires_at,
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
            domain=None,
        )

        response.set_cookie(
            REFRESH_COOKIE,
            refresh_token,
            httponly=True,
            secure=secure_cookie,
            samesite=cookie_samesite,
            max_age=REFRESH_TOKEN_TIMEOUT,  # 30 days - matches SESSION_TIMEOUT
            path="/",
            domain=None,
        )

        return response, 200

    except Exception as e:
        current_app.logger.error(f"Error verifying 2FA login: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred during verification. Please try again."
        }), 500

@auth_bp.route('/resend-2fa-login-code', methods=['POST'])
def resend_2fa_login_code():
    """Resend 2FA verification code during login"""
    try:
        data = request.json or {}
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User ID is required"
            }), 400

        # Check rate limiting - prevent abuse
        # Get the last code generation time
        last_code_check = supabase.table('user_2fa_verification_codes')\
            .select('created_at')\
            .eq('user_id', user_id)\
            .eq('code_type', 'login')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()

        if last_code_check.data:
            from datetime import datetime, timezone
            last_created = datetime.fromisoformat(last_code_check.data[0]['created_at'].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            time_diff = (now - last_created).total_seconds()

            # Require at least 60 seconds between resend requests
            if time_diff < 60:
                wait_time = int(60 - time_diff)
                return jsonify({
                    "status": "error",
                    "message": f"Please wait {wait_time} seconds before requesting another code"
                }), 429

        # Get user information
        user_response = supabase.table('users')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        if not user_response.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        user_record = user_response.data[0]
        email = user_record.get('email')

        # Generate new 2FA login code (RPC function will check if 2FA is enabled)
        code_result = supabase.rpc('generate_2fa_login_code', {
            'p_user_id': user_id,
            'p_ip_address': request.remote_addr,
            'p_user_agent': request.headers.get('User-Agent', 'Unknown')
        }).execute()

        if not code_result.data:
            raise Exception("Failed to generate 2FA code")

        code_data = code_result.data
        code = code_data.get('code')

        # Get user's name for email personalization
        user_name = f"{user_record.get('firstname', '')} {user_record.get('lastname', '')}".strip()

        # Send verification email via SMTP
        from utils.email_service import EmailService

        success, email_msg = EmailService.send_2fa_login_code(
            recipient_email=email,
            code=code,
            user_name=user_name if user_name else None,
            ip_address=request.remote_addr
        )

        if not success:
            current_app.logger.error(f"Failed to resend 2FA login email to {email}: {email_msg}")
            return jsonify({
                "status": "error",
                "message": "Failed to send verification code. Please try again."
            }), 500

        current_app.logger.info(f"AUDIT: 2FA login code resent to {email} from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "Verification code sent successfully. Please check your email."
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error resending 2FA login code: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while sending the code. Please try again."
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
            'flask_session',
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

        # Verify user account is still active
        user_status = supabase.table('users')\
            .select('is_active')\
            .eq('user_id', session_data.get('user_id'))\
            .execute()

        if user_status.data and not user_status.data[0].get('is_active', True):
            # Clear the invalid session
            redis_client.delete(f"{SESSION_PREFIX}{session_id}")
            return jsonify({
                "status": "error",
                "message": "Your account has been deactivated. Please contact your administrator for assistance."
            }), 401

        # Check if this is first login using session data
        first_login = is_first_login(session_data.get("last_sign_in_at"))

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
            "phone_number": session_data.get("phone_number"),
            "facility_id": session_data.get("facility_id"),
            "last_sign_in_at": session_data.get("last_sign_in_at"),
            "is_first_login": first_login,
            "font_size": session_data.get("font_size", 16)
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

        if not session_id:
            return jsonify({
                "status": "error",
                "message": "No session found"
            }), 401

        try:
            # Get the existing session data
            session_data = get_session_data(session_id)
            if not session_data:
                return jsonify({
                    "status": "error",
                    "message": "Session expired"
                }), 401

            # Check if user authenticated via Google OAuth (no Supabase tokens)
            auth_provider = session_data.get('auth_provider', 'supabase')
            if auth_provider == 'google' or not refresh_token:
                # Google OAuth users don't have Supabase refresh tokens
                # Just update session activity and return current session
                update_session_activity(session_id)

                current_app.logger.info(f"Session refreshed for {auth_provider} user {session_data.get('email')}")

                return jsonify({
                    "status": "success",
                    "message": "Session refreshed successfully",
                    "user": session_data,
                    "expires_at": session_data.get('expires_at')
                }), 200
            
            # Create a new session with the refresh token
            # Note: The Supabase Python client expects the refresh token as a direct parameter
            auth_response = supabase.auth.refresh_session(refresh_token)
            
            if not auth_response or not auth_response.session:
                print("Debug - Failed to get new session from Supabase")
                return jsonify({
                    "status": "error",
                    "message": "Failed to refresh session"
                }), 401
                           
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

            # Set session cookie
            response.set_cookie(
                'session_id',
                session_id,
                httponly=True,
                secure=secure_cookie,
                samesite=cookie_samesite,
                max_age=SESSION_TIMEOUT,
                path="/",
                domain=None
            )

            # Set refresh token cookie with REFRESH_TOKEN_TIMEOUT
            response.set_cookie(
                REFRESH_COOKIE,
                auth_response.session.refresh_token,
                httponly=True,
                secure=secure_cookie,
                samesite=cookie_samesite,
                max_age=REFRESH_TOKEN_TIMEOUT,
                path="/",
                domain=None
            )
          
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
        return jsonify({"error": str(e)}), 
    
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