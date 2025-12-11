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

def get_supabase_infrastructure_health():
    """
    Get Supabase infrastructure health metrics
    Uses comprehensive database health monitoring
    """
    try:
        from utils.database_health import get_comprehensive_database_health

        # Get comprehensive health data
        health_data = get_comprehensive_database_health()

        # Extract infrastructure health from the comprehensive data
        infrastructure_health = health_data.get('infrastructure_health', {
            'database': 0.0,
            'auth': 0.0,
            'storage': 0.0,
            'realtime': 0.0,
            'edge_functions': 0.0,
            'overall': 0.0,
            'issues': []
        })

        # Log additional metrics for debugging
        db_metrics = health_data.get('database_metrics', {})
        current_app.logger.info(
            f"Reports Database Health: response_time={db_metrics.get('response_time_ms')}ms, "
            f"avg_query_time={db_metrics.get('avg_query_time_ms')}ms, "
            f"health_score={infrastructure_health.get('overall')}%"
        )

        return infrastructure_health

    except Exception as e:
        current_app.logger.error(f"Error getting infrastructure health: {str(e)}")
        return {
            'database': 0.0,
            'auth': 0.0,
            'storage': 0.0,
            'realtime': 0.0,
            'edge_functions': 0.0,
            'overall': 0.0,
            'issues': [{
                'service': 'system',
                'severity': 'critical',
                'message': f'Unable to retrieve infrastructure health: {str(e)}'
            }]
        }

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
# HELPER FUNCTIONS FOR REPORT CALCULATIONS
# ============================================================================

def get_current_year_month():
    """Get current year and month"""
    now = datetime.now()
    return now.year, now.month

def calculate_monthly_active_users(year, month):
    """
    Calculate Monthly Active Users (MAU) for a specific month
    Reuses existing get_mau_by_week RPC function from dashboard
    Returns MAU data with weekly breakdown and growth metrics
    """
    try:
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        # Get current month's data using RPC
        current_result = admin_supabase.rpc('get_mau_by_week', {
            'p_year': year,
            'p_month': month,
            'p_source': 'sessions'
        }).execute()

        # Get previous month's data for growth calculation
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1

        prev_result = admin_supabase.rpc('get_mau_by_week', {
            'p_year': prev_year,
            'p_month': prev_month,
            'p_source': 'sessions'
        }).execute()

        # Parse current month data
        if not current_result or not current_result.data:
            return None

        current_weeks = current_result.data.get('weeks', {})
        total_mau = sum(current_weeks.values())

        # Build weekly breakdown with month labels
        weekly_breakdown = [
            {
                "week": f"{month_names[month - 1]} W{week}",
                "count": count
            }
            for week, count in sorted(current_weeks.items(), key=lambda x: int(x[0]))
        ]

        # Calculate growth vs previous month
        prev_weeks = prev_result.data.get('weeks', {}) if prev_result and prev_result.data else {}
        prev_total = sum(prev_weeks.values())

        if prev_total > 0:
            growth = round(((total_mau - prev_total) / prev_total) * 100, 1)
        else:
            growth = 0.0

        # PERFORMANCE: Skip historical months to speed up loading (reduced from 5 RPC calls to 2)
        # Historical trend removed for better UX - focus on current month data

        current_app.logger.info(f"MAU calculation complete: {total_mau} for {year}-{month}")

        return {
            "currentMonth": {
                "year": year,
                "month": month,
                "total": total_mau,
                "weeklyBreakdown": weekly_breakdown,
                "growth": growth
            }
        }

    except Exception as e:
        current_app.logger.error(f"Error calculating MAU: {str(e)}")
        return None

def calculate_user_activity_metrics(user_activity, users_data):
    """Calculate metrics specific to user activity report"""
    try:
        current_app.logger.info(f"Calculating user activity metrics: {len(user_activity)} activity records, {len(users_data)} users")

        if not user_activity or len(user_activity) == 0:
            current_app.logger.warning("No user activity data available")
            return {
                "totalLogins": 0,
                "totalRegistrations": 0,
                "avgDailyActive": 0,
                "peakActivityDate": "N/A",
                "activeUsersChange": 0
            }

        total_logins = sum(day.get('logins', 0) for day in user_activity)
        total_registrations = sum(day.get('registrations', 0) for day in user_activity)
        total_active = sum(day.get('active_users', 0) for day in user_activity)
        avg_daily_active = round(total_active / len(user_activity), 1) if user_activity else 0

        # Find peak activity date (most logins)
        peak_activity = max(user_activity, key=lambda x: x.get('logins', 0)) if user_activity else {}
        peak_date = peak_activity.get('date', 'N/A')

        # Calculate active users in last 7 days vs previous 7 days for change %
        now = datetime.now()
        seven_days_ago = (now - timedelta(days=7)).strftime('%Y-%m-%d')
        fourteen_days_ago = (now - timedelta(days=14)).strftime('%Y-%m-%d')

        recent_active = sum(1 for u in users_data if u.get('last_sign_in_at', '') and u.get('last_sign_in_at', '') >= seven_days_ago)
        previous_active = sum(1 for u in users_data
                             if u.get('last_sign_in_at', '') and fourteen_days_ago <= u.get('last_sign_in_at', '') < seven_days_ago)

        if previous_active > 0:
            active_change = round(((recent_active - previous_active) / previous_active) * 100, 1)
        else:
            active_change = 0.0

        result = {
            "totalLogins": total_logins,
            "totalRegistrations": total_registrations,
            "avgDailyActive": avg_daily_active,
            "peakActivityDate": peak_date,
            "activeUsersChange": active_change
        }

        current_app.logger.info(f"User activity metrics: {result}")
        return result

    except Exception as e:
        current_app.logger.error(f"Error calculating user activity metrics: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return {"totalLogins": 0, "totalRegistrations": 0, "avgDailyActive": 0,
                "peakActivityDate": "N/A", "activeUsersChange": 0}

def calculate_facility_metrics(facility_stats):
    """Calculate metrics specific to facility performance report"""
    try:
        current_app.logger.info(f"Calculating facility metrics: {len(facility_stats)} facilities")

        if not facility_stats or len(facility_stats) == 0:
            current_app.logger.warning("No facility stats available")
            return {
                "totalPatients": 0,
                "totalAppointments": 0,
                "avgPatientsPerFacility": 0,
                "topPerformingFacility": "N/A"
            }

        total_patients = sum(f.get('patients', 0) for f in facility_stats)
        total_appointments = sum(f.get('appointments', 0) for f in facility_stats)
        avg_patients = round(total_patients / len(facility_stats), 1) if facility_stats else 0

        # Find top performing facility by appointments
        top_facility = max(facility_stats, key=lambda x: x.get('appointments', 0)) if facility_stats else {}
        top_name = top_facility.get('facility', 'N/A')

        result = {
            "totalPatients": total_patients,
            "totalAppointments": total_appointments,
            "avgPatientsPerFacility": avg_patients,
            "topPerformingFacility": top_name
        }

        current_app.logger.info(f"Facility metrics: {result}")
        return result

    except Exception as e:
        current_app.logger.error(f"Error calculating facility metrics: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return {"totalPatients": 0, "totalAppointments": 0,
                "avgPatientsPerFacility": 0, "topPerformingFacility": "N/A"}

def calculate_system_metrics(system_usage, all_logs_count=0):
    """Calculate metrics specific to system usage report"""
    try:
        current_app.logger.info(f"Calculating system metrics: {len(system_usage) if system_usage else 0} usage items, {all_logs_count} logs")

        if not system_usage or len(system_usage) == 0:
            current_app.logger.warning("No system usage data available")
            return {
                "totalApiCalls": 0,
                "mostCommonAction": "N/A",
                "avgCallsPerHour": 0,
                "systemLoad": "Low"
            }

        # Find most common action category
        most_common = max(system_usage, key=lambda x: x.get('value', 0)) if system_usage else {}
        most_common_action = most_common.get('category', 'N/A')

        total_calls = all_logs_count if all_logs_count > 0 else sum(item.get('value', 0) for item in system_usage)

        # Calculate avg calls per hour (assuming 24 hour period)
        avg_per_hour = round(total_calls / 24, 1)

        # Determine system load level
        if avg_per_hour > 100:
            system_load = "High"
        elif avg_per_hour > 50:
            system_load = "Medium"
        else:
            system_load = "Low"

        result = {
            "totalApiCalls": total_calls,
            "mostCommonAction": most_common_action,
            "avgCallsPerHour": avg_per_hour,
            "systemLoad": system_load
        }

        current_app.logger.info(f"System metrics: {result}")
        return result

    except Exception as e:
        current_app.logger.error(f"Error calculating system metrics: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return {"totalApiCalls": 0, "mostCommonAction": "N/A",
                "avgCallsPerHour": 0, "systemLoad": "Low"}

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
        selected_month = request.args.get('selected_month')  # Format: 'YYYY-MM'

        filters = {'start_date': start_date, 'end_date': end_date, 'role': role_filter, 'selected_month': selected_month}
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

        # Track registrations and active users by creation date
        for user in users:
            if user.get('created_at'):
                date_str = user['created_at'][:10]
                if date_str not in activity_by_date:
                    activity_by_date[date_str] = {'date': date_str, 'logins': 0, 'registrations': 0, 'active_users': 0}
                activity_by_date[date_str]['registrations'] += 1
                if user.get('is_active'):
                    activity_by_date[date_str]['active_users'] += 1

        # Track logins separately by last_sign_in_at date (FIXED!)
        for user in users:
            if user.get('last_sign_in_at'):
                login_date = user['last_sign_in_at'][:10]
                if login_date not in activity_by_date:
                    activity_by_date[login_date] = {'date': login_date, 'logins': 0, 'registrations': 0, 'active_users': 0}
                activity_by_date[login_date]['logins'] += 1

        user_activity = sorted(activity_by_date.values(), key=lambda x: x['date'])

        current_app.logger.info(f"User activity calculated: {len(user_activity)} days of activity, total logins across all days: {sum(d['logins'] for d in user_activity)}")

        # FACILITY STATS - OPTIMIZED with batched queries
        # Performance improvement: 3n queries → 3 queries (where n = number of facilities)
        facilities = admin_supabase.table('healthcare_facilities').select('facility_id, facility_name').execute().data or []
        facility_ids = [f['facility_id'] for f in facilities]

        if facility_ids:
            # Batch query 1: All patients grouped by facility
            patients_result = admin_supabase.rpc('count_patients_by_facility', {
                'facility_ids': facility_ids
            }).execute()
            patients_by_fid = {row['facility_id']: row['count'] for row in (patients_result.data or [])}

            # Batch query 2: All appointments grouped by facility (with optional date filtering)
            appts_result = admin_supabase.rpc('count_appointments_by_facility', {
                'facility_ids': facility_ids,
                'start_date': start_date,
                'end_date': end_datetime.strftime('%Y-%m-%d') if end_datetime else None
            }).execute()
            appts_by_fid = {row['facility_id']: row['count'] for row in (appts_result.data or [])}

            # Batch query 3: All staff grouped by facility
            staff_result = admin_supabase.rpc('count_staff_by_facility', {
                'facility_ids': facility_ids
            }).execute()
            staff_by_fid = {row['facility_id']: row['count'] for row in (staff_result.data or [])}

            # Build facility stats from aggregated data
            facility_stats = []
            for facility in facilities:
                fid = facility['facility_id']
                facility_stats.append({
                    'facility': facility['facility_name'],
                    'facility_id': fid,
                    'patients': patients_by_fid.get(fid, 0),
                    'appointments': appts_by_fid.get(fid, 0),
                    'staff': staff_by_fid.get(fid, 0)
                })
        else:
            facility_stats = []

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

        # SUMMARY METRICS - Get ALL data (no filtering) - MATCH DASHBOARD CALCULATION EXACTLY
        # Get ALL users (including admin role - match dashboard)
        all_users_response = admin_supabase.table('users').select('user_id, is_active').execute()
        all_users_data = all_users_response.data or []
        total_users = len(all_users_data)
        active_users_count = len([u for u in all_users_data if u.get('is_active')])

        # Get ALL facilities (match dashboard)
        all_facilities_response = admin_supabase.table('healthcare_facilities').select('facility_id, deleted_at').execute()
        all_facilities_data = all_facilities_response.data or []
        total_facilities_count = len(all_facilities_data)
        active_facilities_count = len([f for f in all_facilities_data if not f.get('deleted_at')])

        # Other metrics
        total_appts = admin_supabase.table('appointments').select('appointment_id', count='exact').execute()
        recent_act = admin_supabase.table('users').select('user_id', count='exact').gte('last_sign_in_at', (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')).execute()
        api_calls = admin_supabase.table('audit_logs').select('log_id', count='exact').gte('action_timestamp', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')).execute()

        # Get Supabase infrastructure health
        infrastructure_health = get_supabase_infrastructure_health()

        current_app.logger.info(f"All Reports Infrastructure Health: {infrastructure_health}")

        # Calculate system health: combined business metrics (40%) + infrastructure health (60%)
        # 20% from user activity + 20% from facility activity + 60% from infrastructure
        # MATCH DASHBOARD CALCULATION EXACTLY
        user_health = (active_users_count / total_users * 20) if total_users > 0 else 0
        facility_health = (active_facilities_count / total_facilities_count * 20) if total_facilities_count > 0 else 0
        infrastructure_score = (infrastructure_health['overall'] * 0.6)
        system_health = round(user_health + facility_health + infrastructure_score, 1)

        current_app.logger.info(f"All Reports System Health: user_health={user_health}, facility_health={facility_health}, infrastructure_score={infrastructure_score}, total={system_health}")

        summary_metrics = {
            'totalUsers': total_users,  # ALL users including admin
            'activeFacilities': active_facilities_count,  # Non-deleted facilities
            'totalAppointments': getattr(total_appts, 'count', len(total_appts.data or [])),
            'systemHealth': system_health,  # Matches dashboard calculation
            'infrastructureHealth': infrastructure_health,  # Include infrastructure health
            'recentActivity': getattr(recent_act, 'count', len(recent_act.data or [])),
            'apiCalls': getattr(api_calls, 'count', len(api_calls.data or []))
        }

        # Calculate report-specific metrics
        current_app.logger.info(f"=== Starting Metric Calculations ===")
        current_app.logger.info(f"Input data: {len(user_activity)} user activity days, {len(users)} users, {len(facility_stats)} facilities, {len(system_usage)} system usage items")

        user_activity_metrics = calculate_user_activity_metrics(user_activity, users)
        current_app.logger.info(f"User activity metrics calculated: {user_activity_metrics}")

        facility_metrics = calculate_facility_metrics(facility_stats)
        current_app.logger.info(f"Facility metrics calculated: {facility_metrics}")

        system_metrics = calculate_system_metrics(system_usage, len(logs))
        current_app.logger.info(f"System metrics calculated: {system_metrics}")

        # Calculate Monthly Active Users (MAU) if selected_month provided
        monthly_active_users = None
        try:
            if selected_month:
                try:
                    year, month = map(int, selected_month.split('-'))
                    current_app.logger.info(f"Calculating MAU for selected month: {year}-{month}")
                    monthly_active_users = calculate_monthly_active_users(year, month)
                except ValueError as ve:
                    current_app.logger.warning(f"Invalid selected_month format: {selected_month}, error: {str(ve)}")
            else:
                # Default to current month
                current_year, current_month = get_current_year_month()
                current_app.logger.info(f"Calculating MAU for current month: {current_year}-{current_month}")
                monthly_active_users = calculate_monthly_active_users(current_year, current_month)

            if monthly_active_users:
                current_app.logger.info(f"MAU calculation successful: {monthly_active_users.get('total', 0)} users")
            else:
                current_app.logger.warning("MAU calculation returned None")
        except Exception as mau_error:
            current_app.logger.error(f"Error in MAU calculation wrapper: {str(mau_error)}")
            import traceback
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")

        data = {
            'userActivity': user_activity,
            'facilityStats': facility_stats,
            'systemUsage': system_usage,
            'userRoleDistribution': user_role_distribution,
            'summaryMetrics': summary_metrics,
            'userActivityMetrics': user_activity_metrics,
            'facilityMetrics': facility_metrics,
            'systemMetrics': system_metrics,
            'monthlyActiveUsers': monthly_active_users
        }

        # Final verification log
        current_app.logger.info(f"=== Final Response Data ===")
        current_app.logger.info(f"userActivityMetrics keys: {list(user_activity_metrics.keys())}")
        current_app.logger.info(f"facilityMetrics keys: {list(facility_metrics.keys())}")
        current_app.logger.info(f"systemMetrics keys: {list(system_metrics.keys())}")
        current_app.logger.info(f"MAU data present: {monthly_active_users is not None}")

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

        # Get ALL facilities data (to match dashboard logic)
        all_facilities_response = admin_supabase.table('healthcare_facilities').select('facility_id, deleted_at').execute()
        all_facilities = all_facilities_response.data or []

        # Count non-deleted facilities (active facilities)
        active_facilities = len([f for f in all_facilities if not f.get('deleted_at')])
        total_facilities = len(all_facilities)

        # Get ALL users (to match dashboard logic - includes admin role)
        users_response = admin_supabase.table('users').select('user_id, is_active').execute()
        all_users = users_response.data or []

        # Count active users
        active_users = len([u for u in all_users if u.get('is_active')])
        total_users = len(all_users)

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

        # Get Supabase infrastructure health
        infrastructure_health = get_supabase_infrastructure_health()

        current_app.logger.info(f"Reports Infrastructure Health: {infrastructure_health}")

        # Calculate system health: combined business metrics (40%) + infrastructure health (60%)
        # 20% from user activity + 20% from facility activity + 60% from infrastructure
        # Match dashboard calculation exactly
        user_health = (active_users / total_users * 20) if total_users > 0 else 0
        facility_health = (active_facilities / total_facilities * 20) if total_facilities > 0 else 0
        infrastructure_score = (infrastructure_health['overall'] * 0.6)
        system_health = round(user_health + facility_health + infrastructure_score, 1)

        current_app.logger.info(f"Reports System Health Calculation: user_health={user_health}, facility_health={facility_health}, infrastructure_score={infrastructure_score}, total={system_health}")

        data = {
            'totalUsers': total_users,
            'activeFacilities': active_facilities,
            'totalAppointments': total_appointments,
            'systemHealth': system_health,
            'infrastructureHealth': infrastructure_health,
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
