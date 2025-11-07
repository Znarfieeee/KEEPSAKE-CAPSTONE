from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_anon_client, supabase_service_role_client
from gotrue.errors import AuthApiError
from datetime import datetime
from utils.invalidate_cache import invalidate_caches
from utils.redis_client import get_redis_client
import json

users_bp = Blueprint('users', __name__)
redis_client = get_redis_client()

# Admin routes need service role client to bypass RLS
admin_supabase = supabase_service_role_client()

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
        # Use admin_supabase to bypass RLS (admins can see all users)
        response = admin_supabase.table('users').select('*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))').neq('role', 'admin').execute()
        
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

    # Basic Information
    email = data.get("email")
    password = data.get("password")
    firstname = data.get("firstname")
    middlename = data.get("middlename")
    lastname = data.get("lastname")
    phone_number = data.get("phone_number")
    role = data.get("role")

    # Professional Details
    employee_id_number = data.get("employee_id_number")
    specialty = data.get("specialty")
    license_number = data.get("license_number")
    years_of_experience = data.get("years_of_experience")
    education = data.get("education")
    certifications = data.get("certifications")
    job_title = data.get("job_title")

    # Parent-specific fields
    relationship_to_patient = data.get("relationship_to_patient")
    address = data.get("address")
    emergency_contact_name = data.get("emergency_contact_name")
    emergency_contact_phone = data.get("emergency_contact_phone")

    # Subscription
    plan = data.get('plan')
    sub_expiry = data.get('subscription_expires')
    is_subscribed = data.get('is_subscribed', False)

    # Basic validation
    required_fields = {
        'email': email,
        'password': password,
        'firstname': firstname,
        'lastname': lastname,
        'phone_number': phone_number,
        'role': role
    }
    
    missing_fields = [field for field, value in required_fields.items() if not value]
    
    if missing_fields:
        return (
            jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "fields": missing_fields
            }),
            400,
        )

    try:
        signup_resp = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        # Basic Information
                        "firstname": firstname,
                        "middlename": middlename,
                        "lastname": lastname,
                        "phone_number": phone_number,
                        "role": role,

                        # Professional Details
                        "employee_id_number": employee_id_number,
                        "specialty": specialty,
                        "license_number": license_number,
                        "years_of_experience": years_of_experience,
                        "education": education,
                        "certifications": certifications,
                        "job_title": job_title,

                        # Parent-specific fields
                        "relationship_to_patient": relationship_to_patient,
                        "address": address,
                        "emergency_contact_name": emergency_contact_name,
                        "emergency_contact_phone": emergency_contact_phone,

                        # Subscription
                        "plan": plan,
                        "subscription_expires": sub_expiry,
                        "is_subscribed": is_subscribed,
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
        response = admin_supabase.table('users').select(
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
        response = admin_supabase.table('users').update(update_fields).eq('user_id', user_id).execute()

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

        response = admin_supabase.table('users').update({
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
    """Assign or transfer user to a facility with role and department"""
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

        # Check if user already has ANY facility assignment
        existing_assignment = admin_supabase.table('facility_users').select('*').eq('user_id', user_id).execute()

        if existing_assignment.data:
            # User is already assigned to a facility
            existing = existing_assignment.data[0]

            if existing['facility_id'] == facility_id:
                # Same facility - just update the role/department
                response = admin_supabase.table('facility_users').update({
                    'role': facility_role,
                    'department': department,
                    'start_date': start_date,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('user_id', user_id).eq('facility_id', facility_id).execute()
            else:
                # Different facility - delete old assignment and create new one (transfer)
                # First, delete the old assignment
                delete_response = admin_supabase.table('facility_users').delete().eq('user_id', user_id).execute()

                if getattr(delete_response, 'error', None):
                    current_app.logger.error(f"Failed to delete old facility assignment: {delete_response.error}")
                    return jsonify({
                        "status": "error",
                        "message": "Failed to remove previous facility assignment"
                    }), 500

                # Then create the new assignment
                response = admin_supabase.table('facility_users').insert({
                    'user_id': user_id,
                    'facility_id': facility_id,
                    'role': facility_role,
                    'department': department,
                    'start_date': start_date or datetime.utcnow().date().isoformat(),
                    'assigned_by': assigned_by,
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }).execute()
        else:
            # No existing assignment - create new one
            response = admin_supabase.table('facility_users').insert({
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
        response = admin_supabase.table('facility_users').delete().eq('user_id', user_id).eq('facility_id', facility_id).execute()

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
        admin_supabase.table('facility_users').delete().eq('user_id', user_id).execute()

        # Delete user from public.users table (this will cascade to other tables)
        user_response = admin_supabase.table('users').delete().eq('user_id', user_id).execute()

        if getattr(user_response, 'error', None):
            current_app.logger.error(f"Failed to delete user from database: {user_response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to delete user from database"
            }), 500

        # Delete from Supabase Auth (this is optional, depends on your auth strategy)
        try:
            auth_response = admin_supabase.auth.admin.delete_user(user_id)
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
