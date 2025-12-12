from flask import Blueprint, jsonify, request, current_app, render_template
from config.settings import get_authenticated_client, supabase_service_role_client
from utils.access_control import require_auth
from utils.sanitize import sanitize_request_data
from utils.notification_utils import create_qr_access_alert
from utils.invalidate_cache import invalidate_caches
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

    Uses service role client to bypass RLS - QR code token is the authorization mechanism
    """
    try:
        sr_client = supabase_service_role_client()

        # Always include basic patient information
        patient_data = sr_client.table('patients')\
            .select('patient_id, firstname, lastname, middlename, date_of_birth, sex, bloodtype')\
            .eq('patient_id', patient_id)\
            .single()\
            .execute()

        if not patient_data.data:
            return None

        result = patient_data.data

        # Add allergies if in scope
        if 'allergies' in scope or 'full_access' in scope:
            try:
                allergies = sr_client.table('allergies')\
                    .select('allergy_id, patient_id, allergy_name, severity, diagnosed_date, notes, created_at')\
                    .eq('patient_id', patient_id)\
                    .execute()
                result['allergies'] = allergies.data or []
            except Exception:
                result['allergies'] = []

        # Add prescriptions if in scope
        if 'prescriptions' in scope or 'full_access' in scope:
            try:
                # Get prescriptions with doctor and facility info
                prescriptions = sr_client.table('prescriptions')\
                    .select('''
                        *,
                        doctor:users!prescriptions_doctor_id_fkey(user_id, firstname, middlename, lastname, specialty, license_number),
                        facility:healthcare_facilities!prescriptions_facility_id_fkey(facility_id, facility_name, address, city, zip_code, contact_number)
                    ''')\
                    .eq('patient_id', patient_id)\
                    .order('prescription_date', desc=True)\
                    .execute()

                prescriptions_data = prescriptions.data or []

                # Get medications for each prescription
                if prescriptions_data:
                    rx_ids = [rx.get('rx_id') for rx in prescriptions_data if rx.get('rx_id')]

                    if rx_ids:
                        medications = sr_client.table('prescription_medications')\
                            .select('*')\
                            .in_('rx_id', rx_ids)\
                            .execute()

                        # Map medications to prescriptions
                        med_map = {}
                        for med in (medications.data or []):
                            rx_id = med.get('rx_id')
                            med_map.setdefault(rx_id, []).append(med)

                        # Attach medications to prescriptions
                        for rx in prescriptions_data:
                            rx['medications'] = med_map.get(rx.get('rx_id'), [])

                            # Format doctor name
                            if rx.get('doctor'):
                                doctor = rx['doctor']
                                rx['doctor_name'] = f"Dr. {doctor.get('firstname', '')} {doctor.get('lastname', '')}".strip()

                            # Format facility info
                            if rx.get('facility'):
                                facility = rx['facility']
                                rx['facility_name'] = facility.get('facility_name', '')
                                rx['facility_address'] = f"{facility.get('address', '')}, {facility.get('city', '')}"

                result['prescriptions'] = prescriptions_data
            except Exception as e:
                current_app.logger.error(f"Error fetching prescriptions: {e}")
                result['prescriptions'] = []

        # Add vaccinations if in scope
        if 'vaccinations' in scope or 'full_access' in scope:
            try:
                vaccinations = sr_client.table('vaccinations')\
                    .select('vaccination_id, patient_id, vaccine_name, dose_number, administered_at, administered_by, next_dose_date, notes, created_at')\
                    .eq('patient_id', patient_id)\
                    .order('administered_at', desc=True)\
                    .execute()
                result['vaccinations'] = vaccinations.data or []
            except Exception:
                result['vaccinations'] = []

        # Add appointments if in scope
        if 'appointments' in scope or 'full_access' in scope:
            try:
                appointments = sr_client.table('appointments')\
                    .select('appointment_id, patient_id, doctor_id, facility_id, appointment_date, appointment_time, status, reason, notes, created_at, updated_at')\
                    .eq('patient_id', patient_id)\
                    .order('appointment_date', desc=True)\
                    .limit(10)\
                    .execute()
                result['appointments'] = appointments.data or []
            except Exception:
                result['appointments'] = []

        # Add vitals/anthropometric measurements if in scope
        if 'vitals' in scope or 'full_access' in scope:
            try:
                vitals = sr_client.table('anthropometric_measurements')\
                    .select('measurement_id, patient_id, measurement_date, height_cm, weight_kg, head_circumference_cm, bmi, notes, measured_by, created_at')\
                    .eq('patient_id', patient_id)\
                    .order('measurement_date', desc=True)\
                    .limit(10)\
                    .execute()
                result['vitals'] = vitals.data or []
            except Exception:
                result['vitals'] = []

        return result

    except Exception as e:
        current_app.logger.error(f"Error fetching patient data by scope: {e}")
        return None

def ensure_patient_facility_registration(patient_id, facility_id, registered_by, registration_method):
    """Ensure patient is registered at the facility"""
    sr_client = supabase_service_role_client()

    try:
        # Check if patient is already registered to this specific facility
        existing = sr_client.table('facility_patients')\
            .select('facility_patient_id, patient_id, facility_id, is_active')\
            .eq('patient_id', patient_id)\
            .eq('facility_id', facility_id)\
            .execute()

        if not existing.data or len(existing.data) == 0:
            # Patient not registered at this facility - create new registration
            result = sr_client.table('facility_patients').insert({
                'patient_id': patient_id,
                'facility_id': facility_id,
                'registered_by': registered_by,
                'registration_method': registration_method,
                'is_active': True
            }).execute()

            return bool(result.data)
        else:
            # Patient already has a record at this facility
            existing_record = existing.data[0]
            if not existing_record.get('is_active'):
                # Reactivate the existing record
                sr_client.table('facility_patients')\
                    .update({'is_active': True, 'deactivated_at': None, 'deactivated_by': None})\
                    .eq('facility_patient_id', existing_record['facility_patient_id'])\
                    .execute()
                return True
            return False
    except Exception as e:
        current_app.logger.error(f"Failed to ensure patient facility registration: {e}")
        raise


@qr_bp.route('/qr/generate', methods=['POST'])
@require_auth
def generate_token():
    """Generate a new QR code for patient access"""
    try:
        supabase = get_authenticated_client()
        raw_data = request.json
        data = sanitize_request_data(raw_data)
        required_fields = ['patient_id', 'share_type', 'expires_in_days']

        # Validate required fields
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields", "status": 400}), 400

        # Validate patient exists and user has access
        patient = supabase.table('patients')\
            .select('*')\
            .eq('patient_id', data['patient_id'])\
            .single()\
            .execute()

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
        if not facility_id and user_role in ['parent', 'guardian', 'keepsaker']:
            sr_client = supabase_service_role_client()

            # Get patient's facility from facility_patients table
            patient_facility = sr_client.table('facility_patients')\
                .select('facility_id')\
                .eq('patient_id', data['patient_id'])\
                .eq('is_active', True)\
                .order('registered_at', desc=True)\
                .limit(1)\
                .execute()

            if patient_facility.data and len(patient_facility.data) > 0:
                facility_id = patient_facility.data[0]['facility_id']
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

        # Build qr_data
        qr_data = {
            'token_hash': token,
            'patient_id': str(data['patient_id']),
            'facility_id': str(facility_id),
            'generated_by': str(user_id),
            'share_type': data['share_type'],
            'scope': data.get('scope', ['view_only']),
            'expires_at': (datetime.now(timezone.utc) + timedelta(days=data['expires_in_days'])).isoformat(),
            'is_active': True,
            'use_count': 0,
            'metadata': metadata
        }

        # Only add optional fields if they have actual values
        if data.get('max_uses') is not None:
            qr_data['max_uses'] = int(data.get('max_uses'))

        if data.get('target_facilities') and len(data.get('target_facilities', [])) > 0:
            qr_data['target_facilities'] = [str(f) for f in data.get('target_facilities')]

        if data.get('pin_code'):
            qr_data['pin_code'] = str(data.get('pin_code'))

        # Create QR code record
        try:
            result = supabase.table('qr_codes').insert(qr_data).execute()

            if not result.data or len(result.data) == 0:
                return jsonify({
                    "error": "Failed to create QR code",
                    "status": 500
                }), 500

            # Get base URLs from environment
            backend_url = os.environ.get('BACKEND_URL', 'http://localhost:5000')
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

            # Use dedicated view page for specific share types
            share_type = data['share_type']
            if share_type == 'prescription':
                # Prescription QR codes point to Flask HTML endpoint (no frontend needed)
                access_url = f"{backend_url}/qr/prescription/public?token={token}"
            else:
                # Other QR codes still use frontend scanner
                access_url = f"{frontend_url}/qr_scanner?token={token}"

            return jsonify({
                "status": "success",
                "qr_id": result.data[0]['qr_id'],
                "token": token,
                "access_url": access_url,
                "expires_at": qr_data['expires_at']
            }), 200

        except Exception as insert_error:
            current_app.logger.error(f"Database insert failed: {insert_error}")
            return jsonify({
                "error": "Database insert failed",
                "status": 500
            }), 500

    except Exception as e:
        current_app.logger.error(f"Failed to create QR code: {e}")
        return jsonify({
            "error": "Failed to create QR code",
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

    # Handle malformed URLs where PIN was appended with ? instead of &
    pin_from_token = None
    if '?pin=' in token:
        parts = token.split('?pin=')
        token = parts[0]
        if len(parts) > 1:
            pin_from_token = parts[1]

    scanning_user = request.current_user
    if not scanning_user:
        return jsonify({"error": "Invalid user context", "status": 'error'}), 401

    # Get and sanitize user info
    scanning_user_id = str(scanning_user['id'])
    scanning_facility_id = scanning_user.get('facility_id')

    # Convert string "None" to actual None
    if scanning_facility_id == 'None' or scanning_facility_id == 'null' or scanning_facility_id == '':
        scanning_facility_id = None

    try:
        # 1. Get QR code record with comprehensive validation
        sr_client = supabase_service_role_client()
        qr = sr_client.table('qr_codes')\
            .select('qr_id, token_hash, patient_id, facility_id, generated_by, share_type, scope, expires_at, is_active, use_count, max_uses, last_accessed_at, last_accessed_by, target_facilities, pin_code, metadata, created_at')\
            .eq('token_hash', token)\
            .eq('is_active', True)\
            .execute()

        if not qr.data or len(qr.data) == 0:
            return jsonify({"error": "Invalid or inactive QR code", "status": 'error'}), 404

        qr_data = qr.data[0]

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

            # If PIN is set, require verification
            if qr_data.get('pin_code'):
                provided_pin = request.args.get('pin') or pin_from_token
                if not provided_pin:
                    return jsonify({"error": "PIN required", "status": 403, "requires_pin": True}), 403
                if provided_pin != qr_data['pin_code']:
                    return jsonify({"error": "Invalid PIN", "status": 403}), 403

        # Mode 2: Restricted Access (specific facilities whitelisted)
        else:
            # Check if user has a facility and it's in the whitelist
            if scanning_facility_id and scanning_facility_id in target_facilities:
                access_type = "whitelisted_facility"
            else:
                # Check for emergency access override
                metadata = qr_data.get('metadata', {})
                if metadata.get('allow_emergency_access'):
                    # Require PIN for emergency access
                    provided_pin = request.args.get('pin') or pin_from_token
                    if provided_pin and provided_pin == qr_data.get('pin_code'):
                        access_type = "emergency_access"
                    else:
                        return jsonify({"error": "PIN required for emergency access", "status": 403, "requires_pin": True}), 403
                else:
                    return jsonify({"error": "Facility not authorized to access this patient", "status": 403}), 403

        # 5. Get patient data based on scope
        patient_id = qr_data['patient_id']
        scope = qr_data.get('scope', ['view_only'])

        patient_data = get_patient_data_by_scope(patient_id, scope)
        if not patient_data:
            return jsonify({"error": "Patient data not found", "status": 404}), 404

        # 6. Auto-register patient to this facility (if not already)
        if scanning_facility_id:
            try:
                registration_result = ensure_patient_facility_registration(
                    patient_id=patient_id,
                    facility_id=scanning_facility_id,
                    registered_by=scanning_user_id,
                    registration_method='qr_code_scan'
                )
                # Invalidate patient records cache for this facility to reflect new registration
                if registration_result:
                    invalidate_caches('patient')
                    current_app.logger.info(f"Cache invalidated after QR scan registration for patient {patient_id} at facility {scanning_facility_id}")
            except Exception as reg_error:
                current_app.logger.warning(f"Failed to register patient to facility: {reg_error}")

        # 7. Update QR code usage count
        try:
            sr_client_update = supabase_service_role_client()
            current_use_count = qr_data.get('use_count') or 0  # Handle None case
            sr_client_update.table('qr_codes').update({
                'use_count': current_use_count + 1,
                'last_accessed_at': datetime.now(timezone.utc).isoformat(),
                'last_accessed_by': scanning_user_id
            }).eq('qr_id', qr_data['qr_id']).execute()
            current_app.logger.info(f"Updated QR code {qr_data['qr_id']} use_count to {current_use_count + 1}")
        except Exception as update_error:
            # Log but don't fail the request for usage tracking errors
            current_app.logger.error(f"Failed to update QR code use_count: {update_error}")

        # 8. Log to qr_access_logs for audit trail
        try:
            sr_client_log = supabase_service_role_client()
            sr_client_log.table('qr_access_logs').insert({
                'qr_id': qr_data['qr_id'],
                'patient_id': patient_id,
                'accessed_by': scanning_user_id,
                'facility_id': scanning_facility_id,
                'access_method': 'qr_scan',
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')[:500],  # Truncate to 500 chars
                'metadata': {
                    'access_type': access_type,
                    'share_type': qr_data['share_type'],
                    'scope': scope
                }
            }).execute()
        except Exception as log_error:
            current_app.logger.warning(f"Failed to log QR access: {log_error}")

        # 8b. Log to consent_audit_logs for parent consent management
        try:
            sr_client_consent = supabase_service_role_client()
            sr_client_consent.table('consent_audit_logs').insert({
                'qr_id': qr_data['qr_id'],
                'patient_id': patient_id,
                'parent_id': qr_data.get('generated_by'),  # The parent who generated the QR
                'action': 'qr_accessed',
                'performed_by': scanning_user_id,
                'details': {
                    'access_type': access_type,
                    'share_type': qr_data['share_type'],
                    'scope': scope,
                    'facility_id': scanning_facility_id
                },
                'ip_address': request.remote_addr,
                'success': True
            }).execute()
        except Exception as consent_log_error:
            current_app.logger.warning(f"Failed to log consent audit: {consent_log_error}")

        # 9. Create QR access alert notification (deprecated but kept for backwards compatibility)
        try:
            create_qr_access_alert(
                qr_id=qr_data['qr_id'],
                accessed_by_user_id=scanning_user_id,
                patient_id=patient_id
            )
        except Exception:
            pass

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
        current_app.logger.error(f"Failed to validate QR code: {e}")
        return jsonify({"error": "Failed to validate QR code", "status": 500}), 500


# =============================================================================
# PUBLIC QR ACCESS ENDPOINT (No Authentication Required)
# =============================================================================

@qr_bp.route('/qr/prescription/public', methods=['GET'])
def access_prescription_public():
    """
    Public endpoint for accessing prescription QR codes.
    No authentication required - the token itself is the authorization.
    Works with any QR scanner (iPhone, Android, web browsers, etc.)
    """
    token = request.args.get('token')
    if not token:
        return render_template('error.html',
            error_title="Invalid Request",
            error_message="No access token provided. Please use a valid QR code."
        ), 400

    # Handle malformed URLs where PIN was appended with ? instead of &
    pin_from_token = None
    if '?pin=' in token:
        parts = token.split('?pin=')
        token = parts[0]
        if len(parts) > 1:
            pin_from_token = parts[1]

    try:
        sr_client = supabase_service_role_client()

        # 1. Get QR code record
        qr = sr_client.table('qr_codes')\
            .select('''
                qr_id, token_hash, patient_id, facility_id, generated_by, share_type,
                scope, expires_at, is_active, use_count, max_uses, pin_code, metadata, created_at,
                users!qr_codes_generated_by_fkey(firstname, lastname)
            ''')\
            .eq('token_hash', token)\
            .eq('is_active', True)\
            .execute()

        if not qr.data or len(qr.data) == 0:
            return render_template('error.html',
                error_title="Invalid QR Code",
                error_message="This QR code is invalid or has been deactivated."
            ), 404

        qr_data = qr.data[0]

        # 2. Verify this is a prescription QR code
        if qr_data['share_type'] != 'prescription':
            return render_template('error.html',
                error_title="Invalid QR Code Type",
                error_message="This QR code is not for prescription access."
            ), 400

        # 3. Check expiration
        expires_at = datetime.fromisoformat(qr_data['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            return render_template('error.html',
                error_title="QR Code Expired",
                error_message="This prescription QR code has expired and is no longer valid."
            ), 403

        # 4. Check usage limits
        if qr_data['max_uses'] and qr_data['use_count'] >= qr_data['max_uses']:
            return render_template('error.html',
                error_title="Usage Limit Reached",
                error_message="This QR code has reached its maximum number of uses."
            ), 403

        # 5. Check PIN if required
        if qr_data.get('pin_code'):
            provided_pin = request.args.get('pin') or pin_from_token
            if not provided_pin:
                # Show PIN entry form
                return render_template('pin_entry.html',
                    token=token,
                    error=None
                ), 200
            if provided_pin != qr_data['pin_code']:
                # Show PIN entry form with error
                return render_template('pin_entry.html',
                    token=token,
                    error="Invalid PIN. Please try again."
                ), 403

        # 6. Get patient data (prescription scope only)
        patient_id = qr_data['patient_id']
        scope = qr_data.get('scope', ['prescriptions'])

        patient_data = get_patient_data_by_scope(patient_id, scope)
        if not patient_data:
            return jsonify({"error": "Patient data not found", "status": "error"}), 404

        # 7. Update QR code usage count
        try:
            current_use_count = qr_data.get('use_count') or 0
            sr_client.table('qr_codes').update({
                'use_count': current_use_count + 1,
                'last_accessed_at': datetime.now(timezone.utc).isoformat()
            }).eq('qr_id', qr_data['qr_id']).execute()
            current_app.logger.info(f"Public access: Updated QR code {qr_data['qr_id']} use_count to {current_use_count + 1}")
        except Exception as update_error:
            current_app.logger.warning(f"Failed to update QR code use_count: {update_error}")

        # 8. Log to qr_access_logs for audit trail
        try:
            sr_client.table('qr_access_logs').insert({
                'qr_id': qr_data['qr_id'],
                'patient_id': patient_id,
                'accessed_by': None,  # Public access - no user
                'facility_id': None,
                'access_method': 'public_qr_scan',
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')[:500],
                'metadata': {
                    'access_type': 'public_prescription_access',
                    'share_type': qr_data['share_type'],
                    'scope': scope
                }
            }).execute()
        except Exception as log_error:
            current_app.logger.warning(f"Failed to log public QR access: {log_error}")

        # 9. Log to consent_audit_logs
        try:
            sr_client.table('consent_audit_logs').insert({
                'qr_id': qr_data['qr_id'],
                'patient_id': patient_id,
                'parent_id': qr_data.get('generated_by'),
                'action': 'qr_accessed',
                'performed_by': None,  # Public access
                'details': {
                    'access_type': 'public_prescription_access',
                    'share_type': qr_data['share_type'],
                    'scope': scope,
                    'user_agent': request.headers.get('User-Agent', '')[:200]
                },
                'ip_address': request.remote_addr,
                'success': True
            }).execute()
        except Exception as consent_log_error:
            current_app.logger.warning(f"Failed to log consent audit: {consent_log_error}")

        # 10. Prepare data for HTML template
        generator_info = qr_data.get('users') or {}
        generated_by_name = f"{generator_info.get('firstname', '')} {generator_info.get('lastname', '')}".strip() or "Healthcare Provider"

        # Get the prescription from metadata
        metadata = qr_data.get('metadata', {})
        prescriptions = patient_data.get('prescriptions', [])

        # Find the specific prescription if prescription_id is in metadata
        prescription = None
        if metadata.get('prescription_id') and prescriptions:
            prescription = next((p for p in prescriptions if p.get('rx_id') == metadata.get('prescription_id')), None)

        # If not found, use the first prescription
        if not prescription and prescriptions:
            prescription = prescriptions[0]

        if not prescription:
            return render_template('error.html',
                error_title="Prescription Not Found",
                error_message="The requested prescription could not be found or has been removed."
            ), 404

        # Format dates
        def format_date(date_str):
            if not date_str:
                return "N/A"
            try:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return dt.strftime("%B %d, %Y")
            except:
                return date_str

        # Calculate age from date of birth
        def calculate_age(dob_str):
            if not dob_str:
                return "N/A"
            try:
                dob = datetime.fromisoformat(dob_str.replace('Z', '+00:00'))
                today = datetime.now()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

                # Format age appropriately
                if age < 1:
                    # Calculate months for infants
                    months = (today.year - dob.year) * 12 + today.month - dob.month
                    if months < 1:
                        days = (today - dob).days
                        return f"{days} day{'s' if days != 1 else ''}"
                    return f"{months} month{'s' if months != 1 else ''}"
                elif age < 2:
                    return f"{age} year old"
                else:
                    return f"{age} years old"
            except:
                return "N/A"

        # Extract last segment of RX_ID
        def get_short_rx_id(rx_id):
            if not rx_id:
                return "N/A"
            try:
                # Extract last segment after the last hyphen
                return rx_id.split('-')[-1].upper()
            except:
                return rx_id

        # Prepare patient info
        patient_info = {
            'name': f"{patient_data.get('firstname', '')} {patient_data.get('lastname', '')}".strip(),
            'age': calculate_age(patient_data.get('date_of_birth')),
            'sex': patient_data.get('sex', 'N/A')
        }

        # Fetch facility information from healthcare_facilities table
        facility_data = None
        facility_id = prescription.get('facility_id') or patient_data.get('facility_id')
        if facility_id:
            try:
                facility_response = sr_client.table('healthcare_facilities').select('*').eq('facility_id', facility_id).single().execute()
                facility_data = facility_response.data if facility_response.data else None
            except Exception as facility_error:
                current_app.logger.warning(f"Failed to fetch facility data: {facility_error}")

        # Prepare prescription data
        prescription_data = {
            'rx_id': prescription.get('rx_id'),
            'rx_id_short': get_short_rx_id(prescription.get('rx_id')),
            'prescription_date': format_date(prescription.get('prescription_date')),
            'doctor_name': prescription.get('doctor_name') or metadata.get('doctor_name') or 'N/A',
            'doctor_specialty': prescription.get('doctor_specialty') or 'Physician',
            'doctor_license': prescription.get('doctor_license') or prescription.get('license_number'),
            'facility_name': prescription.get('facility_name') or (facility_data.get('facility_name') if facility_data else None),
            'facility_address': prescription.get('facility_address') or (facility_data.get('address') if facility_data else None),
            'facility_email': prescription.get('facility_email') or (facility_data.get('email') if facility_data else None),
            'facility_contact': prescription.get('facility_contact') or prescription.get('facility_phone') or (facility_data.get('contact_number') if facility_data else None),
            'facility_website': facility_data.get('website') if facility_data else None,
            'medications': prescription.get('medications', []),
            'doctor_instructions': prescription.get('doctor_instructions'),
            'return_date': format_date(prescription.get('return_date')) if prescription.get('return_date') else None,
            'allergies': patient_data.get('allergies', [])
        }

        # Logo URLs - use request base URL to construct absolute paths
        logo1_url = request.url_root.rstrip('/') + '/static/logo1.png'
        logo2_url = request.url_root.rstrip('/') + '/static/logo2.png'

        # Current date
        current_date = datetime.now().strftime("%B %d, %Y")

        # Render HTML template
        return render_template('prescription_view.html',
            patient_info=patient_info,
            prescription_data=prescription_data,
            logo1_url=logo1_url,
            logo2_url=logo2_url,
            current_date=current_date
        ), 200

    except Exception as e:
        current_app.logger.error(f"Failed to access prescription QR code: {e}")
        return render_template('error.html',
            error_title="Access Error",
            error_message="Failed to access prescription data. Please try again or contact support."
        ), 500


@qr_bp.route('/qr/list', methods=['GET'])
@require_auth
def list_qr_codes():
    """List QR codes for the current facility"""
    try:
        supabase = get_authenticated_client()
        patient_id = request.args.get('patient_id')

        query = supabase.table('qr_codes').select('*')

        if patient_id:
            query = query.eq('patient_id', patient_id)

        result = query.order('created_at', desc=True).execute()

        return jsonify({
            "status": 200,
            "qr_codes": result.data,
            "count": len(result.data)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to fetch QR codes: {e}")
        return jsonify({"error": "Failed to fetch QR codes", "status": 500}), 500

@qr_bp.route('/qr/revoke/<qr_id>', methods=['POST'])
@require_auth
def revoke_qr_code(qr_id):
    """Revoke a QR code by setting is_active to False"""
    try:
        supabase = get_authenticated_client()
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        user_facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')

        if qr.data['facility_id'] != user_facility_id and user_role != 'system_admin':
            return jsonify({"error": "Unauthorized to revoke this QR code", "status": 403}), 403

        supabase.table('qr_codes').update({
            'is_active': False
        }).eq('qr_id', qr_id).execute()

        return jsonify({
            "status": 200,
            "message": "QR code revoked successfully",
            "qr_id": qr_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to revoke QR code: {e}")
        return jsonify({"error": "Failed to revoke QR code", "status": 500}), 500

@qr_bp.route('/qr/audit/<qr_id>', methods=['GET'])
@require_auth
def get_qr_audit_history(qr_id):
    """Get audit history for a specific QR code"""
    try:
        supabase = get_authenticated_client()
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        user_facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')

        if qr.data['facility_id'] != user_facility_id and user_role != 'system_admin':
            return jsonify({"error": "Unauthorized to view audit history", "status": 403}), 403

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
        current_app.logger.error(f"Failed to fetch audit history: {e}")
        return jsonify({"error": "Failed to fetch audit history", "status": 500}), 500

@qr_bp.route('/qr/details/<qr_id>', methods=['GET'])
@require_auth
def get_qr_details(qr_id):
    """Get details of a specific QR code"""
    try:
        supabase = get_authenticated_client()
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        user_facility_id = request.current_user.get('facility_id')
        user_role = request.current_user.get('role')

        if qr.data['facility_id'] != user_facility_id and user_role != 'system_admin':
            return jsonify({"error": "Unauthorized to view QR code details", "status": 403}), 403

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
        current_app.logger.error(f"Failed to fetch QR code details: {e}")
        return jsonify({"error": "Failed to fetch QR code details", "status": 500}), 500


# =============================================================================
# QR CODE TYPE CHECK ENDPOINT
# =============================================================================

@qr_bp.route('/qr/check-type', methods=['GET'])
@require_auth
def check_qr_type():
    """
    Check the type of a QR code without consuming it.
    Used to determine how to handle the QR code (e.g., parent_access_grant vs regular access)
    """
    token = request.args.get('token')
    if not token:
        return jsonify({"error": "Token is required", "status": "error"}), 400

    try:
        sr_client = supabase_service_role_client()

        qr = sr_client.table('qr_codes')\
            .select('qr_id, share_type, scope, expires_at, is_active, metadata')\
            .eq('token_hash', token)\
            .execute()

        if not qr.data or len(qr.data) == 0:
            return jsonify({
                "error": "QR code not found",
                "status": "error"
            }), 404

        qr_data = qr.data[0]

        # Check if expired
        is_expired = False
        if qr_data.get('expires_at'):
            expires_at = datetime.fromisoformat(qr_data['expires_at'].replace('Z', '+00:00'))
            is_expired = datetime.now(timezone.utc) > expires_at

        return jsonify({
            "status": "success",
            "qr_id": qr_data['qr_id'],
            "share_type": qr_data['share_type'],
            "scope": qr_data.get('scope', []),
            "is_active": qr_data['is_active'],
            "is_expired": is_expired,
            "metadata": qr_data.get('metadata', {})
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to check QR type: {e}")
        return jsonify({
            "error": "Failed to check QR code type",
            "status": "error"
        }), 500


# =============================================================================
# PARENT ACCESS GRANT ENDPOINT
# =============================================================================

@qr_bp.route('/qr/grant-parent-access', methods=['POST'])
@require_auth
def grant_parent_access():
    """
    Grant parent access to a patient via QR code token.
    This endpoint is called when a parent scans a QR code generated by a doctor.

    The parent must:
    1. Be authenticated with role 'parent' or 'keepsaker'
    2. Scan a valid, unexpired QR code with share_type 'parent_access_grant'

    On success, creates a parent_access record linking the parent to the patient.
    """
    try:
        raw_data = request.json
        token = raw_data.get('token')

        if not token:
            return jsonify({"error": "Token is required", "status": "error"}), 400

        # Get current user info
        current_user = request.current_user
        user_id = current_user.get('id')
        user_role = current_user.get('role')

        # Verify user is a parent/keepsaker
        if user_role not in ['parent', 'keepsaker', 'guardian']:
            return jsonify({
                "error": "Only parents can claim parent access",
                "status": "error",
                "code": "invalid_role"
            }), 403

        sr_client = supabase_service_role_client()

        # 1. Get and validate QR code
        qr = sr_client.table('qr_codes')\
            .select('qr_id, token_hash, patient_id, facility_id, generated_by, share_type, scope, expires_at, is_active, use_count, max_uses, metadata')\
            .eq('token_hash', token)\
            .eq('is_active', True)\
            .execute()

        if not qr.data or len(qr.data) == 0:
            return jsonify({
                "error": "Invalid or expired QR code",
                "status": "error",
                "code": "invalid_token"
            }), 404

        qr_data = qr.data[0]

        # 2. Verify share type is for parent access grant
        if qr_data['share_type'] != 'parent_access_grant':
            return jsonify({
                "error": "This QR code is not for parent access",
                "status": "error",
                "code": "invalid_share_type"
            }), 400

        # 3. Check expiration
        expires_at = datetime.fromisoformat(qr_data['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            return jsonify({
                "error": "This QR code has expired",
                "status": "error",
                "code": "expired"
            }), 403

        # 4. Check usage limits
        if qr_data['max_uses'] and qr_data['use_count'] >= qr_data['max_uses']:
            return jsonify({
                "error": "This QR code has already been used",
                "status": "error",
                "code": "limit_reached"
            }), 403

        patient_id = qr_data['patient_id']
        granted_by = qr_data['generated_by']

        # 5. Check if parent already has access to this patient
        existing_access = sr_client.table('parent_access')\
            .select('access_id, is_active')\
            .eq('patient_id', patient_id)\
            .eq('user_id', user_id)\
            .execute()

        if existing_access.data and len(existing_access.data) > 0:
            existing_record = existing_access.data[0]
            if existing_record.get('is_active'):
                return jsonify({
                    "error": "You already have access to this patient",
                    "status": "error",
                    "code": "already_exists"
                }), 400
            else:
                # Reactivate existing access
                # Note: assigned_by is required for audit_trigger_function to get user_id
                sr_client.table('parent_access')\
                    .update({
                        'is_active': True,
                        'revoked_at': None,
                        'granted_by': granted_by,
                        'assigned_by': granted_by,  # Required for audit trigger
                        'granted_at': datetime.now(timezone.utc).isoformat()
                    })\
                    .eq('access_id', existing_record['access_id'])\
                    .execute()

                access_id = existing_record['access_id']
        else:
            # 6. Create new parent_access record
            # Note: assigned_by is required for audit_trigger_function to get user_id
            access_record = sr_client.table('parent_access').insert({
                'patient_id': patient_id,
                'user_id': user_id,
                'relationship': 'parent',  # Default relationship
                'granted_by': granted_by,
                'assigned_by': granted_by,  # Required for audit trigger
                'is_active': True
            }).execute()

            if not access_record.data or len(access_record.data) == 0:
                return jsonify({
                    "error": "Failed to grant parent access",
                    "status": "error"
                }), 500

            access_id = access_record.data[0]['access_id']

        # 7. Update QR code usage count and deactivate (one-time use)
        sr_client.table('qr_codes').update({
            'use_count': (qr_data.get('use_count') or 0) + 1,
            'last_accessed_at': datetime.now(timezone.utc).isoformat(),
            'last_accessed_by': user_id,
            'is_active': False  # Deactivate after use
        }).eq('qr_id', qr_data['qr_id']).execute()

        # 8. Log to consent_audit_logs
        try:
            sr_client.table('consent_audit_logs').insert({
                'qr_id': qr_data['qr_id'],
                'patient_id': patient_id,
                'parent_id': user_id,
                'action': 'parent_access_granted',
                'performed_by': user_id,
                'details': {
                    'granted_by_doctor': granted_by,
                    'access_id': access_id,
                    'method': 'qr_code_scan'
                },
                'ip_address': request.remote_addr,
                'success': True
            }).execute()
        except Exception as log_error:
            current_app.logger.warning(f"Failed to log consent audit: {log_error}")

        # 9. Get patient info for response
        patient = sr_client.table('patients')\
            .select('patient_id, firstname, lastname, middlename, date_of_birth')\
            .eq('patient_id', patient_id)\
            .single()\
            .execute()

        patient_name = "Unknown"
        if patient.data:
            patient_name = f"{patient.data.get('firstname', '')} {patient.data.get('lastname', '')}".strip()

        return jsonify({
            "status": "success",
            "message": f"You now have access to {patient_name}'s records",
            "access_id": access_id,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "patient_data": patient.data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to grant parent access: {e}")
        return jsonify({
            "error": "Failed to grant parent access",
            "status": "error",
            "details": str(e)
        }), 500
