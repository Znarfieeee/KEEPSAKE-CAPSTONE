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

def prepare_patient_payload(data, created_by):
    # Create payload with required fields
    payload = {
        "firstname": data.get('firstname'),
        "lastname": data.get('lastname'),
        "date_of_birth": data.get('date_of_birth'),
        "sex": data.get('sex'),
        "created_by": created_by,
        "is_active": True
    }
    
    # Add optional fields only if they have values
    optional_fields = ['birth_weight', 'birth_height', 'bloodtype', 'gestation_weeks']
    for field in optional_fields:
        if data.get(field) is not None:
            payload[field] = data.get(field)
            
    return payload

def prepare_delivery_payload(data):
    return {
        "type_of_delivery": data.get("type_of_delivery"),
        "apgar_score": data.get('apgar_score'),
        "mother_blood_type": data.get('mother_blood_type'),
        "father_blood_type": data.get('father_blood_type'),
        "patient_blood_type": data.get('patient_blood_type'),
        "distinguishable_remarks": data.get('distinguishable_remarks'),
        "vitamin_k_date": data.get('vitamin_k_date'),
        "vitamin_k_location": data.get('vitamin_k_location'),
        "hepatitis_b_date": data.get('hepatitis_b_date'),
        "bcg_vaccination_date": data.get('bcg_vaccination_date'),
        "bcg_vaccination_location": data.get('bcg_vaccination_location'),
        "other_medications": data.get('other_medications'),
        "follow_up_visit_date": data.get('follow_up_visit_date'),
        "follow_up_visit_site": data.get('follow_up_visit_site'),
        "discharge_diagnosis": data.get('discharge_diagnosis'),
        "other_medications": data.get('other_medications'),
        "obstetrician": data.get('obstetrician'),
        "pediatrician": data.get('pediatrician'),           
    }

def prepare_anthropometric_payload(data, recorded_by):
    return {
        "weight": data.get('weight'),
        "height": data.get('height'),
        "head_circumference": data.get('head_circumference'),
        "chest_circumference": data.get('chest_circumference'),
        "abdominal_circumference": data.get('abdominal_circumference'),
        "measurement_date": data.get('measurement_date'),
        "recorded_by": recorded_by
    }

def prepare_screening_payload(data):
    return {
        "ens_date": data.get('ens_date'),
        "ens_remarks": data.get('ens_remarks'),
        "nhs_date": data.get('nhs_date'),
        "nhs_right_ear": data.get('nhs_right_ear'),
        "nhs_left_ear": data.get('nhs_left_ear'),
        "pos_date": data.get('pos_date'),
        "pos_for_cchd_right": data.get('pos_for_cchd_right'),
        "pos_for_cchd_left": data.get('pos_for_cchd_left'),
        "ror_date": data.get('ror_date'),
        "ror_remarks": data.get('ror_remarks'),
    }

def prepare_allergy_payload(data, recorded_by):
    return {
        "allergen": data.get('allergen'),
        "reaction_type": data.get('reaction_type'),
        "severity": data.get('severity'),
        "date_identified": data.get('date_identified'),
        "notes": data.get('notes'),
        "recorded_by": recorded_by,
    }
   
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

# Add new patient
@patrecord_bp.route('/patient_records', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin')
def add_patient_record():
    try:
        data = request.json or {}
        current_user = request.current_user
        
        # Validate required fields
        required_fields = ['firstname', 'lastname', 'date_of_birth', 'sex']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
            
        # Validate sex field
        if data.get('sex') not in ['male', 'female', 'other']:
            return jsonify({
                "status": "error",
                "message": "Sex must be one of: male, female, other"
            }), 400
            
        # Validate gestation weeks if provided
        if data.get('gestation_weeks') is not None:
            weeks = data.get('gestation_weeks')
            if not isinstance(weeks, int) or weeks <= 0 or weeks > 50:
                return jsonify({
                    "status": "error",
                    "message": "Gestation weeks must be between 1 and 50"
                }), 400
            
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to create new patient record")
        
        created_by = current_user.get('id')
        
        # Prepare all payloads using helper functions
        patients_payload = prepare_patient_payload(data, created_by)
        delivery_payload = prepare_delivery_payload(data)
        anthropometric_payload = prepare_anthropometric_payload(data, created_by)
        screening_payload = prepare_screening_payload(data)
        allergy_payload = prepare_allergy_payload(data, created_by)
        
        try:
            # First, create the patient record and get the ID
            patient_resp = supabase.table('patients').insert(patients_payload).execute()
            if getattr(patient_resp, 'error', None):
                current_app.logger.error(f"AUDIT: Failed to create patient record: {patient_resp.error.message if patient_resp.error else 'Unknown error'}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to create patient",
                    "details": patient_resp.error.message if patient_resp.error else "Unknown",
                }), 400

            if not patient_resp.data or len(patient_resp.data) == 0:
                return jsonify({
                    "status": "error",
                    "message": "Failed to create patient - no data returned"
                }), 400

            patient_id = patient_resp.data[0].get('patient_id')
            if not patient_id:
                return jsonify({
                    "status": "error",
                    "message": "Failed to get patient ID"
                }), 400

            # Now create the audit log entry manually to ensure record_id is set
            audit_payload = {
                "user_id": current_user.get('id'),
                "action_type": "CREATE",
                "table_name": "patients",
                "record_id": patient_id,  # Use the patient_id as record_id
                "patient_id": patient_id,  # Also set the patient_id
                "new_values": patients_payload,
                "ip_address": request.remote_addr
            }
            
            audit_resp = supabase.table('audit_logs').insert(audit_payload).execute()
            if getattr(audit_resp, 'error', None):
                current_app.logger.error(f"AUDIT: Failed to create audit log: {audit_resp.error.message if audit_resp.error else 'Unknown error'}")
                
            # Add patient_id to related records
            delivery_payload['patient_id'] = patient_id
            anthropometric_payload['patient_id'] = patient_id
            screening_payload['patient_id'] = patient_id
            allergy_payload['patient_id'] = patient_id
            
            # Execute remaining operations
            operations = [
                ('delivery_record', delivery_payload),
                ('anthropometric_measurements', anthropometric_payload),
                ('screening_tests', screening_payload),
                ('allergies', allergy_payload)
            ]
            
            for table_name, payload in operations:
                resp = supabase.table(table_name).insert(payload).execute()
                if getattr(resp, 'error', None):
                    current_app.logger.error(f"AUDIT: Failed to create {table_name} record: {resp.error.message if resp.error else 'Unknown error'}")
                    return jsonify({
                        "status": "error",
                        "message": f"Failed to create {table_name}",
                        "details": resp.error.message if resp.error else "Unknown",
                    }), 400
                    
            invalidate_caches('patient')
            current_app.logger.info(f"AUDIT: Successfully created patient record with ID {patient_id}")
            
            return jsonify({
                "status": "success",
                "message": "Patient record created successfully",
                "data": patient_resp.data[0] if patient_resp.data else patients_payload,
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
        
        invalidate_caches('patient')
        current_app.logger.info(f"AUDIT: Successfully created patient record with ID {patient_id}")
        
        return jsonify({
            "status": "success",
            "message": "Patient record created successfully",
            "data": patient_resp.data[0] if patient_resp.data else patients_payload,
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
def update_patient_record(patient_id):
    try:
        data = request.json or {}
        current_user = request.current_user
        
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to update patient record {patient_id}")
        
        # Check if patient exists
        patient_check = supabase.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            current_app.logger.error(f"AUDIT: Patient {patient_id} not found during update attempt")
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404
            
        updated_by = current_user.get('id')
        
        # Prepare payloads for each table using the same helper functions
        updates = []
        
        if any(k in data for k in ['firstname', 'lastname', 'date_of_birth', 'sex', 'birth_weight', 'birth_height', 'bloodtype', 'gestation_weeks']):
            patient_payload = prepare_patient_payload(data, updated_by)
            updates.append(('patients', patient_payload))
            
        if any(k in data for k in ['type_of_delivery', 'apgar_score', 'mother_blood_type', 'father_blood_type', 'patient_blood_type',
                                  'vitamin_k_date', 'vitamin_k_location', 'hepatitis_b_date', 'bcg_vaccination_date']):
            delivery_payload = prepare_delivery_payload(data)
            updates.append(('delivery_record', delivery_payload))
            
        if any(k in data for k in ['weight', 'height', 'head_circumference', 'chest_circumference', 'abdominal_circumference']):
            anthropometric_payload = prepare_anthropometric_payload(data, updated_by)
            updates.append(('anthropometric_measurements', anthropometric_payload))
            
        if any(k in data for k in ['ens_date', 'ens_remarks', 'nhs_date', 'nhs_right_ear', 'nhs_left_ear',
                                  'pos_date', 'pos_for_cchd_right', 'pos_for_cchd_left', 'ror_date', 'ror_remarks']):
            screening_payload = prepare_screening_payload(data)
            updates.append(('screening_tests', screening_payload))
            
        if any(k in data for k in ['allergen', 'reaction_type', 'severity', 'date_identified', 'notes']):
            allergy_payload = prepare_allergy_payload(data, updated_by)
            updates.append(('allergies', allergy_payload))
            
        # Execute updates for each modified table
        for table_name, payload in updates:
            resp = supabase.table(table_name).update(payload).eq('patient_id', patient_id).execute()
            
            if getattr(resp, 'error', None):
                current_app.logger.error(f"AUDIT: Failed to update {table_name} for patient {patient_id}: {resp.error.message if resp.error else 'Unknown error'}")
                return jsonify({
                    "status": "error",
                    "message": f"Failed to update {table_name}",
                    "details": resp.error.message if resp.error else "Unknown"
                }), 400
        
        invalidate_caches('patient', patient_id)
        current_app.logger.info(f"AUDIT: Successfully updated patient record {patient_id}")
        
        return jsonify({
            "status": "success",
            "message": "Patient record updated successfully!",
            "data": {"patient_id": patient_id}
        }), 200
        
    except AuthApiError as e:
        current_app.logger.error(f"AUDIT: Exception on update functionality in patients for {patient_id} with IP ADDRESS {request.remote_addr}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"API Error: {str(e)}"
        }), 500
    except Exception as e:
        current_app.logger.error(f"AUDIT: Unexpected error updating patient {patient_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

# Get patient record by ID
@patrecord_bp.route('/patient_record/<patient_id>', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin')
def get_patient_record_by_id(patient_id):
    try:
        resp = supabase.table('patients')\
            .select('*')\
            .eq('patient_id', patient_id)\
            .single()\
            .execute()
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Patient not found",
                "details": resp.error.message if resp.error else "Unknown"
            }), 404
            
        return jsonify({
            "status": "success",
            "data": resp.data
        }), 200
        
    except AuthApiError as e:
        current_app.logger.error(f"AUDIT: Exception on update functionality in patients for {patient_id} with IP ADDRESS {request.remote_addr}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"API Error: {str(e)}"
        }), 500