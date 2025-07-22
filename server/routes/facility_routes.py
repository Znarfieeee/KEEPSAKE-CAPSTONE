from flask import Blueprint, request, jsonify
from datetime import datetime
from config.settings import supabase
from gotrue.errors import AuthApiError
from utils.access_control import require_auth, require_role
import jwt
import json
from utils.redis_client import redis_client

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


# Wala pa nahuman
@facility_bp.route('/add_facility_user', methods=['POST'])
def add_facility_user():
    try:
        data = request.json
        
        # After successful facility creation, create a FACILITY_USERS entry for the admin
        # current_user_id = sb.auth.get_user().user.id if sb.auth.get_user() else None
        # if current_user_id:
        #     facility_user_insert = sb.table('FACILITY_USERS').insert({
        #         'FACILITY_ID': new_facility['FACILITY_ID'],
        #         'USER_ID': current_user_id,
        #         'ROLE': 'admin',
        #         'START_DATE': datetime.utcnow().date().isoformat()
        #     }).execute()

        #     if facility_user_insert.get('error'):
        #         # Log this error but don't fail the request since facility was created
        #         print(f"Warning: Failed to create facility_user record: {facility_user_insert['error']}")
        
        return jsonify({
            "status": "success",
            "message": "Facility user added successfully"
            }), 201
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error adding facility user: {str(e)}",
            "details": str(e)
        }), 500
        
