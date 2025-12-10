from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client, get_authenticated_client
from postgrest.exceptions import APIError as AuthApiError
from utils.redis_client import get_redis_client, clear_patient_cache
from utils.invalidate_cache import invalidate_caches
from utils.gen_password import generate_password
import json, datetime

# Use service role client for write operations (INSERT/UPDATE/DELETE)
# Backend already validates user permissions via @require_auth and @require_role decorators
# Service role bypasses RLS which avoids auth.uid() issues with JWT token handling
def get_write_client():
    """Returns service role client for write operations that bypass RLS.

    Security Note: This is safe because:
    1. All routes using this are protected by @require_auth (validates session)
    2. All routes using this are protected by @require_role (validates permissions)
    3. The created_by/recorded_by fields are set from the validated user ID
    """
    return supabase_service_role_client()

# Create blueprint for patient routes
patrecord_bp = Blueprint('patrecord', __name__)
redis_client = get_redis_client()

PATIENT_CACHE_KEY = "patient_records:all"
PATIENT_CACHE_PREFIX = "patient_records:"


# Debug endpoint to verify RLS authentication is working
@patrecord_bp.route('/debug/auth-test', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def debug_auth_test():
    """
    Debug endpoint to verify auth.uid() is being set correctly for RLS policies.
    This calls a test function that returns the current auth context.
    """
    try:
        import jwt
        current_user = request.current_user
        session_data = request.session_data
        db = get_authenticated_client()

        # Decode JWT to see the sub claim (without verification, just to inspect)
        access_token = session_data.get('access_token')
        jwt_claims = None
        jwt_sub = None
        if access_token:
            try:
                # Decode without verification just to inspect claims
                jwt_claims = jwt.decode(access_token, options={"verify_signature": False})
                jwt_sub = jwt_claims.get('sub')
            except Exception as jwt_err:
                jwt_claims = f"Error decoding: {str(jwt_err)}"

        # Call the test function to check auth.uid()
        auth_test = db.rpc('test_auth_uid').execute()

        # Also check if we can query the users table for the current user
        user_check = db.table('users').select('user_id, email, role, is_active').eq('user_id', current_user.get('id')).execute()

        # Check facility_users for the current user
        facility_check = db.table('facility_users').select('facility_id, user_id').eq('user_id', current_user.get('id')).execute()

        # Check if JWT sub matches session user_id
        id_match = str(jwt_sub) == str(current_user.get('id')) if jwt_sub else False

        return jsonify({
            "status": "success",
            "debug_info": {
                "current_user_from_session": {
                    "id": current_user.get('id'),
                    "email": current_user.get('email'),
                    "role": current_user.get('role'),
                    "facility_id": current_user.get('facility_id')
                },
                "jwt_info": {
                    "sub_claim": jwt_sub,
                    "role_claim": jwt_claims.get('role') if isinstance(jwt_claims, dict) else None,
                    "exp_claim": jwt_claims.get('exp') if isinstance(jwt_claims, dict) else None,
                    "session_user_id_matches_jwt_sub": id_match
                },
                "auth_uid_test": auth_test.data if auth_test.data else "No data returned",
                "user_in_db": user_check.data if user_check.data else "No user found in DB",
                "facility_assignment": facility_check.data if facility_check.data else "No facility assignment"
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Debug auth test error: {str(e)}")
        import traceback
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500


def prepare_patient_payload(data, created_by):
    # Create payload with required fields
    payload = {
        "firstname": data.get('firstname'),
        "lastname": data.get('lastname'),
        "middlename": data.get('middlename'),
        "date_of_birth": data.get('date_of_birth'),
        "sex": data.get('sex'),
        "created_by": created_by,
        "is_active": True
    }

    # Add optional fields only if they have values
    optional_fields = ['birth_weight', 'birth_height', 'bloodtype', 'gestation_weeks', 'mother', 'father']
    for field in optional_fields:
        if data.get(field) is not None:
            payload[field] = data.get(field)

    return payload

def prepare_delivery_payload(data, patient_id, recorded_by):
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
        "recorded_by": recorded_by,
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

def prepare_screening_payload(data, patient_id, recorded_by):
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
        "recorded_by": recorded_by,
    }

def prepare_allergy_payload(data, patient_id, recorded_by):
    return {
        "patient_id": patient_id,
        "allergen": data.get('allergen'),
        "reaction_type": data.get('reaction_type'),
        "severity": data.get('severity'),
        "date_identified": data.get('date_identified') or datetime.datetime.utcnow().date().isoformat(),
        "notes": data.get('notes'),
        "recorded_by": recorded_by,
    }

def prepare_prescription_payload(data, patient_id, patient_age, recorded_by):
    return {
        'patient_id': patient_id,
        'doctor_id': recorded_by,
        'facility_id': data.get('facility_id'), # Fetch from facility_users or from frontend
        'prescription_date': datetime.utcnow().isoformat(),
        'findings': data.get('findings'),
        'consultation_type': data.get('consultation_type'),
        'consultation_notes': data.get('consultation_notes'),
        'doctor_instructions': data.get('doctor_instructions'),
        'return_date': data.get('return_date'),
        'patient_age_at_time': patient_age,
        'created_by': recorded_by,
        'created_at': datetime.utcnow().isoformat(),
    }

def has_related_data(data, fields):
    """Check if any of the specified fields have non-empty values"""
    return any(data.get(field) for field in fields if data.get(field) not in [None, '', []])

def upsert_related_record(table_name, payload, patient_id, db=None):
    """
    Upsert pattern: Try to update first, insert if no records exist
    Think of this like React's useEffect with dependency array -
    we only create/update when there's actual data to process

    Args:
        table_name: Name of the table to upsert
        payload: Data payload to insert/update
        patient_id: Patient ID for the record
        db: Optional database client (defaults to authenticated client for RLS)
    """
    try:
        # Use provided db client or default to authenticated client for RLS
        if db is None:
            db = get_authenticated_client()

        current_app.logger.info(f"Attempting to upsert {table_name} for patient {patient_id} with payload: {payload}")

        # First check if record exists
        existing = db.table(table_name).select('*').eq('patient_id', patient_id).execute()

        if getattr(existing, 'error', None):
            current_app.logger.error(f"Error checking existing {table_name} record: {existing.error.message}")
            return existing

        if existing.data and len(existing.data) > 0:
            # Update existing record
            resp = db.table(table_name).update(payload).eq('patient_id', patient_id).execute()
            current_app.logger.info(f"Updated existing {table_name} record for patient {patient_id}")
        else:
            # Insert new record
            resp = db.table(table_name).insert(payload).execute()
            current_app.logger.info(f"Created new {table_name} record for patient {patient_id}")

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Database error in {table_name}: {resp.error.message}")
        else:
            current_app.logger.info(f"Successfully upserted {table_name} record")

        return resp

    except Exception as e:
        current_app.logger.error(f"Exception upserting {table_name} for patient {patient_id}: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@patrecord_bp.route('/patient_records', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def get_patient_records():
    """
    Fetch patients with facility-based isolation.
    Only returns patients that are registered at the user's facility via facility_patients table.
    """
    try:
        current_user = request.current_user
        user_facility_id = current_user.get('facility_id')

        if not user_facility_id:
            current_app.logger.error(f"AUDIT: User {current_user.get('email')} has no facility_id assigned")
            return jsonify({
                "status": "error",
                "message": "User is not assigned to any facility"
            }), 403

        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        facility_cache_key = f"{PATIENT_CACHE_PREFIX}facility:{user_facility_id}"

        if not bust_cache:
            cached = redis_client.get(facility_cache_key)

            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200

        # Fetch only patients registered at the user's facility through facility_patients junction table
        resp = get_authenticated_client().table('facility_patients')\
            .select('''
                facility_patient_id,
                registered_at,
                registration_method,
                is_active,
                patients (
                    patient_id,
                    firstname,
                    lastname,
                    middlename,
                    date_of_birth,
                    sex,
                    birth_weight,
                    birth_height,
                    bloodtype,
                    gestation_weeks,
                    created_by,
                    is_active,
                    created_at,
                    updated_at
                )
            ''')\
            .eq('facility_id', user_facility_id)\
            .eq('is_active', True)\
            .order('registered_at', desc=True)\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch patients for facility {user_facility_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch patients",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        # Extract patient data from the nested response and flatten it
        patients_data = []
        for record in resp.data or []:
            if record.get('patients'):
                patient = record['patients']
                # Add facility-specific metadata
                patient['facility_registration'] = {
                    'facility_patient_id': record.get('facility_patient_id'),
                    'registered_at': record.get('registered_at'),
                    'registration_method': record.get('registration_method')
                }
                patients_data.append(patient)

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetched {len(patients_data)} patients from facility {user_facility_id}")

        # Cache the facility-specific results
        redis_client.setex(facility_cache_key, 300, json.dumps(patients_data))

        return jsonify({
            "status": "success",
            "data": patients_data,
            "cached": False,
            "facility_id": user_facility_id,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching patients: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching patients: {str(e)}",
        }), 500

@patrecord_bp.route('/patient_records', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
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

        current_app.logger.info(f"AUDIT: User {current_user.get('email', 'Unknown')} attempting to create new patient record")
        current_app.logger.debug(f"Patient creation data received: {json.dumps(data, default=str)}")

        # Validate required fields
        required_fields = ['firstname', 'lastname', 'date_of_birth', 'sex']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            current_app.logger.warning(f"AUDIT: Patient creation failed - missing required fields: {missing_fields}")
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "field_errors": {field: "This field is required" for field in missing_fields}
            }), 400

        # Validate sex field
        if data.get('sex') not in ['male', 'female']:
            current_app.logger.warning(f"AUDIT: Patient creation failed - invalid sex value: {data.get('sex')}")
            return jsonify({
                "status": "error",
                "message": "Sex must be one of: male or female",
                "field_errors": {"sex": "Please select a valid sex option"}
            }), 400

        # Validate date of birth format
        try:
            from datetime import datetime
            datetime.fromisoformat(data.get('date_of_birth').replace('Z', '+00:00'))
        except (ValueError, AttributeError) as e:
            current_app.logger.warning(f"AUDIT: Patient creation failed - invalid date format: {data.get('date_of_birth')}")
            return jsonify({
                "status": "error",
                "message": "Invalid date of birth format",
                "field_errors": {"date_of_birth": "Please provide a valid date"}
            }), 400

        created_by = current_user.get('id')
        if not created_by:
            current_app.logger.error(f"AUDIT: Patient creation failed - no user ID available")
            return jsonify({
                "status": "error",
                "message": "Authentication error - user ID not found"
            }), 401

        # Create only the main patient record - clean and simple
        patients_payload = prepare_patient_payload(data, created_by)
        current_app.logger.debug(f"Prepared patient payload: {json.dumps(patients_payload, default=str)}")

        try:
            # Use service role client for INSERT operations
            # Backend already validates user via @require_auth and @require_role decorators
            db = get_write_client()
            patient_resp = db.table('patients').insert(patients_payload).execute()

            if getattr(patient_resp, 'error', None):
                error_msg = patient_resp.error.message if patient_resp.error else 'Unknown database error'
                current_app.logger.error(f"AUDIT: Failed to create patient record - Database error: {error_msg}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to create patient record",
                    "details": error_msg,
                }), 500

            if not patient_resp.data or len(patient_resp.data) == 0:
                current_app.logger.error(f"AUDIT: Failed to create patient record - No data returned from database")
                return jsonify({
                    "status": "error",
                    "message": "Failed to create patient record - database returned no data"
                }), 500

            patient_data = patient_resp.data[0]
            patient_id = patient_data.get('patient_id')

            if not patient_id:
                current_app.logger.error(f"AUDIT: Failed to create patient record - Patient ID not found in response")
                return jsonify({
                    "status": "error",
                    "message": "Failed to retrieve patient ID from created record"
                }), 500

            # Register patient to the user's facility
            user_facility_id = current_user.get('facility_id')
            if user_facility_id:
                try:
                    facility_patient_payload = {
                        'facility_id': user_facility_id,
                        'patient_id': patient_id,
                        'registered_by': created_by,
                        'registration_method': 'manual',
                        'is_active': True
                    }

                    # Use service role client for facility_patients insertion
                    facility_patient_resp = get_write_client().table('facility_patients').insert(facility_patient_payload).execute()

                    if getattr(facility_patient_resp, 'error', None):
                        current_app.logger.error(f"AUDIT: Failed to register patient {patient_id} to facility {user_facility_id}: {facility_patient_resp.error.message}")
                        # Don't fail the entire operation, but log the error
                    else:
                        current_app.logger.info(f"AUDIT: Successfully registered patient {patient_id} to facility {user_facility_id}")

                except Exception as facility_error:
                    current_app.logger.error(f"AUDIT: Exception registering patient to facility: {str(facility_error)}")
                    # Don't fail the entire operation
            else:
                current_app.logger.warning(f"AUDIT: User {current_user.get('email')} has no facility_id, patient {patient_id} not registered to any facility")

            invalidate_caches('patient')

            current_app.logger.info(f"AUDIT: Successfully created patient record with ID {patient_id} for user {current_user.get('email', 'Unknown')}")

            return jsonify({
                "status": "success",
                "message": "Patient record created successfully",
                "data": patient_data,
                "patient_id": patient_id,
                "next_steps": {
                    "delivery_record": f"/patient_record/{patient_id}/delivery",
                    "growth_milestones": f"/patient_record/{patient_id}/growth-milestone",
                    "screening_tests": f"/patient_record/{patient_id}/screening",
                    "allergies": f"/patient_record/{patient_id}/allergies",
                    "prescription": f"/patient_record/{patient_id}/prescription",
                }
            }), 201

        except AuthApiError as e:
            current_app.logger.error(f"AUDIT: Auth API error while creating patient: {str(e)}")
            return jsonify({
                "status": "error",
                "message": "Authentication error occurred while creating patient",
                "details": str(e)
            }), 401
        except Exception as e:
            current_app.logger.error(f"AUDIT: Unexpected error while creating patient: {str(e)}")
            import traceback
            current_app.logger.error(f"AUDIT: Traceback: {traceback.format_exc()}")
            return jsonify({
                "status": "error",
                "message": "An unexpected error occurred while creating the patient record",
                "details": str(e)
            }), 500

    except AuthApiError as e:
        current_app.logger.error(f"AUDIT: Supabase Auth error in patient creation: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Authentication error",
            "details": str(e)
        }), 401

    except Exception as e:
        current_app.logger.error(f"AUDIT: Top-level error creating patient: {str(e)}")
        import traceback
        current_app.logger.error(f"AUDIT: Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred",
            "details": str(e)
        }), 500

# Separate routes for individual record types (like separate React components)
@patrecord_bp.route('/patient_record/<patient_id>/delivery', methods=['POST', 'PUT'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def manage_delivery_record(patient_id):
    """Dedicated route for delivery records - like a focused React component"""
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        delivery_payload = prepare_delivery_payload(data, patient_id, recorded_by)
        resp = upsert_related_record('delivery_record', delivery_payload, patient_id, db)

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
@require_role('doctor', 'facility_admin', 'nurse')
def manage_anthropometric_record(patient_id):
    """
    Manage anthropometric measurements - upsert pattern for the most recent measurement.
    POST: Add new measurement or update if recent one exists
    PUT: Update the most recent measurement
    """
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        current_app.logger.info(f"AUDIT: Managing anthropometric record for patient {patient_id} by user {current_user.get('email')}")

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        anthro_payload = prepare_anthropometric_payload(data, patient_id, recorded_by)

        # Check if we're updating an existing record (has am_id) or creating new
        am_id = data.get('am_id')

        if am_id and request.method == 'PUT':
            # Update specific measurement by ID
            resp = db.table('anthropometric_measurements').update(anthro_payload).eq('am_id', am_id).eq('patient_id', patient_id).execute()
            action = "updated"
        else:
            # Check for recent measurement (within last 24 hours) to update
            existing = db.table('anthropometric_measurements').select('am_id, measurement_date').eq('patient_id', patient_id).order('measurement_date', desc=True).limit(1).execute()

            if existing.data and len(existing.data) > 0:
                # Update the most recent measurement
                recent_am_id = existing.data[0]['am_id']
                resp = db.table('anthropometric_measurements').update(anthro_payload).eq('am_id', recent_am_id).execute()
                action = "updated"
            else:
                # Insert new measurement
                resp = db.table('anthropometric_measurements').insert(anthro_payload).execute()
                action = "created"

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Error managing anthropometric record: {resp.error.message if resp.error else 'Unknown'}")
            return jsonify({
                "status": "error",
                "message": "Failed to save anthropometric record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        patient_name = f"{patient_check.data['firstname']} {patient_check.data['lastname']}"
        current_app.logger.info(f"AUDIT: Successfully {action} anthropometric record for patient {patient_name} (ID: {patient_id})")

        invalidate_caches('patient', patient_id)

        return jsonify({
            "status": "success",
            "message": f"Anthropometric record {action} successfully",
            "data": resp.data
        }), 200 if action == "updated" else 201

    except Exception as e:
        current_app.logger.error(f"AUDIT: Exception managing anthropometric record: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error managing anthropometric record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/growth-milestone', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def add_growth_milestone(patient_id):
    """
    Add a new growth milestone measurement for tracking child development.
    This endpoint records anthropometric measurements (weight, height, head circumference, etc.)
    which are used to generate WHO growth charts and track the child's development over time.

    Patients can have multiple milestone records tracked throughout their growth journey.
    """
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        current_app.logger.info(f"AUDIT: Adding growth milestone for patient {patient_id} by user {current_user.get('email')}")

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            current_app.logger.warning(f"AUDIT: Patient {patient_id} not found")
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        milestone_payload = prepare_anthropometric_payload(data, patient_id, recorded_by)

        current_app.logger.debug(f"Growth milestone payload: {milestone_payload}")

        # Insert new milestone record
        resp = db.table('anthropometric_measurements').insert(milestone_payload).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Error inserting growth milestone: {resp.error.message if resp.error else 'Unknown'}")
            return jsonify({
                "status": "error",
                "message": "Failed to save growth milestone",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        patient_name = f"{patient_check.data['firstname']} {patient_check.data['lastname']}"
        current_app.logger.info(f"AUDIT: Successfully added growth milestone for patient {patient_name} (ID: {patient_id})")

        invalidate_caches('patient', patient_id)

        return jsonify({
            "status": "success",
            "message": "Growth milestone recorded successfully",
            "data": resp.data
        }), 201

    except Exception as e:
        current_app.logger.error(f"AUDIT: Exception adding growth milestone: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error recording growth milestone: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/growth-milestone/<measurement_id>', methods=['PUT'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def update_growth_milestone(patient_id, measurement_id):
    """Update an existing growth milestone measurement"""
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        current_app.logger.info(f"AUDIT: Updating growth milestone {measurement_id} for patient {patient_id}")

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        milestone_payload = prepare_anthropometric_payload(data, patient_id, recorded_by)

        # Update specific milestone record
        resp = db.table('anthropometric_measurements').update(milestone_payload).eq('am_id', measurement_id).eq('patient_id', patient_id).execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to update growth milestone",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        invalidate_caches('patient', patient_id)
        current_app.logger.info(f"AUDIT: Successfully updated growth milestone {measurement_id}")

        return jsonify({
            "status": "success",
            "message": "Growth milestone updated successfully",
            "data": resp.data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating growth milestone: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error updating growth milestone: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/growth-milestone/<measurement_id>', methods=['DELETE'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def delete_growth_milestone(patient_id, measurement_id):
    """Delete a growth milestone measurement"""
    try:
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        current_app.logger.info(f"AUDIT: Deleting growth milestone {measurement_id} for patient {patient_id}")

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Delete specific milestone record
        resp = db.table('anthropometric_measurements').delete().eq('am_id', measurement_id).eq('patient_id', patient_id).execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to delete growth milestone",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        invalidate_caches('patient', patient_id)
        current_app.logger.info(f"AUDIT: Successfully deleted growth milestone {measurement_id}")

        return jsonify({
            "status": "success",
            "message": "Growth milestone deleted successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting growth milestone: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error deleting growth milestone: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/screening', methods=['POST', 'PUT'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def manage_screening_record(patient_id):
    """Dedicated route for screening test records"""
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        screening_payload = prepare_screening_payload(data, patient_id, recorded_by)
        resp = upsert_related_record('screening_tests', screening_payload, patient_id, db)

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
        
@patrecord_bp.route('/patient_record/<patient_id>/allergies', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def add_allergy_record(patient_id):
    """Add a new allergy record - patients can have multiple allergies"""
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        current_app.logger.info(f"DEBUG: Adding allergy for patient {patient_id} with data: {data}")

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        allergy_payload = prepare_allergy_payload(data, patient_id, recorded_by)

        current_app.logger.info(f"DEBUG: Allergy payload: {allergy_payload}")

        # Always INSERT new allergy records (don't use upsert since patients can have multiple allergies)
        resp = db.table('allergies').insert(allergy_payload).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"DEBUG: Error inserting allergy: {resp.error.message if resp.error else 'Unknown'}")
            return jsonify({
                "status": "error",
                "message": "Failed to save allergy record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        current_app.logger.info(f"DEBUG: Successfully added allergy record: {resp.data}")
        invalidate_caches('patient', patient_id)

        return jsonify({
            "status": "success",
            "message": "Allergy record added successfully",
            "data": resp.data
        }), 201

    except Exception as e:
        current_app.logger.error(f"DEBUG: Exception adding allergy: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error adding allergy record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/allergies/<allergy_id>', methods=['PUT'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def update_allergy_record(patient_id, allergy_id):
    """Update an existing allergy record"""
    try:
        data = request.json or {}
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        recorded_by = current_user.get('id')
        allergy_payload = prepare_allergy_payload(data, patient_id, recorded_by)

        # Update specific allergy record
        resp = db.table('allergies').update(allergy_payload).eq('allergy_id', allergy_id).eq('patient_id', patient_id).execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to update allergy record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        invalidate_caches('patient', patient_id)

        return jsonify({
            "status": "success",
            "message": "Allergy record updated successfully",
            "data": resp.data
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error updating allergy record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/allergies/<allergy_id>', methods=['DELETE'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def delete_allergy_record(patient_id, allergy_id):
    """Delete an allergy record"""
    try:
        current_user = request.current_user
        db = get_write_client()  # Use service role for write operations

        # Verify patient exists
        patient_check = db.table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Delete specific allergy record
        resp = db.table('allergies').delete().eq('allergy_id', allergy_id).eq('patient_id', patient_id).execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to delete allergy record",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        invalidate_caches('patient', patient_id)

        return jsonify({
            "status": "success",
            "message": "Allergy record deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error deleting allergy record: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/parent_access/<access_id>', methods=['PUT'])
@require_auth
@require_role('doctor', 'facility_admin')
def update_parent_relationship(patient_id, access_id):
    """
    Update the relationship type for an existing parent-child assignment.

    Use this to change relationship from 'parent' to 'guardian', etc.
    To revoke access entirely, use DELETE /patient_record/<patient_id>/remove-parent/<access_id>
    """
    try:
        data = request.json or {}
        current_user = request.current_user

        # Verify patient exists
        patient_check = get_authenticated_client().table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Validate relationship is provided
        relationship = data.get('relationship')
        if not relationship:
            return jsonify({
                "status": "error",
                "message": "relationship field is required"
            }), 400

        # Validate relationship type
        valid_relationships = ['parent', 'guardian', 'caregiver', 'family_member']
        if relationship not in valid_relationships:
            return jsonify({
                "status": "error",
                "message": f"Invalid relationship. Must be one of: {', '.join(valid_relationships)}"
            }), 400

        # Verify access record exists and is active
        access_check = get_authenticated_client().table('parent_access').select('''
            access_id,
            relationship,
            is_active,
            users!parent_access_user_id_fkey(
                firstname,
                lastname,
                email
            )
        ''').eq('access_id', access_id).eq('patient_id', patient_id).single().execute()

        if not access_check.data:
            return jsonify({
                "status": "error",
                "message": "Parent access record not found"
            }), 404

        access_record = access_check.data
        if not access_record.get('is_active'):
            return jsonify({
                "status": "error",
                "message": "Cannot update revoked parent access. Please create a new assignment."
            }), 400

        # Update only the relationship
        update_payload = {
            'relationship': relationship
        }

        resp = get_authenticated_client().table('parent_access').update(update_payload).eq('access_id', access_id).eq('patient_id', patient_id).execute()

        if getattr(resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to update parent relationship",
                "details": resp.error.message if resp.error else "Unknown"
            }), 400

        invalidate_caches('patient', patient_id)

        parent_user = access_record.get('users')
        parent_name = f"{parent_user['firstname']} {parent_user['lastname']}" if parent_user else "Unknown"
        patient_name = f"{patient_check.data['firstname']} {patient_check.data['lastname']}"

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} updated relationship for {parent_name} to '{relationship}' for patient {patient_name}")

        return jsonify({
            "status": "success",
            "message": f"Successfully updated {parent_name}'s relationship to {patient_name} as '{relationship}'",
            "data": resp.data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in update_parent_relationship: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error updating parent relationship: {str(e)}"
        }), 500

# ============================================================================
# COMPREHENSIVE PARENT-CHILD ASSIGNMENT ROUTES
# ============================================================================

@patrecord_bp.route('/patient_record/<patient_id>/parents', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def get_patient_parents(patient_id):
    """
    Get all parents/guardians assigned to a specific patient.
    Returns complete parent information with relationship details.
    """
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetching parents for patient {patient_id}")

        # Verify patient exists
        patient_check = get_authenticated_client().table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Get all active parent access records with user details
        parent_access_resp = get_authenticated_client().table('parent_access').select('''
            access_id,
            relationship,
            granted_at,
            revoked_at,
            is_active,
            users!parent_access_user_id_fkey(
                user_id,
                email,
                firstname,
                lastname,
                phone_number,
                is_active
            ),
            granted_by_user:users!parent_access_granted_by_fkey(
                firstname,
                lastname,
                email
            )
        ''').eq('patient_id', patient_id).order('granted_at', desc=True).execute()

        if getattr(parent_access_resp, 'error', None):
            current_app.logger.error(f"Error fetching parents: {parent_access_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch parent information",
                "details": parent_access_resp.error.message
            }), 400

        parents_data = []
        for access_record in parent_access_resp.data:
            parent_user = access_record.get('users')
            granted_by = access_record.get('granted_by_user')

            if parent_user:
                parents_data.append({
                    'access_id': access_record['access_id'],
                    'relationship': access_record['relationship'],
                    'granted_at': access_record['granted_at'],
                    'revoked_at': access_record['revoked_at'],
                    'is_active': access_record['is_active'],
                    'parent': {
                        'user_id': parent_user['user_id'],
                        'email': parent_user['email'],
                        'firstname': parent_user['firstname'],
                        'lastname': parent_user['lastname'],
                        'phone_number': parent_user['phone_number'],
                        'is_active': parent_user['is_active']
                    },
                    'granted_by': {
                        'name': f"{granted_by['firstname']} {granted_by['lastname']}" if granted_by else "Unknown",
                        'email': granted_by['email'] if granted_by else None
                    }
                })

        current_app.logger.info(f"AUDIT: Found {len(parents_data)} parents for patient {patient_id}")

        return jsonify({
            "status": "success",
            "data": {
                "patient": patient_check.data,
                "parents": parents_data,
                "count": len(parents_data)
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_patient_parents: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching parent information: {str(e)}"
        }), 500

@patrecord_bp.route('/parents/search', methods=['GET'])
@require_auth
@require_role('doctor', 'facility_admin', 'nurse')
def search_parents():
    """
    Search for existing parent users by email or phone number.
    This helps doctors find existing parent accounts before creating new ones.

    Query params:
    - email: Search by email (exact or partial match)
    - phone: Search by phone number (partial match)
    """
    try:
        current_user = request.current_user
        email = request.args.get('email', '').strip()
        phone = request.args.get('phone', '').strip()

        if not email and not phone:
            return jsonify({
                "status": "error",
                "message": "Please provide either email or phone number to search"
            }), 400

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} searching for parents with email='{email}' phone='{phone}'")

        # Build search query
        query = get_authenticated_client().table('users').select('user_id, email, firstname, lastname, phone_number, is_active, created_at')

        # Search by email or phone
        if email:
            query = query.ilike('email', f'%{email}%')
        if phone:
            query = query.ilike('phone_number', f'%{phone}%')

        # Only search for parent role users
        query = query.eq('role', 'parent')

        search_resp = query.limit(20).execute()

        if getattr(search_resp, 'error', None):
            current_app.logger.error(f"Error searching parents: {search_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to search for parents",
                "details": search_resp.error.message
            }), 400

        parents = search_resp.data or []

        current_app.logger.info(f"AUDIT: Found {len(parents)} parent users matching search criteria")

        return jsonify({
            "status": "success",
            "data": {
                "parents": parents,
                "count": len(parents),
                "search_criteria": {
                    "email": email if email else None,
                    "phone": phone if phone else None
                }
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in search_parents: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error searching for parents: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/assign-parent', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin')
def assign_existing_parent_to_child(patient_id):
    """
    Assign an existing parent user to a child (patient).
    This route is for linking existing parent accounts to patients.

    Required fields:
    - parent_user_id: The user_id of the existing parent
    - relationship: Type of relationship (parent, guardian, caregiver, family_member)

    This route checks for duplicate assignments and validates the parent user.
    """
    try:
        data = request.json or {}
        current_user = request.current_user
        parent_user_id = data.get('parent_user_id')
        relationship = data.get('relationship', 'parent')

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} assigning parent {parent_user_id} to patient {patient_id}")

        # Validate required fields
        if not parent_user_id:
            return jsonify({
                "status": "error",
                "message": "parent_user_id is required"
            }), 400

        # Validate relationship type
        valid_relationships = ['parent', 'guardian', 'caregiver', 'family_member']
        if relationship not in valid_relationships:
            return jsonify({
                "status": "error",
                "message": f"Invalid relationship. Must be one of: {', '.join(valid_relationships)}"
            }), 400

        # Verify patient exists
        patient_check = get_authenticated_client().table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            current_app.logger.warning(f"AUDIT: Patient {patient_id} not found")
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Verify parent user exists and has parent role
        parent_check = get_authenticated_client().table('users').select('user_id, email, firstname, lastname, role, is_active').eq('user_id', parent_user_id).single().execute()
        if not parent_check.data:
            current_app.logger.warning(f"AUDIT: Parent user {parent_user_id} not found")
            return jsonify({
                "status": "error",
                "message": "Parent user not found"
            }), 404

        parent_user = parent_check.data
        if parent_user['role'] != 'parent':
            return jsonify({
                "status": "error",
                "message": f"User must have 'parent' role. Current role: {parent_user['role']}"
            }), 400

        # Check for existing active assignment
        existing_check = get_authenticated_client().table('parent_access')\
            .select('access_id, is_active')\
            .eq('patient_id', patient_id)\
            .eq('user_id', parent_user_id)\
            .eq('is_active', True)\
            .execute()

        if existing_check.data and len(existing_check.data) > 0:
            current_app.logger.warning(f"AUDIT: Parent {parent_user_id} already assigned to patient {patient_id}")
            return jsonify({
                "status": "error",
                "message": f"{parent_user['firstname']} {parent_user['lastname']} is already assigned to this patient"
            }), 409

        # Create parent access record
        granted_by = current_user.get('id')
        parent_access_payload = {
            "patient_id": patient_id,
            "user_id": parent_user_id,
            "relationship": relationship,
            "granted_by": granted_by,
            "granted_at": datetime.datetime.now().date().isoformat(),
            "is_active": True
        }

        resp = get_authenticated_client().table('parent_access').insert(parent_access_payload).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Error assigning parent: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to assign parent to patient",
                "details": resp.error.message
            }), 400

        invalidate_caches('patient', patient_id)

        patient_name = f"{patient_check.data['firstname']} {patient_check.data['lastname']}"
        parent_name = f"{parent_user['firstname']} {parent_user['lastname']}"

        current_app.logger.info(f"AUDIT: Successfully assigned parent {parent_name} ({parent_user['email']}) to patient {patient_name}")

        return jsonify({
            "status": "success",
            "message": f"Successfully assigned {parent_name} as {relationship} to {patient_name}",
            "data": {
                "access_record": resp.data[0] if resp.data else None,
                "parent": parent_user,
                "patient": patient_check.data
            }
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error in assign_existing_parent_to_child: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error assigning parent to patient: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/create-and-assign-parent', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin')
def create_and_assign_parent(patient_id):
    """
    Create a new parent user account and immediately assign them to a patient.
    This is a convenience route that combines user creation and parent assignment.

    Required fields:
    - email: Parent's email (must be unique)
    - firstname: Parent's first name
    - lastname: Parent's last name
    - relationship: Type of relationship (parent, guardian, caregiver, family_member)

    Optional fields:
    - phone_number: Parent's phone number
    - facility_id: Facility to assign the parent to

    The system will:
    1. Check if email already exists
    2. Create a new parent user with auto-generated password
    3. Assign the parent to the patient
    4. Return the generated password (doctor should share with parent)
    """
    try:
        data = request.json or {}
        current_user = request.current_user

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} creating and assigning new parent to patient {patient_id}")

        # Validate required fields
        required_fields = ['email', 'firstname', 'lastname', 'relationship']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        email = data.get('email').strip().lower()
        firstname = data.get('firstname').strip()
        lastname = data.get('lastname').strip()
        phone_number = data.get('phone_number', '').strip()
        relationship = data.get('relationship', 'parent')
        facility_id = data.get('facility_id')  # Optional

        # Validate relationship type
        valid_relationships = ['parent', 'guardian', 'caregiver', 'family_member']
        if relationship not in valid_relationships:
            return jsonify({
                "status": "error",
                "message": f"Invalid relationship. Must be one of: {', '.join(valid_relationships)}"
            }), 400

        # Verify patient exists
        patient_check = get_authenticated_client().table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            current_app.logger.warning(f"AUDIT: Patient {patient_id} not found")
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Check if email already exists in users table
        email_check = get_authenticated_client().table('users').select('user_id, email, role, is_active').eq('email', email).execute()
        if email_check.data and len(email_check.data) > 0:
            existing_user = email_check.data[0]
            current_app.logger.warning(f"AUDIT: Email {email} already exists in users table with role {existing_user['role']}")

            # If user exists and has parent role, suggest using assign existing parent
            if existing_user['role'] == 'parent':
                return jsonify({
                    "status": "error",
                    "message": f"A parent account with email {email} already exists",
                    "suggestion": "Use the 'Assign Existing Parent' option instead",
                    "existing_user_id": existing_user['user_id']
                }), 409
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Email {email} is already registered with role: {existing_user['role']}",
                    "suggestion": "Please use a different email address"
                }), 409

        # Set default password (user will be required to change on first login)
        default_password = "keepsake123"

        # Get the service role client
        service_client = supabase_service_role_client()
        auth_user_id = None

        # Create parent user in Supabase Auth
        try:
            current_app.logger.info(f"AUDIT: Attempting to create auth user for {email}")

            auth_resp = service_client.auth.admin.create_user({
                "email": email,
                "password": default_password,
                "email_confirm": True,  # Auto-confirm email so they can login immediately
                "user_metadata": {
                    "firstname": firstname,
                    "lastname": lastname,
                    "role": "parent",
                    "must_change_password": True,  # Flag to force password change on first login
                    "is_first_login": True
                }
            })

            if not auth_resp or not auth_resp.user:
                current_app.logger.error(f"AUDIT: Failed to create auth user for parent {email}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to create parent account in authentication system"
                }), 500

            auth_user_id = auth_resp.user.id
            current_app.logger.info(f"AUDIT: Created auth user {auth_user_id} for parent {email} with default password")

        except Exception as auth_error:
            error_message = str(auth_error)
            current_app.logger.error(f"AUDIT: Auth error creating parent user: {error_message}")
            import traceback
            current_app.logger.error(f"AUDIT: Traceback: {traceback.format_exc()}")

            # Check if error is due to user already existing in auth
            if "already registered" in error_message.lower() or "already exists" in error_message.lower() or "unique" in error_message.lower():
                # Try to get the existing auth user
                try:
                    current_app.logger.info(f"AUDIT: Email {email} already exists in Supabase Auth, attempting to retrieve user")
                    # List users by email to get the auth user
                    auth_users = service_client.auth.admin.list_users()
                    existing_auth_user = None

                    for user in auth_users:
                        if hasattr(user, 'email') and user.email == email:
                            existing_auth_user = user
                            break

                    if existing_auth_user:
                        auth_user_id = existing_auth_user.id
                        current_app.logger.info(f"AUDIT: Found existing auth user {auth_user_id} for {email}")
                    else:
                        return jsonify({
                            "status": "error",
                            "message": f"Email {email} is already registered in the system but could not be retrieved",
                            "suggestion": "Please contact system administrator"
                        }), 409
                except Exception as retrieval_error:
                    current_app.logger.error(f"AUDIT: Failed to retrieve existing auth user: {str(retrieval_error)}")
                    return jsonify({
                        "status": "error",
                        "message": f"Email {email} is already registered but could not be retrieved",
                        "details": str(retrieval_error)
                    }), 409
            else:
                return jsonify({
                    "status": "error",
                    "message": "Failed to create parent account",
                    "details": error_message
                }), 500

        # Now create or verify parent record in users table
        try:
            # Double-check if user record already exists with this user_id
            user_id_check = get_authenticated_client().table('users').select('user_id, email, role').eq('user_id', auth_user_id).execute()

            if user_id_check.data and len(user_id_check.data) > 0:
                # User record already exists, use it
                parent_user = user_id_check.data[0]
                current_app.logger.info(f"AUDIT: User record already exists for {auth_user_id}, using existing record")
            else:
                # Create new user record
                user_payload = {
                    "user_id": auth_user_id,
                    "email": email,
                    "password": "hashed_by_supabase_auth",  # Actual password is managed by Supabase Auth
                    "firstname": firstname,
                    "lastname": lastname,
                    "role": "parent",
                    "phone_number": phone_number if phone_number else None,
                    "is_active": True,
                    "is_subscribed": False
                }

                user_resp = get_authenticated_client().table('users').insert(user_payload).execute()

                if getattr(user_resp, 'error', None):
                    error_code = getattr(user_resp.error, 'code', None)
                    error_message = getattr(user_resp.error, 'message', 'Unknown error')

                    current_app.logger.error(f"AUDIT: Failed to create user record for parent {email}: {error_message} (code: {error_code})")

                    # If duplicate key error, try to fetch the existing record
                    if error_code == '23505':  # Unique constraint violation
                        current_app.logger.info(f"AUDIT: User record may already exist for {auth_user_id}, attempting to fetch")
                        existing_check = get_authenticated_client().table('users').select('*').eq('user_id', auth_user_id).execute()
                        if existing_check.data and len(existing_check.data) > 0:
                            parent_user = existing_check.data[0]
                            current_app.logger.info(f"AUDIT: Successfully retrieved existing user record for {auth_user_id}")
                        else:
                            # Clean up auth user since we can't create the database record
                            try:
                                service_client.auth.admin.delete_user(auth_user_id)
                                current_app.logger.info(f"AUDIT: Cleaned up auth user {auth_user_id}")
                            except Exception as cleanup_error:
                                current_app.logger.warning(f"Failed to cleanup auth user: {str(cleanup_error)}")

                            return jsonify({
                                "status": "error",
                                "message": "Failed to create parent user record due to constraint violation",
                                "details": error_message
                            }), 500
                    else:
                        # Clean up auth user for other errors
                        try:
                            service_client.auth.admin.delete_user(auth_user_id)
                            current_app.logger.info(f"AUDIT: Cleaned up auth user {auth_user_id}")
                        except Exception as cleanup_error:
                            current_app.logger.warning(f"Failed to cleanup auth user: {str(cleanup_error)}")

                        return jsonify({
                            "status": "error",
                            "message": "Failed to create parent user record",
                            "details": error_message
                        }), 500
                else:
                    parent_user = user_resp.data[0] if user_resp.data else None

        except Exception as db_error:
            current_app.logger.error(f"AUDIT: Database error creating user record: {str(db_error)}")
            import traceback
            current_app.logger.error(f"AUDIT: Traceback: {traceback.format_exc()}")

            # Clean up auth user
            try:
                if auth_user_id:
                    service_client.auth.admin.delete_user(auth_user_id)
                    current_app.logger.info(f"AUDIT: Cleaned up auth user {auth_user_id}")
            except Exception as cleanup_error:
                current_app.logger.warning(f"Failed to cleanup auth user: {str(cleanup_error)}")

            return jsonify({
                "status": "error",
                "message": "Database error while creating parent user",
                "details": str(db_error)
            }), 500

        if not parent_user:
            return jsonify({
                "status": "error",
                "message": "Failed to retrieve parent user record"
            }), 500

        parent_user_id = parent_user['user_id']
        current_app.logger.info(f"AUDIT: Created parent user record {parent_user_id} for {email}")

        # If facility_id provided, assign parent to facility
        if facility_id:
            try:
                facility_user_payload = {
                    "user_id": parent_user_id,
                    "facility_id": facility_id,
                    "assigned_by": current_user.get('id'),
                    "is_active": True
                }
                facility_resp = get_authenticated_client().table('facility_users').insert(facility_user_payload).execute()
                if not getattr(facility_resp, 'error', None):
                    current_app.logger.info(f"AUDIT: Assigned parent {parent_user_id} to facility {facility_id}")
            except Exception as fac_error:
                current_app.logger.warning(f"AUDIT: Failed to assign parent to facility: {str(fac_error)}")
                # Continue even if facility assignment fails

        # Create parent access record (assign to patient)
        granted_by = current_user.get('id')
        parent_access_payload = {
            "patient_id": patient_id,
            "user_id": parent_user_id,
            "relationship": relationship,
            "granted_by": granted_by,
            "granted_at": datetime.datetime.now().date().isoformat(),
            "is_active": True
        }

        access_resp = get_authenticated_client().table('parent_access').insert(parent_access_payload).execute()

        if getattr(access_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to assign parent {parent_user_id} to patient {patient_id}: {access_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Parent account created but failed to assign to patient",
                "details": access_resp.error.message,
                "parent_user_id": parent_user_id
            }), 400

        invalidate_caches('patient', patient_id)

        patient_name = f"{patient_check.data['firstname']} {patient_check.data['lastname']}"
        parent_name = f"{firstname} {lastname}"

        current_app.logger.info(f"AUDIT: Successfully created and assigned parent {parent_name} ({email}) to patient {patient_name}")

        return jsonify({
            "status": "success",
            "message": f"Successfully created parent account for {parent_name} and assigned as {relationship} to {patient_name}",
            "data": {
                "parent_user": {
                    "user_id": parent_user_id,
                    "email": email,
                    "firstname": firstname,
                    "lastname": lastname,
                    "phone_number": phone_number,
                    "role": "parent"
                },
                "generated_password": default_password,
                "default_password": default_password,
                "access_record": access_resp.data[0] if access_resp.data else None,
                "patient": patient_check.data
            },
            "important": "Please share the default password 'keepsake123' with the parent securely. They will be required to change it on first login."
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error in create_and_assign_parent: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error creating and assigning parent: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>/remove-parent/<access_id>', methods=['DELETE'])
@require_auth
@require_role('doctor', 'facility_admin')
def remove_parent_assignment(patient_id, access_id):
    """
    Remove a parent's access to a patient's records.
    This soft-deletes the parent_access record by setting is_active=False and revoked_at.

    The parent user account remains intact; only the relationship is removed.
    """
    try:
        current_user = request.current_user

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} removing parent access {access_id} from patient {patient_id}")

        # Verify patient exists
        patient_check = get_authenticated_client().table('patients').select('patient_id, firstname, lastname').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Verify parent access record exists
        access_check = get_authenticated_client().table('parent_access').select('''
            access_id,
            relationship,
            is_active,
            users!parent_access_user_id_fkey(
                firstname,
                lastname,
                email
            )
        ''').eq('access_id', access_id).eq('patient_id', patient_id).single().execute()

        if not access_check.data:
            return jsonify({
                "status": "error",
                "message": "Parent access record not found"
            }), 404

        access_record = access_check.data
        parent_user = access_record.get('users')

        # Soft delete: Set is_active=False and revoked_at
        update_payload = {
            "is_active": False,
            "revoked_at": datetime.datetime.now().date().isoformat()
        }

        resp = get_authenticated_client().table('parent_access').update(update_payload).eq('access_id', access_id).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Error removing parent access: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to remove parent access",
                "details": resp.error.message
            }), 400

        invalidate_caches('patient', patient_id)

        patient_name = f"{patient_check.data['firstname']} {patient_check.data['lastname']}"
        parent_name = f"{parent_user['firstname']} {parent_user['lastname']}" if parent_user else "Unknown"

        current_app.logger.info(f"AUDIT: Successfully removed parent {parent_name} access from patient {patient_name}")

        return jsonify({
            "status": "success",
            "message": f"Successfully removed {parent_name}'s access to {patient_name}'s records",
            "data": {
                "access_id": access_id,
                "revoked_at": update_payload['revoked_at']
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in remove_parent_assignment: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error removing parent assignment: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>', methods=['PUT'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
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
        patient_check = get_authenticated_client().table('patients').select('patient_id').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            current_app.logger.error(f"AUDIT: Patient {patient_id} not found during update attempt")
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404
            
        updated_by = current_user.get('id')

        # Only update patient table fields
        patient_fields = ['firstname', 'middlename', 'lastname', 'date_of_birth', 'sex', 'birth_weight', 'birth_height', 'bloodtype', 'gestation_weeks', 'mother', 'father']
        
        if any(k in data for k in patient_fields):
            patient_payload = prepare_patient_payload(data, updated_by)
            resp = get_authenticated_client().table('patients').update(patient_payload).eq('patient_id', patient_id).execute()
            
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
@require_role('doctor', 'pediapro', 'facility_admin', 'nurse', 'vital_custodian', 'parent', 'keepsaker')
def get_patient_record_by_id(patient_id):
    """
    Get patient with optional related data.
    Like a React component that can optionally load child components.

    RLS policies enforce access based on authenticated user's JWT token:
    - Healthcare staff can only access patients registered to their facility
    - Parents can only access their assigned children
    """
    try:
        current_user = request.current_user
        user_role = current_user.get('role')
        user_id = current_user.get('id')
        user_facility_id = current_user.get('facility_id')

        # RLS policies will enforce access based on the authenticated user's JWT token
        # The @require_auth decorator creates a per-request authenticated client via set_authenticated_client()

        # If user is a parent or keepsaker, verify they have access to this child
        if user_role in ['parent', 'keepsaker']:
            access_check = get_authenticated_client().table('parent_access')\
                .select('access_id, relationship')\
                .eq('user_id', user_id)\
                .eq('patient_id', patient_id)\
                .eq('is_active', True)\
                .execute()

            if not access_check.data or len(access_check.data) == 0:
                current_app.logger.warning(f"AUDIT: Unauthorized parent access attempt - User {current_user.get('email')} tried to access patient {patient_id}")
                return jsonify({
                    "status": "error",
                    "message": "You do not have access to this child's records"
                }), 403

        # For facility staff, verify patient is registered to their facility
        elif user_role in ['doctor', 'facility_admin', 'nurse', 'pediapro', 'vital_custodian']:
            if user_facility_id:
                facility_check = get_authenticated_client().table('facility_patients')\
                    .select('facility_patient_id')\
                    .eq('patient_id', patient_id)\
                    .eq('facility_id', user_facility_id)\
                    .eq('is_active', True)\
                    .execute()

                if not facility_check.data or len(facility_check.data) == 0:
                    current_app.logger.warning(f"AUDIT: Patient {patient_id} not registered to facility {user_facility_id} for user {current_user.get('email')}")
                    return jsonify({
                        "status": "error",
                        "message": "Patient is not registered to your facility. Please scan their QR code first."
                    }), 403

        include_related = request.args.get('include_related', 'false').lower() == 'true'

        # Get main patient record - RLS policies will enforce access
        resp = get_authenticated_client().table('patients')\
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

        try:
            age_resp = get_authenticated_client().rpc('calculate_age', {'date_of_birth': patient_data['date_of_birth']}).execute()
            
            if age_resp.data is not None: 
                age_data = age_resp.data
                
                patient_data['age_info'] = {
                    'formatted_age': age_data.get('formatted_age', 'Unknown'),
                    'years': age_data.get('years', 0),
                    'months': age_data.get('months', 0),
                    'days': age_data.get('days', 0),
                    'total_days': age_data.get('total_days', 0),
                    'calculated_on': age_data.get('calculated_on')
                }
                
                patient_data['age'] = age_data.get('formatted_age')
                
            else:
                current_app.logger.warning(f"Age calculation returned null for patient {patient_id}")
                patient_data['calculated_age'] = None
        except Exception as age_error:
            current_app.logger.error(f"Error calculating age for patient {patient_id}: {str(age_error)}")
            # Don't fail the entire request if age calculation fails
            patient_data['calculated_age'] = None
            
            
        # Optionally include related records
        if include_related:
            related_data = {}

            try:
                # Get delivery record - RLS policies enforce access
                delivery_resp = get_authenticated_client().table('delivery_record').select('*').eq('patient_id', patient_id).execute()
                if getattr(delivery_resp, 'error', None):
                    current_app.logger.error(f"Error fetching delivery record for patient {patient_id}: {delivery_resp.error.message}")
                    related_data['delivery'] = None
                else:
                    related_data['delivery'] = delivery_resp.data[0] if delivery_resp.data else None

                # Get anthropometric measurements
                anthro_resp = get_authenticated_client().table('anthropometric_measurements').select('*').eq('patient_id', patient_id).execute()
                if getattr(anthro_resp, 'error', None):
                    current_app.logger.error(f"Error fetching anthropometric data for patient {patient_id}: {anthro_resp.error.message}")
                    related_data['anthropometric_measurements'] = []
                else:
                    related_data['anthropometric_measurements'] = anthro_resp.data or []

                # Get screening tests
                screening_resp = get_authenticated_client().table('screening_tests').select('*').eq('patient_id', patient_id).execute()
                if getattr(screening_resp, 'error', None):
                    current_app.logger.error(f"Error fetching screening data for patient {patient_id}: {screening_resp.error.message}")
                    related_data['screening'] = None
                else:
                    related_data['screening'] = screening_resp.data[0] if screening_resp.data else None

                # Get allergies
                allergy_resp = get_authenticated_client().table('allergies').select('*').eq('patient_id', patient_id).order('date_identified', desc=True).execute()
                if getattr(allergy_resp, 'error', None):
                    current_app.logger.error(f"Error fetching allergies for patient {patient_id}: {allergy_resp.error.message}")
                    related_data['allergies'] = []
                else:
                    related_data['allergies'] = allergy_resp.data or []

                # Get prescriptions
                rx_resp = get_authenticated_client().table('prescriptions').select('*').eq('patient_id', patient_id).execute()
                if getattr(rx_resp, 'error', None):
                    current_app.logger.error(f"Error fetching prescriptions for patient {patient_id}: {rx_resp.error.message}")
                    related_data['prescriptions'] = []
                else:
                    related_data['prescriptions'] = rx_resp.data or []

                # Get vaccinations (exclude soft-deleted records)
                vaccination_resp = get_authenticated_client().table('vaccinations')\
                    .select('*')\
                    .eq('patient_id', patient_id)\
                    .eq('is_deleted', False)\
                    .execute()
                if getattr(vaccination_resp, 'error', None):
                    current_app.logger.error(f"Error fetching vaccinations for patient {patient_id}: {vaccination_resp.error.message}")
                    related_data['vaccinations'] = []
                else:
                    related_data['vaccinations'] = vaccination_resp.data or []

                # Get parent access data with user information
                parent_access_resp = get_authenticated_client().table('parent_access').select('''
                    access_id,
                    relationship,
                    granted_at,
                    revoked_at,
                    is_active,
                    users!parent_access_user_id_fkey(
                        user_id,
                        email,
                        firstname,
                        lastname,
                        phone_number
                    )
                ''').eq('patient_id', patient_id).eq('is_active', True).execute()

                if getattr(parent_access_resp, 'error', None):
                    current_app.logger.error(f"Error fetching parent access for patient {patient_id}: {parent_access_resp.error.message}")
                    related_data['parent_access'] = []
                else:
                    related_data['parent_access'] = parent_access_resp.data or []

            except Exception as related_error:
                current_app.logger.error(f"Exception while fetching related records for patient {patient_id}: {str(related_error)}")
                # Initialize empty related data if there's an exception
                related_data = {
                    'delivery': None,
                    'anthropometric_measurements': [],
                    'screening': None,
                    'allergies': [],
                    'prescriptions': [],
                    'vaccinations': [],
                    'parent_access': []
                }

            patient_data['related_records'] = related_data
            # current_app.logger.info(f"DEBUG: Final related_data structure for patient {patient_id}: {json.dumps(related_data, default=str)}")
            
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

@patrecord_bp.route('/patient_record/<patient_id>/register_to_facility', methods=['POST'])
@require_auth
@require_role('doctor', 'facility_admin')
def register_patient_to_facility(patient_id):
    """
    Register an existing patient to the user's facility.
    This will be used for QR code scanning in the future.
    For now, it allows manual registration of patients to facilities.
    """
    try:
        current_user = request.current_user
        user_facility_id = current_user.get('facility_id')

        if not user_facility_id:
            return jsonify({
                "status": "error",
                "message": "User is not assigned to any facility"
            }), 403

        # Verify patient exists
        patient_check = get_authenticated_client().table('patients').select('*').eq('patient_id', patient_id).single().execute()
        if not patient_check.data:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        # Check if patient is already registered to this facility
        existing_check = get_authenticated_client().table('facility_patients')\
            .select('*')\
            .eq('facility_id', user_facility_id)\
            .eq('patient_id', patient_id)\
            .execute()

        if existing_check.data and len(existing_check.data) > 0:
            existing_record = existing_check.data[0]
            if existing_record.get('is_active'):
                return jsonify({
                    "status": "error",
                    "message": "Patient is already registered to this facility"
                }), 409
            else:
                # Reactivate the existing record
                update_resp = get_authenticated_client().table('facility_patients')\
                    .update({
                        'is_active': True,
                        'deactivated_at': None,
                        'deactivated_by': None,
                        'deactivation_reason': None
                    })\
                    .eq('facility_patient_id', existing_record['facility_patient_id'])\
                    .execute()

                if getattr(update_resp, 'error', None):
                    return jsonify({
                        "status": "error",
                        "message": "Failed to reactivate patient registration",
                        "details": update_resp.error.message
                    }), 500

                current_app.logger.info(f"AUDIT: Reactivated patient {patient_id} registration to facility {user_facility_id} by {current_user.get('email')}")

                return jsonify({
                    "status": "success",
                    "message": "Patient registration reactivated successfully",
                    "data": update_resp.data[0]
                }), 200

        # Register new patient to facility
        data = request.json or {}
        registration_method = data.get('registration_method', 'manual')

        facility_patient_payload = {
            'facility_id': user_facility_id,
            'patient_id': patient_id,
            'registered_by': current_user.get('id'),
            'registration_method': registration_method,
            'is_active': True
        }

        # Add QR code data if provided
        if data.get('qr_code_scanned'):
            facility_patient_payload['qr_code_scanned_at'] = datetime.datetime.utcnow().isoformat()
            facility_patient_payload['qr_code_scanned_by'] = current_user.get('id')

        resp = get_authenticated_client().table('facility_patients').insert(facility_patient_payload).execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to register patient {patient_id} to facility {user_facility_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to register patient to facility",
                "details": resp.error.message
            }), 500

        invalidate_caches('patient')

        current_app.logger.info(f"AUDIT: Successfully registered patient {patient_id} to facility {user_facility_id} by {current_user.get('email')}")

        return jsonify({
            "status": "success",
            "message": "Patient registered to facility successfully",
            "data": resp.data[0]
        }), 201

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error registering patient to facility: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error registering patient to facility: {str(e)}"
        }), 500

@patrecord_bp.route('/patient_record/<patient_id>', methods=['PATCH'])
@require_auth
@require_role('doctor', 'facility_admin')
def delete_patient_record(patient_id):
    """
    Delete patient record and all related records.
    This is a hard delete operation that removes all traces of the patient.

    Security: Only facility admins and doctors can delete patient records.
    """
    try:
        current_user = request.current_user
        user_facility_id = current_user.get('facility_id')

        current_app.logger.info(f"AUDIT: User {current_user.get('email', 'Unknown')} attempting to deactivate patient record {patient_id}")

        # # Check if patient exists
        # patient_check = get_authenticated_client().table('patients').select('*').eq('patient_id', patient_id).single().execute()
        # if not patient_check.data:
        #     current_app.logger.warning(f"AUDIT: Patient {patient_id} not found during delete attempt")
        #     return jsonify({
        #         "status": "error",
        #         "message": "Patient not found"
        #     }), 404

        # patient_data = patient_check.data
        # patient_name = f"{patient_data.get('firstname', '')} {patient_data.get('lastname', '')}"

        # # Delete related records first (to avoid foreign key constraints)
        # related_tables = [
        #     'delivery_record',
        #     'anthropometric_measurements',
        #     'growth_milestones',
        #     'screening_tests',
        #     'prescriptions',
        #     'vaccinations',
        #     'facility_patients',
        #     'allergies',
        #     'parent_access',
        #     'appointments'
        # ]

        # deleted_related = {}
        # for table in related_tables:
        #     try:
        #         delete_resp = get_authenticated_client().table(table).delete().eq('patient_id', patient_id).execute()
        #         deleted_count = len(delete_resp.data) if delete_resp.data else 0
        #         deleted_related[table] = deleted_count
        #         current_app.logger.info(f"AUDIT: Deleted {deleted_count} records from {table} for patient {patient_id}")
        #     except Exception as table_error:
        #         current_app.logger.warning(f"AUDIT: Failed to delete from {table} for patient {patient_id}: {str(table_error)}")
        #         # Continue with other tables even if one fails
        #         deleted_related[table] = 0

        # Delete the main patient record
        patient_delete_resp = get_authenticated_client().table('patients')\
            .update({'is_active': False})\
            .eq('patient_id', patient_id)\
            .execute()

        if getattr(patient_delete_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to delete patient {patient_id}: {patient_delete_resp.error.message if patient_delete_resp.error else 'Unknown error'}")
            return jsonify({
                "status": "error",
                "message": "Failed to delete patient record",
                "details": patient_delete_resp.error.message if patient_delete_resp.error else "Unknown database error"
            }), 500

        if not patient_delete_resp.data:
            current_app.logger.warning(f"AUDIT: Patient {patient_id} was not found or already deleted")
            return jsonify({
                "status": "error",
                "message": "Patient record not found or already deleted"
            }), 404

        # Invalidate caches
        redis_client.delete(f"patient_records:facility:{user_facility_id}")  # Clear facility-specific cache
        redis_client.delete(f"{PATIENT_CACHE_PREFIX}{patient_id}")  # Clear patient-specific cache
        redis_client.delete("patient_records:all")  # Clear all patients cache
        
        # try:
        #     facility_id = patient_data.get('facility_id') or current_user.get('facility_id')
        #     cleared = clear_patient_cache(patient_id=patient_id, facility_id=facility_id)
        #     current_app.logger.info(f"AUDIT: Cleared {cleared} Redis cache keys for patient {patient_id}")
        # except Exception as redis_err:
        #     current_app.logger.warning(f"AUDIT: Failed to clear Redis cache for patient {patient_id}: {redis_err}")

        # Log successful deletion with details
        # total_related_deleted = sum(deleted_related.values())
        # current_app.logger.info(f"AUDIT: Successfully deleted patient {patient_id} ({patient_name}) and {total_related_deleted} related records by user {current_user.get('email', 'Unknown')}")
        # current_app.logger.info(f"AUDIT: Deletion breakdown: {json.dumps(deleted_related)}")

        return jsonify({
            "status": "success",
            "message": f"Patient deactivated successfully",
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Unexpected error deactivating patient {patient_id}: {str(e)}")
        import traceback
        current_app.logger.error(f"AUDIT: Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred while deactivating the patient record",
            "details": str(e)
        }), 500
        
