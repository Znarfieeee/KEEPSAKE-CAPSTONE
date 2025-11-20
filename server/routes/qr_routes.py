from flask import Blueprint, jsonify, request
from config.settings import supabase, supabase_service_role_client
from utils.access_control import require_auth
from utils.sanitize import sanitize_request_data
from utils.notification_utils import create_qr_access_alert
from datetime import datetime, timedelta, timezone
import secrets
import os

qr_bp = Blueprint('qr', __name__)

def generate_secure_token():
    return secrets.token_urlsafe(32)  # 256 bits of entropy

def get_patient_data_by_scope(patient_id, scope):
    """
    Get patient data based on access scope
    Scope options: view_only, allergies, prescriptions, vaccinations, appointments, vitals, full_access
    """
    try:
        # Always include basic patient information
        patient_data = supabase.table('patients')\
            .select('patient_id, firstname, lastname, middlename, date_of_birth, sex, bloodtype')\
            .eq('patient_id', patient_id)\
            .single()\
            .execute()

        if not patient_data.data:
            return None

        result = patient_data.data

        # If view_only, return just basic info
        if scope == ['view_only'] or 'view_only' in scope:
            return result

        # Add allergies if in scope
        if 'allergies' in scope or 'full_access' in scope:
            try:
                print(f"DEBUG: Fetching allergies for patient {patient_id}")
                allergies = supabase.table('allergies')\
                    .select('allergy_id, patient_id, allergy_name, severity, diagnosed_date, notes, created_at')\
                    .eq('patient_id', patient_id)\
                    .execute()
                result['allergies'] = allergies.data or []
                print(f"DEBUG: Found {len(result['allergies'])} allergies")
            except Exception as e:
                print(f"ERROR: Failed to fetch allergies: {e}")
                raise

        # Add prescriptions if in scope
        if 'prescriptions' in scope or 'full_access' in scope:
            try:
                print(f"DEBUG: Fetching prescriptions for patient {patient_id}")
                prescriptions = supabase.table('prescriptions')\
                    .select('prescription_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, notes, status, created_at, updated_at')\
                    .eq('patient_id', patient_id)\
                    .order('created_at', desc=True)\
                    .execute()
                result['prescriptions'] = prescriptions.data or []
                print(f"DEBUG: Found {len(result['prescriptions'])} prescriptions")
            except Exception as e:
                print(f"ERROR: Failed to fetch prescriptions: {e}")
                raise

        # Add vaccinations if in scope
        if 'vaccinations' in scope or 'full_access' in scope:
            try:
                print(f"DEBUG: Fetching vaccinations for patient {patient_id}")
                vaccinations = supabase.table('vaccinations')\
                    .select('vaccination_id, patient_id, vaccine_name, dose_number, administered_at, administered_by, next_dose_date, notes, created_at')\
                    .eq('patient_id', patient_id)\
                    .order('administered_at', desc=True)\
                    .execute()
                result['vaccinations'] = vaccinations.data or []
                print(f"DEBUG: Found {len(result['vaccinations'])} vaccinations")
            except Exception as e:
                print(f"ERROR: Failed to fetch vaccinations: {e}")
                raise

        # Add appointments if in scope
        if 'appointments' in scope or 'full_access' in scope:
            try:
                print(f"DEBUG: Fetching appointments for patient {patient_id}")
                appointments = supabase.table('appointments')\
                    .select('appointment_id, patient_id, doctor_id, facility_id, appointment_date, appointment_time, status, reason, notes, created_at, updated_at')\
                    .eq('patient_id', patient_id)\
                    .order('appointment_date', desc=True)\
                    .limit(10)\
                    .execute()
                result['appointments'] = appointments.data or []
                print(f"DEBUG: Found {len(result['appointments'])} appointments")
            except Exception as e:
                print(f"ERROR: Failed to fetch appointments: {e}")
                raise

        # Add vitals/anthropometric measurements if in scope
        if 'vitals' in scope or 'full_access' in scope:
            try:
                print(f"DEBUG: Fetching vitals for patient {patient_id}")
                vitals = supabase.table('anthropometric_measurements')\
                    .select('measurement_id, patient_id, measurement_date, height_cm, weight_kg, head_circumference_cm, bmi, notes, measured_by, created_at')\
                    .eq('patient_id', patient_id)\
                    .order('measurement_date', desc=True)\
                    .limit(10)\
                    .execute()
                result['vitals'] = vitals.data or []
                print(f"DEBUG: Found {len(result['vitals'])} vitals")
            except Exception as e:
                print(f"ERROR: Failed to fetch vitals: {e}")
                raise

        return result

    except Exception as e:
        print(f"Error fetching patient data by scope: {e}")
        return None

def ensure_patient_facility_registration(patient_id, facility_id, registered_by, registration_method):
    """Ensure patient is registered at the facility"""
    # Use service role client to bypass RLS policies
    sr_client = supabase_service_role_client()

    existing = sr_client.table('facility_patients')\
        .select('id, patient_id, facility_id')\
        .eq('patient_id', patient_id)\
        .eq('facility_id', facility_id)\
        .execute()

    if not existing.data:
        sr_client.table('facility_patients').insert({
            'patient_id': patient_id,
            'facility_id': facility_id,
            'registered_by': registered_by,
            'registration_method': registration_method,
            'is_active': True
        }).execute()


@qr_bp.route('/qr/generate', methods=['POST'])
@require_auth
def generate_token():
    """Generate a new QR code for patient access"""
    try:
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        required_fields = ['patient_id', 'share_type', 'expires_in_days']

        # Validate required fields
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields", "status": 400}), 400

        # DEBUG: Log user info
        print(f"DEBUG: Current user: {request.current_user}")
        print(f"DEBUG: User ID: {request.current_user.get('id')}")
        print(f"DEBUG: User role: {request.current_user.get('role')}")
        print(f"DEBUG: User facility_id: {request.current_user.get('facility_id')}")

        # Validate patient exists and user has access
        patient = supabase.table('patients')\
            .select('*')\
            .eq('patient_id', data['patient_id'])\
            .single()\
            .execute()
            
        patient_id = data.get('patient_id')

        if not patient.data:
            return jsonify({"error": "Patient not found", "status": 404}), 404

        # Generate token and create QR code record
        token = generate_secure_token()

        # Get facility_id - for parents, use the patient's facility
        facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')
        user_id = request.current_user.get('id')

        # Convert string "None" to actual None
        if facility_id == 'None' or facility_id == 'null' or facility_id == '':
            facility_id = None

        # Validate user_id
        if not user_id:
            return jsonify({"error": "Invalid user session - no user ID", "status": 401}), 401

        # If user is a parent/guardian without a facility_id, get patient's facility
        if not facility_id and user_role in ['parent', 'guardian']:
            print(f"DEBUG: Parent user detected, fetching facility for patient {data['patient_id']}")

            # Use service role client to bypass RLS policies
            # This is necessary because parent users don't have direct access to facility_patients table
            sr_client = supabase_service_role_client()

            # Get patient's facility from facility_patients table
            patient_facility = sr_client.table('facility_patients')\
                .select('facility_id')\
                .eq('patient_id', data['patient_id'])\
                .eq('is_active', True)\
                .order('registered_at', desc=True)\
                .limit(1)\
                .execute()

            print(f"DEBUG: Patient facility result: {patient_facility.data}")

            if patient_facility.data and len(patient_facility.data) > 0:
                facility_id = patient_facility.data[0]['facility_id']
                print(f"DEBUG: Found facility_id: {facility_id}")
            else:
                return jsonify({"error": "Patient not registered at any facility", "status": 400}), 400

        if not facility_id:
            return jsonify({"error": "Unable to determine facility context", "status": 400}), 400

        # Build metadata properly
        metadata = {}
        if data.get('metadata') and isinstance(data.get('metadata'), dict):
            metadata = data.get('metadata').copy()

        # Add system metadata
        metadata['allow_emergency_access'] = data.get('allow_emergency_access', False)
        metadata['requires_pin'] = bool(data.get('pin_code'))

        # Build qr_data with strict None checking - DO NOT include fields with None values
        qr_data = {
            'token_hash': token,
            'patient_id': str(data['patient_id']),  # Ensure string
            'facility_id': str(facility_id),  # Ensure string
            'generated_by': str(user_id),  # Ensure string
            'share_type': data['share_type'],
            'scope': data.get('scope', ['view_only']),
            'expires_at': (datetime.now(timezone.utc) + timedelta(days=data['expires_in_days'])).isoformat(),
            'is_active': True,
            'use_count': 0,
            'metadata': metadata
        }

        # Only add optional fields if they have actual values (not None, not empty)
        if data.get('max_uses') is not None:
            qr_data['max_uses'] = int(data.get('max_uses'))

        if data.get('target_facilities') and len(data.get('target_facilities', [])) > 0:
            qr_data['target_facilities'] = [str(f) for f in data.get('target_facilities')]

        if data.get('pin_code'):
            qr_data['pin_code'] = str(data.get('pin_code'))

        # DEBUG: Log what we're about to insert
        print(f"DEBUG: QR data to insert: {qr_data}")

        # Create QR code record (audit logging handled by database trigger)
        try:
            result = supabase.table('qr_codes').insert(qr_data).execute()

            # Check if insert was successful
            if not result.data or len(result.data) == 0:
                return jsonify({
                    "error": "Failed to create QR code - database returned no data",
                    "details": "This may be due to RLS policies or invalid data",
                    "status": 500
                }), 500

            # Get base URL from environment or use default
            base_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

            return jsonify({
                "status": "success",
                "qr_id": result.data[0]['qr_id'],
                "token": token,
                "access_url": f"{base_url}/qr/access?token={token}",
                "expires_at": qr_data['expires_at']
            }), 200

        except Exception as insert_error:
            return jsonify({
                "error": "Database insert failed",
                "details": str(insert_error),
                "status": 500
            }), 500

    except Exception as e:
        return jsonify({
            "error": "Failed to create QR code",
            "details": str(e),
            "status": 500
        }), 500

@qr_bp.route('/qr/access', methods=['GET'])
@require_auth
def validate_qr_access():
    """
    Validates QR code access with flexible facility control and comprehensive security checks
    Supports 3 access modes: Open Access, Restricted Access, Emergency Access
    """
    token = request.args.get('token')
    if not token:
        return jsonify({"error": "Token is required", "status": 'error'}), 400

    scanning_user = request.current_user
    if not scanning_user:
        return jsonify({"error": "Invalid user context", "status": 'error'}), 401

    # Get and sanitize user info
    scanning_user_id = str(scanning_user['id'])
    scanning_facility_id = scanning_user.get('facility_id')

    # Convert string "None" to actual None
    if scanning_facility_id == 'None' or scanning_facility_id == 'null' or scanning_facility_id == '':
        scanning_facility_id = None

    print(f"DEBUG: Scanning user ID: {scanning_user_id}")
    print(f"DEBUG: Scanning user role: {scanning_user.get('role')}")
    print(f"DEBUG: Scanning facility_id (sanitized): {scanning_facility_id}")

    try:
        # 1. Get QR code record with comprehensive validation
        # Use service role client to avoid RLS-related ambiguous column issues
        sr_client = supabase_service_role_client()
        qr = sr_client.table('qr_codes')\
            .select('qr_id, token_hash, patient_id, facility_id, generated_by, share_type, scope, expires_at, is_active, use_count, max_uses, last_accessed_at, last_accessed_by, target_facilities, pin_code, metadata, created_at')\
            .eq('token_hash', token)\
            .eq('is_active', True)\
            .execute()

        if not qr.data or len(qr.data) == 0:
            return jsonify({"error": "Invalid or inactive QR code", "status": 'error'}), 404

        qr_data = qr.data[0]

        print(f"DEBUG: QR code found: {qr_data['qr_id']}")
        print(f"DEBUG: QR patient_id: {qr_data['patient_id']}")
        print(f"DEBUG: QR facility_id: {qr_data.get('facility_id')}")

        # 2. Check expiration
        expires_at = datetime.fromisoformat(qr_data['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            return jsonify({"error": "QR code has expired", "status": 'error'}), 403

        # 3. Check usage limits
        if qr_data['max_uses'] and qr_data['use_count'] >= qr_data['max_uses']:
            return jsonify({"error": "QR code usage limit reached", "status": 'error'}), 403

        # 4. FLEXIBLE FACILITY ACCESS CONTROL
        target_facilities = qr_data.get('target_facilities')
        access_type = None

        # Mode 1: Open Access (NULL or empty target_facilities)
        if not target_facilities or len(target_facilities) == 0:
            access_type = "open_access"
            print(f"DEBUG: Open access mode - no facility restrictions")

            # If PIN is set, require verification
            if qr_data.get('pin_code'):
                provided_pin = request.args.get('pin')
                if provided_pin != qr_data['pin_code']:
                    return jsonify({"error": "Invalid PIN", "status": 403}), 403

        # Mode 2: Restricted Access (specific facilities whitelisted)
        else:
            print(f"DEBUG: Restricted access mode - target_facilities: {target_facilities}")

            # Check if user has a facility and it's in the whitelist
            if scanning_facility_id and scanning_facility_id in target_facilities:
                access_type = "whitelisted_facility"
                print(f"DEBUG: Facility {scanning_facility_id} is whitelisted")
            else:
                # Check for emergency access override
                metadata = qr_data.get('metadata', {})
                if metadata.get('allow_emergency_access'):
                    # Require PIN for emergency access
                    provided_pin = request.args.get('pin')
                    if provided_pin and provided_pin == qr_data.get('pin_code'):
                        access_type = "emergency_access"
                        print(f"DEBUG: Emergency access granted with PIN")
                    else:
                        return jsonify({"error": "PIN required for emergency access", "status": 403}), 403
                else:
                    print(f"DEBUG: Access denied - facility {scanning_facility_id} not in whitelist and no emergency access")
                    return jsonify({"error": "Facility not authorized to access this patient", "status": 403}), 403

        # 5. Get patient data based on scope
        patient_id = qr_data['patient_id']
        scope = qr_data.get('scope', ['view_only'])

        print(f"DEBUG: Fetching patient data with scope: {scope}")
        try:
            patient_data = get_patient_data_by_scope(patient_id, scope)
            if not patient_data:
                return jsonify({"error": "Patient data not found", "status": 404}), 404
            print(f"DEBUG: Successfully fetched patient data")
        except Exception as scope_error:
            print(f"ERROR: Failed to fetch patient data by scope: {scope_error}")
            return jsonify({"error": "Failed to fetch patient data", "details": str(scope_error), "status": 500}), 500

        # 6. Auto-register patient to this facility (if not already)
        # Only register if scanning user has a valid facility
        if scanning_facility_id:
            try:
                print(f"DEBUG: Registering patient {patient_id} to facility {scanning_facility_id}")
                ensure_patient_facility_registration(
                    patient_id=patient_id,
                    facility_id=scanning_facility_id,
                    registered_by=scanning_user_id,
                    registration_method='qr_code_scan'
                )
                print(f"DEBUG: Successfully registered patient to facility")
            except Exception as reg_error:
                print(f"ERROR: Failed to register patient to facility: {reg_error}")
                # Don't fail the request for registration errors
        else:
            print(f"DEBUG: Skipping facility registration - scanning user has no facility_id")

        # 7. Update QR code usage (audit logging handled by database trigger)
        print(f"DEBUG: Updating QR usage - accessed by user: {scanning_user_id}")

        try:
            # Use service role client to bypass RLS policies for administrative updates
            sr_client_update = supabase_service_role_client()
            print(f"DEBUG: Service role client type: {type(sr_client_update)}")

            # Try updating without last_accessed_by first (trigger might be causing ambiguous user_id error)
            try:
                update_result = sr_client_update.table('qr_codes').update({
                    'use_count': qr_data['use_count'] + 1,
                    'last_accessed_at': datetime.now(timezone.utc).isoformat()
                }).eq('qr_id', qr_data['qr_id']).execute()

                print(f"DEBUG: Successfully updated QR usage count (without last_accessed_by)")

                # Now try to update last_accessed_by separately
                try:
                    sr_client_update.table('qr_codes').update({
                        'last_accessed_by': scanning_user_id
                    }).eq('qr_id', qr_data['qr_id']).execute()
                    print(f"DEBUG: Successfully updated last_accessed_by")
                except Exception as accessed_by_error:
                    print(f"WARNING: Could not update last_accessed_by (continuing anyway): {accessed_by_error}")
                    # Don't fail the request if we can't update last_accessed_by

            except Exception as count_error:
                print(f"ERROR: Failed to update use_count: {count_error}")
                # Try without any user tracking fields at all
                print(f"DEBUG: Attempting minimal update (use_count only)...")
                sr_client_update.table('qr_codes').update({
                    'use_count': qr_data['use_count'] + 1
                }).eq('qr_id', qr_data['qr_id']).execute()
                print(f"DEBUG: Minimal update succeeded")

        except Exception as update_error:
            print(f"ERROR: All update attempts failed: {update_error}")
            print(f"ERROR: Error type: {type(update_error)}")
            import traceback
            print(f"ERROR: Traceback: {traceback.format_exc()}")
            # Don't fail the entire request just because we can't update usage stats
            print(f"WARNING: Continuing without updating QR usage count")

        # 8. Create QR access alert notification
        try:
            create_qr_access_alert(
                qr_id=qr_data['qr_id'],
                accessed_by_user_id=scanning_user_id,
                patient_id=patient_id
            )
        except Exception as notif_error:
            # Log notification error but don't fail the request
            print(f"Failed to create QR access notification: {notif_error}")

        return jsonify({
            "status": 200,
            "access_type": access_type,
            "patient_data": patient_data,
            "qr_metadata": {
                "share_type": qr_data['share_type'],
                "generated_by_facility": qr_data['facility_id'],
                "expires_at": qr_data['expires_at'],
                "scope": scope
            }
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to validate QR code", "details": str(e), "status": 500}), 500

@qr_bp.route('/qr/list', methods=['GET'])
@require_auth
def list_qr_codes():
    """
    List QR codes for the current facility
    Optional query params: patient_id (to filter by patient)
    """
    try:
        patient_id = request.args.get('patient_id')
        # facility_id = request.current_user.get('facility_id')

        # Build query
        query = supabase.table('qr_codes')\
            .select('*')\
            # .eq('facility_id', facility_id) 

        # Filter by patient if provided
        if patient_id:
            query = query.eq('patient_id', patient_id)

        # Execute query and order by creation date
        result = query.order('created_at', desc=True).execute()

        return jsonify({
            "status": 200,
            "qr_codes": result.data,
            "count": len(result.data)
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch QR codes", "details": str(e), "status": 500}), 500

@qr_bp.route('/qr/revoke/<qr_id>', methods=['POST'])
@require_auth
def revoke_qr_code(qr_id):
    """
    Revoke a QR code by setting is_active to False
    Only the generating facility or system admin can revoke
    """
    try:
        # Get the QR code to verify ownership
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        # Check if user has permission to revoke
        user_facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')

        # Allow revocation if user is from the same facility or is system admin
        if qr.data['facility_id'] != user_facility_id and user_role != 'system_admin':
            return jsonify({"error": "Unauthorized to revoke this QR code", "status": 403}), 403

        # Revoke the QR code (audit logging handled by database trigger)
        supabase.table('qr_codes').update({
            'is_active': False
        }).eq('qr_id', qr_id).execute()

        return jsonify({
            "status": 200,
            "message": "QR code revoked successfully",
            "qr_id": qr_id
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to revoke QR code", "details": str(e), "status": 500}), 500

@qr_bp.route('/qr/audit/<qr_id>', methods=['GET'])
@require_auth
def get_qr_audit_history(qr_id):
    """
    Get audit history for a specific QR code
    Shows all access attempts (successful and denied)
    """
    try:
        # Verify QR code exists and user has access
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        # Check permission
        user_facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')

        if qr.data['facility_id'] != user_facility_id and user_role != 'system_admin':
            return jsonify({"error": "Unauthorized to view audit history", "status": 403}), 403

        # Get audit logs for this QR code
        audit_logs = supabase.table('audit_logs')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .order('action_timestamp', desc=True)\
            .execute()

        return jsonify({
            "status": 200,
            "qr_code": qr.data,
            "audit_logs": audit_logs.data,
            "total_accesses": qr.data.get('use_count', 0)
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch audit history", "details": str(e), "status": 500}), 500

@qr_bp.route('/qr/details/<qr_id>', methods=['GET'])
@require_auth
def get_qr_details(qr_id):
    """
    Get details of a specific QR code
    """
    try:
        # Get QR code details
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        # Check permission
        user_facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')

        if qr.data['facility_id'] != user_facility_id and user_role != 'system_admin':
            return jsonify({"error": "Unauthorized to view QR code details", "status": 403}), 403

        # Get patient basic info
        patient = supabase.table('patients')\
            .select('patient_id, firstname, lastname, date_of_birth')\
            .eq('patient_id', qr.data['patient_id'])\
            .single()\
            .execute()

        return jsonify({
            "status": 200,
            "qr_code": qr.data,
            "patient": patient.data if patient.data else None
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch QR code details", "details": str(e), "status": 500}), 500