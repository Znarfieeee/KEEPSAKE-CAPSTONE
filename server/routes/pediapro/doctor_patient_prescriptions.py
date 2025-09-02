from flask import Flask, jsonify, request, current_app, Blueprint
from config.settings import supabase
from utils.access_control import require_auth, require_role
from utils.redis_client import get_redis_client
from utils.invalidate_cache import invalidate_caches
import json, datetime

patrx_bp = Blueprint('patrx', __name__)
redis_client = get_redis_client()

PRESCRIPTION_CACHE_KEY = 'patient_prescription:all'
PRESCRIPTION_CACHE_PREFIX = 'patient_prescription:'
PRESCRIPTION_MEDICATION_= 'prescription_med:'


def prepare_prescription_payload( data, patient_id, created_by, pat_age):
    
    required_fields = ['consultation_type', 'findings', 'doctor_instructions']
    for field in required_fields:
        if not data.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    # Validate consultation_type range (1-10 as per schema)
    consultation_type = data.get('consultation_type')
    if not isinstance(consultation_type, int) or not (1 <= consultation_type <= 10):
        raise ValueError("consultation_type must be an integer between 1 and 10")
    
    payload = {
        "patient_id": patient_id,
        "consultation_type": consultation_type,
        "consultation_notes": data.get('consultation_notes', ''),
        "findings": data.get('findings'),
        "patient_age_at_time": pat_age,
        "doctor_instructions": data.get('doctor_instructions'),
        "return_date": data.get('return_date'),
        "created_by": created_by,
        "doctor_id": created_by,  # Assuming the creator is the doctor
        "facility_id": data.get('facility_id')  # This should be provided
    }
    
    return {k: v for k, v in payload.items() if v is not None}
    
# Get all prescription from patient_id
@patrx_bp.route('/patient_record/<patient_id>/prescriptions', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'parent', 'guardian')
def get_all_patient_rx(patient_id):
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        
        if not bust_cache: 
            cached = redis_client.get(PRESCRIPTION_CACHE_KEY + patient_id)
            
            if cached:
                cached_data = json.loads(cached)
                current_app.logger.info(f"Cache hit for patient {patient_id}")
                return jsonify({
                    'status': 'success',
                    'cached': True,
                    'data': cached_data,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                    
                }), 200
                
        rx_resp = supabase.table('prescriptions')\
            .select('*')\
            .eq('patient_id', patient_id)\
            .order('prescription_date', desc=True)\
            .execute()
        
        if rx_resp.error:
            current_app.logger.error(f"Prescription fetch error: {rx_resp.error}")
            return jsonify({
                'status': 'error',
                'message': "Failed to fetch prescription",
                "details": rx_resp.error.message if rx_resp.error else 'Unknown'
            }), 400
            
        prescriptions = rx_resp.data or []
            
        rx_ids = [rx.get('rx_id') for rx in prescriptions if rx.get('rx_id')]
            
        rx_med_resp = supabase.table('prescription_medications')\
            .select('*')\
            .in_('rx_id', rx_ids)\
            .execute()
        
        if getattr(rx_med_resp, 'error', None):
            return jsonify({
                'status': 'error',
                'message': "Failed to fetch prescription's medication",
                "details": rx_med_resp.error.message if rx_med_resp.error else 'Unknown'
            }), 400
            
        medications = rx_med_resp.data
        
        med_map = {}
        for med in medications: 
            rx_id = med.get('rx_id')
            med_map.setdefault(rx_id, []).append(med)
        
        resp = []
        for rx in prescriptions:
            rx['medications'] = med_map.get(rx.get('rx_id'), [])
            resp.append(rx)
        
        
        # Cache the constructed response
        redis_client.setex(PRESCRIPTION_CACHE_KEY + patient_id, 300, json.dumps(resp))
        
        return jsonify({
            'status': 'success',
            'data': resp,
            'cached': False,
            'timestamp': datetime.datetime.utcnow().isoformat()            
        }), 200
        
    except ValueError as ve:
        current_app.logger.warning(f"Validation error for patient {patient_id}: {str(ve)}")
        return jsonify({
            'status': 'error',
            'message': str(ve)
        }), 400
        
    except Exception as e:
        current_app.logger.error(f"Unexpected error fetching prescriptions for patient {patient_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred while fetching prescriptions'
        }), 500
        
@patrx_bp.route('/patient_record/<patient_id>/prescriptions', methods=['POST'])
@require_auth
@require_role('facility_admin', 'doctor')
def create_patient_prescription(patient_id):
    try:
        data = request.json
        current_user = request.current_user
        
        created_by = current_user.get('id')
        
        patient_check = supabase.table('patients').select('patient_id, date_of_birth').eq('patient_id', patient_id).single().execute()
        print(dict(patient_check))
        
        if patient_check.data:
            pat_age_resp = supabase.rpc('calculate_age', {'date_of_birth': patient_check['date_of_birth']}).execute()
            
            pat_age = pat_age_resp.data if pat_age_resp.data is not None else 0
        else:
            current_app.logger.error(f"Failed patient_check: {patient_check.error}")
            return jsonify({
                'status': 'error',
                'message': 'Error verifying patient record',
                'details': str(e)
            }), 400
        
        prescription_payload = prepare_prescription_payload(data, patient_id, created_by, pat_age)
        
        rx_resp = supabase.table('prescriptions').insert(prescription_payload).execute()
        
        if rx_resp.error:
            current_app.logger.error(f"Failed prescription_resp {rx_id}: {rx_resp.error}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to add prescription',
                'details': str(rx_resp.error)
            }), 400
        
        new_prescription = rx_resp.data[0] if rx_resp.data else None
        if not new_prescription:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create prescription - no data returned'
            }), 500
            
        rx_id = new_prescription.get('rx_id')
        
        medications = data.get('medications', [])
        if medications: 
            medication_payloads = []
            for med in medications:
                med_payload = {
                    'rx_id': rx_id,
                    'medication_name': med.get('medication_name'),
                    'dosage': med.get('dosage'),
                    'frequency': med.get('frequency'),
                    'duration': med.get('duration'),
                    'quantity': med.get('quantity'),
                    'refills_authorized': med.get('refills_authorized', 0),
                    'special_instructions': med.get('special_instructions')
                }
                
                if not all([med_payload['medication_name'], med_payload['dosage'], med_payload['frequency']]):
                    return jsonify({
                        'status': 'error',
                        'message': 'Missing required medication fields: medication_name, dosage, frequency'
                    }), 400
                    
                medication_payloads.append(med_payload)
                
            med_resp = supabase.table('prescription_medications')\
                .insert(medication_payloads)\
                .execute()
                
            if getattr(med_resp, 'error', None):
                current_app.logger.error(f"Failed to create medications for prescription {rx_id}: {med_resp.error}")
                return jsonify({
                    'status': 'error',
                    'message': 'Failed to create prescription medications',
                    'details': str(med_resp.error)
                }), 400
            
            new_prescription['medications'] = med_resp.data
        else:
            new_prescription['medications'] = []
            
        invalidate_caches('prescription', rx_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Prescription created successfully',
            'data': new_prescription,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }), 201
        
    except ValueError as ve:
        return jsonify({
            'status': 'error',
            'message': str(ve)
        }), 400
        
    except Exception as e:
        current_app.logger.error(f"Unexpected error creating prescription: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred while creating prescription'
        }), 500