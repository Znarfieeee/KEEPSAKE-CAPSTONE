from flask import Flask, jsonify, request, current_app, Blueprint
from utils.access_control import require_auth, require_role
from config.settings import supabase
from utils.redis_client import get_redis_client
from utils.invalidate_cache import invalidate_caches
from gotrue.errors import AuthApiError
import json
import datetime
import secrets
import string

fusers_bp = Blueprint('facility_users', __name__)
redis_client = get_redis_client()

FACILITY_USERS_CACHE_KEY = 'facility_users:all'
FACILITY_USERS_CACHE_PREFIX = 'facility_users:'

def generate_secure_password(length=12):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def prepare_facility_user_response(facility_user_data, user_data):
    """Prepare facility user data for response"""
    return {
        "user_id": facility_user_data.get('user_id'),
        "facility_id": facility_user_data.get('facility_id'),
        "role": facility_user_data.get('role'),
        "department": facility_user_data.get('department'),
        "start_date": facility_user_data.get('start_date'),
        "end_date": facility_user_data.get('end_date'),
        "assigned_by": facility_user_data.get('assigned_by'),
        "created_at": facility_user_data.get('created_at'),
        "updated_at": facility_user_data.get('updated_at'),
        "user_info": {
            "firstname": user_data.get('firstname'),
            "lastname": user_data.get('lastname'),
            "email": user_data.get('email'),
            "specialty": user_data.get('specialty'),
            "license_number": user_data.get('license_number'),
            "phone_number": user_data.get('phone_number'),
            "is_active": user_data.get('is_active'),
            "created_at": user_data.get('created_at')
        }
    }

@fusers_bp.route('/facility_users', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor')
def get_facility_users():
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        current_user = request.current_user

        # Validate facility_id exists
        if not current_user.get('facility_id'):
            current_app.logger.error(f"User {request.current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        cache_key = f"{FACILITY_USERS_CACHE_PREFIX}{current_user.get('facility_id')}"

        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                current_app.logger.info(f"Retrieved facility users from cache for facility {current_user.get('facility_id')}")
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200

        # JOIN facility_users with users table - equivalent to your SQL query
        facility_users_resp = supabase.table('facility_users').select(
            '''
            facility_id,
            user_id,
            role,
            department,
            start_date,
            end_date,
            assigned_by,
            created_at,
            updated_at,
            department,
            users:users!facility_users_user_id_fkey (
                user_id,
                firstname,
                lastname,
                email,
                specialty,
                license_number,
                last_sign_in_at,
                phone_number,
                is_active,
                role,
                created_at,
                updated_at
            )
            '''
        ).eq('facility_id', current_user.get('facility_id')).execute()
        
        if getattr(facility_users_resp, 'error', None):
            current_app.logger.error(f"Failed to fetch facility users: {facility_users_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facility users",
                "details": facility_users_resp.error.message if facility_users_resp.error else "Unknown"
            }), 400

        # Transform the data to match the expected format
        result_data = []
        for facility_user in facility_users_resp.data:
            user_data = facility_user.get('users', {})
            
            # Get assigned_by user details (optional - only if needed)
            assigned_by_data = {}
            if facility_user.get('assigned_by'):
                assigned_by_resp = supabase.table('users').select('firstname, lastname, email').eq('user_id', facility_user['assigned_by']).execute()
                assigned_by_data = assigned_by_resp.data[0] if assigned_by_resp.data else {}

            combined_data = {
                "user_id": facility_user.get('user_id'),
                "facility_id": facility_user.get('facility_id'),
                "role": facility_user.get('role'),
                "department": facility_user.get('department'),
                "start_date": facility_user.get('start_date'),
                "end_date": facility_user.get('end_date'),
                "assigned_by": facility_user.get('assigned_by'),
                "created_at": facility_user.get('created_at'),
                "updated_at": facility_user.get('updated_at'),
                "user_info": {
                    "firstname": user_data.get('firstname'),
                    "lastname": user_data.get('lastname'),
                    "email": user_data.get('email'),
                    "specialty": user_data.get('specialty'),
                    "license_number": user_data.get('license_number'),
                    "phone_number": user_data.get('phone_number'),
                    "last_sign_in_at": user_data.get('last_sign_in_at'),
                    "is_active": user_data.get('is_active'),
                    "role": user_data.get('role'),
                    "created_at": user_data.get('created_at')
                },
                "assigned_by_info": {
                    "firstname": assigned_by_data.get('firstname'),
                    "lastname": assigned_by_data.get('lastname'),
                    "email": assigned_by_data.get('email')
                }
            }
            result_data.append(combined_data)

        redis_client.setex(cache_key, 300, json.dumps(result_data))
        current_app.logger.info(f"Retrieved {len(result_data)} facility users for facility {current_user.get('facility_id')}")

        return jsonify({
            "status": "success",
            "data": result_data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching facility users: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch facility users: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users', methods=['POST'])
@require_auth
@require_role('facility_admin')
def add_facility_user():
    try:
        data = request.json
        current_user = request.current_user
        current_user_facility_id = current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Validate required fields
        required_fields = ['email', 'firstname', 'lastname', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400

        # Validate role
        valid_roles = ['doctor', 'nurse', 'staff', 'facility_admin']
        if data.get('role') not in valid_roles:
            return jsonify({
                "status": "error",
                "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            }), 400

        # Validate department if provided
        if data.get('department'):
            valid_departments = [
                'Pediatrics', 'Cardiology', 'Emergency', 'Surgery', 'Administration',
                'Radiology', 'Laboratory', 'Pharmacy', 'Nursing', 'IT', 'Human Resources', 'Finance'
            ]
            if data.get('department') not in valid_departments:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid department. Must be one of: {', '.join(valid_departments)}"
                }), 400

        # Check if user already exists
        existing_user_resp = supabase.table('users').select('*').eq('email', data.get('email')).execute()

        if existing_user_resp.data:
            # User exists, check if already assigned to this facility
            user_id = existing_user_resp.data[0]['user_id']
            facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

            if facility_user_resp.data:
                return jsonify({
                    "status": "error",
                    "message": "User is already assigned to this facility"
                }), 400

            # Add existing user to facility
            facility_user_payload = {
                "facility_id": current_user_facility_id,
                "user_id": user_id,
                "role": data.get('role'),
                "department": data.get('department'),
                "start_date": data.get('start_date', datetime.date.today().isoformat()),
                "assigned_by": current_user.get('id'),
                "created_at": datetime.datetime.utcnow().isoformat(),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }

            facility_user_resp = supabase.table('facility_users').insert(facility_user_payload).execute()
            if getattr(facility_user_resp, 'error', None):
                current_app.logger.error(f"Failed to assign existing user to facility: {facility_user_resp.error.message}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to assign user to facility"
                }), 400

        else:
            # Create new user using Supabase Auth
            password = 'keepsake123'

            try:
                signup_resp = supabase.auth.sign_up({
                    "email": data.get('email'),
                    "password": password,
                    "options": {
                        "data": {
                            "firstname": data.get('firstname'),
                            "lastname": data.get('lastname'),
                            "role": data.get('role'),
                            "specialty": data.get('specialty'),
                            "license_number": data.get('license_number'),
                            "phone_number": data.get('phone_number'),
                            "is_active": True
                        }
                    }
                })

                # Check if email confirmation is required
                if signup_resp.user is None:
                    current_app.logger.error("User signup requires email confirmation")
                    return jsonify({
                        "status": "error",
                        "message": "User signup requires email confirmation"
                    }), 400

                user_id = signup_resp.user.id

            except AuthApiError as auth_error:
                current_app.logger.error(f"Failed to create user in Supabase Auth: {str(auth_error)}")
                return jsonify({
                    "status": "error",
                    "message": f"Failed to create user: {str(auth_error)}"
                }), 400
            except Exception as e:
                current_app.logger.error(f"Failed to create new user: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to create user"
                }), 400

            # Add user to facility
            facility_user_payload = {
                "facility_id": current_user_facility_id,
                "user_id": user_id,
                "role": data.get('role'),
                "department": data.get('department'),
                "start_date": data.get('start_date', datetime.date.today().isoformat()),
                "assigned_by": current_user.get('id'),
                "created_at": datetime.datetime.utcnow().isoformat(),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }

            facility_user_resp = supabase.table('facility_users').insert(facility_user_payload).execute()
            if getattr(facility_user_resp, 'error', None):
                current_app.logger.error(f"Failed to assign new user to facility: {facility_user_resp.error.message}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to assign user to facility"
                }), 400

        # Invalidate cache
        invalidate_caches([f"{FACILITY_USERS_CACHE_PREFIX}{current_user_facility_id}"])

        current_app.logger.info(f"Successfully added user {data.get('email')} to facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "message": "User successfully added to facility",
            "data": {
                "user_id": user_id,
                "email": data.get('email'),
                "role": data.get('role'),
                "generated_password": password if not existing_user_resp.data else None
            }
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error adding facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to add facility user: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users/<user_id>', methods=['PUT'])
@require_auth
@require_role('facility_admin')
def update_facility_user(user_id):
    try:
        data = request.get_json()
        current_user = request.current_user
        current_user_facility_id = current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Check if facility user exists
        facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if not facility_user_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility user not found"
            }), 404

        # Prepare update payload
        update_payload = {}
        if 'role' in data:
            valid_roles = ['doctor', 'nurse', 'staff', 'facility_admin']
            if data['role'] not in valid_roles:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
                }), 400
            update_payload['role'] = data['role']

        if 'department' in data:
            # Validate department if provided
            if data['department']:
                valid_departments = [
                    'Pediatrics', 'Cardiology', 'Emergency', 'Surgery', 'Administration',
                    'Radiology', 'Laboratory', 'Pharmacy', 'Nursing', 'IT', 'Human Resources', 'Finance'
                ]
                if data['department'] not in valid_departments:
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid department. Must be one of: {', '.join(valid_departments)}"
                    }), 400
            update_payload['department'] = data['department']

        if 'start_date' in data:
            update_payload['start_date'] = data['start_date']

        if 'end_date' in data:
            update_payload['end_date'] = data['end_date']

        update_payload['updated_at'] = datetime.datetime.utcnow().isoformat()

        # Update facility user
        facility_user_update_resp = supabase.table('facility_users').update(update_payload).eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if getattr(facility_user_update_resp, 'error', None):
            current_app.logger.error(f"Failed to update facility user: {facility_user_update_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to update facility user"
            }), 400

        # Update user information if provided
        user_update_payload = {}
        user_fields = ['firstname', 'lastname', 'specialty', 'license_number', 'phone_number']
        for field in user_fields:
            if field in data:
                user_update_payload[field] = data[field]

        if user_update_payload:
            user_update_payload['updated_at'] = datetime.datetime.utcnow().isoformat()
            user_update_resp = supabase.table('users').update(user_update_payload).eq('user_id', user_id).execute()

            if getattr(user_update_resp, 'error', None):
                current_app.logger.error(f"Failed to update user information: {user_update_resp.error.message}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to update user information"
                }), 400

        # Invalidate cache
        invalidate_caches([f"{FACILITY_USERS_CACHE_PREFIX}{current_user_facility_id}"])

        current_app.logger.info(f"Successfully updated facility user {user_id} in facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "message": "Facility user updated successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update facility user: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users/<user_id>', methods=['DELETE'])
@require_auth
@require_role('facility_admin')
def remove_facility_user(user_id):
    try:
        current_user = request.current_user
        current_user_facility_id = current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Check if facility user exists
        facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if not facility_user_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility user not found"
            }), 404

        # Set end_date instead of deleting (soft delete)
        update_payload = {
            "end_date": datetime.date.today().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat()
        }

        facility_user_update_resp = supabase.table('facility_users').update(update_payload).eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if getattr(facility_user_update_resp, 'error', None):
            current_app.logger.error(f"Failed to remove facility user: {facility_user_update_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to remove facility user"
            }), 400

        # Invalidate cache
        invalidate_caches([f"{FACILITY_USERS_CACHE_PREFIX}{current_user_facility_id}"])

        current_app.logger.info(f"Successfully removed facility user {user_id} from facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "message": "Facility user removed successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error removing facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to remove facility user: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users/<user_id>', methods=['GET'])
@require_auth
@require_role('facility_admin')
def get_facility_user(user_id):
    try:
        current_user_facility_id = request.current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {request.current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Get facility user
        facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if not facility_user_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility user not found"
            }), 404

        # Get user details
        user_resp = supabase.table('users').select('*').eq('user_id', user_id).execute()

        if not user_resp.data:
            return jsonify({
                "status": "error",
                "message": "User details not found"
            }), 404

        facility_user_data = facility_user_resp.data[0]
        user_data = user_resp.data[0]

        result_data = prepare_facility_user_response(facility_user_data, user_data)

        current_app.logger.info(f"Retrieved facility user {user_id} for facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "data": result_data,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch facility user: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users/<user_id>/reset_password', methods=['POST'])
@require_auth
@require_role('facility_admin')
def reset_user_password(user_id):
    try:
        current_user = request.current_user
        current_user_facility_id = current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Check if facility user exists
        facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if not facility_user_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility user not found"
            }), 404

        # Generate new password
        new_password = generate_secure_password()

        # Update user password (in production, this should be properly hashed)
        user_update_payload = {
            "password": new_password,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }

        user_update_resp = supabase.table('users').update(user_update_payload).eq('user_id', user_id).execute()

        if getattr(user_update_resp, 'error', None):
            current_app.logger.error(f"Failed to reset user password: {user_update_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to reset user password"
            }), 400

        current_app.logger.info(f"Successfully reset password for user {user_id} in facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "message": "Password reset successfully",
            "data": {
                "user_id": user_id,
                "new_password": new_password
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error resetting user password: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to reset user password: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users/<user_id>/activate', methods=['POST'])
@require_auth
@require_role('facility_admin')
def activate_user(user_id):
    try:
        current_user = request.current_user
        current_user_facility_id = current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Check if facility user exists
        facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if not facility_user_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility user not found"
            }), 404

        # Activate user
        user_update_payload = {
            "is_active": True,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }

        user_update_resp = supabase.table('users').update(user_update_payload).eq('user_id', user_id).execute()

        if getattr(user_update_resp, 'error', None):
            current_app.logger.error(f"Failed to activate user: {user_update_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to activate user"
            }), 400

        # Remove end_date from facility_users if present
        facility_update_payload = {
            "end_date": None,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }

        supabase.table('facility_users').update(facility_update_payload).eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        # Invalidate cache
        invalidate_caches([f"{FACILITY_USERS_CACHE_PREFIX}{current_user_facility_id}"])

        current_app.logger.info(f"Successfully activated user {user_id} in facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "message": "User activated successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error activating user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to activate user: {str(e)}"
        }), 500

@fusers_bp.route('/facility_users/<user_id>/deactivate', methods=['POST'])
@require_auth
@require_role('facility_admin')
def deactivate_user(user_id):
    try:
        current_user = request.current_user
        current_user_facility_id = current_user.get('facility_id')

        # Validate facility_id exists
        if not current_user_facility_id:
            current_app.logger.error(f"User {current_user.get('user_id', 'unknown')} has no facility_id")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to a facility"
            }), 400

        # Check if facility user exists
        facility_user_resp = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', current_user_facility_id).execute()

        if not facility_user_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility user not found"
            }), 404

        # Deactivate user
        user_update_payload = {
            "is_active": False,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }

        user_update_resp = supabase.table('users').update(user_update_payload).eq('user_id', user_id).execute()

        if getattr(user_update_resp, 'error', None):
            current_app.logger.error(f"Failed to deactivate user: {user_update_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to deactivate user"
            }), 400

        # Invalidate cache
        invalidate_caches([f"{FACILITY_USERS_CACHE_PREFIX}{current_user_facility_id}"])

        current_app.logger.info(f"Successfully deactivated user {user_id} in facility {current_user_facility_id}")

        return jsonify({
            "status": "success",
            "message": "User deactivated successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deactivating user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to deactivate user: {str(e)}"
        }), 500