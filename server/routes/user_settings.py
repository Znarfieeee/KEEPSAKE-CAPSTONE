from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth
from config.settings import supabase, supabase_service_role_client
from gotrue.errors import AuthApiError
from datetime import datetime
from utils.sessions import get_session_data, update_session_activity
from utils.redis_client import redis_client
import re
import json

settings_bp = Blueprint('user_settings', __name__)
SESSION_PREFIX = 'keepsake_session:'
SESSION_TIMEOUT = 1800  # 30 minutes

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

@settings_bp.route('/settings/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change user password"""
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

        if len(new_password) < 8:
            return jsonify({
                "status": "error",
                "message": "Password must be at least 8 characters long"
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

@settings_bp.route('/settings/update-email', methods=['POST'])
@require_auth
def update_email():
    """Update user email address"""
    try:
        user_id = request.current_user.get('id')
        current_email = request.current_user.get('email')
        data = request.json or {}

        new_email = data.get('new_email')
        password = data.get('password')

        # Validation
        if not new_email or not password:
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
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

        # Verify password
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": current_email,
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

        # Update email in auth.users using database function (trigger will sync to public.users)
        try:
            result = supabase.rpc('update_auth_user_email', {
                'p_user_id': user_id,
                'p_new_email': new_email
            }).execute()

            if not result.data:
                raise Exception("Failed to update email")

            current_app.logger.info(f"AUDIT: User {current_email} changed email to {new_email} from IP {request.remote_addr}")

            return jsonify({
                "status": "success",
                "message": "Email updated successfully. Please log in again with your new email."
            }), 200

        except Exception as update_error:
            error_msg = str(update_error)
            current_app.logger.error(f"Failed to update email: {error_msg}")

            # Check for specific error messages
            if "already in use" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Email is already in use"
                }), 409

            return jsonify({
                "status": "error",
                "message": "Failed to update email"
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error updating email: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to update email"
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

        # Check if user has 2FA enabled
        # Note: This is a placeholder implementation
        # You'll need to implement actual 2FA logic based on your requirements

        return jsonify({
            "status": "success",
            "data": {
                "enabled": False,
                "method": None
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
    """Enable 2FA for user account"""
    try:
        user_id = request.current_user.get('id')

        # Placeholder for 2FA implementation
        # You can implement TOTP, SMS, or email-based 2FA

        current_app.logger.info(f"AUDIT: User {user_id} enabled 2FA from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "2FA feature coming soon"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error enabling 2FA: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to enable 2FA"
        }), 500

@settings_bp.route('/settings/2fa/disable', methods=['POST'])
@require_auth
def disable_2fa():
    """Disable 2FA for user account"""
    try:
        user_id = request.current_user.get('id')

        # Placeholder for 2FA implementation

        current_app.logger.info(f"AUDIT: User {user_id} disabled 2FA from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "2FA feature coming soon"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error disabling 2FA: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to disable 2FA"
        }), 500
