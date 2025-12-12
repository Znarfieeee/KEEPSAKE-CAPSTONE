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

def populate_patient_name(appointment_data):
    """
    Helper function to populate patient_name from patient data if it's null
    """
    if appointment_data.get('patient_name') is None and appointment_data.get('patients'):
        patient = appointment_data['patients']
        # Construct full name from patient data
        full_name_parts = [patient.get('firstname', '')]
        if patient.get('middlename'):
            full_name_parts.append(patient.get('middlename'))
        full_name_parts.append(patient.get('lastname', ''))
        appointment_data['patient_name'] = ' '.join(filter(None, full_name_parts))
    return appointment_data

def populate_doctor_name(appointment_data):
    """
    Helper function to populate doctor_name from doctor data if it's null
    """
    if appointment_data.get('doctor_name') is None and appointment_data.get('doctor'):
        doctor = appointment_data['doctor']
        doctor_name = f"{doctor.get('firstname', '')} {doctor.get('lastname', '')}"
        appointment_data['doctor_name'] = doctor_name.strip()
    return appointment_data

def process_appointment_data(appointments_data):
    """
    Process appointment data to ensure patient_name and doctor_name are populated
    """
    processed_data = []
    for appointment in appointments_data:
        # Populate patient_name if null
        appointment = populate_patient_name(appointment)
        # Populate doctor_name if null
        appointment = populate_doctor_name(appointment)
        processed_data.append(appointment)
    return processed_data

def prepare_appointments_payload(data, is_update=False):
    """
    Prepare appointment payload with required and optional fields.
    Maps to the actual database schema fields.

    Real-life clinic validation approach:
    - No time restrictions (allows past/future appointments for walk-ins, backdating)
    - Allows double-booking (multiple patients at same time)
    - Doctor assignment is optional (supports "any available doctor")
    - Only validates essential fields to ensure data integrity
    """
    payload = {}

    # Required fields for creation (minimal validation for real-life flexibility)
    if not is_update:
        required_fields = ['patient_id', 'facility_id', 'scheduled_by', 'appointment_date']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    # Map fields according to database schema
    field_mapping = {
        'patient_id': 'patient_id',
        'facility_id': 'facility_id',
        'doctor_id': 'doctor_id',  # Optional - allows "any available doctor"
        'doctor_name': 'doctor_name',
        'scheduled_by': 'scheduled_by',
        'appointment_date': 'appointment_date',  # No date restrictions (past/future allowed)
        'appointment_time': 'appointment_time',  # No time slot restrictions
        'appointment_type': 'appointment_type',  # No time slot restrictions
        'reason': 'reason',
        'notes': 'notes',
        'status': 'status',  # scheduled, confirmed, cancelled, completed, no_show
        'updated_by': 'updated_by',
        'patient_name': 'patient_name'
        
    }

    # Only include fields that have values and exist in our mapping
    for key, db_field in field_mapping.items():
        if key in data and data[key] is not None:
            payload[db_field] = data[key]

    # Set default status if not provided and not an update
    if not is_update and 'status' not in payload:
        payload['status'] = 'scheduled'

    # Add timestamps for updates
    if is_update:
        payload['updated_at'] = datetime.datetime.utcnow().isoformat()

    return payload

@appointment_bp.route('/appointments', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def get_appointments():
    """Get all appointments with related data"""
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        current_user = request.current_user
        
        # Check cache first
        if not bust_cache:
            cached = redis_client.get(APPOINTMENT_CACHE_KEY)
            if cached:
                cached_data = json.loads(cached)
                # Process cached data to populate missing names
                processed_data = process_appointment_data(cached_data)
                return jsonify({
                    'status': 'success',
                    'data': processed_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
        
        # Fetch from database with proper joins using explicit foreign key relationships
        resp = supabase.table('appointments')\
            .select('''
                *,
                patients!appointments_patient_id_fkey(patient_id, firstname, lastname, middlename, date_of_birth),
                doctor:users!appointments_doctor_id_fkey(user_id, firstname, lastname, specialty),
                facility:healthcare_facilities!appointments_facility_id_fkey(facility_id, facility_name, address),
                scheduled_by:users!appointments_scheduled_by_fkey(user_id, firstname, lastname),
                updated_by:users!appointments_updated_by_fkey(user_id, firstname, lastname)
            ''')\
            .order('appointment_date', desc=True)\
            .execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message
            }), 400
        
        # Process data to populate missing names
        processed_data = process_appointment_data(resp.data)
        
        # Cache the processed results for 5 minutes
        redis_client.setex(APPOINTMENT_CACHE_KEY, 300, json.dumps(processed_data))
        
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetched all appointments")
        
        return jsonify({
            "status": "success",
            "data": processed_data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

@appointment_bp.route('/appointments/patient/<patient_id>', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'parent', 'guardian')
def get_appointments_by_patient_id(patient_id):
    """Get appointments for a specific patient"""
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetching appointments for patient: {patient_id}")
        
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}patient:{patient_id}"
        
        # Check cache first
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                # Process cached data to populate missing names
                processed_data = process_appointment_data(cached_data)
                return jsonify({
                    'status': 'success',
                    'data': processed_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
        
        # Debug: Log the patient_id being queried
        current_app.logger.info(f"DEBUG: Querying appointments for patient_id: {patient_id}")
        
        # Get appointments for the patient with related data using explicit foreign key relationships
        resp = supabase.table('appointments')\
            .select('''
                *,
                patients!appointments_patient_id_fkey(patient_id, firstname, lastname, middlename, date_of_birth),
                doctor:users!appointments_doctor_id_fkey(user_id, firstname, lastname, specialty),
                facility:healthcare_facilities!appointments_facility_id_fkey(facility_id, facility_name, address, contact_number),
                scheduled_by:users!appointments_scheduled_by_fkey(user_id, firstname, lastname),
                updated_by:users!appointments_updated_by_fkey(user_id, firstname, lastname)
            ''')\
            .eq('patient_id', patient_id)\
            .order('appointment_date', desc=True)\
            .execute()
        
        # Debug: Log the raw response
        current_app.logger.info(f"DEBUG: Raw Supabase response data length: {len(resp.data) if resp.data else 0}")
        current_app.logger.info(f"DEBUG: Supabase error: {getattr(resp, 'error', None)}")
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for patient {patient_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message
            }), 400
        
        # Debug: Log raw data before processing
        if resp.data and len(resp.data) > 0:
            current_app.logger.info(f"DEBUG: First appointment raw data keys: {list(resp.data[0].keys())}")
        
        # Process data to populate missing names
        processed_data = process_appointment_data(resp.data)
        
        # Debug: Log processed data
        current_app.logger.info(f"DEBUG: Processed data length: {len(processed_data)}")
        if processed_data and len(processed_data) > 0:
            current_app.logger.info(f"DEBUG: First processed appointment keys: {list(processed_data[0].keys())}")
        
        # Cache the processed results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(processed_data))
        
        return jsonify({
            "status": "success",
            "data": processed_data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for patient {patient_id}: {str(e)}")
        # Debug: Log the full exception traceback
        import traceback
        current_app.logger.error(f"DEBUG: Full traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

@appointment_bp.route('/appointments/facility/<facility_id>', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def get_appointments_by_facility_id(facility_id):
    """Get appointments for a specific facility"""
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetching appointments for facility: {facility_id}")
        
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}facility:{facility_id}"
        
        # Check cache first
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                # Process cached data to populate missing names
                processed_data = process_appointment_data(cached_data)
                return jsonify({
                    'status': 'success',
                    'data': processed_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200
        
        # Get appointments for the facility with related data using explicit foreign key relationships
        resp = supabase.table('appointments')\
            .select('''
                *,
                patients!appointments_patient_id_fkey(patient_id, firstname, lastname, middlename, date_of_birth),
                doctor:users!appointments_doctor_id_fkey(user_id, firstname, lastname, specialty),
                scheduled_by:users!appointments_scheduled_by_fkey(user_id, firstname, lastname),
                updated_by:users!appointments_updated_by_fkey(user_id, firstname, lastname)
            ''')\
            .eq('facility_id', facility_id)\
            .order('appointment_date', desc=True)\
            .execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for facility {facility_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message
            }), 400
        
        # Process data to populate missing names
        processed_data = process_appointment_data(resp.data)
        
        # Cache the processed results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(processed_data))
        
        return jsonify({
            "status": "success",
            "data": processed_data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

@appointment_bp.route('/appointments/my-facility', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def get_appointments_for_user_facility():
    """Get appointments for the current user's facility (auto-detects facility)"""
    try:
        current_user = request.current_user
        user_id = current_user.get('id')

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetching appointments for their facility")

        # Get the user's facility
        facility_response = supabase.table('facility_users')\
            .select('facility_id, healthcare_facilities!facility_users_facility_id_fkey(facility_id, facility_name)')\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .maybe_single()\
            .execute()

        if getattr(facility_response, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to get facility for user {user_id}: {facility_response.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to get user's facility information"
            }), 400

        if not facility_response.data:
            return jsonify({
                "status": "error",
                "message": "User is not assigned to any facility"
            }), 404

        facility_id = facility_response.data.get('facility_id')
        facility_info = facility_response.data.get('healthcare_facilities', {})

        if not facility_id:
            return jsonify({
                "status": "error",
                "message": "No facility found for current user"
            }), 404

        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}facility:{facility_id}"

        # Check cache first
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                # Process cached data to populate missing names
                processed_data = process_appointment_data(cached_data)
                return jsonify({
                    'status': 'success',
                    'data': processed_data,
                    'facility_id': facility_id,
                    'facility_name': facility_info.get('facility_name', 'Unknown'),
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200

        # Get appointments for the facility with related data
        resp = supabase.table('appointments')\
            .select('''
                *,
                patients!appointments_patient_id_fkey(patient_id, firstname, lastname, middlename, date_of_birth),
                doctor:users!appointments_doctor_id_fkey(user_id, firstname, lastname, specialty),
                scheduled_by:users!appointments_scheduled_by_fkey(user_id, firstname, lastname),
                updated_by:users!appointments_updated_by_fkey(user_id, firstname, lastname)
            ''')\
            .eq('facility_id', facility_id)\
            .order('appointment_date', desc=True)\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for facility {facility_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message
            }), 400

        # Process data to populate missing names
        processed_data = process_appointment_data(resp.data)

        # Cache the processed results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(processed_data))

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetched {len(processed_data)} appointments for facility {facility_id}")

        return jsonify({
            "status": "success",
            "data": processed_data,
            "facility_id": facility_id,
            "facility_name": facility_info.get('facility_name', 'Unknown'),
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for user's facility: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

@appointment_bp.route('/appointments/doctor/<doctor_id>', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def get_appointments_by_doctor_id(doctor_id):
    """Get appointments for a specific doctor with facility isolation"""
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetching appointments for doctor: {doctor_id}")

        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        user_id = current_user.get('id')
        cache_key = f"{APPOINTMENT_CACHE_PREFIX}doctor:{doctor_id}:user:{user_id}"

        # Check cache first (include user_id in cache key for facility isolation)
        if not bust_cache:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                # Process cached data to populate missing names
                processed_data = process_appointment_data(cached_data)
                return jsonify({
                    'status': 'success',
                    'data': processed_data,
                    'cached': True,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }), 200

        # SECURITY FIX: Enforce facility isolation
        # Step 1: Get facilities where the current user works
        user_facilities_resp = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .execute()

        if getattr(user_facilities_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch user facilities: {user_facilities_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch user facilities"
            }), 400

        if not user_facilities_resp.data:
            current_app.logger.warning(f"AUDIT: User {current_user.get('email')} has no facility assignments")
            return jsonify({
                "status": "success",
                "data": [],
                "message": "No facilities found for current user"
            }), 200

        facility_ids = [f['facility_id'] for f in user_facilities_resp.data]

        # Step 2: Get patients that belong to these facilities
        facility_patients_resp = supabase.table('facility_patients')\
            .select('patient_id')\
            .in_('facility_id', facility_ids)\
            .eq('is_active', True)\
            .execute()

        if getattr(facility_patients_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch facility patients: {facility_patients_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facility patients"
            }), 400

        accessible_patient_ids = [p['patient_id'] for p in facility_patients_resp.data]

        if not accessible_patient_ids:
            current_app.logger.info(f"AUDIT: No patients found in user's facilities")
            return jsonify({
                "status": "success",
                "data": [],
                "message": "No patients found in your facilities"
            }), 200

        # Step 3: Get appointments for the doctor, filtered by accessible patients
        resp = supabase.table('appointments')\
            .select('''
                *,
                patients!appointments_patient_id_fkey(patient_id, firstname, lastname, middlename, date_of_birth),
                doctor:users!appointments_doctor_id_fkey(user_id, firstname, lastname, specialty),
                facility:healthcare_facilities!appointments_facility_id_fkey(facility_id, facility_name, address),
                scheduled_user:users!appointments_scheduled_by_fkey(user_id, firstname, lastname)
            ''')\
            .eq('doctor_id', doctor_id)\
            .in_('patient_id', accessible_patient_ids)\
            .order('appointment_date', desc=True)\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch appointments for doctor {doctor_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": resp.error.message
            }), 400

        # Process data to populate missing names
        processed_data = process_appointment_data(resp.data)

        # Cache the processed results for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(processed_data))

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetched {len(processed_data)} appointments for doctor {doctor_id} (facility-isolated)")

        return jsonify({
            "status": "success",
            "data": processed_data,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching appointments for doctor {doctor_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}",
        }), 500

# Search patient's by name
@appointment_bp.route('/search_patients', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def search_patients():
    """Search for patients by name with facility isolation"""
    try:
        search_term = request.args.get('name', '').strip()
        if not search_term:
            return jsonify({
                "status": "error",
                "message": "Search term is required"
            }), 400

        current_user = request.current_user
        user_id = current_user.get('id')
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} searching for patient: {search_term}")

        # SECURITY FIX: Enforce facility isolation
        # Step 1: Get facilities where the current user works
        user_facilities_resp = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .execute()

        if getattr(user_facilities_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch user facilities: {user_facilities_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch user facilities"
            }), 400

        if not user_facilities_resp.data:
            current_app.logger.warning(f"AUDIT: User {current_user.get('email')} has no facility assignments")
            return jsonify({
                "status": "success",
                "data": [],
                "message": "No facilities found for current user"
            }), 200

        facility_ids = [f['facility_id'] for f in user_facilities_resp.data]

        # Step 2: Get patients that belong to these facilities
        facility_patients_resp = supabase.table('facility_patients')\
            .select('patient_id')\
            .in_('facility_id', facility_ids)\
            .eq('is_active', True)\
            .execute()

        if getattr(facility_patients_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to fetch facility patients: {facility_patients_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facility patients"
            }), 400

        accessible_patient_ids = [p['patient_id'] for p in facility_patients_resp.data]

        if not accessible_patient_ids:
            current_app.logger.info(f"AUDIT: No patients found in user's facilities")
            return jsonify({
                "status": "success",
                "data": [],
                "message": "No patients found in your facilities"
            }), 200

        # Split the search term into parts for better matching
        name_parts = search_term.lower().split()

        # Build search query for first and last names
        search_conditions = []
        for part in name_parts:
            search_conditions.append(f'firstname.ilike.%{part}%')
            search_conditions.append(f'lastname.ilike.%{part}%')

        # Step 3: Search for patients with matching names (filtered by accessible patients)
        resp = supabase.table('patients')\
            .select('patient_id, firstname, lastname, middlename, date_of_birth, sex')\
            .or_(','.join(search_conditions))\
            .in_('patient_id', accessible_patient_ids)\
            .eq('is_active', True)\
            .limit(10)\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Error searching patients: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to search patients",
                "details": resp.error.message
            }), 400

        # Format the results
        matches = []
        for patient in resp.data:
            # Build full name including middle name if present
            full_name_parts = [patient['firstname']]
            if patient.get('middlename'):
                full_name_parts.append(patient['middlename'])
            full_name_parts.append(patient['lastname'])

            full_name = ' '.join(full_name_parts)

            matches.append({
                'patient_id': patient['patient_id'],
                'full_name': full_name,
                'date_of_birth': patient['date_of_birth'],
                'sex': patient['sex']
            })

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} found {len(matches)} patients matching '{search_term}' (facility-isolated)")

        return jsonify({
            "status": "success",
            "data": matches
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error searching for patients: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error searching for patients: {str(e)}",
        }), 500
        
@appointment_bp.route('/doctors/available', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def get_available_doctors():
    """Get doctors available in the current user's facilities"""
    try:
        current_user = request.current_user
        user_id = current_user.get('id')
        
        # Get facilities where the current user works
        user_facilities_resp = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', user_id)\
            .is_('end_date', 'null')\
            .execute()
        
        if getattr(user_facilities_resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to fetch user facilities"
            }), 400
        
        if not user_facilities_resp.data:
            return jsonify({
                "status": "success",
                "data": [],
                "message": "No facilities found for current user"
            }), 200
        
        facility_ids = [f['facility_id'] for f in user_facilities_resp.data]
        
        # Get doctors from the same facilities
        doctors_resp = supabase.table('facility_users')\
            .select('''
                user_id,
                facility_id,
                users!facility_users_user_id_fkey(
                    user_id,
                    firstname,
                    lastname,
                    specialty,
                    license_number
                ),
                healthcare_facilities!facility_users_facility_id_fkey(
                    facility_id,
                    facility_name
                )
            ''')\
            .in_('facility_id', facility_ids)\
            .eq('role', 'doctor')\
            .is_('end_date', 'null')\
            .execute()
        
        if getattr(doctors_resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to fetch doctors"
            }), 400
        
        # Format the response
        formatted_doctors = []
        for doc in doctors_resp.data:
            user_data = doc.get('users', {})
            facility_data = doc.get('healthcare_facilities', {})
            
            formatted_doctors.append({
                'doctor_id': user_data.get('user_id'),
                'full_name': f"{user_data.get('firstname', '')} {user_data.get('lastname', '')}".strip(),
                'specialty': user_data.get('specialty'),
                'license_number': user_data.get('license_number'),
                'facility_id': facility_data.get('facility_id'),
                'facility_name': facility_data.get('facility_name')
            })
        
        # Remove duplicates (doctors who work at multiple facilities)
        seen_doctors = {}
        unique_doctors = []
        for doctor in formatted_doctors:
            doc_id = doctor['doctor_id']
            if doc_id not in seen_doctors:
                seen_doctors[doc_id] = doctor
                unique_doctors.append(doctor)
            else:
                # If doctor works at multiple facilities, combine facility info
                existing = seen_doctors[doc_id]
                if isinstance(existing.get('facilities'), list):
                    existing['facilities'].append({
                        'facility_id': doctor['facility_id'],
                        'facility_name': doctor['facility_name']
                    })
                else:
                    existing['facilities'] = [
                        {
                            'facility_id': existing['facility_id'],
                            'facility_name': existing['facility_name']
                        },
                        {
                            'facility_id': doctor['facility_id'],
                            'facility_name': doctor['facility_name']
                        }
                    ]
                    # Remove single facility fields
                    del existing['facility_id']
                    del existing['facility_name']
        
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} fetched available doctors")
        
        return jsonify({
            "status": "success",
            "data": unique_doctors
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error fetching available doctors: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching available doctors: {str(e)}"
        }), 500

@appointment_bp.route('/appointments', methods=['POST'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def schedule_appointment():
    """Schedule a new appointment"""
    try:
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        current_user = request.current_user
        
        current_user_id = current_user.get('id')
        
        # Add the user who scheduled the appointment
        data['scheduled_by'] = current_user.get('id')
        
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to schedule appointment")

        facility_response = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', current_user_id)\
            .maybe_single()\
            .execute()

        if getattr(facility_response, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to get facility id: {facility_response.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to get facility information",
                "details": facility_response.error.message,
            }), 400

        # Check if user has a facility assignment
        if not facility_response.data:
            current_app.logger.error(f"AUDIT: User {current_user.get('email')} has no facility assignment")
            return jsonify({
                "status": "error",
                "message": "No facility found for current user. Please contact your administrator."
            }), 400

        facility_id = facility_response.data.get('facility_id')
        if not facility_id:
            return jsonify({
                "status": "error",
                "message": "No facility found for current user"
            }), 400
            
        # Add facility_id to the appointment data if not already present
        if 'facility_id' not in data:
            data['facility_id'] = facility_id
        
        
        
        # Get patient details if patient_id is provided
        if data.get('patient_id'):
            patient_resp = supabase.table('patients')\
                .select('firstname, lastname, middlename')\
                .eq('patient_id', data['patient_id'])\
                .maybe_single()\
                .execute()
                
            if not getattr(patient_resp, 'error', None) and patient_resp.data:
                patient = patient_resp.data
                # Construct full name
                full_name_parts = [patient.get('firstname', '')]
                if patient.get('middlename'):
                    full_name_parts.append(patient.get('middlename'))
                full_name_parts.append(patient.get('lastname', ''))
                data['patient_name'] = ' '.join(full_name_parts)

        # Get doctor's full name if doctor_id is provided
        if data.get('doctor_id'):
            doctor_resp = supabase.table('users')\
                .select('firstname, lastname')\
                .eq('user_id', data['doctor_id'])\
                .maybe_single()\
                .execute()
                
            if not getattr(doctor_resp, 'error', None) and doctor_resp.data:
                doctor = doctor_resp.data
                data['doctor_name'] = f"{doctor.get('firstname', '')} {doctor.get('lastname', '')}"

        # Prepare the appointment payload
        try:
            # Debug: Log incoming data
            current_app.logger.info(f"DEBUG: Received appointment data: {data}")
            current_app.logger.info(f"DEBUG: Appointment type from request: {data.get('appointment_type')}")

            appointments_payload = prepare_appointments_payload(data, is_update=False)

            # Debug: Log prepared payload
            current_app.logger.info(f"DEBUG: Prepared payload: {appointments_payload}")
            current_app.logger.info(f"DEBUG: Appointment type in payload: {appointments_payload.get('appointment_type')}")
        except ValueError as ve:
            return jsonify({
                "status": "error",
                "message": str(ve)
            }), 400
        
        # If doctor_id is provided, verify the doctor exists and is active in the facility
        if appointments_payload.get('doctor_id'):
            doctor_check = supabase.table('facility_users')\
                .select('user_id')\
                .eq('user_id', appointments_payload['doctor_id'])\
                .eq('facility_id', appointments_payload['facility_id'])\
                .eq('role', 'doctor')\
                .is_('end_date', 'null')\
                .maybe_single()\
                .execute()

            if getattr(doctor_check, 'error', None) or not doctor_check.data:
                return jsonify({
                    "status": "error",
                    "message": "Selected doctor is not active in this facility",
                }), 400

        # Insert the appointment
        appointments_resp = supabase.table('appointments')\
            .insert(appointments_payload)\
            .execute()

        # Debug: Log database response
        current_app.logger.info(f"DEBUG: Database response data: {appointments_resp.data if appointments_resp.data else 'No data'}")
        if appointments_resp.data and len(appointments_resp.data) > 0:
            current_app.logger.info(f"DEBUG: Appointment type in DB response: {appointments_resp.data[0].get('appointment_type')}")

        if getattr(appointments_resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to schedule appointment: {appointments_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to schedule appointment",
                "details": appointments_resp.error.message,
            }), 400
            
        if not appointments_resp.data or len(appointments_resp.data) == 0:
            return jsonify({
                "status": "error",
                "message": "Failed to schedule appointment - no data returned"
            }), 400

        appointment_id = appointments_resp.data[0].get('appointment_id')
        if not appointment_id:
            return jsonify({
                "status": "error",
                "message": "Failed to get appointment ID"
            }), 400
        
        # Invalidate related caches
        invalidate_caches('appointments')
        
        current_app.logger.info(f"AUDIT: Successfully scheduled appointment with ID {appointment_id}")
        
        return jsonify({
            "status": "success",
            "message": "Appointment scheduled successfully",
            "data": appointments_resp.data[0]
        }), 201
            
    except AuthApiError as e:
        current_app.logger.error(f"AUDIT: Auth API error while scheduling appointment: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Auth API Error: {str(e)}",
        }), 500
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Unexpected error while scheduling appointment: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error scheduling appointment: {str(e)}",
        }), 500

@appointment_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def update_appointment(appointment_id):
    """Update an existing appointment"""
    try:
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        current_user = request.current_user
        
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to update appointment {appointment_id}")
        
        # Add the user who updated the appointment
        data['updated_by'] = current_user.get('id')

        # Get patient details if patient_id is provided
        if data.get('patient_id'):
            patient_resp = supabase.table('patients')\
                .select('firstname, lastname, middlename')\
                .eq('patient_id', data['patient_id'])\
                .maybe_single()\
                .execute()
                
            if not getattr(patient_resp, 'error', None) and patient_resp.data:
                patient = patient_resp.data
                # Construct full name
                full_name_parts = [patient.get('firstname', '')]
                if patient.get('middlename'):
                    full_name_parts.append(patient.get('middlename'))
                full_name_parts.append(patient.get('lastname', ''))
                data['patient_name'] = ' '.join(full_name_parts)

        # Get doctor's full name if doctor_id is provided
        if data.get('doctor_id'):
            doctor_resp = supabase.table('users')\
                .select('firstname, lastname')\
                .eq('user_id', data['doctor_id'])\
                .maybe_single()\
                .execute()
                
            if not getattr(doctor_resp, 'error', None) and doctor_resp.data:
                doctor = doctor_resp.data
                data['doctor_name'] = f"{doctor.get('firstname', '')} {doctor.get('lastname', '')}"
        
        # Prepare the update payload
        try:
            appointments_payload = prepare_appointments_payload(data, is_update=True)
        except ValueError as ve:
            return jsonify({
                "status": "error",
                "message": str(ve)
            }), 400
        
        # Update the appointment
        resp = supabase.table('appointments')\
            .update(appointments_payload)\
            .eq('appointment_id', appointment_id)\
            .execute()
                    
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to update appointment {appointment_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to update appointment",
                "details": resp.error.message
            }), 400
        
        if not resp.data:
            return jsonify({
                "status": "error",
                "message": "Appointment not found or no changes made"
            }), 404
        
        # Invalidate related caches
        invalidate_caches('appointments', appointment_id)
        
        current_app.logger.info(f"AUDIT: Successfully updated appointment {appointment_id}")
        
        return jsonify({
            "status": "success",
            "message": "Appointment updated successfully",
            "data": resp.data[0]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Unexpected error updating appointment {appointment_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@appointment_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse')
def cancel_appointment(appointment_id):
    """Cancel an appointment (soft delete by changing status)"""
    try:
        current_user = request.current_user
        current_app.logger.info(f"AUDIT: User {current_user.get('email')} attempting to cancel appointment {appointment_id}")
        
        # Update appointment status to cancelled
        resp = supabase.table('appointments')\
            .update({
                'status': 'cancelled',
                'updated_by': current_user.get('id'),
                'updated_at': datetime.datetime.utcnow().isoformat()
            })\
            .eq('appointment_id', appointment_id)\
            .execute()
        
        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to cancel appointment {appointment_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to cancel appointment",
                "details": resp.error.message
            }), 400
        
        if not resp.data:
            return jsonify({
                "status": "error",
                "message": "Appointment not found"
            }), 404
        
        # Invalidate related caches
        invalidate_caches('appointments', appointment_id)
        
        current_app.logger.info(f"AUDIT: Successfully cancelled appointment {appointment_id}")
        
        return jsonify({
            "status": "success",
            "message": "Appointment cancelled successfully"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error cancelling appointment {appointment_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error cancelling appointment: {str(e)}"
        }), 500

@appointment_bp.route('/appointments/<int:appointment_id>/status', methods=['PATCH'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def update_appointment_status(appointment_id):
    """Update appointment status (scheduled, confirmed, completed, no_show)"""
    try:
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        current_user = request.current_user

        # Debug logging
        current_app.logger.info(f"DEBUG: Received status update request for appointment_id={appointment_id}")
        current_app.logger.info(f"DEBUG: Request data: {data}")

        if not data.get('status'):
            return jsonify({
                "status": "error",
                "message": "Status is required"
            }), 400

        # Validate status
        valid_statuses = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show', 'checked_in', 'in_progress']
        if data['status'] not in valid_statuses:
            return jsonify({
                "status": "error",
                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), 400

        current_app.logger.info(f"AUDIT: User {current_user.get('email')} updating appointment {appointment_id} status to {data['status']}")
        
        # Update appointment status
        resp = supabase.table('appointments')\
            .update({
                'status': data['status'],
                'updated_by': current_user.get('id'),
                'updated_at': datetime.datetime.utcnow().isoformat(),
                'notes': data.get('notes', '')  # Optional notes for status change
            })\
            .eq('appointment_id', appointment_id)\
            .execute()

        # Debug logging
        current_app.logger.info(f"DEBUG: Supabase response data: {resp.data if resp.data else 'No data'}")
        current_app.logger.info(f"DEBUG: Supabase response error: {getattr(resp, 'error', None)}")

        if getattr(resp, 'error', None):
            current_app.logger.error(f"AUDIT: Failed to update appointment status {appointment_id}: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to update appointment status",
                "details": resp.error.message
            }), 400

        if not resp.data or len(resp.data) == 0:
            current_app.logger.error(f"DEBUG: No appointment found with ID {appointment_id}")
            return jsonify({
                "status": "error",
                "message": f"Appointment not found with ID {appointment_id}. Please refresh the page."
            }), 404
        
        # Invalidate related caches
        invalidate_caches('appointments', appointment_id)
        
        current_app.logger.info(f"AUDIT: Successfully updated appointment {appointment_id} status to {data['status']}")
        
        return jsonify({
            "status": "success",
            "message": f"Appointment status updated to {data['status']}",
            "data": resp.data[0]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AUDIT: Error updating appointment status {appointment_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error updating appointment status: {str(e)}"
        }), 500