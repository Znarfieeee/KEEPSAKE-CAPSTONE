from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from utils.redis_client import get_redis_client
import json
import datetime
from postgrest.exceptions import APIError as AuthApiError

# Create blueprint for facility routes
facility_bp = Blueprint('facility', __name__)
redis_client = get_redis_client()

FACILITY_CACHE_KEY = "healthcare_facilities:all"
FACILITY_CACHE_PREFIX = "healthcare_facilities:"
FACILITY_USERS_CACHE_PREFIX = "facility_users:"

def invalidate_facility_caches(facility_id=None):
    """
    Smart cache invalidation - like clearing specific drawers in a filing cabinet
    instead of throwing out the whole cabinet.
    """
    try:
        # Always clear the main facilities list
        redis_client.delete(FACILITY_CACHE_KEY)
        
        if facility_id:
            # Clear specific facility cache
            facility_key = f"{FACILITY_CACHE_PREFIX}{facility_id}"
            redis_client.delete(facility_key)
            
            # Clear facility users cache
            users_key = f"{FACILITY_USERS_CACHE_PREFIX}{facility_id}"
            redis_client.delete(users_key)
            
            # Clear any related pattern-based caches
            pattern_keys = redis_client.keys(f"{FACILITY_CACHE_PREFIX}{facility_id}:*")
            if pattern_keys:
                redis_client.delete(*pattern_keys)
                
        current_app.logger.info(f"Cache invalidated for facility: {facility_id or 'all'}")
        
    except Exception as e:
        current_app.logger.error(f"Cache invalidation failed: {str(e)}")

# Get all list of facilities
@facility_bp.route('/admin/facilities', methods=['GET'])
@require_auth
@require_role('admin')
def list_facilities():
    """Return all healthcare facilities visible to the current user."""
    try:
        bust_cache = request.arg.get('bust_cache', 'false').lower() == 'true'

        # If we have cached data, return it
        if not bust_cache:
            cached = redis_client.get(FACILITY_CACHE_KEY)
            
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.utc.now().isoformat()
                }), 200

        # If no cache, fetch from Supabase
        resp = supabase.table('healthcare_facilities').select('*').execute()
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error", 
                "message": "Failed to fetch facilities",
                "details": resp.error.message if resp.error else "Unknown",
            }), 400
        
        # Store fresh copy in Redis (5-minute TTL)
        redis_client.setex(FACILITY_CACHE_KEY, 300, json.dumps(resp.data))
        
        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.utc.now().isoformat()            
        }), 200

    except Exception as e:
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
        data = request.json or {}

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
        invalidate_facility_caches()

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
        
@facility_bp.route('/admin/facilities/<facility_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_facility(facility_id):
    try:
        data = request.json or {}
        
        resp = supabase.table('healthcare_facilities')\
            .update(data)\
                .eq('facility_id', facility_id)\
                .execute()
                
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to update facility",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        invalidate_facility_caches(facility_id)
        
        return jsonify({
            "status": "success",
            "message": "Facility updated successfully!",
            "data": resp.data[0] if resp.data else None
        }), 201
        
    except AuthApiError as AuthError:
        return jsonify({
            "status": "error",
            "message": f"API error: {str(AuthError)}" 
        }), 500

# Get Facility by ID
@facility_bp.route('/admin/facilities/<facility_id>', methods=['GET'])
@require_auth
def get_facility_by_id(facility_id):
    """Retrieve a single facility by its UUID."""
    try:
        resp = (
            supabase.table('healthcare_facilities')
            .select('*')
            .eq('facility_id', facility_id)
            .single()
            .execute()
        )

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Facility not found",
                "details": resp.error.message if resp.error else "Unknown",
            }), 404

        return jsonify({
            "status": "success",
            "data": resp.data,
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error retrieving facility: {str(e)}",
        }), 500

# Soft delete by deactivating active status
@facility_bp.route('/admin/<facility_id>/delete_facility', methods=['POST'])
@require_auth
@require_role('admin')
def delete_facility(facility_id):
    try:
        response = supabase.table('healthcare_facilities').update({"subscription_status": "inactive"}).eq("facility_id", facility_id).execute()
        
        if not response:
            return jsonify({
                "status": "error",
                "message": f"Error deactivating facility: {str(facility_id)}"
            })
        
        invalidate_facility_caches(facility_id)
            
        return jsonify({
            "status": "success",
            "message": "Successfully deactivate facility."
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Server error"
        }), 500

# Assign facility admin to facility
@facility_bp.route('/admin/<facility_id>/add_facility_admin', methods=['POST'])
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
                
                invalidate_facility_caches(facility_id)
                
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
        current_app.logger.error(f"AUDIT: Exception in add_facility_admin for facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign user: {str(e)}"
        }), 500

# Get all users for a specific facility
@facility_bp.route('/admin/facilities/<facility_id>/users', methods=['GET'])
@require_auth
@require_role('admin')
def get_facility_users(facility_id):
    """
    Get all users for a specific facility
    Like getting the employee roster for a building
    """
    try:
        # Query with joins to get complete user information
        query = supabase.table('facility_users')\
            .select('''
                *,
                users (
                    user_id,
                    email,
                    firstname,
                    lastname,
                    specialty,
                    license_number,
                    phone_number,
                    is_active,
                    created_at
                )
            ''')\
            .eq('facility_id', facility_id)\
            .is_('end_date', 'null')  # Only active assignments
        
        result = query.execute()
        
        if result.get('error'):
            raise Exception(result['error'])
        
        # Format the response
        facility_users = []
        for record in result.data:
            user_data = record['users']
            facility_users.append({
                'user_id': user_data['user_id'],
                'email': user_data['email'],
                'firstname': user_data['firstname'],
                'lastname': user_data['lastname'],
                'facility_role': record['role'],
                'specialty': user_data['specialty'],
                'license_number': user_data['license_number'],
                'phone_number': user_data['phone_number'],
                'start_date': record['start_date'],
                'is_active': user_data['is_active'],
                'created_at': user_data['created_at']
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
    data = request.json
    current_user = request.current_user
    
    try:
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
            user_updates['updated_at'] = datetime.utcnow().isoformat()
            
            user_update_result = supabase.table('users')\
                .update(user_updates)\
                .eq('user_id', user_id)\
                .execute()
            
            if user_update_result.get('error'):
                raise Exception(f"Failed to update user: {user_update_result['error']}")
        
        # Update facility-specific role if provided
        if 'role' in data:
            new_role = data['role']
            valid_roles = ['doctor', 'nurse', 'admin', 'staff']
            
            if new_role not in valid_roles:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
                }), 400
            
            facility_update_result = supabase.table('facility_users')\
                .update({'role': new_role})\
                .eq('facility_id', facility_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if facility_update_result.get('error'):
                raise Exception(f"Failed to update facility role: {facility_update_result['error']}")
        
        # Audit logging is handled automatically by the database trigger
        
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
        # Set end_date to current timestamp
        update_result = supabase.table('facility_users')\
            .update({'end_date': datetime.utcnow().isoformat()})\
            .eq('facility_id', facility_id)\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .execute()
            
        if update_result.get('error'):
            raise Exception(update_result['error'])
            
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
    data = request.json
    current_user = request.current_user
    
    patient_id = data.get('patient_id')
    notes = data.get('notes', '')
    
    if not patient_id:
        return jsonify({
            "status": "error",
            "message": "Patient ID is required"
        }), 400
    
    try:
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
            'assigned_by': current_user['id'],
            'notes': notes,
            'is_active': True
        }
        
        assignment_result = supabase.table('patient_facility').insert(assignment_record).execute()
        
        if assignment_result.get('error'):
            raise Exception(f"Failed to assign patient: {assignment_result['error']}")
        
        # Audit logging is handled automatically by the database trigger
        
        return jsonify({
            "status": "success",
            "message": "Patient assigned to facility successfully",
            "assignment_id": assignment_result.data[0]['pf_id']
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Failed to assign patient to facility: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign patient to facility: {str(e)}"
        }), 500

# Need refinements kay dapat ang invitation system also allows user to register if there are no accounts
# If found that accounts exist, then iinvite in to facility.
# Inviting user into the facility
@facility_bp.route('/admin/facilities/<facility_id>/invite', methods=['POST'])
@require_auth
@require_role('admin')
def invite_facility_user(facility_id):
    """
    Send an invitation to join a facility
    Like sending a job offer with building access
    """
    data = request.json
    current_user = request.current_user
    
    email = data.get('email')
    role = data.get('role')
    message = data.get('message', '')
    
    if not email or not role:
        return jsonify({
            "status": "error",
            "message": "Email and role are required"
        }), 400
    
    try:
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
        expires_at = datetime.utcnow() + datetime.timedelta(days=7)
        
        # Store invitation
        invite_record = {
            'email': email,
            'facility_id': facility_id,
            'role': role,
            'token': invite_token,
            'expires_at': expires_at.isoformat(),
            'created_by': current_user['id'],
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
