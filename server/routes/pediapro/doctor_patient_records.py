from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from postgrest.exceptions import APIError as AuthApiError
from utils.redis_client import get_redis_client
from utils.invalidate_cache import invalidate_caches
import json, datetime

# Create blueprint for patient routes
patrecord_bp = Blueprint('patrecord', __name__)
redis_client = get_redis_client()

PATIENT_CACHE_KEY = "patient_records:all"
PATIENT_CACHE_PREFIX = "patient_records:"
        
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
        
        invalidate_caches('patient')
        
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

# Update patient 
@patrecord_bp.route('/patient_record/<patient_id>', methods=['PUT'])
@require_auth
@require_role('facility_admin', 'doctor')
def update_user(patient_id):
    try:
        data = request.json
        
        resp = supabase.table('patients').update(data).eq('patient_id', patient_id).execute()
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to update patient",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        invalidate_caches('patient', patient_id)
        
        return jsonify({
            "status": "success",
            "message": "Patient updated successfully!",
            "data": resp.data[0] if resp.data else None
        }), 201
        
        
    except AuthApiError as e:
        current_app.logger.error(f"AUDIT: Exception on update functionality in patients for {patient_id} with IP ADDRESS {request.remote_addr}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"API Error: {str(e)}"
        }), 500