from flask import Blueprint, request, jsonify
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


@facility_bp.route('/facilities/<int:facility_id>/users', methods=['POST'])
@require_auth
@require_role('facility_admin')
def create_facility_user(facility_id):
    """Create a new user and assign them to the facility for a specific facility"""
    data = request.json
    current_user = request.current_user
    
    email = data.get('email')
    password = generate_password()
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    role = data.get('role')
    specialty = data.get('specialty')
    license_number = data.get('license_number')
    phone_number = data.get('phone_number')
    start_date = data.get('start_date')
    
    # Validation
    required_fields = ['email', 'password', 'firstname', 'lastname', 'role', 'phone_number']
    if not all(data.get(field) for field in required_fields):
        return jsonify({
            "status": "error",
            "message": f"Missing required fields: {', '.join(required_fields)}"
        }), 400
        
    try:
        # Check if user exits
        check_user = supabase.table('users').select('*').eq('email', email).single().execute()
        if check_user.data:
            return jsonify({
                "status": "error",
                "message": "User already exists"
            }), 400
            
        # Create user in Supabase Auth
        signup_resp = supabase_service_role_client().auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "firstname": firstname,
                "lastname": lastname,
                "role": role,
                "specialty": specialty,
                "license_number": license_number,
                "phone_number": phone_number,
                "facility_id": facility_id,
                "created_by": current_user.get('id')
            }
        })
        
        # The user will be automatically added into public.users because of trigger function
        
        if signup_resp.user is None:
            return jsonify({
                "status": "error",
                "message": "Failed to create user"
            }), 400
        
        # Get the user_id
        user_id = signup_resp.user.id
        
        # Link user to facility
        facility_user_payload = {
            'facility_id': facility_id,
            'user_id': user_id,
            'role': role,
            'start_date': start_date
        }
        
        facility_user_result = supabase.table('facility_users').insert(facility_user_payload).execute()
        
        if getattr(facility_user_result, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to link user to facility"
            }), 400
        
        # Audit log
        audit_log(
            user_id=current_user['id'],
                action_type='CREATE',
                table_name='facility_users',
                record_id=user_id,
                patient_id=None,  # Not patient-specific
                new_values={
                    'facility_id': facility_id,
                    'user_id': user_id,
                    'role': role,
                    'created_by': current_user['id']
                }
        )
        
        return jsonify({
            "status": "success",
            "message": "Facility user created successfully!",
            }), 201
    
    except AuthApiError as auth_error:
        return jsonify({
            "status": "error",
            "message": f"Authentication error: {str(auth_error)}"
        }), 400
    except Exception as e:
        current_app.logger.error(f"Failed to create facility user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to create facility user: {str(e)}"
        }), 500