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

def prepare_delivery_payload(data, patient_id):
    return {
        "patient_id": patient_id,
        "type_of_delivery": data.get("type_of_delivery"),
        "apgar_score": data.get('apgar_score'),
        "mother_blood_type": data.get('mother_blood_type'),
        "father_blood_type": data.get('father_blood_type'),
        "patient_blood_type": data.get('patient_blood_type'),
        "distinguishable_marks": data.get('distinguishable_marks'),
        "vitamin_k_date": data.get('vitamin_k_date'),
        "vitamin_k_location": data.get('vitamin_k_location'),
        "hepatitis_b_date": data.get('hepatitis_b_date'),
        "hepatitis_b_location": data.get('hepatitis_b_location'), 
        "bcg_vaccination_date": data.get('bcg_vaccination_date'),
        "bcg_vaccination_location": data.get('bcg_vaccination_location'),
        "other_medications": data.get('other_medications'),
        "follow_up_visit_date": data.get('follow_up_visit_date'),
        "follow_up_visit_site": data.get('follow_up_visit_site'),
        "discharge_diagnosis": data.get('discharge_diagnosis'),
        "obstetrician": data.get('obstetrician'),
        "pediatrician": data.get('pediatrician'),           
    }

def prepare_anthropometric_payload(data, patient_id, recorded_by):
    return {
        "patient_id": patient_id,
        "weight": data.get('weight'),
        "height": data.get('height'),
        "head_circumference": data.get('head_circumference'),
        "chest_circumference": data.get('chest_circumference'),
        "abdominal_circumference": data.get('abdominal_circumference'),
        "measurement_date": data.get('measurement_date'),
        "recorded_by": recorded_by
    }

def prepare_screening_payload(data, patient_id):
    return {
        "patient_id": patient_id,
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

def prepare_allergy_payload(data, patient_id, recorded_by):
    return {
        "patient_id": patient_id,
        "allergen": data.get('allergen'),
        "reaction_type": data.get('reaction_type'),
        "severity": data.get('severity'),
        "date_identified": data.get('date_identified'),
        "notes": data.get('notes'),
        "recorded_by": recorded_by,
    }

def has_related_data(data, fields):
    """Check if any of the specified fields have non-empty values"""
    return any(data.get(field) for field in fields if data.get(field) not in [None, '', []])

def upsert_related_record(table_name, payload, patient_id):
    """
    Upsert pattern: Try to update first, insert if no records exist
    Think of this like React's useEffect with dependency array - 
    we only create/update when there's actual data to process
    """
    try:
        # First check if record exists
        existing = supabase.table(table_name).select('*').eq('patient_id', patient_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing record
            resp = supabase.table(table_name).update(payload).eq('patient_id', patient_id).execute()
            current_app.logger.info(f"Updated existing {table_name} record for patient {patient_id}")
        else:
            # Insert new record
            resp = supabase.table(table_name).insert(payload).execute()
            current_app.logger.info(f"Created new {table_name} record for patient {patient_id}")
            
        return resp
        
    except Exception as e:
        current_app.logger.error(f"Error upserting {table_name} for patient {patient_id}: {str(e)}")
        raise

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

@patrecord_bp.route('/patient_records', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin')
def add_patient_record():
    """
    Clean, focused patient creation - like a pure React functional component.
    Only handles the main patient record. 
    Use dedicated routes for related data (delivery, measurements, etc.)
    
    Think: <PatientBasicForm /> instead of <MegaPatientEverythingForm />
    """
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
        if data.get('sex') not in ['male', 'female']:
            return jsonify({
                "status": "error",
                "message": "Sex must be one of: male or female"
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
        
        # Create only the main patient record - clean and simple
        patients_payload = prepare_patient_payload(data, created_by)
        
        try:
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
                    
            invalidate_caches('patient')
            
            current_app.logger.info(f"AUDIT: Successfully created patient record with ID {patient_id}")
            
            return jsonify({
                "status": "success",
                "message": "Patient record created successfully. Use dedicated endpoints for additional data (delivery, measurements, etc.)",
                "data": patient_resp.data[0],
                "next_steps": {
                    "delivery_record": f"/api/patient_record/{patient_id}/delivery",
                    "anthropometric_data": f"/api/patient_record/{patient_id}/anthropometric",
                    "screening_tests": f"/api/patient_record/{patient_id}/screening",
                    "allergies": f"/api/patient_record/{patient_id}/allergies"
                }
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

# Separate routes for individual record types (like separate React components)
@patrecord_bp.route('/patient_record/<patient_id>/delivery', methods=['POST', 'PUT'])
@require_auth
@require_role('doctor', 'facility_admin')
def manage_delivery_record(patient_id):
    """Dedicated route for delivery records - like a focused React component"""
    try:
        data = request.json or {}
        current_user = request.current_user
        
        # Verify patient exists
        patient_check = supabase.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404
        
        delivery_payload = prepare_delivery_payload(data, patient_id)
        resp = upsert_related_record('delivery_record', delivery_payload, patient_id)
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to save delivery record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        invalidate_caches('patient', patient_id)
        
        return jsonify({
            "status": "success",
            "message": "Delivery record saved successfully",
            "data": resp.data
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error managing delivery record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/anthropometric', methods=['POST', 'PUT'])
@require_auth
@require_role('doctor', 'facility_admin')
def manage_anthropometric_record(patient_id):
    """Dedicated route for anthropometric records"""
    try:
        data = request.json or {}
        current_user = request.current_user
        
        # Verify patient exists
        patient_check = supabase.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404
        
        recorded_by = current_user.get('id')
        anthropometric_payload = prepare_anthropometric_payload(data, patient_id, recorded_by)
        resp = upsert_related_record('anthropometric_measurements', anthropometric_payload, patient_id)
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to save anthropometric record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        invalidate_caches('patient', patient_id)
        
        return jsonify({
            "status": "success",
            "message": "Anthropometric record saved successfully",
            "data": resp.data
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error managing anthropometric record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/screening', methods=['POST', 'PUT'])
@require_auth
@require_role('doctor', 'facility_admin')
def manage_screening_record(patient_id):
    """Dedicated route for screening test records"""
    try:
        data = request.json or {}
        current_user = request.current_user
        
        # Verify patient exists
        patient_check = supabase.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404
        
        screening_payload = prepare_screening_payload(data, patient_id)
        resp = upsert_related_record('screening_tests', screening_payload, patient_id)
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to save screening record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        invalidate_caches('patient', patient_id)
        
        return jsonify({
            "status": "success",
            "message": "Screening record saved successfully",
            "data": resp.data
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error managing screening record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/allergies', methods=['POST', 'PUT'])
@require_auth
@require_role('doctor', 'facility_admin')
def manage_allergy_record(patient_id):
    """Dedicated route for allergy records"""
    try:
        data = request.json or {}
        current_user = request.current_user
        
        # Verify patient exists
        patient_check = supabase.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404
        
        recorded_by = current_user.get('id')
        allergy_payload = prepare_allergy_payload(data, patient_id, recorded_by)
        resp = upsert_related_record('allergies', allergy_payload, patient_id)
        
        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to save allergy record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400
            
        invalidate_caches('patient', patient_id)
        
        return jsonify({
            "status": "success",
            "message": "Allergy record saved successfully",
            "data": resp.data
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error managing allergy record: {str(e)}"
        }), 500

# Update patient - simplified to only handle patient table
@patrecord_bp.route('/patient_record/<patient_id>', methods=['PUT'])
@require_auth
@require_role('facility_admin', 'doctor')
def update_patient_record(patient_id):
    """
    Update only the main patient record. 
    Use dedicated routes for related records.
    Like updating props in a specific React component.
    """
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
        
        # Only update patient table fields
        patient_fields = ['firstname', 'lastname', 'date_of_birth', 'sex', 'birth_weight', 'birth_height', 'bloodtype', 'gestation_weeks']
        
        if any(k in data for k in patient_fields):
            patient_payload = prepare_patient_payload(data, updated_by)
            resp = supabase.table('patients').update(patient_payload).eq('patient_id', patient_id).execute()
            
            if getattr(resp, 'error', None):
                current_app.logger.error(f"AUDIT: Failed to update patient {patient_id}: {resp.error.message if resp.error else 'Unknown error'}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to update patient",
                    "details": resp.error.message if resp.error else "Unknown"
                }), 400
        
        invalidate_caches('patient', patient_id)
        current_app.logger.info(f"AUDIT: Successfully updated patient record {patient_id}")
        
        return jsonify({
            "status": "success",
            "message": "Patient record updated successfully!",
            "data": {"patient_id": patient_id}
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Unexpected error updating patient {patient_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

# Get patient record by ID with optional related data
@patrecord_bp.route('/patient_record/<patient_id>', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin')
def get_patient_record_by_id(patient_id):
    """
    Get patient with optional related data.
    Like a React component that can optionally load child components.
    """
    try:
        include_related = request.args.get('include_related', 'false').lower() == 'true'
        
        # Get main patient record
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
        
        patient_data = resp.data
        
        # Optionally include related records
        if include_related:
            related_data = {}
            
            # Get delivery record
            delivery_resp = supabase.table('delivery_record').select('*').eq('patient_id', patient_id).execute()
            if delivery_resp.data:
                related_data['delivery'] = delivery_resp.data[0] if delivery_resp.data else None
            
            # Get anthropometric measurements
            anthro_resp = supabase.table('anthropometric_measurements').select('*').eq('patient_id', patient_id).execute()
            if anthro_resp.data:
                related_data['anthropometric'] = anthro_resp.data
            
            # Get screening tests
            screening_resp = supabase.table('screening_tests').select('*').eq('patient_id', patient_id).execute()
            if screening_resp.data:
                related_data['screening'] = screening_resp.data[0] if screening_resp.data else None
            
            # Get allergies
            allergy_resp = supabase.table('allergies').select('*').eq('patient_id', patient_id).execute()
            if allergy_resp.data:
                related_data['allergies'] = allergy_resp.data
            
            patient_data['related_records'] = related_data
            
        return jsonify({
            "status": "success",
            "data": patient_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching patient {patient_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching patient: {str(e)}"
        }), 500