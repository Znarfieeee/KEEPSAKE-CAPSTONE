from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth
from config.settings import supabase, supabase_service_role_client
from gotrue.errors import AuthApiError
from datetime import datetime
from utils.sessions import get_session_data, update_session_activity
from utils.redis_client import redis_client
from utils.invalidate_cache import invalidate_caches
import re
import json

settings_bp = Blueprint('user_settings', __name__)
SESSION_PREFIX = 'flask_session:'
SESSION_TIMEOUT = 86400 * 30  # 30 days - no auto-logout for inactive sessions

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Phone number validation regex (basic international format)
PHONE_REGEX = re.compile(r'^\+?[1-9]\d{1,14}$')

@settings_bp.route('/settings/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get current user's profile information"""
    try:
        user_id = request.current_user.get('id')

        # Fetch user data from users table
        user_response = supabase.table('users').select('*').eq('user_id', user_id).execute()

        if not user_response.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        user_data = user_response.data[0]

        # Get facility information if assigned
        facility_response = supabase.table('facility_users')\
            .select('*, healthcare_facilities(facility_name, facility_id)')\
            .eq('user_id', user_id)\
            .execute()

        facility_info = None
        if facility_response.data:
            facility_info = facility_response.data[0].get('healthcare_facilities')

        current_app.logger.info(f"AUDIT: User {user_id} retrieved profile from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "data": {
                "user_id": user_data.get('user_id'),
                "email": user_data.get('email'),
                "firstname": user_data.get('firstname'),
                "lastname": user_data.get('lastname'),
                "middlename": user_data.get('middlename'),
                "phone_number": user_data.get('phone_number'),
                "role": user_data.get('role'),
                "specialty": user_data.get('specialty'),
                "license_number": user_data.get('license_number'),
                "is_active": user_data.get('is_active'),
                "facility": facility_info,
                "created_at": user_data.get('created_at'),
                "updated_at": user_data.get('updated_at')
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching profile: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch profile"
        }), 500

@settings_bp.route('/settings/profile', methods=['PUT'])
@require_auth
def update_profile():
    """Update user profile information"""
    try:
        user_id = request.current_user.get('id')
        data = request.json or {}

        # Fields that can be updated
        allowed_fields = ['firstname', 'lastname', 'specialty', 'license_number']
        update_data = {}

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        if not update_data:
            return jsonify({
                "status": "error",
                "message": "No valid fields to update"
            }), 400

        # Update auth.users.raw_user_meta_data using database function
        # The trigger will automatically sync to public.users
        try:
            result = supabase.rpc('update_auth_user_metadata', {
                'p_user_id': user_id,
                'p_metadata': update_data
            }).execute()

            if not result.data:
                raise Exception("Failed to update user metadata")
        except Exception as auth_error:
            current_app.logger.error(f"Failed to update auth metadata: {str(auth_error)}")
            return jsonify({
                "status": "error",
                "message": "Failed to update profile"
            }), 500

        # Update Redis session with new user data
        session_id = request.cookies.get('session_id')
        if session_id:
            try:
                session_data = get_session_data(session_id)
                if session_data:
                    # Update session data with new values
                    for field in allowed_fields:
                        if field in update_data:
                            session_data[field] = update_data[field]

                    session_data['last_activity'] = datetime.utcnow().isoformat()

                    # Re-serialize and store in Redis
                    session_json = json.dumps(session_data, ensure_ascii=False, separators=(',', ':'))
                    redis_client.setex(f"{SESSION_PREFIX}{session_id}", SESSION_TIMEOUT, session_json)

                    current_app.logger.info(f"Redis session updated for user {user_id}")
            except Exception as session_error:
                current_app.logger.warning(f"Failed to update Redis session: {str(session_error)}")

        # Invalidate user cache
        invalidate_caches('users', user_id)

        current_app.logger.info(f"AUDIT: User {user_id} updated profile from IP {request.remote_addr}")

        # Return updated user data for frontend to update AuthContext
        updated_user = {
            "id": user_id,
            "email": request.current_user.get('email'),
            "role": request.current_user.get('role'),
            "firstname": update_data.get('firstname', request.current_user.get('firstname')),
            "lastname": update_data.get('lastname', request.current_user.get('lastname')),
            "specialty": update_data.get('specialty', request.current_user.get('specialty')),
            "license_number": update_data.get('license_number', request.current_user.get('license_number')),
            "phone_number": request.current_user.get('phone_number'),
            "facility_id": request.current_user.get('facility_id'),
        }

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully",
            "user": updated_user
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to update profile"
        }), 500

def validate_password_strength(password):
    """
    Validate password strength against security requirements.
    Returns tuple: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None

@settings_bp.route('/settings/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change user password and update last_signed_in_at"""
    try:
        user_id = request.current_user.get('id')
        email = request.current_user.get('email')
        data = request.json or {}

        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        # Validation
        if not current_password or not new_password or not confirm_password:
            return jsonify({
                "status": "error",
                "message": "All password fields are required"
            }), 400

        if new_password != confirm_password:
            return jsonify({
                "status": "error",
                "message": "New passwords do not match"
            }), 400

        # Validate password strength
        is_valid, error_msg = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 400

        # Verify current password by attempting to sign in
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": current_password
            })

            if not auth_response or not auth_response.user:
                return jsonify({
                    "status": "error",
                    "message": "Current password is incorrect"
                }), 401
        except AuthApiError:
            return jsonify({
                "status": "error",
                "message": "Current password is incorrect"
            }), 401

        # Update password using database function
        try:
            result = supabase.rpc('update_auth_user_password', {
                'p_user_id': user_id,
                'p_new_password': new_password
            }).execute()

            if not result.data:
                raise Exception("Failed to update password")

            current_app.logger.info(f"AUDIT: User {email} changed password from IP {request.remote_addr}")

            return jsonify({
                "status": "success",
                "message": "Password changed successfully"
            }), 200

        except Exception as update_error:
            current_app.logger.error(f"Failed to update password: {str(update_error)}")
            return jsonify({
                "status": "error",
                "message": "Failed to update password"
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error changing password: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to change password"
        }), 500

@settings_bp.route('/settings/complete-first-login', methods=['POST'])
@require_auth
def complete_first_login():
    """Mark first login as complete by updating last_signed_in_at"""
    try:
        user_id = request.current_user.get('id')
        email = request.current_user.get('email')

        # Update last_signed_in_at in public.users table
        now = datetime.utcnow().isoformat()
        users_update = supabase.table('users').update({
            'last_sign_in_at': now
        }).eq('user_id', user_id).execute()

        if not users_update.data:
            current_app.logger.warning(f"Failed to update last_signed_in_at for user {email}")
            return jsonify({
                "status": "error",
                "message": "Failed to complete first login"
            }), 500

        # Invalidate user cache
        invalidate_caches('users', user_id)

        current_app.logger.info(f"AUDIT: User {email} completed first login from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "First login completed successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error completing first login: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to complete first login"
        }), 500

@settings_bp.route('/settings/request-email-change', methods=['POST'])
@require_auth
def request_email_change():
    """Request email change with verification code"""
    try:
        user_id = request.current_user.get('id')
        current_email = request.current_user.get('email')
        data = request.json or {}

        new_email = data.get('new_email')

        # Validation
        if not new_email:
            return jsonify({
                "status": "error",
                "message": "New email is required"
            }), 400

        if not EMAIL_REGEX.match(new_email):
            return jsonify({
                "status": "error",
                "message": "Invalid email format"
            }), 400

        if new_email == current_email:
            return jsonify({
                "status": "error",
                "message": "New email must be different from current email"
            }), 400

        # Initiate email change verification
        try:
            result = supabase.rpc('initiate_email_change_verification', {
                'p_user_id': user_id,
                'p_new_email': new_email
            }).execute()

            if not result.data:
                raise Exception("Failed to initiate email change")

            verification_data = result.data

            # Log for development - in production, send actual email
            current_app.logger.info(f"AUDIT: Email change verification requested by {current_email} to {new_email} from IP {request.remote_addr}")
            current_app.logger.info(f"Email Change Code for {current_email}: {verification_data.get('code')}")

            return jsonify({
                "status": "success",
                "message": f"Verification code sent to {current_email}. Please check your email.",
                "code": verification_data.get('code'),  # Remove this in production
                "new_email": new_email,
                "expires_in": "10 minutes"
            }), 200

        except Exception as verification_error:
            error_msg = str(verification_error)
            current_app.logger.error(f"Failed to initiate email change: {error_msg}")

            # Check for specific error messages
            if "already in use" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Email is already in use"
                }), 409

            return jsonify({
                "status": "error",
                "message": "Failed to initiate email change"
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error requesting email change: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to request email change"
        }), 500

@settings_bp.route('/settings/verify-email-change', methods=['POST'])
@require_auth
def verify_email_change():
    """Verify email change code and update email"""
    try:
        user_id = request.current_user.get('id')
        current_email = request.current_user.get('email')
        data = request.json or {}

        code = data.get('code')

        if not code:
            return jsonify({
                "status": "error",
                "message": "Verification code is required"
            }), 400

        # Verify the code and update email
        try:
            result = supabase.rpc('verify_email_change_code', {
                'p_user_id': user_id,
                'p_code': code
            }).execute()

            if result.data:
                current_app.logger.info(f"AUDIT: User {current_email} successfully changed email from IP {request.remote_addr}")

                return jsonify({
                    "status": "success",
                    "message": "Email updated successfully. Please log in again with your new email."
                }), 200
            else:
                return jsonify({
                    "status": "error",
                    "message": "Invalid verification code"
                }), 400

        except Exception as verify_error:
            error_msg = str(verify_error)
            current_app.logger.error(f"Email change verification failed: {error_msg}")

            # Return user-friendly error messages
            if "expired" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Verification code has expired. Please request a new code."
                }), 400
            elif "invalid" in error_msg.lower() or "no email change request" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Invalid verification code. Please try again."
                }), 400
            elif "already in use" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Email is already in use by another account."
                }), 409
            else:
                return jsonify({
                    "status": "error",
                    "message": "Failed to verify code"
                }), 500

    except Exception as e:
        current_app.logger.error(f"Error verifying email change: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to verify email change"
        }), 500

@settings_bp.route('/settings/update-phone', methods=['POST'])
@require_auth
def update_phone():
    """Update user phone number"""
    try:
        user_id = request.current_user.get('id')
        data = request.json or {}

        new_phone = data.get('phone_number')
        password = data.get('password')

        # Validation
        if not new_phone or not password:
            return jsonify({
                "status": "error",
                "message": "Phone number and password are required"
            }), 400

        # Verify password
        try:
            email = request.current_user.get('email')
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if not auth_response or not auth_response.user:
                return jsonify({
                    "status": "error",
                    "message": "Password is incorrect"
                }), 401
        except AuthApiError:
            return jsonify({
                "status": "error",
                "message": "Password is incorrect"
            }), 401

        # Update auth.users.raw_user_meta_data using database function (trigger will sync to public.users)
        try:
            result = supabase.rpc('update_auth_user_metadata', {
                'p_user_id': user_id,
                'p_metadata': {"phone_number": new_phone}
            }).execute()

            if not result.data:
                raise Exception("Failed to update phone number")
        except Exception as auth_error:
            current_app.logger.error(f"Failed to update auth metadata: {str(auth_error)}")
            return jsonify({
                "status": "error",
                "message": "Failed to update phone number"
            }), 500

        # Update Redis session with new phone number
        session_id = request.cookies.get('session_id')
        if session_id:
            try:
                session_data = get_session_data(session_id)
                if session_data:
                    session_data['phone_number'] = new_phone
                    session_data['last_activity'] = datetime.utcnow().isoformat()

                    session_json = json.dumps(session_data, ensure_ascii=False, separators=(',', ':'))
                    redis_client.setex(f"{SESSION_PREFIX}{session_id}", SESSION_TIMEOUT, session_json)

                    current_app.logger.info(f"Redis session updated with new phone for user {user_id}")
            except Exception as session_error:
                current_app.logger.warning(f"Failed to update Redis session: {str(session_error)}")

        # Invalidate user cache
        invalidate_caches('users', user_id)

        current_app.logger.info(f"AUDIT: User {user_id} updated phone number from IP {request.remote_addr}")

        # Return updated user data for frontend
        updated_user = {
            "id": user_id,
            "email": request.current_user.get('email'),
            "role": request.current_user.get('role'),
            "firstname": request.current_user.get('firstname'),
            "lastname": request.current_user.get('lastname'),
            "middlename": request.current_user.get('middlename'),
            "specialty": request.current_user.get('specialty'),
            "license_number": request.current_user.get('license_number'),
            "phone_number": new_phone,
            "facility_id": request.current_user.get('facility_id'),
        }

        return jsonify({
            "status": "success",
            "message": "Phone number updated successfully",
            "user": updated_user
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating phone: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to update phone number"
        }), 500

@settings_bp.route('/settings/deactivate-account', methods=['POST'])
@require_auth
def deactivate_account():
    """Deactivate user account"""
    try:
        user_id = request.current_user.get('id')
        email = request.current_user.get('email')
        data = request.json or {}

        password = data.get('password')
        confirmation = data.get('confirmation')

        # Validation
        if not password:
            return jsonify({
                "status": "error",
                "message": "Password is required"
            }), 400

        if confirmation != "DEACTIVATE":
            return jsonify({
                "status": "error",
                "message": "Please type 'DEACTIVATE' to confirm"
            }), 400

        # Verify password
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if not auth_response or not auth_response.user:
                return jsonify({
                    "status": "error",
                    "message": "Password is incorrect"
                }), 401
        except AuthApiError:
            return jsonify({
                "status": "error",
                "message": "Password is incorrect"
            }), 401

        # Deactivate account in users table
        deactivate_response = supabase.table('users').update({
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()

        if not deactivate_response.data:
            return jsonify({
                "status": "error",
                "message": "Failed to deactivate account"
            }), 500
            
        # Invalidate user cache
        invalidate_caches('users', user_id)

        # Clear user's session from Redis
        session_id = request.cookies.get('session_id')
        if session_id:
            redis_client.delete(f"flask_session:{session_id}")

        # Try to ban user in Supabase auth
        sr_client = supabase_service_role_client()

        if getattr(getattr(sr_client, 'auth', None), "admin", None):
            try:
                if hasattr(sr_client.auth.admin, "update_user"):
                    sr_client.auth.admin.update_user(user_id, {
                        "ban_duration": "876600h"  # Ban for ~100 years (effectively permanent)
                    })
                elif hasattr(sr_client.auth.admin, "update_user_by_id"):
                    sr_client.auth.admin.update_user_by_id(user_id, {
                        "ban_duration": "876600h"  # Ban for ~100 years (effectively permanent)
                    })

            except Exception as admin_err:
                current_app.logger.warning(f"Service-role admin update failed: {admin_err}")
                # Don't raise - the is_active=False in users table is the primary check

        current_app.logger.info(f"AUDIT: User {email} deactivated account from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "Account deactivated successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deactivating account: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to deactivate account"
        }), 500

@settings_bp.route('/settings/2fa/status', methods=['GET'])
@require_auth
def get_2fa_status():
    """Get 2FA status for current user"""
    try:
        user_id = request.current_user.get('id')

        # Check if user has 2FA settings
        settings_response = supabase.table('user_2fa_settings')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        if settings_response.data:
            settings = settings_response.data[0]
            return jsonify({
                "status": "success",
                "data": {
                    "enabled": settings.get('is_enabled', False),
                    "method": settings.get('method', 'email'),
                    "verified_at": settings.get('verified_at')
                }
            }), 200
        else:
            return jsonify({
                "status": "success",
                "data": {
                    "enabled": False,
                    "method": None,
                    "verified_at": None
                }
            }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching 2FA status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch 2FA status"
        }), 500

@settings_bp.route('/settings/2fa/enable', methods=['POST'])
@require_auth
def enable_2fa():
    """Send 2FA verification code to user's email"""
    try:
        user_id = request.current_user.get('id')
        email = request.current_user.get('email')

        # Initiate 2FA email verification
        result = supabase.rpc('initiate_2fa_email_verification', {
            'p_user_id': user_id
        }).execute()

        if not result.data:
            raise Exception("Failed to initiate 2FA verification")

        verification_data = result.data
        code = verification_data.get('code')

        # Get user's name for email personalization
        user_response = supabase.table('users').select('firstname, lastname').eq('user_id', user_id).execute()
        user_name = None
        if user_response.data:
            user = user_response.data[0]
            user_name = f"{user.get('firstname', '')} {user.get('lastname', '')}"  .strip()

        # Send verification email via SMTP
        from utils.email_service import EmailService

        success, email_msg = EmailService.send_2fa_setup_code(
            recipient_email=email,
            code=code,
            user_name=user_name if user_name else None
        )

        if not success:
            current_app.logger.error(f"Failed to send 2FA setup email to {email}: {email_msg}")
            return jsonify({
                "status": "error",
                "message": "Failed to send verification email. Please try again."
            }), 500

        current_app.logger.info(f"AUDIT: 2FA verification code sent to {email} from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": f"Verification code sent to {email}. Please check your email.",
            "expires_in": "10 minutes"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error enabling 2FA: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to enable 2FA"
        }), 500

@settings_bp.route('/settings/2fa/verify', methods=['POST'])
@require_auth
def verify_2fa():
    """Verify 2FA code and enable 2FA"""
    try:
        user_id = request.current_user.get('id')
        data = request.json or {}

        code = data.get('code')

        if not code:
            return jsonify({
                "status": "error",
                "message": "Verification code is required"
            }), 400

        # Verify the code using database function
        try:
            result = supabase.rpc('verify_2fa_code', {
                'p_user_id': user_id,
                'p_code': code
            }).execute()

            if result.data:
                current_app.logger.info(f"AUDIT: User {user_id} enabled 2FA from IP {request.remote_addr}")

                # Send confirmation email
                email = request.current_user.get('email')
                user_response = supabase.table('users').select('firstname, lastname').eq('user_id', user_id).execute()
                user_name = None
                if user_response.data:
                    user = user_response.data[0]
                    user_name = f"{user.get('firstname', '')} {user.get('lastname', '')}".strip()

                from utils.email_service import EmailService
                EmailService.send_2fa_enabled_notification(
                    recipient_email=email,
                    user_name=user_name if user_name else None
                )

                return jsonify({
                    "status": "success",
                    "message": "Two-factor authentication enabled successfully"
                }), 200
            else:
                return jsonify({
                    "status": "error",
                    "message": "Invalid verification code"
                }), 400

        except Exception as verify_error:
            error_msg = str(verify_error)
            current_app.logger.error(f"2FA verification failed: {error_msg}")

            # Return user-friendly error messages
            if "expired" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Verification code has expired. Please request a new code."
                }), 400
            elif "invalid" in error_msg.lower() or "no verification code" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Invalid verification code. Please try again."
                }), 400
            else:
                return jsonify({
                    "status": "error",
                    "message": "Failed to verify code"
                }), 500

    except Exception as e:
        current_app.logger.error(f"Error verifying 2FA: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to verify 2FA"
        }), 500

@settings_bp.route('/settings/2fa/disable', methods=['POST'])
@require_auth
def disable_2fa():
    """Disable 2FA for user account"""
    try:
        user_id = request.current_user.get('id')
        email = request.current_user.get('email')
        data = request.json or {}

        password = data.get('password')

        # Require password confirmation to disable 2FA
        if not password:
            return jsonify({
                "status": "error",
                "message": "Password is required to disable 2FA"
            }), 400

        # Verify password
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if not auth_response or not auth_response.user:
                return jsonify({
                    "status": "error",
                    "message": "Password is incorrect"
                }), 401
        except AuthApiError:
            return jsonify({
                "status": "error",
                "message": "Password is incorrect"
            }), 401

        # Disable 2FA
        result = supabase.rpc('disable_2fa', {
            'p_user_id': user_id
        }).execute()

        if result.data:
            current_app.logger.info(f"AUDIT: User {user_id} disabled 2FA from IP {request.remote_addr}")

            # Send confirmation email
            user_response = supabase.table('users').select('firstname, lastname').eq('user_id', user_id).execute()
            user_name = None
            if user_response.data:
                user = user_response.data[0]
                user_name = f"{user.get('firstname', '')} {user.get('lastname', '')}".strip()

            from utils.email_service import EmailService
            EmailService.send_2fa_disabled_notification(
                recipient_email=email,
                user_name=user_name if user_name else None
            )

            return jsonify({
                "status": "success",
                "message": "Two-factor authentication disabled successfully"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to disable 2FA"
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error disabling 2FA: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to disable 2FA"
        }), 500

@settings_bp.route('/settings/font-size', methods=['GET'])
@require_auth
def get_font_size():
    """Get current user's font size preference"""
    try:
        user_id = request.current_user.get('id')

        # Fetch font_size from users table
        user_response = supabase.table('users')\
            .select('font_size')\
            .eq('user_id', user_id)\
            .execute()

        if not user_response.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        font_size = user_response.data[0].get('font_size', 16)

        current_app.logger.info(f"AUDIT: User {user_id} retrieved font size from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "data": {"font_size": font_size}
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching font size: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch font size"
        }), 500

@settings_bp.route('/settings/font-size', methods=['PUT'])
@require_auth
def update_font_size():
    """Update user's font size preference"""
    try:
        user_id = request.current_user.get('id')
        data = request.json or {}
        font_size = data.get('font_size')

        # Validation
        if font_size is None:
            return jsonify({"status": "error", "message": "Font size is required"}), 400

        if not isinstance(font_size, int):
            return jsonify({"status": "error", "message": "Font size must be an integer"}), 400

        # Range validation (12-20px)
        if font_size < 12 or font_size > 20:
            return jsonify({
                "status": "error",
                "message": "Font size must be between 12 and 20 pixels"
            }), 400

        # Update using RPC function (maintains consistency)
        result = supabase.rpc('update_auth_user_metadata', {
            'p_user_id': user_id,
            'p_metadata': {"font_size": font_size}
        }).execute()
        
        update_response = supabase.table('users').update({
            'font_size': font_size,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()

        if not result.data:
            raise Exception("Failed to update font size")

        if not update_response:
            raise Exception("Failed to update font size")

        # Update Redis session
        session_id = request.cookies.get('session_id')
        if session_id:
            try:
                session_data = get_session_data(session_id)
                if session_data:
                    session_data['font_size'] = font_size
                    session_data['last_activity'] = datetime.utcnow().isoformat()
                    session_json = json.dumps(session_data, ensure_ascii=False, separators=(',', ':'))
                    redis_client.setex(f"{SESSION_PREFIX}{session_id}", SESSION_TIMEOUT, session_json)
                    current_app.logger.info(f"Redis session updated with font size for user {user_id}")
            except Exception as session_error:
                current_app.logger.warning(f"Failed to update Redis session: {str(session_error)}")

        # Invalidate user cache
        invalidate_caches('users', user_id)

        current_app.logger.info(f"AUDIT: User {user_id} updated font size to {font_size}px from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "Font size updated successfully",
            "user": {"id": user_id, "font_size": font_size}
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating font size: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to update font size"}), 500
