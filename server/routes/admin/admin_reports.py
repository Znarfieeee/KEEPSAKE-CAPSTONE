from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase_service_role_client
from datetime import datetime, timedelta
from utils.redis_client import get_redis_client
import json
import hashlib

reports_bp = Blueprint('reports', __name__)
redis_client = get_redis_client()

# Admin routes need service role client to bypass RLS
admin_supabase = supabase_service_role_client()

CACHE_TTL = 300  # 5 minutes

def get_cache_key(report_type, filters):
    """Generate a unique cache key based on report type and filters"""
    filter_str = json.dumps(filters, sort_keys=True)
    filter_hash = hashlib.md5(filter_str.encode()).hexdigest()
    return f"report:{report_type}:{filter_hash}"

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

# ============================================================================
# CONSOLIDATED ENDPOINT - Single route to fetch all report data at once
# This reduces HTTP requests from 5 to 1, improving performance significantly
# ============================================================================

@reports_bp.route('/admin/reports/all', methods=['GET'])
@require_auth
@require_role('admin')
def get_all_reports():
    """Get all report data in a single optimized request - FAST & EFFICIENT"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        role_filter = request.args.get('role')
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        filters = {'start_date': start_date, 'end_date': end_date, 'role': role_filter}
        cache_key = get_cache_key('all_reports', filters)
        cached_result = get_cached_data(cache_key, bust_cache)

        if cached_result:
            return jsonify({"status": "success", **cached_result}), 200

        end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1) if end_date else None

        # Fetch ALL users data (NO DATE FILTERING - we'll filter on frontend)
        # This gives accurate totals and allows frontend filtering without backend calls
        all_users_query = admin_supabase.table('users').select('user_id, created_at, last_sign_in_at, is_active, role')
        users = all_users_query.execute().data or []

        # USER ACTIVITY
        activity_by_date = {}
        for user in users:
            if user.get('created_at'):
                date_str = user['created_at'][:10]
                if date_str not in activity_by_date:
                    activity_by_date[date_str] = {'date': date_str, 'logins': 0, 'registrations': 0, 'active_users': 0}
                activity_by_date[date_str]['registrations'] += 1
                if user.get('is_active'):
                    activity_by_date[date_str]['active_users'] += 1
                if user.get('last_sign_in_at') and user['last_sign_in_at'][:10] == date_str:
                    activity_by_date[date_str]['logins'] += 1
        user_activity = sorted(activity_by_date.values(), key=lambda x: x['date'])

        # FACILITY STATS
        facilities = admin_supabase.table('healthcare_facilities').select('facility_id, facility_name').execute().data or []
        facility_stats = []
        for facility in facilities:
            fid = facility['facility_id']
            patients = admin_supabase.table('facility_patients').select('patient_id', count='exact').eq('facility_id', fid).eq('is_active', True).execute()
            appts_q = admin_supabase.table('appointments').select('appointment_id', count='exact').eq('facility_id', fid)
            if start_date:
                appts_q = appts_q.gte('appointment_date', start_date)
            if end_datetime:
                appts_q = appts_q.lt('appointment_date', end_datetime.strftime('%Y-%m-%d'))
            appts = appts_q.execute()
            staff = admin_supabase.table('facility_users').select('user_id', count='exact').eq('facility_id', fid).execute()
            facility_stats.append({
                'facility': facility['facility_name'],
                'facility_id': fid,
                'patients': getattr(patients, 'count', len(patients.data or [])),
                'appointments': getattr(appts, 'count', len(appts.data or [])),
                'staff': getattr(staff, 'count', len(staff.data or []))
            })

        # SYSTEM USAGE
        audit_q = admin_supabase.table('audit_logs').select('action_type, table_name')
        if start_date:
            audit_q = audit_q.gte('action_timestamp', start_date)
        if end_datetime:
            audit_q = audit_q.lt('action_timestamp', end_datetime.strftime('%Y-%m-%d'))
        logs = audit_q.execute().data or []
        usage = {'Dashboard Views': 0, 'Reports Generated': 0, 'Data Exports': 0, 'User Logins': 0, 'API Calls': len(logs)}
        for log in logs:
            if log.get('action_type') == 'VIEW':
                usage['Dashboard Views'] += 1
        system_usage = [{'category': k, 'value': v} for k, v in usage.items()]

        # USER ROLE DISTRIBUTION
        role_users = admin_supabase.table('users').select('role').execute().data or []
        if role_filter and role_filter != 'all':
            role_users = [u for u in role_users if u.get('role') == role_filter]
        role_counts = {}
        for u in role_users:
            role_display = {'doctor': 'Doctors', 'nurse': 'Nurses', 'admin': 'Admins', 'parent': 'Parents', 'guardian': 'Parents', 'facility_admin': 'Facility Admins', 'staff': 'Staff'}.get(u.get('role', ''), 'Other')
            role_counts[role_display] = role_counts.get(role_display, 0) + 1
        colors = {'Doctors': '#3B82F6', 'Nurses': '#10B981', 'Admins': '#F59E0B', 'Parents': '#8B5CF6', 'Facility Admins': '#EF4444', 'Staff': '#6366F1'}
        user_role_distribution = sorted([{'name': n, 'value': c, 'color': colors.get(n, '#6B7280')} for n, c in role_counts.items()], key=lambda x: x['value'], reverse=True)

        # SUMMARY METRICS - Get ALL data (no filtering)
        # Count ALL users (not filtered by date)
        all_users_count_query = admin_supabase.table('users').select('user_id', count='exact').neq('role', 'admin')
        total_users_response = all_users_count_query.execute()
        total_users = getattr(total_users_response, 'count', len(total_users_response.data or []))

        # Other metrics
        total_appts = admin_supabase.table('appointments').select('appointment_id', count='exact').execute()
        recent_act = admin_supabase.table('users').select('user_id', count='exact').gte('last_sign_in_at', (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')).execute()
        api_calls = admin_supabase.table('audit_logs').select('log_id', count='exact').gte('action_timestamp', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')).execute()
        active_u = admin_supabase.table('users').select('user_id', count='exact').eq('is_active', True).execute()

        summary_metrics = {
            'totalUsers': total_users,  # This is now accurate - counts ALL users
            'activeFacilities': len(facilities),
            'totalAppointments': getattr(total_appts, 'count', len(total_appts.data or [])),
            'systemHealth': round((getattr(active_u, 'count', len(active_u.data or [])) / total_users * 100), 1) if total_users > 0 else 100.0,
            'recentActivity': getattr(recent_act, 'count', len(recent_act.data or [])),
            'apiCalls': getattr(api_calls, 'count', len(api_calls.data or []))
        }

        data = {'userActivity': user_activity, 'facilityStats': facility_stats, 'systemUsage': system_usage, 'userRoleDistribution': user_role_distribution, 'summaryMetrics': summary_metrics}
        set_cache_data(cache_key, data)
        return jsonify({"status": "success", "data": data, "cached": False, "cache_expires_in": CACHE_TTL}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching reports: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@reports_bp.route('/admin/reports/user-activity', methods=['GET'])
@require_auth
@require_role('admin')
def get_user_activity_report():
    """Get user activity analytics - logins, registrations, active users over time"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        facility_id = request.args.get('facility_id')
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Build filter dict for cache key
        filters = {
            'start_date': start_date,
            'end_date': end_date,
            'facility_id': facility_id
        }

        # Check cache
        cache_key = get_cache_key('user_activity', filters)
        cached_result = get_cached_data(cache_key, bust_cache)
        if cached_result:
            return jsonify({
                "status": "success",
                "data": cached_result["data"],
                "cached": cached_result["cached"],
                "cache_expires_in": cached_result["cache_expires_in"]
            }), 200

        # Query users table
        query = admin_supabase.table('users').select('user_id, created_at, last_sign_in_at, is_active, role')

        # Apply date filters
        if start_date:
            query = query.gte('created_at', start_date)
        if end_date:
            # Add one day to include the end_date
            end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.lt('created_at', end_datetime.strftime('%Y-%m-%d'))

        response = query.execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch user activity: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch user activity data"
            }), 500

        users = response.data or []

        # Group by date and calculate metrics
        activity_by_date = {}

        for user in users:
            if user.get('created_at'):
                date_str = user['created_at'][:10]  # Extract YYYY-MM-DD

                if date_str not in activity_by_date:
                    activity_by_date[date_str] = {
                        'date': date_str,
                        'logins': 0,
                        'registrations': 0,
                        'active_users': 0
                    }

                # Count registrations (users created on this date)
                activity_by_date[date_str]['registrations'] += 1

                # Count active users
                if user.get('is_active'):
                    activity_by_date[date_str]['active_users'] += 1

                # Count logins (users who signed in on this date)
                if user.get('last_sign_in_at'):
                    login_date = user['last_sign_in_at'][:10]
                    if login_date == date_str:
                        activity_by_date[date_str]['logins'] += 1

        # Convert to list and sort by date
        data = sorted(activity_by_date.values(), key=lambda x: x['date'])

        # Cache the results
        set_cache_data(cache_key, data)

        return jsonify({
            "status": "success",
            "data": data,
            "cached": False,
            "cache_expires_in": CACHE_TTL
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching user activity report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500

@reports_bp.route('/admin/reports/facility-stats', methods=['GET'])
@require_auth
@require_role('admin')
def get_facility_stats_report():
    """Get facility performance metrics - patient counts, appointments, staff"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        facility_ids = request.args.getlist('facility_ids[]')
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Build filter dict for cache key
        filters = {
            'start_date': start_date,
            'end_date': end_date,
            'facility_ids': sorted(facility_ids) if facility_ids else None
        }

        # Check cache
        cache_key = get_cache_key('facility_stats', filters)
        cached_result = get_cached_data(cache_key, bust_cache)
        if cached_result:
            return jsonify({
                "status": "success",
                "data": cached_result["data"],
                "cached": cached_result["cached"],
                "cache_expires_in": cached_result["cache_expires_in"]
            }), 200

        # Get facilities
        facilities_query = admin_supabase.table('healthcare_facilities').select('facility_id, facility_name')

        if facility_ids:
            facilities_query = facilities_query.in_('facility_id', facility_ids)

        facilities_response = facilities_query.execute()
        facilities = facilities_response.data or []

        # Get stats for each facility
        data = []

        for facility in facilities:
            facility_id = facility['facility_id']

            # Count patients for this facility
            patients_query = admin_supabase.table('facility_patients').select('patient_id', count='exact').eq('facility_id', facility_id).eq('is_active', True)
            patients_response = patients_query.execute()
            patient_count = patients_response.count if hasattr(patients_response, 'count') else len(patients_response.data or [])

            # Count appointments for this facility
            appointments_query = admin_supabase.table('appointments').select('appointment_id', count='exact').eq('facility_id', facility_id)

            if start_date:
                appointments_query = appointments_query.gte('appointment_date', start_date)
            if end_date:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                appointments_query = appointments_query.lt('appointment_date', end_datetime.strftime('%Y-%m-%d'))

            appointments_response = appointments_query.execute()
            appointment_count = appointments_response.count if hasattr(appointments_response, 'count') else len(appointments_response.data or [])

            # Count staff for this facility
            staff_query = admin_supabase.table('facility_users').select('user_id', count='exact').eq('facility_id', facility_id)
            staff_response = staff_query.execute()
            staff_count = staff_response.count if hasattr(staff_response, 'count') else len(staff_response.data or [])

            data.append({
                'facility': facility['facility_name'],
                'facility_id': facility_id,
                'patients': patient_count,
                'appointments': appointment_count,
                'staff': staff_count
            })

        # Cache the results
        set_cache_data(cache_key, data)

        return jsonify({
            "status": "success",
            "data": data,
            "cached": False,
            "cache_expires_in": CACHE_TTL
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching facility stats report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500

@reports_bp.route('/admin/reports/system-usage', methods=['GET'])
@require_auth
@require_role('admin')
def get_system_usage_report():
    """Get system usage analytics - dashboard views, exports, API calls"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Build filter dict for cache key
        filters = {
            'start_date': start_date,
            'end_date': end_date
        }

        # Check cache
        cache_key = get_cache_key('system_usage', filters)
        cached_result = get_cached_data(cache_key, bust_cache)
        if cached_result:
            return jsonify({
                "status": "success",
                "data": cached_result["data"],
                "cached": cached_result["cached"],
                "cache_expires_in": cached_result["cache_expires_in"]
            }), 200

        # Query audit logs for system usage
        query = admin_supabase.table('audit_logs').select('action_type, table_name, action_timestamp')

        # Apply date filters
        if start_date:
            query = query.gte('action_timestamp', start_date)
        if end_date:
            end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.lt('action_timestamp', end_datetime.strftime('%Y-%m-%d'))

        response = query.execute()
        audit_logs = response.data or []

        # Aggregate by category
        usage_stats = {
            'Dashboard Views': 0,
            'Reports Generated': 0,
            'Data Exports': 0,
            'User Logins': 0,
            'API Calls': len(audit_logs)
        }

        for log in audit_logs:
            action_type = log.get('action_type', '')
            table_name = log.get('table_name', '')

            # Categorize based on action type and table
            if action_type == 'VIEW':
                usage_stats['Dashboard Views'] += 1
            elif action_type == 'CREATE' and 'report' in table_name.lower():
                usage_stats['Reports Generated'] += 1
            elif 'export' in table_name.lower():
                usage_stats['Data Exports'] += 1

        # Convert to list format for charts
        data = [
            {'category': key, 'value': value}
            for key, value in usage_stats.items()
        ]

        # Cache the results
        set_cache_data(cache_key, data)

        return jsonify({
            "status": "success",
            "data": data,
            "cached": False,
            "cache_expires_in": CACHE_TTL
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching system usage report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500

@reports_bp.route('/admin/reports/user-role-distribution', methods=['GET'])
@require_auth
@require_role('admin')
def get_user_role_distribution():
    """Get user counts by role with subscription status"""
    try:
        # Get query parameters
        facility_id = request.args.get('facility_id')
        is_active = request.args.get('is_active')
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Build filter dict for cache key
        filters = {
            'facility_id': facility_id,
            'is_active': is_active
        }

        # Check cache
        cache_key = get_cache_key('user_role_distribution', filters)
        cached_result = get_cached_data(cache_key, bust_cache)
        if cached_result:
            return jsonify({
                "status": "success",
                "data": cached_result["data"],
                "cached": cached_result["cached"],
                "cache_expires_in": cached_result["cache_expires_in"]
            }), 200

        # Query users
        query = admin_supabase.table('users').select('role, is_active, is_subscribed')

        # Apply filters
        if is_active is not None:
            active_bool = is_active.lower() == 'true'
            query = query.eq('is_active', active_bool)

        response = query.execute()
        users = response.data or []

        # Count by role
        role_counts = {}

        for user in users:
            role = user.get('role', 'unknown')

            # Map role names to display names
            role_display = {
                'doctor': 'Doctors',
                'nurse': 'Nurses',
                'admin': 'Admins',
                'parent': 'Parents',
                'guardian': 'Parents',  # Group guardians with parents
                'facility_admin': 'Facility Admins',
                'staff': 'Staff'
            }.get(role, role.title())

            if role_display not in role_counts:
                role_counts[role_display] = 0

            role_counts[role_display] += 1

        # Color mapping for pie chart
        color_map = {
            'Doctors': '#3B82F6',
            'Nurses': '#10B981',
            'Admins': '#F59E0B',
            'Parents': '#8B5CF6',
            'Facility Admins': '#EF4444',
            'Staff': '#6366F1'
        }

        # Convert to list format
        data = [
            {
                'name': name,
                'value': count,
                'color': color_map.get(name, '#6B7280')
            }
            for name, count in role_counts.items()
        ]

        # Sort by value descending
        data.sort(key=lambda x: x['value'], reverse=True)

        # Cache the results
        set_cache_data(cache_key, data)

        return jsonify({
            "status": "success",
            "data": data,
            "cached": False,
            "cache_expires_in": CACHE_TTL
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching user role distribution: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500

@reports_bp.route('/admin/reports/summary-metrics', methods=['GET'])
@require_auth
@require_role('admin')
def get_summary_metrics():
    """Get high-level KPI metrics for dashboard stat boxes"""
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Check cache
        cache_key = get_cache_key('summary_metrics', {})
        cached_result = get_cached_data(cache_key, bust_cache)
        if cached_result:
            return jsonify({
                "status": "success",
                "data": cached_result["data"],
                "cached": cached_result["cached"],
                "cache_expires_in": cached_result["cache_expires_in"]
            }), 200

        # Get total users (excluding admin role)
        users_response = admin_supabase.table('users').select('user_id', count='exact').neq('role', 'admin').execute()
        total_users = users_response.count if hasattr(users_response, 'count') else len(users_response.data or [])

        # Get active facilities
        facilities_response = admin_supabase.table('healthcare_facilities').select('facility_id', count='exact').eq('subscription_status', 'active').execute()
        active_facilities = facilities_response.count if hasattr(facilities_response, 'count') else len(facilities_response.data or [])

        # Get total appointments
        appointments_response = admin_supabase.table('appointments').select('appointment_id', count='exact').execute()
        total_appointments = appointments_response.count if hasattr(appointments_response, 'count') else len(appointments_response.data or [])

        # Get recent activity (users signed in in last 7 days)
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        recent_activity_response = admin_supabase.table('users').select('user_id', count='exact').gte('last_sign_in_at', seven_days_ago).execute()
        recent_activity = recent_activity_response.count if hasattr(recent_activity_response, 'count') else len(recent_activity_response.data or [])

        # Get API calls (audit log entries in last 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        api_calls_response = admin_supabase.table('audit_logs').select('log_id', count='exact').gte('action_timestamp', thirty_days_ago).execute()
        api_calls = api_calls_response.count if hasattr(api_calls_response, 'count') else len(api_calls_response.data or [])

        # Calculate system health (percentage of active users)
        active_users_response = admin_supabase.table('users').select('user_id', count='exact').eq('is_active', True).execute()
        active_users = active_users_response.count if hasattr(active_users_response, 'count') else len(active_users_response.data or [])
        system_health = round((active_users / total_users * 100), 1) if total_users > 0 else 100.0

        data = {
            'totalUsers': total_users,
            'activeFacilities': active_facilities,
            'totalAppointments': total_appointments,
            'systemHealth': system_health,
            'recentActivity': recent_activity,
            'apiCalls': api_calls
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
        current_app.logger.error(f"Error fetching summary metrics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500
