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

def upsert_related_record(table_name, payload, patient_id, rx_id=None):
    """
    Upsert pattern: Try to update first, insert if no records exist
    For prescriptions: uses patient_id as key
    For medications: uses rx_id as key and handles array of medications
    """
    try:
        if table_name == 'prescription_medications':
            # For medications, always insert new records for a prescription
            result = supabase.table(table_name).insert(payload).execute()
            if not result.data:
                raise Exception("Failed to insert medications")
            current_app.logger.info(f"Created new medications for prescription {rx_id}")
            return result
        else:
            # For prescriptions table
            try:
                existing = supabase.table(table_name).select('*').eq('patient_id', patient_id).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Update existing prescription
                    result = supabase.table(table_name).update(payload).eq('patient_id', patient_id).execute()
                    current_app.logger.info(f"Updated existing {table_name} record for patient {patient_id}")
                else:
                    # Insert new prescription
                    result = supabase.table(table_name).insert(payload).execute()
                    current_app.logger.info(f"Created new {table_name} record for patient {patient_id}")
                
                if not result.data:
                    raise Exception(f"Failed to {'update' if existing.data else 'create'} {table_name}")
                return result
                
            except Exception as table_error:
                current_app.logger.error(f"Database operation failed: {str(table_error)}")
                raise
            
    except Exception as e:
        current_app.logger.error(f"Error upserting {table_name} for patient {patient_id}: {str(e)}")
        raise
    
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
        
        if not rx_resp:
            current_app.logger.error(f"Prescription fetch error: {rx_resp}")
            return jsonify({
                'status': 'error',
                'message': "Failed to fetch prescription",
                "details": rx_resp.error.message if rx_resp else 'Unknown'
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
                "details": rx_med_resp.error.message if rx_med_resp else 'Unknown'
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
        
@patrx_bp.route('/patient_record/<patient_id>/prescriptions', methods=['POST', 'PUT'])
@require_auth
@require_role('facility_admin', 'doctor')
def create_patient_prescription(patient_id):
    try:
        data = request.json
        current_user = request.current_user
        
        created_by = current_user.get('id')
        
        patient_check = supabase.table('patients').select('patient_id, date_of_birth').eq('patient_id', patient_id).single().execute()
        
        if not patient_check.data:
            return jsonify({
                'status': 'error',
                'message': 'Patient not found'
            }), 400
        
        try:
            dob = datetime.datetime.strptime(patient_check.data['date_of_birth'], '%Y-%m-%d')
            today = datetime.datetime.now()
            pat_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except Exception as patient_error:
            current_app.logger.error(f"Failed to calculate patient age: {patient_error}")
            pat_age = 0
            
        prescription_payload = prepare_prescription_payload(data, patient_id, created_by, pat_age)
        
        rx_resp = upsert_related_record('prescriptions', prescription_payload, patient_id)
        
        if not rx_resp.data:
            return jsonify({
                'status': 'error',
                'message': 'Failed to add prescription - no data returned'
            }), 500
        
        new_prescription = rx_resp.data[0] if rx_resp.data else None
        if not new_prescription:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create prescription - invalid response'
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
                
            # med_resp = supabase.table('prescription_medications')\
            #     .insert(medication_payloads)\
            #     .execute()
            
            try:
                med_resp = upsert_related_record('prescription_medications', medication_payloads, patient_id, rx_id)
                
                if not med_resp.data:
                    raise Exception("No data returned from medication creation")
                    
                new_prescription['medications'] = med_resp.data
                
            except Exception as med_error:
                current_app.logger.error(f"Failed to create medications for prescription {rx_id}: {str(med_error)}")
                return jsonify({
                    'status': 'error',
                    'message': 'Failed to create prescription medications',
                    'details': str(med_error)
                }), 400
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