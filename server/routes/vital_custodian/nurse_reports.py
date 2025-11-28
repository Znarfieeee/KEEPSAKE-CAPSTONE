from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import get_authenticated_client
from datetime import datetime, timedelta
from utils.redis_client import get_redis_client
import json
import hashlib

nurse_reports_bp = Blueprint('nurse_reports', __name__)
redis_client = get_redis_client()

CACHE_TTL = 300  # 5 minutes

def get_cache_key(report_type, filters):
    """Generate a unique cache key based on report type and filters"""
    filter_str = json.dumps(filters, sort_keys=True)
    filter_hash = hashlib.md5(filter_str.encode()).hexdigest()
    return f"nurse_report:{report_type}:{filter_hash}"

def get_cached_data(cache_key, bust_cache=False):
    """Get cached data if available and not busting cache"""
    if bust_cache:
        return None

    cached = redis_client.get(cache_key)
    if cached:
        try:
            cached_data = json.loads(cached)
            ttl = redis_client.ttl(cache_key)
            return {
                "data": cached_data,
                "cached": True,
                "cache_expires_in": ttl if ttl > 0 else 0
            }
        except Exception as e:
            current_app.logger.error(f"Error parsing cached data: {str(e)}")
    return None

def set_cache_data(cache_key, data):
    """Cache data with TTL"""
    try:
        redis_client.setex(cache_key, CACHE_TTL, json.dumps(data))
    except Exception as e:
        current_app.logger.error(f"Error caching data: {str(e)}")

@nurse_reports_bp.route('/nurse/reports/all', methods=['GET'])
@require_auth
@require_role('nurse')
def get_nurse_reports():
    """
    Consolidated endpoint - returns all nurse/clinic report data in a single optimized request
    Includes: Appointments, record updates (excluding patient health trends)
    """
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        current_user_id = request.current_user.get('id')

        # Build cache key
        filters = {'nurse_id': current_user_id}
        cache_key = get_cache_key('all_reports', filters)
        cached_result = get_cached_data(cache_key, bust_cache)

        if cached_result:
            return jsonify({"status": "success", **cached_result}), 200

        supabase = get_authenticated_client()

        # ===================================================================
        # STEP 1: FACILITY ISOLATION - Get nurse's facility and patients
        # ===================================================================

        # Get nurse's facility
        facility_response = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', current_user_id)\
            .is_('end_date', 'null')\
            .execute()

        if not facility_response.data or len(facility_response.data) == 0:
            return jsonify({
                "status": "error",
                "message": "Nurse not assigned to any facility"
            }), 400

        facility_id = facility_response.data[0]['facility_id']

        # Get facility name
        facility_info_response = supabase.table('healthcare_facilities')\
            .select('facility_name')\
            .eq('facility_id', facility_id)\
            .execute()

        facility_name = facility_info_response.data[0]['facility_name'] if facility_info_response.data else 'N/A'

        # Get accessible patients for this facility
        facility_patients_response = supabase.table('facility_patients')\
            .select('patient_id')\
            .eq('facility_id', facility_id)\
            .eq('is_active', True)\
            .execute()

        patient_ids = [p['patient_id'] for p in facility_patients_response.data] if facility_patients_response.data else []

        if not patient_ids:
            # No patients, return empty data structure
            empty_data = {
                'appointmentRateData': [],
                'recordUpdateFrequencyData': [],
                'recordUpdateTypesData': [],
                'summaryMetrics': {
                    'facilityName': facility_name,
                    'totalPatients': 0,
                    'totalAppointments': 0,
                    'avgCompletionRate': 0,
                    'recordsUpdatedToday': 0,
                    'avgUpdateFrequency': 0
                }
            }
            set_cache_data(cache_key, empty_data)
            return jsonify({"status": "success", "data": empty_data, "cached": False, "cache_expires_in": CACHE_TTL}), 200

        # ===================================================================
        # STEP 2: APPOINTMENT ANALYTICS
        # ===================================================================

        # Get all appointments for this facility
        appointments_response = supabase.table('appointments')\
            .select('appointment_id, appointment_date, status')\
            .eq('facility_id', facility_id)\
            .execute()

        appointments = appointments_response.data or []

        # Group by date
        appointment_by_date = {}
        for apt in appointments:
            date = apt.get('appointment_date', '')[:10]  # Extract YYYY-MM-DD
            status = apt.get('status', 'scheduled')

            if date not in appointment_by_date:
                appointment_by_date[date] = {
                    'date': date,
                    'scheduled': 0,
                    'completed': 0,
                    'cancelled': 0,
                    'noshow': 0
                }

            if status == 'completed':
                appointment_by_date[date]['completed'] += 1
            elif status == 'cancelled':
                appointment_by_date[date]['cancelled'] += 1
            elif status == 'no_show':
                appointment_by_date[date]['noshow'] += 1

            # Count all non-cancelled as scheduled
            if status != 'cancelled':
                appointment_by_date[date]['scheduled'] += 1

        # Calculate completion rates
        appointment_rate_data = []
        for date, data in sorted(appointment_by_date.items()):
            total_non_cancelled = data['scheduled']
            completed = data['completed']
            rate = round((completed / total_non_cancelled * 100), 2) if total_non_cancelled > 0 else 0

            appointment_rate_data.append({
                **data,
                'rate': rate
            })

        # Sort by date and take last 30 days
        appointment_rate_data.sort(key=lambda x: x['date'], reverse=True)
        appointment_rate_data = appointment_rate_data[:30]
        appointment_rate_data.reverse()  # Chronological order

        # ===================================================================
        # STEP 3: RECORD UPDATE FREQUENCY
        # ===================================================================

        # Get recent updates from audit logs
        today = datetime.now().strftime('%Y-%m-%d')
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        month_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # Count updates by timeframe
        daily_updates_response = supabase.table('audit_logs')\
            .select('log_id', count='exact')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', today)\
            .execute()

        weekly_updates_response = supabase.table('audit_logs')\
            .select('log_id', count='exact')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', week_ago)\
            .execute()

        monthly_updates_response = supabase.table('audit_logs')\
            .select('log_id', count='exact')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', month_ago)\
            .execute()

        daily_count = getattr(daily_updates_response, 'count', 0) or 0
        weekly_count = getattr(weekly_updates_response, 'count', 0) or 0
        monthly_count = getattr(monthly_updates_response, 'count', 0) or 0

        record_update_frequency_data = [
            {'category': 'Daily Updates', 'count': daily_count},
            {'category': 'Weekly Updates', 'count': weekly_count},
            {'category': 'Monthly Updates', 'count': monthly_count}
        ]

        # ===================================================================
        # STEP 4: RECORD UPDATE TYPES DISTRIBUTION
        # ===================================================================

        # Get update types from audit logs (last 30 days)
        updates_by_type_response = supabase.table('audit_logs')\
            .select('action_type')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', month_ago)\
            .execute()

        updates_by_type = updates_by_type_response.data or []

        # Count by type
        type_counts = {}
        type_colors = {
            'medical_record': {'name': 'Medical Records', 'color': '#3B82F6'},
            'vital_signs': {'name': 'Vital Signs', 'color': '#10B981'},
            'medication': {'name': 'Medications', 'color': '#F59E0B'},
            'vaccination': {'name': 'Immunizations', 'color': '#8B5CF6'},
            'note': {'name': 'Notes & Observations', 'color': '#EF4444'}
        }

        for update in updates_by_type:
            action_type = update.get('action_type', 'unknown')

            # Map action types to categories
            if 'medical' in action_type.lower() or 'record' in action_type.lower():
                category = 'medical_record'
            elif 'vital' in action_type.lower() or 'measurement' in action_type.lower():
                category = 'vital_signs'
            elif 'medication' in action_type.lower() or 'prescription' in action_type.lower():
                category = 'medication'
            elif 'vaccination' in action_type.lower() or 'vaccine' in action_type.lower():
                category = 'vaccination'
            else:
                category = 'note'

            type_counts[category] = type_counts.get(category, 0) + 1

        record_update_types_data = []
        for type_key, info in type_colors.items():
            count = type_counts.get(type_key, 0)
            record_update_types_data.append({
                'name': info['name'],
                'value': count,
                'color': info['color']
            })

        # ===================================================================
        # STEP 5: SUMMARY METRICS
        # ===================================================================

        total_patients = len(patient_ids)
        total_appointments = len(appointments)

        # Calculate completion rate
        total_completed = sum(1 for apt in appointments if apt.get('status') == 'completed')
        total_non_cancelled = sum(1 for apt in appointments if apt.get('status') != 'cancelled')
        completion_rate = round((total_completed / total_non_cancelled * 100), 2) if total_non_cancelled > 0 else 0

        # Update frequency
        update_frequency = round((daily_count / total_patients * 100), 2) if total_patients > 0 else 0

        summary_metrics = {
            'facilityName': facility_name,
            'totalPatients': total_patients,
            'totalAppointments': total_appointments,
            'avgCompletionRate': completion_rate,
            'recordsUpdatedToday': daily_count,
            'avgUpdateFrequency': update_frequency
        }

        # ===================================================================
        # FINAL RESPONSE
        # ===================================================================

        data = {
            'appointmentRateData': appointment_rate_data,
            'recordUpdateFrequencyData': record_update_frequency_data,
            'recordUpdateTypesData': record_update_types_data,
            'summaryMetrics': summary_metrics
        }

        # Cache the results
        set_cache_data(cache_key, data)

        return jsonify({
            "status": "success",
            "data": data,
            "cached": False,
            "cache_expires_in": CACHE_TTL
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching nurse reports: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500
