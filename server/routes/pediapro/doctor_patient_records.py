from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from postgrest.exceptions import APIError as AuthApiError
from utils.redis_client import get_redis_client
import json, datetime

# Create blueprint for patient routes
patrecord_bp = Blueprint('patrecord', __name__)
redis_client = get_redis_client()

PATIENT_CACHE_KEY = "patient_records:all"
PATIENT_CACHE_PREFIX = "patient_records:"

def invalidate_patient_caches(facility_id=None):
    """
    Smart cache invalidation - like clearing specific drawers in a filing cabinet
    instead of throwing out the whole cabinet.
    """
    try:
        # Always clear the main facilities list
        redis_client.delete(PATIENT_CACHE_KEY)
        
        if facility_id:
            # Clear specific facility cache
            facility_key = f"{PATIENT_CACHE_PREFIX}{facility_id}"
            redis_client.delete(facility_key)
            
            # Clear any related pattern-based caches
            pattern_keys = redis_client.keys(f"{PATIENT_CACHE_PREFIX}{facility_id}:*")
            if pattern_keys:
                redis_client.delete(*pattern_keys)
                
        current_app.logger.info(f"Cache invalidated for facility: {facility_id or 'all'}")
        
    except Exception as e:
        current_app.logger.error(f"Cache invalidation failed: {str(e)}")
        
@patrecord_bp.route('/patient_records', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin')
def get_patient_records():
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        
        if not bust_cache:
            cached = redis_client.get(PATIENT_CACHE_KEY)
            
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200
                
        resp = supabase.table('patients').select('*').execute()
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to fetch patients",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        redis_client.setex(PATIENT_CACHE_KEY, 300, json.dumps(resp.data))
        
        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
                
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching facilities: {str(e)}",
        }), 500

# ADD NEW PATIENT RECORD
@patrecord_bp.route('/patient_records', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin')
def add_patient_record():
    try:
        data = request.json
        
        created_by = (getattr(request, 'current_user', {}) or {}).get('id')
        
        payload = {
            "firstname": data.get('firstname'),
            "lastname": data.get('lastname'),
            "date_of_birth": data.get('date_of_birth'),
            "sex": data.get('sex'),
            "birth_weight": data.get('birth_weight'),
            "birth_height": data.get('birth_height'),
            "bloodtype": data.get('bloodtype'),
            "gestation_weeks": data.get('gestation_weeks'),
            "created_by": created_by,
        }
        
        resp = supabase.table('patients').insert(payload).execute()
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to create patient",
                "details": resp.error.message if resp.error else "Unknown",
            }), 400
        
        invalidate_patient_caches()
        
        return jsonify({
            "status": "success",
            "message": "Patient created successfully",
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
            "message": f"Error creating patient: {str(e)}",
        }), 500
        