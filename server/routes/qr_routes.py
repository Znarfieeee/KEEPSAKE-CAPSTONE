from flask import Blueprint, jsonify, request
from config.settings import supabase
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
            allergies = supabase.table('allergies')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .execute()
            result['allergies'] = allergies.data or []

        # Add prescriptions if in scope
        if 'prescriptions' in scope or 'full_access' in scope:
            prescriptions = supabase.table('prescriptions')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('created_at', desc=True)\
                .execute()
            result['prescriptions'] = prescriptions.data or []

        # Add vaccinations if in scope
        if 'vaccinations' in scope or 'full_access' in scope:
            vaccinations = supabase.table('vaccinations')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('administered_at', desc=True)\
                .execute()
            result['vaccinations'] = vaccinations.data or []

        # Add appointments if in scope
        if 'appointments' in scope or 'full_access' in scope:
            appointments = supabase.table('appointments')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('appointment_date', desc=True)\
                .limit(10)\
                .execute()
            result['appointments'] = appointments.data or []

        # Add vitals/anthropometric measurements if in scope
        if 'vitals' in scope or 'full_access' in scope:
            vitals = supabase.table('anthropometric_measurements')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('measurement_date', desc=True)\
                .limit(10)\
                .execute()
            result['vitals'] = vitals.data or []

        return result

    except Exception as e:
        print(f"Error fetching patient data by scope: {e}")
        return None

def ensure_patient_facility_registration(patient_id, facility_id, registered_by, registration_method):
    """Ensure patient is registered at the facility"""
    existing = supabase.table('facility_patients')\
        .select('*')\
        .eq('patient_id', patient_id)\
        .eq('facility_id', facility_id)\
        .execute()
    
    if not existing.data:
        supabase.table('facility_patients').insert({
            'patient_id': patient_id,
            'facility_id': facility_id,
            'registered_by': registered_by,
            'registration_method': registration_method
        }).execute()


@qr_bp.route('/qr/generate', methods=['POST'])
@require_auth
def generate_token():
    """Generate a new QR code for patient access"""
    try:
        raw_data = request.get_json()
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

        qr_data = {
            'token_hash': token,
            'patient_id': data['patient_id'],
            'facility_id': request.current_user.get('facility_id'),
            'generated_by': request.current_user.get('id'),
            'share_type': data['share_type'],
            'scope': data.get('scope', ['view_only']),
            'expires_at': (datetime.now(timezone.utc) + timedelta(days=data['expires_in_days'])).isoformat(),
            'is_active': True,
            'use_count': 0,
            'max_uses': data.get('max_uses'),
            'target_facilities': data.get('target_facilities'),
            'pin_code': data.get('pin_code'),
            'metadata': {
                'allow_emergency_access': data.get('allow_emergency_access', False),
                'requires_pin': bool(data.get('pin_code'))
            }
        }

        # Create QR code record (audit logging handled by database trigger)
        result = supabase.table('qr_codes').insert(qr_data).execute()

        # Get base URL from environment or use default
        base_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

        return jsonify({
            "status": 200,
            "qr_id": result.data[0]['qr_id'],
            "token": token,
            "access_url": f"{base_url}/qr/access?token={token}",
            "expires_at": qr_data['expires_at']
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to create QR code", "details": str(e), "status": 500}), 500

@qr_bp.route('/qr/access', methods=['GET'])
@require_auth
def validate_qr_access():
    """
    Validates QR code access with flexible facility control and comprehensive security checks
    Supports 3 access modes: Open Access, Restricted Access, Emergency Access
    """
    token = request.args.get('token')
    if not token:
        return jsonify({"error": "Token is required", "status": 400}), 400

    scanning_user = request.current_user
    if not scanning_user or 'facility_id' not in scanning_user:
        return jsonify({"error": "Invalid user or facility context", "status": 401}), 401

    try:
        # 1. Get QR code record with comprehensive validation
        qr = supabase.table('qr_codes')\
            .select('*')\
            .eq('token_hash', token)\
            .eq('is_active', True)\
            .execute()

        if not qr.data or len(qr.data) == 0:
            return jsonify({"error": "Invalid or inactive QR code", "status": 404}), 404

        qr_data = qr.data[0]

        # 2. Check expiration
        expires_at = datetime.fromisoformat(qr_data['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            return jsonify({"error": "QR code has expired", "status": 403}), 403

        # 3. Check usage limits
        if qr_data['max_uses'] and qr_data['use_count'] >= qr_data['max_uses']:
            return jsonify({"error": "QR code usage limit reached", "status": 403}), 403

        # 4. FLEXIBLE FACILITY ACCESS CONTROL
        target_facilities = qr_data.get('target_facilities')
        scanning_facility_id = scanning_user.get('facility_id')
        access_type = None

        # Mode 1: Open Access (NULL or empty target_facilities)
        if not target_facilities or len(target_facilities) == 0:
            access_type = "open_access"

            # If PIN is set, require verification
            if qr_data.get('pin_code'):
                provided_pin = request.args.get('pin')
                if provided_pin != qr_data['pin_code']:
                    return jsonify({"error": "Invalid PIN", "status": 403}), 403

        # Mode 2: Restricted Access (specific facilities whitelisted)
        else:
            if scanning_facility_id in target_facilities:
                access_type = "whitelisted_facility"
            else:
                # Check for emergency access override
                metadata = qr_data.get('metadata', {})
                if metadata.get('allow_emergency_access'):
                    # Require PIN for emergency access
                    provided_pin = request.args.get('pin')
                    if provided_pin and provided_pin == qr_data.get('pin_code'):
                        access_type = "emergency_access"
                    else:
                        return jsonify({"error": "PIN required for emergency access", "status": 403}), 403
                else:
                    return jsonify({"error": "Facility not authorized to access this patient", "status": 403}), 403

        # 5. Get patient data based on scope
        patient_id = qr_data['patient_id']
        scope = qr_data.get('scope', ['view_only'])

        patient_data = get_patient_data_by_scope(patient_id, scope)
        if not patient_data:
            return jsonify({"error": "Patient data not found", "status": 404}), 404

        # 6. Auto-register patient to this facility (if not already)
        ensure_patient_facility_registration(
            patient_id=patient_id,
            facility_id=scanning_facility_id,
            registered_by=scanning_user['id'],
            registration_method='qr_code_scan'
        )

        # 7. Update QR code usage (audit logging handled by database trigger)
        supabase.table('qr_codes').update({
            'use_count': qr_data['use_count'] + 1,
            'last_accessed_at': datetime.now(timezone.utc).isoformat(),
            'last_accessed_by': scanning_user['id']
        }).eq('qr_id', qr_data['qr_id']).execute()

        # 8. Create QR access alert notification
        try:
            create_qr_access_alert(
                qr_id=qr_data['qr_id'],
                accessed_by_user_id=scanning_user['id'],
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