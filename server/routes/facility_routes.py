from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from config.settings import supabase, supabase_service_role_client
from gotrue.errors import AuthApiError
from utils.access_control import require_auth, require_role
import jwt
import json
from utils.redis_client import redis_client
from utils.gen_password import generate_password

facility_bp = Blueprint('facility', __name__)

# List facilities -----------------------------------------------------------
@facility_bp.route('/facilities', methods=['GET'])
@require_auth
@require_role('admin', 'facility_admin', 'systemadmin')
def list_facilities():
    """Return all healthcare facilities visible to the current user."""
    try:
        cache_key = "healthcare_facilities:all"
        cached = redis_client.get(cache_key)
        cached_data = json.loads(cached) if cached else None

        # Fetch from Supabase
        resp = supabase.table('healthcare_facilities').select('*').execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error", 
                "message": "Failed to fetch facilities",
                "details": resp.error.message if resp.error else "Unknown",
            }), 400

        # Store fresh copy in Redis (10-minute TTL)
        redis_client.setex(cache_key, 600, json.dumps(resp.data))
        
        if cached_data:
            return jsonify({
                "status": "success",
                "data": cached_data,
                "cached": True,
            }), 200

        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching facilities: {str(e)}",
        }), 500


# Create facility -----------------------------------------------------------
@facility_bp.route('/facilities', methods=['POST'])
@require_auth
@require_role('admin', 'systemadmin')
def create_facility():
    """Create a new facility record in Supabase."""
    try:
        data = request.json or {}

        # Basic validation – facility_name is minimally required
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

        # Invalidate cached list so subsequent GET reflects the new record
        redis_client.delete("healthcare_facilities:all")

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


# Get facility by ID --------------------------------------------------------
@facility_bp.route('/facilities/<string:facility_id>', methods=['GET'])
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

# Fetching all users for a specific facility
@facility_bp.route('/facilities/<facility_id>/users', methods=['GET'])
@require_auth
@require_role(['admin', 'facility_admin', 'doctor', 'nurse'])
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

# Update a facility_user's or role
@facility_bp.route('/facilities/<facility_id>/users/<user_id>', methods=['PUT'])
@require_auth
@require_role(['admin', 'facility_admin'])
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
            user_updates['updated_at'] = datetime.datetime.utcnow().isoformat()
            
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

# Soft delete a user from a facility by setting end_date
@facility_bp.route('/facilities/<facility_id>/users/<user_id>', methods=['DELETE'])
@require_auth
@require_role(['admin', 'facility_admin'])
def remove_facility_user(facility_id, user_id):
    """
    Remove a user from a facility (soft delete by setting end_date)
    Like terminating an employee from a building
    """
    current_user = request.current_user
    data = request.json or {}
    end_date = data.get('end_date', datetime.date.today().isoformat())
    reason = data.get('reason', 'Removed by admin')
    
    try:
        # Check if user exists in facility
        facility_user_result = supabase.table('facility_users')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .single()\
            .execute()
        
        if facility_user_result.get('error') or not facility_user_result.data:
            return jsonify({
                "status": "error",
                "message": "User not found in this facility or already inactive"
            }), 404
        
        # Set end_date instead of deleting
        update_result = supabase.table('facility_users')\
            .update({'end_date': end_date})\
            .eq('facility_id', facility_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if update_result.get('error'):
            raise Exception(f"Failed to remove user from facility: {update_result['error']}")
        
        # Optionally deactivate user entirely if they have no other facility assignments
        other_facilities = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .execute()
        
        if not other_facilities.data:
            # User has no other active facility assignments, deactivate
            supabase.table('users')\
                .update({'is_active': False})\
                .eq('user_id', user_id)\
                .execute()
        
        # Audit logging is handled automatically by the database trigger
        
        return jsonify({
            "status": "success",
            "message": "User removed from facility successfully"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Failed to remove facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to remove facility user: {str(e)}"
        }), 500
        
# Need refinements kay dapat ang invitation system also allows user to register if there are no accounts
# If found that accounts exist, then iinvite in to facility.
# Inviting user into the facility
@facility_bp.route('/facilities/<facility_id>/invite', methods=['POST'])
@require_auth
@require_role(['admin', 'facility_admin'])
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
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        
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

# Assign a patient to the facility
@facility_bp.route('/facilities/<facility_id>/patients', methods=['POST'])
@require_auth
@require_role(['admin', 'facility_admin', 'doctor'])
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