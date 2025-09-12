from flask import Flask, Blueprint, current_app, request, jsonify
from utils.access_control import require_auth, require_role
from utils.redis_client import get_redis_client
from utils.sanitize import sanitize_request_data
from utils.invalidate_cache import invalidate_caches
from postgrest.exceptions import APIError as AuthApiError
from config.settings import supabase
import json, datetime

appointment_bp = Blueprint('appointment', __name__)
redis_client = get_redis_client()

APPOINTMENT_CACHE_KEY = 'appointments:all'
APPOINTMENT_CACHE_PREFIX = 'appointments:'

def prepare_appointments_payload(data):
    """Prepare appointment payload with required and optional fields."""
    # Required fields
    patient_id = data.get('patient_id')
    facility_id = data.get('facility_id')
    doctor_id = data.get('doctor_id')
    scheduled_by = data.get('scheduled_by')
    
    if not all([patient_id, facility_id, doctor_id, scheduled_by]):
        raise ValueError("Missing required fields: patient_id, facility_id, doctor_id, and scheduled_by are required")
        
    return {
        'patient_id': patient_id,
        'facility_id': facility_id,
        'doctor_id': doctor_id,
        'scheduled_by': scheduled_by,
        'appointment_date': data.get('appointment_date'),
        'appointment_time': data.get('appointment_time'),
        'reason': data.get('reason'),
        'notes': data.get('notes', ''),
        'status': data.get('status')
    }
    
@appointment_bp.route('/appointments', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def get_appointments():
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower()== 'true'
        current_user = request.current_user
        
        if not bust_cache:
            cached = redis_client.get(APPOINTMENT_CACHE_KEY)
            
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    'status': 'success',
                    'data': cached_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
                
        resp = supabase.table('appointments')\
            .select('*, patient:patient_id(*), doctor:doctor_id(*), facility:facility_id(*)')\
            .execute()
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        redis_client.setex(APPOINTMENT_CACHE_KEY, 300, json.dumps(resp.data))

        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to fetch appointment")
        return jsonify({
            "status": "error",
            "message": f"Error fetching facilities: {str(e)}",
        }), 500
        
# Get appointments by patient_id
@appointment_bp.route('/appointments/patient/<patient_id>', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def get_appointments_by_patient_id(patient_id):
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to fetch appointments for patient: {patient_id}")
        
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}patient:{patient_id}"
        
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    'status': 'success',
                    'data': cached_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
                
        # Get all appointments for the patient, ordered by date
        resp = supabase.table('appointments')\
            .select('*, doctor:doctor_id(*), facility:facility_id(*)')\
            .eq('patient_id', patient_id)\
            .order('appointment_date', desc=True)\
            .execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for patient {patient_id}: {resp.error.message if resp.error else 'Unknown error'}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        # Cache the results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(resp.data))
        
        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for patient {patient_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

# Get appointments by facility_id
@appointment_bp.route('/appointments/facility/<facility_id>', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def get_appointments_by_facility_id(facility_id):
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to fetch appointments for patient: {facility_id}")
        
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}patient:{facility_id}"
        
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    'status': 'success',
                    'data': cached_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
                
        # Get all appointments for the patient, ordered by date
        resp = supabase.table('appointments')\
            .select('*, doctor:doctor_id(*), facility:facility_id(*)')\
            .eq('facility_id', facility_id)\
            .order('appointment_date', desc=True)\
            .execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for patient {facility_id}: {resp.error.message if resp.error else 'Unknown error'}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        # Cache the results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(resp.data))
        
        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for patient {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

# Get appointments by doctor_id
@appointment_bp.route('/appointments/doctor/<doctor_id>', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def get_appointments_by_doctor_id(doctor_id):
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to fetch appointments for patient: {doctor_id}")
        
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}patient:{doctor_id}"
        
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    'status': 'success',
                    'data': cached_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
                
        # Get all appointments for the doctor, ordered by date
        resp = supabase.table('appointments')\
            .select('*, patient:patient_id(*), doctor:doctor_id(*), facility:facility_id(*)')\
            .eq('doctor_id', doctor_id)\
            .order('appointment_date', desc=True)\
            .execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for patient {doctor_id}: {resp.error.message if resp.error else 'Unknown error'}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        # Cache the results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(resp.data))
        
        return jsonify({
            "status": "success",
            "data": resp.data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for patient {doctor_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

# Schedule appointment
@appointment_bp.route('/appointments', methods=['POST'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def schedule_appointment():
    try:
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        current_user = request.current_user
        
        required_fields = ['patient_id', 'facility_id', 'doctor_id', 'appointment_date', 'reason']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
            
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to schedule appointment")
        
        # Add the scheduled_by field to the data
        data['scheduled_by'] = current_user.get('id')
        
        try:
            appointments_payload = prepare_appointments_payload(data)
        except ValueError as ve:
            return jsonify({
                "status": "error",
                "message": str(ve)
            }), 400
        
        try:
            appointments_resp = supabase.table('appointments')\
                .insert(appointments_payload)\
                .execute()
                
            if getattr(appointments_resp, 'error', None):
                current_app.logger.error(f"AUDIT: Failed to schedule appointment: {appointments_resp.error.message if appointments_resp.error else 'Unknown error'}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to create patient",
                    "details": appointments_resp.error.message if appointments_resp.error else "Unknown",
                }), 400
                
            if not appointments_resp.data or len(appointments_resp.data) == 0:
                return jsonify({
                    "status": "error",
                    "message": "Failed to create patient - no data returned"
                }), 400

            appointment_id = appointments_resp.data[0].get('patient_id')
            if not appointment_id:
                return jsonify({
                    "status": "error",
                    "message": "Failed to get appointment ID"
                }), 400
                
            invalidate_caches('appointments')
            
            current_app.logger.info(f"AUDIT: Successfully scheduled appointment with ID {appointment_id}")
            
            return jsonify({
                    "status": "success",
                    "message": "Successfully plotted schedule",
                    "data": appointments_resp.data,          
                }), 201
            
        except AuthApiError as e:
            current_app.logger.error(f"AUDIT: Auth API error while creating patient: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Auth API Error: {str(e)}",
            }), 500
        except Exception as e:
            current_app.logger.error(f"AUDIT: Unexpected error while creating patient: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
            }), 500
            
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
        
@appointment_bp.route('/appointments/<appointment_id>', methods=['PUT'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def update_appointment(appointment_id):
    try:
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        current_user = request.current_user
        
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to update appointment {appointment_id}")
        
        data['scheduled_by'] = request.current_user.get('id')
        
        appointment_fields = ['appointment_date', 'reason', 'notes', 'doctor_id']
        update_data = {k: v for k, v in data.items() if k in appointment_fields and v is not None}
        
        if update_data:
            try:
                appointments_payload = prepare_appointments_payload(data)
            except ValueError as ve:
                return jsonify({
                    "status": "error",
                    "message": str(ve)
                }), 400
                
            resp = supabase.table('appointments').update(appointments_payload).eq('appointment_id', appointment_id).execute()
                        
            if getattr(resp, 'error', None):
                current_app.logger.error(f"AUDIT: Failed to update appointment {appointment_id}: {resp.error.message if resp.error else 'Unknown error'}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to update appointment",
                    "details": resp.error.message if resp.error else "Unknown"
                }), 400
        
        invalidate_caches('appointments', appointment_id)
        current_app.logger.info(f"AUDIT: Successfully updated patient record {appointment_id}")
        
        return jsonify({
            "status": "success",
            "message": "Appointment schedule updated successfully!",
            "data": {"patient_id": appointment_id}
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Unexpected error updating appointment {appointment_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500
