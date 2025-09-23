from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_anon_client
from gotrue.errors import AuthApiError
from datetime import datetime
from utils.invalidate_cache import invalidate_caches
from utils.redis_client import get_redis_client
import json

users_bp = Blueprint('users', __name__)
redis_client = get_redis_client()

USERS_CACHE_KEY = 'users:all'
USERS_CACHE_PREFIX = 'users:'

""" USE THE SUPABASE REAL-TIME 'GET' METHOD TO GET THE LIST OF FACILITIES """
@users_bp.route('/admin/users', methods=['GET'])
@require_auth
@require_role('admin')
def get_all_users():
    """Get all users with their roles, status, and facility assignments"""
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        
        if not bust_cache:
            cached = redis_client.get(USERS_CACHE_KEY)
            
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200
        
        # Get users data from the database if there's no cache
        response = supabase.table('users').select('*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))').neq('role', 'admin').execute()
        
        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch users: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch users"
            }), 500
            
        return jsonify({
            "status": "success",
            "data": response.data,
            "count": len(response.data)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching users: {str(e)}"
        }), 500

@users_bp.route('/admin/add_user', methods=['POST'])
@require_auth
@require_role('admin')
def add_user():
    """Register a new user in Supabase Auth and mirror the data in the public.users table."""

    data = request.json or {}

    email = data.get("email")
    password = data.get("password")
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    specialty = data.get("specialty")
    role = data.get("role")
    plan = data.get('plan')
    sub_expiry = data.get('subscription_expires')
    license_number = data.get("license_number")
    phone_number = data.get("phone_number")
    middlename = data.get("middlename")
    is_subscribed = data.get('is_subscribed', False)

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
        
    invalidate_caches('')
        
    try:
        signup_resp = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "firstname": firstname,
                        "middlename": middlename,
                        "lastname": lastname,
                        "specialty": specialty,
                        "role": role,
                        "plan": plan,
                        "subscription_expires": sub_expiry,
                        "is_subscribed": is_subscribed,
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
        
        invalidate_caches('users')

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

@users_bp.route('/admin/users/<user_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_user_by_id(user_id):
    """ Get a specific user with their facility assignment.
    Like looking up a specific employee's complete profile. """
    
    try:
        response = supabase.table('users').select(
            '*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))'
        ).eq('user_id', user_id).execute()
        
        if response.data:
            user = response.data[0]
            
            invalidate_caches('users', user_id)
                
            return jsonify({
                "status": "success",
                "data": user
            })
        
        else:
            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404
    
    except Exception as e:
        current_app.logger.error(f"Error fetching user {user_id} : {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch user"
        }), 500

@users_bp.route('/admin/users/<user_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_user(user_id):
    """Update user profile information"""
    try:
        data = request.json or {}

        # Extract updatable fields
        update_fields = {}
        allowed_fields = [
            'firstname', 'middlename', 'lastname', 'specialty',
            'license_number', 'phone_number', 'role',
            'subscription_expires', 'is_subscribed'
        ]

        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]

        if not update_fields:
            return jsonify({
                "status": "error",
                "message": "No valid fields provided for update"
            }), 400

        # Add update timestamp
        update_fields['updated_at'] = datetime.utcnow().isoformat()

        # Update user in database
        response = supabase.table('users').update(update_fields).eq('user_id', user_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to update user: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to update user"
            }), 500

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User updated successfully",
            "data": response.data[0]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update user: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/status', methods=['PATCH'])
@require_auth
@require_role('admin')
def update_user_status(user_id):
    """Update user status (active/inactive/suspended)"""
    try:
        data = request.json or {}
        is_active = data.get('is_active')
        
        if is_active is None:
            return jsonify({
                "status": "error",
                "message": "is_active field is required"
            }), 400

        response = supabase.table('users').update({
            'is_active': is_active,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to update user status: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to update user status"
            }), 500

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": f"User status updated to {'active' if is_active else 'inactive'}",
            "data": response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user status {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update user status: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/assign-facility', methods=['POST'])
@require_auth
@require_role('admin')
def assign_user_to_facility(user_id):
    """Assign user to a facility with role and department"""
    try:
        data = request.json or {}
        facility_id = data.get('facility_id')
        facility_role = data.get('facility_role')
        department = data.get('department')
        start_date = data.get('start_date')
        current_user = request.current_user
        assigned_by = current_user.get('id')

        if not facility_id or not facility_role:
            return jsonify({
                "status": "error",
                "message": "Facility ID and role are required"
            }), 400

        # Check if user already assigned to this facility
        existing = supabase.table('facility_users').select('*').eq('user_id', user_id).eq('facility_id', facility_id).execute()

        if existing.data:
            # Update existing assignment
            response = supabase.table('facility_users').update({
                'role': facility_role,
                'department': department,
                'start_date': start_date,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('user_id', user_id).eq('facility_id', facility_id).execute()
        else:
            # Create new assignment
            response = supabase.table('facility_users').insert({
                'user_id': user_id,
                'facility_id': facility_id,
                'role': facility_role,
                'department': department,
                'start_date': start_date or datetime.utcnow().date().isoformat(),
                'assigned_by': assigned_by,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to assign user to facility: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to assign user to facility"
            }), 500

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User assigned to facility successfully",
            "data": response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error assigning user {user_id} to facility: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign user to facility: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/facilities/<facility_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def remove_user_from_facility(user_id, facility_id):
    """Remove user from a facility"""
    try:
        response = supabase.table('facility_users').delete().eq('user_id', user_id).eq('facility_id', facility_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to remove user from facility: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to remove user from facility"
            }), 500

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User removed from facility successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error removing user {user_id} from facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to remove user from facility: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_user(user_id):
    """Permanently delete a user and all associated data"""
    try:
        # First, remove user from all facilities
        supabase.table('facility_users').delete().eq('user_id', user_id).execute()

        # Delete user from public.users table (this will cascade to other tables)
        user_response = supabase.table('users').delete().eq('user_id', user_id).execute()

        if getattr(user_response, 'error', None):
            current_app.logger.error(f"Failed to delete user from database: {user_response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to delete user from database"
            }), 500

        # Delete from Supabase Auth (this is optional, depends on your auth strategy)
        try:
            auth_response = supabase.auth.admin.delete_user(user_id)
        except Exception as auth_error:
            current_app.logger.warning(f"Could not delete user from auth: {auth_error}")
            # Continue anyway as the main user record is deleted

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User deleted successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to delete user: {str(e)}"
        }), 500
