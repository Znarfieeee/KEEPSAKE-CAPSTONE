from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from utils.redis_client import get_redis_client
from utils.invalidate_cache import invalidate_caches
from utils.sanitize import sanitize_request_data
import json
import datetime
from postgrest.exceptions import APIError as AuthApiError

# Create blueprint for facility routes
facility_bp = Blueprint('facility', __name__)
redis_client = get_redis_client()

FACILITY_CACHE_KEY = "healthcare_facilities:all"
FACILITY_CACHE_PREFIX = "healthcare_facilities:"
FACILITY_USERS_CACHE_PREFIX = "facility_users:"

""" USE THE SUPABASE REAL-TIME 'GET' METHOD TO GET THE LIST OF FACILITIES """
# Get all list of facilities
@facility_bp.route('/admin/facilities', methods=['GET'])
@require_auth
@require_role('admin')
def list_facilities():
    """Return all healthcare facilities visible to the current user."""
    try:
        current_user = getattr(request, 'current_user', {})
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        current_app.logger.info(f"Admin {current_user.get('email', 'unknown')} fetching facilities list (bust_cache={bust_cache})")

        # If we have cached data, return it
        if not bust_cache:
            cached = redis_client.get(FACILITY_CACHE_KEY)

            if cached:
                cached_data = json.loads(cached)
                current_app.logger.debug(f"Returning cached facilities data ({len(cached_data)} facilities)")
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200

        # If no cache, fetch from Supabase
        resp = supabase.table('healthcare_facilities')\
            .select('*')\
            .is_('deleted_at', 'null')\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Supabase error fetching facilities: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facilities",
                "details": resp.error.message if resp.error else "Unknown",
            }), 400

        # Store fresh copy in Redis (5-minute TTL)
        redis_client.setex(FACILITY_CACHE_KEY, 300, json.dumps(resp.data))
        current_app.logger.info(f"Fetched {len(resp.data)} active facilities from database")

        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error fetching facilities: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching facilities: {str(e)}",
        }), 500

# Create new facility
@facility_bp.route('/admin/facilities', methods=['POST'])
@require_auth
@require_role('admin')
def create_facility():
    """Create a new facility record in Supabase."""
    try:
        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)

        if not data.get('facility_name'):
            return jsonify({
                "status": "error",
                "message": "Facility name is required!",
            }), 400

        created_by = (getattr(request, 'current_user', {}) or {}).get('id')

        payload = {
            "facility_name": data.get("facility_name"),
            "address": data.get("address"),
            "city": data.get("city"),
            "zip_code": data.get("zip_code"),
            "contact_number": data.get("contact_number"),
            "email": data.get("email"),
            "website": data.get("website") or "N/A",
            "subscription_status": data.get("subscription_status") or "active",
            "subscription_expires": data.get("subscription_expires"),
            "plan": data.get("plan"),
            "type": data.get("type"),
            "created_by": created_by,
        }

        resp = supabase.table('healthcare_facilities').insert(payload).execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to create facility",
                "details": resp.error.message if resp.error else "Unknown",
            }), 400

        # Invalidate cache after successful creation
        invalidate_caches('facility')

        return jsonify({
            "status": "success",
            "message": "Facility created successfully",
            "data": resp.data[0] if resp.data else payload,
        }), 201

    except AuthApiError as e:
        return jsonify({
            "status": "error",
            "message": f"Supabase Auth error: {str(e)}",
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error creating facility: {str(e)}",
        }), 500

# Update facility
@facility_bp.route('/admin/facilities/<facility_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_facility(facility_id):
    try:
        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        current_user = getattr(request, 'current_user', {})

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email', 'unknown')} updating facility {facility_id}")

        # Validate facility exists before updating
        existing_facility = supabase.table('healthcare_facilities')\
            .select('facility_id, facility_name')\
            .eq('facility_id', facility_id)\
            .single()\
            .execute()

        if getattr(existing_facility, 'error', None) or not existing_facility.data:
            current_app.logger.warning(f"Attempt to update non-existent facility {facility_id}")
            return jsonify({
                "status": "error",
                "message": "Facility not found"
            }), 404

        # Map frontend data to database fields
        # Only include fields that actually exist in the healthcare_facilities table
        update_data = {}

        # Map frontend field names to database column names
        field_mapping = {
            'name': 'facility_name',
            'facility_name': 'facility_name',
            'email': 'email',
            'website': 'website',
            'type': 'type',
            'plan': 'plan',
            'subscription_status': 'subscription_status',
            'contact_number': 'contact_number',
            'contact': 'contact_number',
            'address': 'address',
            'city': 'city',
            'zip_code': 'zip_code'
        }

        # Extract location data if it's provided as a single string
        if 'location' in data and isinstance(data['location'], str):
            location_parts = [part.strip() for part in data['location'].split(',')]
            if len(location_parts) >= 3:
                data['address'] = location_parts[0]
                data['city'] = location_parts[1]
                data['zip_code'] = location_parts[2]

        # Only update fields that exist in the database schema
        for frontend_field, db_field in field_mapping.items():
            if frontend_field in data and data[frontend_field] is not None:
                update_data[db_field] = data[frontend_field]

        current_app.logger.debug(f"Updating facility {facility_id} with data: {update_data}")

        resp = supabase.table('healthcare_facilities')\
            .update(update_data)\
            .eq('facility_id', facility_id)\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to update facility {facility_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to update facility",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        invalidate_caches('facility', facility_id)
        current_app.logger.info(f"AUDIT: Facility {facility_id} updated successfully by {current_user.get('email', 'unknown')}")

        return jsonify({
            "status": "success",
            "message": "Facility updated successfully!",
            "data": resp.data[0] if resp.data else None
        }), 200

    except AuthApiError as AuthError:
        current_app.logger.error(f"Auth API error updating facility {facility_id}: {str(AuthError)}")
        return jsonify({
            "status": "error",
            "message": f"API error: {str(AuthError)}"
        }), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error updating facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Server error occurred while updating facility"
        }), 500

# Get Facility by ID
@facility_bp.route('/admin/facilities/<facility_id>', methods=['GET'])
@require_auth
def get_facility_by_id(facility_id):
    """Retrieve a single facility by its UUID."""
    try:
        current_user = getattr(request, 'current_user', {})
        current_app.logger.info(f"User {current_user.get('email', 'unknown')} fetching facility {facility_id}")

        resp = (
            supabase.table('healthcare_facilities')
            .select('*')
            .eq('facility_id', facility_id)
            .is_('deleted_at', 'null')
            .single()
            .execute()
        )

        if getattr(resp, 'error', None) or not resp.data:
            current_app.logger.warning(f"Facility {facility_id} not found or deleted")
            return jsonify({
                "status": "error",
                "message": "Facility not found",
                "details": resp.error.message if resp.error else "Not found or deleted",
            }), 404

        current_app.logger.info(f"Successfully retrieved facility {facility_id} ({resp.data.get('facility_name', 'Unknown')})")
        return jsonify({
            "status": "success",
            "data": resp.data,
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error retrieving facility: {str(e)}",
        }), 500

# soft delete facility
@facility_bp.route('/admin/delete_facility/<facility_id>', methods=['POST'])
@require_auth
@require_role('admin')
def delete_facility(facility_id):
    try:
        deleted_at = datetime.datetime.utcnow().isoformat()

        # Update the facility with deleted_at timestamp and set status to inactive
        # First, get the current facility data before deletion
        existing_facility = supabase.table('healthcare_facilities')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .is_('deleted_at', 'null')\
            .single()\
            .execute()

        if getattr(existing_facility, "error", None) or not existing_facility.data:
            return jsonify({
                "status": "error",
                "message": f"Facility not found or already deleted: {str(facility_id)}"
            }), 404

        # Perform the soft delete
        response = supabase.table('healthcare_facilities').update({
            'deleted_at': deleted_at,
            'subscription_status': 'inactive'
        }).eq("facility_id", facility_id).execute()

        if getattr(response, "error", None):
            return jsonify({
                "status": "error",
                "message": f"Error deleting facility: {response.error.message}"
            }), 400

        if not response.data:
            return jsonify({
                "status": "error",
                "message": f"Failed to delete facility: {str(facility_id)}"
            }), 400

        # Invalidate facility caches
        invalidate_caches('facility', facility_id)

        # Log the deletion for audit purposes
        current_app.logger.info(f"AUDIT: Facility {facility_id} soft deleted by admin {getattr(request, 'current_user', {}).get('email', 'unknown')}")

        return jsonify({
            "status": "success",
            "message": "Successfully deleted facility.",
            "data": existing_facility.data,  # Return the original facility data
            "deleted_facility": response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Server error occurred while deleting facility"
        }), 500

# Deactivate facility (alias for delete_facility for client compatibility)
@facility_bp.route('/admin/deactivate_facility/<facility_id>', methods=['POST'])
@require_auth
@require_role('admin')
def deactivate_facility(facility_id):
    """Deactivate facility - same as soft delete"""
    return delete_facility(facility_id)

# Assign facility admin to facility
@facility_bp.route('/admin/assign-user-to-facility/<facility_id>', methods=['POST'])
@require_auth
@require_role('admin')
def assign_user_to_facility(facility_id):
    try:
        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        current_user = getattr(request, 'current_user', {})

        email = data.get('email')
        role = data.get('role')
        department = data.get('department', '')
        start_date = data.get('start_date', datetime.datetime.utcnow().isoformat())
        end_date = data.get('end_date')  # Optional, NULL means permanent

        # Validate required fields
        if not email or not role:
            current_app.logger.warning(f"Invalid assignment request - missing email or role")
            return jsonify({
                "status": "error",
                "message": "Email and role are required"
            }), 400

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email', 'unknown')} attempting to assign {email} to facility {facility_id} as {role}")
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
            current_app.logger.warning(f"Attempt to assign inactive user {email} to facility {facility_id}")
            return jsonify({
                "status": "error",
                "message": f"User {email} is not active."
            }), 400
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
        if department:
            proc_params['p_department'] = department
            
        assign_response = supabase_service_role_client().rpc('assign_user_to_facility', proc_params).execute()
        
        if assign_response.data:
            # The stored procedure returns a table with success, message, and facility_user_record
            result = assign_response.data[0] if assign_response.data else {}
            
            if result.get('success'):
                current_app.logger.info(f"AUDIT: Successfully assigned {email} to facility {facility_id} as {role} by admin {current_user.get('email')}")
                
                invalidate_caches('facility_users', facility_id)
                
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
            
    except Exception as e:
        current_app.logger.error(f"AUDIT: Exception in assign_user_to_facility for facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign user: {str(e)}"
        }), 500

# Get all users for a specific facility
@facility_bp.route('/admin/facilities/<facility_id>/users', methods=['GET'])
@require_auth
@require_role('admin', 'facility_admin')
def get_facility_users(facility_id):
    """
    Get all users for a specific facility
    Like getting the employee roster for a building
    """
    try:
        # Query with joins to get complete user information
        # Only return active assignments (end_date is null)
        resp = supabase.table('facility_users').select(
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
        ).eq('facility_id', facility_id).is_('end_date', 'null').execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to fetch facility users: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facility users",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
        
        # Get facility name once (all users are from the same facility)
        facility_name = None
        facility_status = None
        if resp.data:
            facility_resp = supabase.table('healthcare_facilities').select('facility_name, subscription_status').eq('facility_id', facility_id).single().execute()
            if not getattr(facility_resp, 'error', None) and facility_resp.data:
                facility_name = facility_resp.data.get('facility_name')
                facility_status = facility_resp.data.get('subscription_status')

        # Format the response
        facility_users = []
        for record in resp.data:
            user_data = record['users']
            facility_users.append({
                'facility_id': facility_id,
                'user_id': user_data['user_id'],
                'email': user_data['email'],
                'firstname': user_data['firstname'],
                'lastname': user_data['lastname'],
                'role': record['role'],
                'department': record.get('department'),
                'specialty': user_data['specialty'],
                'license_number': user_data['license_number'],
                'phone_number': user_data['phone_number'],
                'start_date': record['start_date'],
                'end_date': record.get('end_date'),
                'is_active': user_data['is_active'],
                'created_at': user_data['created_at'],
                'facility_name': facility_name or 'Unknown',
                'facility_status': facility_status or 'unknown'
            })

        return jsonify({
            "status": "success",
            "users": facility_users,
            "count": len(facility_users)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Failed to get facility users: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve facility users: {str(e)}"
        }), 500

# Update a facility user's information or role
@facility_bp.route('/admin/facilities/<facility_id>/users/<user_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_facility_user(facility_id, user_id):
    """
    Update a facility user's information or role
    Like promoting an employee or updating their details
    """
    try:
        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        current_user = getattr(request, 'current_user', {})

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email', 'unknown')} updating user {user_id} in facility {facility_id}")
        # Get current user data
        current_user_result = supabase.table('users')\
            .select('*')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        if current_user_result.get('error') or not current_user_result.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404
        
        current_data = current_user_result.data
        
        # Prepare updates for users table
        user_updates = {}
        updatable_fields = ['firstname', 'lastname', 'specialty', 'license_number', 'phone_number']
        
        for field in updatable_fields:
            if field in data:
                user_updates[field] = data[field]
        
        if user_updates:
            user_updates['updated_at'] = datetime.datetime.utcnow().isoformat()
            
            user_update_result = supabase.table('users')\
                .update(user_updates)\
                .eq('user_id', user_id)\
                .execute()
            
            if user_update_result.get('error'):
                raise Exception(f"Failed to update user: {user_update_result['error']}")
        
        # Update facility-specific role and/or department if provided
        facility_updates = {}
        if 'role' in data:
            new_role = data['role']
            valid_roles = ['doctor', 'nurse', 'admin', 'staff']

            if new_role not in valid_roles:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
                }), 400

            facility_updates['role'] = new_role

        if 'department' in data:
            facility_updates['department'] = data['department']

        if facility_updates:
            facility_update_result = supabase.table('facility_users')\
                .update(facility_updates)\
                .eq('facility_id', facility_id)\
                .eq('user_id', user_id)\
                .execute()

            if facility_update_result.get('error'):
                raise Exception(f"Failed to update facility user: {facility_update_result['error']}")
        
        # Audit logging is handled automatically by the database trigger
        current_app.logger.info(f"AUDIT: Successfully updated user {user_id} in facility {facility_id} by {current_user.get('email', 'unknown')}")

        return jsonify({
            "status": "success",
            "message": "Facility user updated successfully"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Failed to update facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update facility user: {str(e)}"
        }), 500

# Soft delete user from a facility
@facility_bp.route('/admin/facilities/<facility_id>/users/<user_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_facility_user(facility_id, user_id):
    """Soft delete a user from a facility by setting end_date"""
    try:
        current_user = getattr(request, 'current_user', {})
        current_app.logger.info(f"AUDIT: Admin {current_user.get('email', 'unknown')} removing user {user_id} from facility {facility_id}")

        # Set end_date to current timestamp
        update_result = supabase.table('facility_users')\
            .update({'end_date': datetime.datetime.utcnow().isoformat()})\
            .eq('facility_id', facility_id)\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .execute()
            
        if update_result.get('error'):
            raise Exception(update_result['error'])
            
        current_app.logger.info(f"AUDIT: Successfully removed user {user_id} from facility {facility_id} by {current_user.get('email', 'unknown')}")
        return jsonify({
            "status": "success",
            "message": "User removed from facility"
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Failed to remove user from facility: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to remove user from facility: {str(e)}"
        }), 500


# Assign a patient to the facility
@facility_bp.route('/admin/facilities/<facility_id>/patients', methods=['POST'])
@require_auth
@require_role('admin')
def assign_patient_to_facility(facility_id):
    """
    Assign a patient to the facility
    Like admitting a patient to a hospital department
    """
    try:
        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        current_user = getattr(request, 'current_user', {})

        patient_id = data.get('patient_id')
        notes = data.get('notes', '')

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email', 'unknown')} assigning patient {patient_id} to facility {facility_id}")

        if not patient_id:
            current_app.logger.warning(f"Invalid patient assignment request - missing patient_id")
            return jsonify({
                "status": "error",
                "message": "Patient ID is required"
            }), 400
        # Check if patient exists
        patient_check = supabase.table('patients')\
            .select('patient_id')\
            .eq('patient_id', patient_id)\
            .eq('is_active', True)\
            .single()\
            .execute()
        
        if patient_check.get('error') or not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found or inactive"
            }), 404
        
        # Check if already assigned
        existing_assignment = supabase.table('patient_facility')\
            .select('pf_id')\
            .eq('patient_id', patient_id)\
            .eq('facility_id', facility_id)\
            .eq('is_active', True)\
            .execute()
        
        if existing_assignment.data:
            return jsonify({
                "status": "error",
                "message": "Patient already assigned to this facility"
            }), 400
        
        # Create assignment
        assignment_record = {
            'patient_id': patient_id,
            'facility_id': facility_id,
            'assigned_by': current_user.get('id'),
            'notes': notes,
            'is_active': True
        }
        
        assignment_result = supabase.table('patient_facility').insert(assignment_record).execute()
        
        if assignment_result.get('error'):
            raise Exception(f"Failed to assign patient: {assignment_result['error']}")
        
        # Audit logging is handled automatically by the database trigger
        current_app.logger.info(f"AUDIT: Successfully assigned patient {patient_id} to facility {facility_id} by {current_user.get('email', 'unknown')}")

        return jsonify({
            "status": "success",
            "message": "Patient assigned to facility successfully",
            "assignment_id": assignment_result.data[0]['pf_id']
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Failed to assign patient {patient_id} to facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign patient to facility: {str(e)}"
        }), 500

# Need refinements kay dapat ang invitation system also allows user to register if there are no accounts
# If found that accounts exist, then i-invite in to facility.
# Inviting user into the facility
@facility_bp.route('/admin/facilities/<facility_id>/invite', methods=['POST'])
@require_auth
@require_role('admin')
def invite_facility_user(facility_id):
    """
    Send an invitation to join a facility
    Like sending a job offer with building access
    """
    try:
        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        current_user = getattr(request, 'current_user', {})

        email = data.get('email')
        role = data.get('role')
        message = data.get('message', '')

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email', 'unknown')} inviting {email} to facility {facility_id} as {role}")

        if not email or not role:
            current_app.logger.warning(f"Invalid invitation request - missing email or role")
            return jsonify({
                "status": "error",
                "message": "Email and role are required"
            }), 400
        # Check if user already exists in the facility
        existing_user = supabase.table('facility_users')\
            .select('*, users!inner(email)')\
            .eq('facility_id', facility_id)\
            .eq('users.email', email)\
            .is_('end_date', 'null')\
            .execute()
        
        if existing_user.data:
            return jsonify({
                "status": "error",
                "message": "User already exists in this facility"
            }), 400
        
        # Generate invitation token
        import secrets
        invite_token = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        
        # Store invitation
        invite_record = {
            'email': email,
            'facility_id': facility_id,
            'role': role,
            'token': invite_token,
            'expires_at': expires_at.isoformat(),
            'created_by': current_user.get('id'),
            'message': message
        }
        
        invite_result = supabase.table('facility_invites').insert(invite_record).execute()
        
        if invite_result.get('error'):
            raise Exception(f"Failed to create invitation: {invite_result['error']}")
        
        """ Send email invitation (implement your email service)
         Refinements to use supabase email invitation system 
         If not, then implement email invitation specifically for facility_users """
         
        # send_facility_invitation_email(
        #     email=email,
        #     facility_id=facility_id,
        #     role=role,
        #     token=invite_token,
        #     inviter_name=f"{current_user['firstname']} {current_user['lastname']}",
        #     message=message
        # )
        
        current_app.logger.info(f"AUDIT: Successfully created invitation for {email} to facility {facility_id} by {current_user.get('email', 'unknown')}")
        return jsonify({
            "status": "success",
            "message": "Invitation sent successfully",
            "invite_id": invite_result.data[0]['id']
        }), 201

    except Exception as e:
        current_app.logger.error(f"Failed to send invitation: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to send invitation: {str(e)}"
        }), 500

# Get all users assigned to facilities
@facility_bp.route('/admin/facility-users', methods=['GET'])
@require_auth
@require_role('admin')
def get_all_facility_users():
    """Get all users with their facility assignments"""
    try:
        current_user = getattr(request, 'current_user', {})
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        current_app.logger.info(f"Admin {current_user.get('email', 'unknown')} fetching facility users (bust_cache={bust_cache})")

        # Check cache first
        cache_key = f"{FACILITY_USERS_CACHE_PREFIX}all"
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200

        # Fetch from database with JOIN to get user and facility details
        resp = supabase.table('facility_users').select(
            'facility_id, user_id, role, department, start_date, end_date, '
            'users!facility_users_user_id_fkey(email, firstname, lastname, phone_number, is_active, specialty, license_number), '
            'healthcare_facilities!facility_users_facility_id_fkey(facility_name, subscription_status)'
        ).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to fetch facility users: {resp.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facility users"
            }), 500

        # Transform the data to flatten the nested structure
        facility_users = []
        for item in resp.data:
            user_data = item.get('users', {})
            facility_data = item.get('healthcare_facilities', {})

            facility_users.append({
                'facility_id': item['facility_id'],
                'user_id': item['user_id'],
                'role': item['role'],
                'department': item.get('department'),
                'start_date': item.get('start_date'),
                'end_date': item.get('end_date'),
                'email': user_data.get('email'),
                'firstname': user_data.get('firstname'),
                'lastname': user_data.get('lastname'),
                'phone_number': user_data.get('phone_number'),
                'is_active': user_data.get('is_active'),
                'specialty': user_data.get('specialty'),
                'license_number': user_data.get('license_number'),
                'facility_name': facility_data.get('facility_name'),
                'facility_status': facility_data.get('subscription_status')
            })

        # Cache the result for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(facility_users))
        current_app.logger.info(f"Fetched {len(facility_users)} facility user assignments from database")

        return jsonify({
            "status": "success",
            "data": facility_users,
            "cached": False,
            "count": len(facility_users)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching facility users: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching facility users: {str(e)}"
        }), 500

# Get users for a specific facility
@facility_bp.route('/admin/facilities/<facility_id>/users', methods=['GET'])
@require_auth
@require_role('admin')
def get_facility_users_by_id(facility_id):
    """Get all users assigned to a specific facility"""
    try:
        current_user = getattr(request, 'current_user', {})
        current_app.logger.info(f"User {current_user.get('email', 'unknown')} fetching users for facility {facility_id}")

        resp = supabase.table('facility_users').select(
            'facility_id, user_id, role, department, start_date, end_date, '
            'users!facility_users_user_id_fkey(email, firstname, lastname, phone_number, is_active, specialty, license_number), '
            'healthcare_facilities!facility_users_facility_id_fkey(facility_name, subscription_status)'
        ).eq('facility_id', facility_id).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to fetch users for facility {facility_id}: {resp.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facility users"
            }), 500

        # Transform the data
        facility_users = []
        for item in resp.data:
            user_data = item.get('users', {})
            facility_data = item.get('healthcare_facilities', {})

            facility_users.append({
                'facility_id': item['facility_id'],
                'user_id': item['user_id'],
                'role': item['role'],
                'department': item.get('department'),
                'start_date': item.get('start_date'),
                'end_date': item.get('end_date'),
                'email': user_data.get('email'),
                'firstname': user_data.get('firstname'),
                'lastname': user_data.get('lastname'),
                'phone_number': user_data.get('phone_number'),
                'is_active': user_data.get('is_active'),
                'specialty': user_data.get('specialty'),
                'license_number': user_data.get('license_number'),
                'facility_name': facility_data.get('facility_name'),
                'facility_status': facility_data.get('subscription_status')
            })

        return jsonify({
            "status": "success",
            "data": facility_users,
            "count": len(facility_users)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching users for facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500
