from flask import Blueprint, jsonify, request, current_app
from config.settings import supabase, supabase_service_role_client
from utils.access_control import require_auth
from utils.sanitize import sanitize_request_data
from datetime import datetime, timezone

parent_consent_bp = Blueprint('parent_consent', __name__)


def get_parent_children(parent_id):
    """Get all children associated with a parent"""
    try:
        sr_client = supabase_service_role_client()
        result = sr_client.table('parent_access')\
            .select('patient_id, relationship, granted_at, patients(patient_id, firstname, lastname, date_of_birth, sex)')\
            .eq('user_id', parent_id)\
            .eq('is_active', True)\
            .execute()

        return [item for item in result.data if item.get('patients')] if result.data else []
    except Exception as e:
        current_app.logger.error(f"Error fetching parent children: {e}")
        return []


def verify_parent_access(parent_id, patient_id):
    """Verify parent has access to the patient"""
    try:
        sr_client = supabase_service_role_client()
        result = sr_client.table('parent_access')\
            .select('access_id')\
            .eq('user_id', parent_id)\
            .eq('patient_id', patient_id)\
            .eq('is_active', True)\
            .execute()

        return bool(result.data and len(result.data) > 0)
    except Exception:
        return False


# ============================================================================
# ACTIVE SHARES ENDPOINTS
# ============================================================================

@parent_consent_bp.route('/consent/active', methods=['GET'])
@require_auth
def get_active_shares():
    """Get all active QR code shares for parent's children"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        # Only parents can access this endpoint
        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can access consent management", "status": 403}), 403

        # Get optional patient filter
        patient_id = request.args.get('patient_id')

        sr_client = supabase_service_role_client()

        # Get parent's children
        children = get_parent_children(user_id)
        if not children:
            return jsonify({
                "status": 200,
                "shares": [],
                "children": [],
                "message": "No children found"
            }), 200

        patient_ids = [child['patient_id'] for child in children]

        # If specific patient requested, verify access
        if patient_id:
            if patient_id not in patient_ids:
                return jsonify({"error": "Unauthorized access to patient", "status": 403}), 403
            patient_ids = [patient_id]

        # Get active QR codes for these patients
        qr_query = sr_client.table('qr_codes')\
            .select('''
                qr_id, token_hash, patient_id, facility_id, generated_by, share_type,
                scope, expires_at, is_active, use_count, max_uses, last_accessed_at,
                target_facilities, pin_code, metadata, created_at,
                patients(firstname, lastname, date_of_birth),
                healthcare_facilities(facility_name, type),
                users!qr_codes_generated_by_fkey(firstname, lastname, role)
            ''')\
            .in_('patient_id', patient_ids)\
            .eq('is_active', True)\
            .order('created_at', desc=True)\
            .execute()

        shares = []
        for qr in (qr_query.data or []):
            # Check if expired or usage limit reached
            expires_at = datetime.fromisoformat(qr['expires_at'].replace('Z', '+00:00'))
            is_expired = datetime.now(timezone.utc) > expires_at
            is_limit_reached = qr.get('max_uses') and qr['use_count'] >= qr['max_uses']

            effective_status = 'active'
            if is_expired:
                effective_status = 'expired'
            elif is_limit_reached:
                effective_status = 'limit_reached'

            patient_info = qr.get('patients') or {}
            facility_info = qr.get('healthcare_facilities') or {}
            generator_info = qr.get('users') or {}

            shares.append({
                'qr_id': qr['qr_id'],
                'patient_id': qr['patient_id'],
                'patient_name': f"{patient_info.get('firstname', '')} {patient_info.get('lastname', '')}".strip(),
                'patient_dob': patient_info.get('date_of_birth'),
                'share_type': qr['share_type'],
                'scope': qr['scope'] or ['view_only'],
                'facility_name': facility_info.get('facility_name', 'Unknown'),
                'facility_type': facility_info.get('type'),
                'generated_by': f"{generator_info.get('firstname', '')} {generator_info.get('lastname', '')}".strip() if generator_info else 'Unknown',
                'generated_by_role': generator_info.get('role') if generator_info else None,
                'created_at': qr['created_at'],
                'expires_at': qr['expires_at'],
                'use_count': qr['use_count'],
                'max_uses': qr['max_uses'],
                'last_accessed_at': qr['last_accessed_at'],
                'has_pin': bool(qr.get('pin_code')),
                'has_facility_restriction': bool(qr.get('target_facilities') and len(qr['target_facilities']) > 0),
                'effective_status': effective_status,
                'metadata': qr.get('metadata', {})
            })

        # Format children data
        formatted_children = [{
            'patient_id': child['patient_id'],
            'name': f"{child['patients']['firstname']} {child['patients']['lastname']}",
            'date_of_birth': child['patients']['date_of_birth'],
            'relationship': child['relationship']
        } for child in children]

        return jsonify({
            "status": 200,
            "shares": shares,
            "children": formatted_children,
            "total_active": len([s for s in shares if s['effective_status'] == 'active'])
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to fetch active shares: {e}")
        return jsonify({"error": "Failed to fetch active shares", "status": 500}), 500


# ============================================================================
# ACCESS HISTORY ENDPOINTS
# ============================================================================

@parent_consent_bp.route('/consent/access-history', methods=['GET'])
@require_auth
def get_access_history():
    """Get access history for parent's children's QR codes"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can access consent management", "status": 403}), 403

        # Get filters
        patient_id = request.args.get('patient_id')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        sr_client = supabase_service_role_client()

        # Get parent's children
        children = get_parent_children(user_id)
        if not children:
            return jsonify({
                "status": 200,
                "history": [],
                "total": 0
            }), 200

        patient_ids = [child['patient_id'] for child in children]

        if patient_id:
            if patient_id not in patient_ids:
                return jsonify({"error": "Unauthorized access to patient", "status": 403}), 403
            patient_ids = [patient_id]

        # Get QR codes for these patients first
        qr_codes = sr_client.table('qr_codes')\
            .select('qr_id, patient_id, share_type')\
            .in_('patient_id', patient_ids)\
            .execute()

        if not qr_codes.data:
            return jsonify({
                "status": 200,
                "history": [],
                "total": 0
            }), 200

        qr_ids = [qr['qr_id'] for qr in qr_codes.data]
        qr_map = {qr['qr_id']: qr for qr in qr_codes.data}

        # Get consent audit logs
        audit_logs = sr_client.table('consent_audit_logs')\
            .select('''
                log_id, consent_id, qr_id, patient_id, parent_id, action,
                performed_by, performed_at, details, ip_address, success,
                users!consent_audit_logs_performed_by_fkey(firstname, lastname, role),
                patients(firstname, lastname)
            ''')\
            .in_('qr_id', qr_ids)\
            .order('performed_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()

        history = []
        for log in (audit_logs.data or []):
            performer = log.get('users') or {}
            patient = log.get('patients') or {}
            qr_info = qr_map.get(log['qr_id'], {})

            history.append({
                'log_id': log['log_id'],
                'qr_id': log['qr_id'],
                'patient_id': log['patient_id'],
                'patient_name': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip() if patient else 'Unknown',
                'action': log['action'],
                'action_label': get_action_label(log['action']),
                'performed_by': f"{performer.get('firstname', '')} {performer.get('lastname', '')}".strip() if performer else 'System',
                'performed_by_role': performer.get('role') if performer else None,
                'performed_at': log['performed_at'],
                'details': log.get('details', {}),
                'ip_address': log.get('ip_address'),
                'success': log.get('success', True),
                'share_type': qr_info.get('share_type', 'unknown')
            })

        # Get total count
        count_result = sr_client.table('consent_audit_logs')\
            .select('log_id', count='exact')\
            .in_('qr_id', qr_ids)\
            .execute()

        return jsonify({
            "status": 200,
            "history": history,
            "total": count_result.count if hasattr(count_result, 'count') else len(history),
            "limit": limit,
            "offset": offset
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to fetch access history: {e}")
        return jsonify({"error": "Failed to fetch access history", "status": 500}), 500


def get_action_label(action):
    """Convert action code to human-readable label"""
    labels = {
        'consent_granted': 'Access Granted',
        'consent_revoked': 'Access Revoked',
        'consent_modified': 'Settings Modified',
        'consent_expired': 'Access Expired',
        'qr_generated': 'QR Code Created',
        'qr_accessed': 'QR Code Scanned',
        'qr_revoked': 'QR Code Revoked',
        'qr_expired': 'QR Code Expired',
        'preferences_updated': 'Preferences Updated',
        'emergency_revoke_all': 'Emergency Revoke All',
        'access_attempt_blocked': 'Access Blocked',
        'suspicious_activity_detected': 'Suspicious Activity'
    }
    return labels.get(action, action.replace('_', ' ').title())


# ============================================================================
# QR CODE ACCESS LOGS (from qr_access_logs table)
# ============================================================================

@parent_consent_bp.route('/consent/access-logs', methods=['GET'])
@require_auth
def get_qr_access_logs():
    """Get detailed QR code access logs showing who accessed what"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can access consent management", "status": 403}), 403

        patient_id = request.args.get('patient_id')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        sr_client = supabase_service_role_client()

        # Get parent's children
        children = get_parent_children(user_id)
        if not children:
            return jsonify({
                "status": 200,
                "logs": [],
                "total": 0
            }), 200

        patient_ids = [child['patient_id'] for child in children]

        if patient_id:
            if patient_id not in patient_ids:
                return jsonify({"error": "Unauthorized access to patient", "status": 403}), 403
            patient_ids = [patient_id]

        # Try to get from qr_access_logs table
        try:
            access_logs = sr_client.table('qr_access_logs')\
                .select('''
                    log_id, qr_id, patient_id, accessed_by, accessed_at,
                    facility_id, access_method, ip_address, user_agent, metadata,
                    users!qr_access_logs_accessed_by_fkey(firstname, lastname, role),
                    patients(firstname, lastname),
                    healthcare_facilities(facility_name)
                ''')\
                .in_('patient_id', patient_ids)\
                .order('accessed_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()

            logs = []
            for log in (access_logs.data or []):
                accessor = log.get('users') or {}
                patient = log.get('patients') or {}
                facility = log.get('healthcare_facilities') or {}

                logs.append({
                    'log_id': log['log_id'],
                    'qr_id': log['qr_id'],
                    'patient_id': log['patient_id'],
                    'patient_name': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip() if patient else 'Unknown',
                    'accessed_by': f"{accessor.get('firstname', '')} {accessor.get('lastname', '')}".strip() if accessor else 'Unknown',
                    'accessed_by_role': accessor.get('role') if accessor else None,
                    'accessed_at': log['accessed_at'],
                    'facility_name': facility.get('facility_name') if facility else 'Unknown',
                    'access_method': log.get('access_method', 'qr_scan'),
                    'ip_address': log.get('ip_address'),
                    'metadata': log.get('metadata', {})
                })

            return jsonify({
                "status": 200,
                "logs": logs,
                "total": len(logs),
                "limit": limit,
                "offset": offset
            }), 200

        except Exception:
            # Table might not exist yet, return empty
            return jsonify({
                "status": 200,
                "logs": [],
                "total": 0,
                "message": "Access logs not available"
            }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to fetch access logs: {e}")
        return jsonify({"error": "Failed to fetch access logs", "status": 500}), 500


# ============================================================================
# REVOKE ENDPOINTS
# ============================================================================

@parent_consent_bp.route('/consent/revoke/<qr_id>', methods=['POST'])
@require_auth
def revoke_share(qr_id):
    """Revoke a specific QR code share"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can revoke shares", "status": 403}), 403

        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        reason = data.get('reason', 'Revoked by parent')

        sr_client = supabase_service_role_client()

        # Get QR code details
        qr = sr_client.table('qr_codes')\
            .select('qr_id, patient_id, is_active')\
            .eq('qr_id', qr_id)\
            .single()\
            .execute()

        if not qr.data:
            return jsonify({"error": "QR code not found", "status": 404}), 404

        # Verify parent has access to this patient
        if not verify_parent_access(user_id, qr.data['patient_id']):
            return jsonify({"error": "Unauthorized to revoke this share", "status": 403}), 403

        if not qr.data['is_active']:
            return jsonify({"error": "QR code already revoked", "status": 400}), 400

        # Revoke the QR code
        sr_client.table('qr_codes').update({
            'is_active': False
        }).eq('qr_id', qr_id).execute()

        # Log the revocation
        try:
            sr_client.table('consent_audit_logs').insert({
                'qr_id': qr_id,
                'patient_id': qr.data['patient_id'],
                'parent_id': user_id,
                'action': 'qr_revoked',
                'performed_by': user_id,
                'details': {
                    'reason': reason,
                    'revoked_at': datetime.now(timezone.utc).isoformat()
                },
                'success': True
            }).execute()
        except Exception:
            pass  # Don't fail if logging fails

        return jsonify({
            "status": 200,
            "message": "Share revoked successfully",
            "qr_id": qr_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to revoke share: {e}")
        return jsonify({"error": "Failed to revoke share", "status": 500}), 500


@parent_consent_bp.route('/consent/revoke-all/<patient_id>', methods=['POST'])
@require_auth
def revoke_all_shares(patient_id):
    """Emergency revoke all active shares for a patient"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can revoke shares", "status": 403}), 403

        # Verify parent has access
        if not verify_parent_access(user_id, patient_id):
            return jsonify({"error": "Unauthorized to revoke shares for this patient", "status": 403}), 403

        raw_data = request.json or {}
        data = sanitize_request_data(raw_data)
        reason = data.get('reason', 'Emergency revoke all by parent')

        sr_client = supabase_service_role_client()

        # Get all active QR codes for this patient
        active_qrs = sr_client.table('qr_codes')\
            .select('qr_id')\
            .eq('patient_id', patient_id)\
            .eq('is_active', True)\
            .execute()

        if not active_qrs.data or len(active_qrs.data) == 0:
            return jsonify({
                "status": 200,
                "message": "No active shares to revoke",
                "revoked_count": 0
            }), 200

        qr_ids = [qr['qr_id'] for qr in active_qrs.data]

        # Revoke all
        sr_client.table('qr_codes').update({
            'is_active': False
        }).in_('qr_id', qr_ids).execute()

        # Log the emergency revocation
        try:
            sr_client.table('consent_audit_logs').insert({
                'patient_id': patient_id,
                'parent_id': user_id,
                'action': 'emergency_revoke_all',
                'performed_by': user_id,
                'details': {
                    'reason': reason,
                    'revoked_count': len(qr_ids),
                    'qr_ids': qr_ids,
                    'revoked_at': datetime.now(timezone.utc).isoformat()
                },
                'success': True
            }).execute()
        except Exception:
            pass

        return jsonify({
            "status": 200,
            "message": f"Successfully revoked {len(qr_ids)} active share(s)",
            "revoked_count": len(qr_ids),
            "patient_id": patient_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to revoke all shares: {e}")
        return jsonify({"error": "Failed to revoke all shares", "status": 500}), 500


# ============================================================================
# PREFERENCES ENDPOINTS
# ============================================================================

@parent_consent_bp.route('/consent/preferences', methods=['GET'])
@require_auth
def get_consent_preferences():
    """Get parent's consent preferences"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can access consent preferences", "status": 403}), 403

        sr_client = supabase_service_role_client()

        # Get existing preferences
        prefs = sr_client.table('consent_preferences')\
            .select('*')\
            .eq('parent_id', user_id)\
            .execute()

        if prefs.data and len(prefs.data) > 0:
            preferences = prefs.data[0]
        else:
            # Return default preferences
            preferences = {
                'preference_id': None,
                'parent_id': user_id,
                'default_expiry_days': 7,
                'default_max_uses': 10,
                'default_scope': ['view_only', 'allergies', 'vaccinations'],
                'always_require_pin': False,
                'notify_on_access': True,
                'notify_on_expiry': True,
                'notify_before_expiry_days': 3,
                'allow_emergency_override': False,
                'emergency_contact_notified': True
            }

        return jsonify({
            "status": 200,
            "preferences": preferences
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to fetch consent preferences: {e}")
        return jsonify({"error": "Failed to fetch consent preferences", "status": 500}), 500


@parent_consent_bp.route('/consent/preferences', methods=['PUT'])
@require_auth
def update_consent_preferences():
    """Update parent's consent preferences"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can update consent preferences", "status": 403}), 403

        raw_data = request.json
        data = sanitize_request_data(raw_data)

        # Validate and prepare update data
        update_data = {}

        if 'default_expiry_days' in data:
            days = int(data['default_expiry_days'])
            if days < 1 or days > 365:
                return jsonify({"error": "Expiry days must be between 1 and 365", "status": 400}), 400
            update_data['default_expiry_days'] = days

        if 'default_max_uses' in data:
            uses = int(data['default_max_uses'])
            if uses < 1 or uses > 100:
                return jsonify({"error": "Max uses must be between 1 and 100", "status": 400}), 400
            update_data['default_max_uses'] = uses

        if 'default_scope' in data:
            valid_scopes = ['view_only', 'allergies', 'prescriptions', 'vaccinations', 'appointments', 'vitals', 'full_access']
            scope = data['default_scope']
            if not isinstance(scope, list) or not all(s in valid_scopes for s in scope):
                return jsonify({"error": "Invalid scope values", "status": 400}), 400
            update_data['default_scope'] = scope

        if 'always_require_pin' in data:
            update_data['always_require_pin'] = bool(data['always_require_pin'])

        if 'notify_on_access' in data:
            update_data['notify_on_access'] = bool(data['notify_on_access'])

        if 'notify_on_expiry' in data:
            update_data['notify_on_expiry'] = bool(data['notify_on_expiry'])

        if 'notify_before_expiry_days' in data:
            days = int(data['notify_before_expiry_days'])
            if days < 1 or days > 30:
                return jsonify({"error": "Notify before expiry must be between 1 and 30 days", "status": 400}), 400
            update_data['notify_before_expiry_days'] = days

        if 'allow_emergency_override' in data:
            update_data['allow_emergency_override'] = bool(data['allow_emergency_override'])

        if 'emergency_contact_notified' in data:
            update_data['emergency_contact_notified'] = bool(data['emergency_contact_notified'])

        if not update_data:
            return jsonify({"error": "No valid fields to update", "status": 400}), 400

        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()

        sr_client = supabase_service_role_client()

        # Check if preferences exist
        existing = sr_client.table('consent_preferences')\
            .select('preference_id')\
            .eq('parent_id', user_id)\
            .execute()

        if existing.data and len(existing.data) > 0:
            # Update existing
            result = sr_client.table('consent_preferences')\
                .update(update_data)\
                .eq('parent_id', user_id)\
                .execute()
        else:
            # Insert new
            update_data['parent_id'] = user_id
            result = sr_client.table('consent_preferences')\
                .insert(update_data)\
                .execute()

        # Log the update
        try:
            sr_client.table('consent_audit_logs').insert({
                'parent_id': user_id,
                'action': 'preferences_updated',
                'performed_by': user_id,
                'details': {
                    'updated_fields': list(update_data.keys()),
                    'new_values': update_data
                },
                'success': True
            }).execute()
        except Exception:
            pass

        return jsonify({
            "status": 200,
            "message": "Preferences updated successfully",
            "preferences": result.data[0] if result.data else update_data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to update consent preferences: {e}")
        return jsonify({"error": "Failed to update consent preferences", "status": 500}), 500


# ============================================================================
# STATISTICS ENDPOINT
# ============================================================================

@parent_consent_bp.route('/consent/stats', methods=['GET'])
@require_auth
def get_consent_stats():
    """Get statistics about parent's consent and sharing activities"""
    try:
        user = request.current_user
        user_id = user.get('id')
        user_role = user.get('role')

        if user_role not in ['parent', 'guardian', 'keepsaker']:
            return jsonify({"error": "Only parents can access consent stats", "status": 403}), 403

        sr_client = supabase_service_role_client()

        # Get parent's children
        children = get_parent_children(user_id)
        if not children:
            return jsonify({
                "status": 200,
                "stats": {
                    "total_children": 0,
                    "total_active_shares": 0,
                    "total_expired_shares": 0,
                    "total_revoked_shares": 0,
                    "total_accesses": 0,
                    "shares_by_type": {},
                    "recent_activity_count": 0
                }
            }), 200

        patient_ids = [child['patient_id'] for child in children]

        # Get all QR codes for children
        all_qrs = sr_client.table('qr_codes')\
            .select('qr_id, is_active, share_type, use_count, expires_at')\
            .in_('patient_id', patient_ids)\
            .execute()

        qr_data = all_qrs.data or []
        now = datetime.now(timezone.utc)

        active_count = 0
        expired_count = 0
        revoked_count = 0
        total_accesses = 0
        shares_by_type = {}

        for qr in qr_data:
            expires_at = datetime.fromisoformat(qr['expires_at'].replace('Z', '+00:00'))
            is_expired = now > expires_at

            if qr['is_active'] and not is_expired:
                active_count += 1
            elif is_expired:
                expired_count += 1
            else:
                revoked_count += 1

            total_accesses += qr.get('use_count', 0)

            share_type = qr.get('share_type', 'unknown')
            shares_by_type[share_type] = shares_by_type.get(share_type, 0) + 1

        # Get recent activity count (last 7 days)
        seven_days_ago = (now - timedelta(days=7)).isoformat()
        try:
            recent_activity = sr_client.table('consent_audit_logs')\
                .select('log_id', count='exact')\
                .eq('parent_id', user_id)\
                .gte('performed_at', seven_days_ago)\
                .execute()
            recent_activity_count = recent_activity.count if hasattr(recent_activity, 'count') else 0
        except Exception:
            recent_activity_count = 0

        return jsonify({
            "status": 200,
            "stats": {
                "total_children": len(children),
                "total_active_shares": active_count,
                "total_expired_shares": expired_count,
                "total_revoked_shares": revoked_count,
                "total_accesses": total_accesses,
                "shares_by_type": shares_by_type,
                "recent_activity_count": recent_activity_count
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to fetch consent stats: {e}")
        return jsonify({"error": "Failed to fetch consent stats", "status": 500}), 500


# Import timedelta for stats
from datetime import timedelta
