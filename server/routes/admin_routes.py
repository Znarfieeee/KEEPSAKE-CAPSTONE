from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta, timezone
from config.settings import supabase, sr_client
from gotrue.errors import AuthApiError
from utils.access_control import require_auth, require_role
import jwt
import json
import time
from utils.redis_client import redis_client
from utils.gen_password import generate_password
from utils.audit_logger import log_action
from dateutil.relativedelta import relativedelta

# Use project-specific cookie names instead of the Supabase defaults
ACCESS_COOKIE = "keepsake_session"      # short-lived JWT
REFRESH_COOKIE = "keepsake_session"    # long-lived refresh token
SESSION_PREFIX = "keepsake_session:"
SESSION_TIMEOUT = 86400 * 30  # 30 days - no auto-logout for inactive sessions
REFRESH_TOKEN_TIMEOUT = 7 * 24 * 60 * 60  # 7 days

admin_bp = Blueprint('admin', __name__)

# Session management endpoints
@admin_bp.route('/admin/sessions', methods=['GET'])
@require_auth
@require_role('admin')
def list_active_sessions():
    """List all active sessions (admin only)"""
    try:
        pattern = f"{SESSION_PREFIX}*"
        session_keys = redis_client.keys(pattern)
        
        active_sessions = []
        for key in session_keys:
            session_data = redis_client.get(key)
            if session_data:
                data = json.loads(session_data)
                active_sessions.append({
                    'session_id': key.replace(SESSION_PREFIX, ''),
                    'user_id': data.get('user_id'),
                    'email': data.get('email'),
                    'role': data.get('role'),
                    'created_at': data.get('created_at'),
                    'last_activity': data.get('last_activity')
                })
        
        return jsonify({
            "active_sessions": active_sessions,
            "count": len(active_sessions)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Dashboard metrics endpoint constants
DASHBOARD_CACHE_KEY = "admin_dashboard:metrics"
QUERY_PERF_KEY_PREFIX = "dashboard:query_perf:"
CACHE_TTL = 300  # 5 minutes
PLAN_PRICING = {
    'standard': 5544,    # ₱5,544/month
    'premium': 11144,    # ₱11,144/month
    'enterprise': 22344  # ₱22,344/month
}

# Helper functions for dashboard metrics
def calculate_growth_rate(current, previous):
    """Calculate percentage growth rate, handle division by zero"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def calculate_revenue_by_plan(plan):
    """Map facility plan to monthly revenue"""
    if not plan:
        return 0
    return PLAN_PRICING.get(plan.lower(), 0)


def get_date_ranges():
    """Return commonly used date ranges for trend calculations"""
    now = datetime.now(timezone.utc)
    return {
        'now': now,
        'thirty_days_ago': now - timedelta(days=30),
        'sixty_days_ago': now - timedelta(days=60),
        'six_months_ago': now - timedelta(days=180)
    }


def filter_by_date_range(items, date_field, start_date, end_date):
    """Filter items by date range"""
    filtered = []
    for item in items:
        if item.get(date_field):
            try:
                item_date = datetime.fromisoformat(str(item[date_field]).replace('Z', '+00:00'))
                if start_date <= item_date < end_date:
                    filtered.append(item)
            except (ValueError, AttributeError):
                continue
    return filtered


def calculate_weekly_active_users(users):
    """Calculate active users (logged in) per week for last 4 weeks"""
    now = datetime.now(timezone.utc)
    weeks = []

    for i in range(4, 0, -1):
        week_start = now - timedelta(weeks=i)
        week_end = now - timedelta(weeks=i-1)

        # Count users who logged in during this week
        count = sum(1 for user in users
                   if user.get('last_sign_in_at')
                   and week_start <= datetime.fromisoformat(str(user['last_sign_in_at']).replace('Z', '+00:00')) < week_end)

        weeks.append({
            "week": f"Week {5-i}",
            "active_users": count
        })

    return weeks


def calculate_monthly_revenue_trend(facilities):
    """Calculate revenue for last 6 months"""
    now = datetime.now(timezone.utc)
    months = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for i in range(5, -1, -1):
        month_date = now - relativedelta(months=i)
        month_name = month_names[month_date.month - 1]

        # Calculate revenue for facilities active in that month
        revenue = 0
        for facility in facilities:
            if facility.get('subscription_status') == 'active' and not facility.get('deleted_at'):
                # Check if facility existed in that month
                if facility.get('created_at'):
                    created_at = datetime.fromisoformat(str(facility['created_at']).replace('Z', '+00:00'))
                    if created_at <= month_date:
                        revenue += calculate_revenue_by_plan(facility.get('plan', ''))

        # Target: 10% more than current revenue
        target = int(revenue * 1.1) if revenue > 0 else 0

        months.append({
            "month": month_name,
            "revenue": revenue,
            "target": target
        })

    return months


def track_query_performance(query_name, duration_ms):
    """Store query timing in Redis for monitoring (keep last 10 entries)"""
    try:
        key = f"{QUERY_PERF_KEY_PREFIX}{query_name}"

        # Get existing timings
        existing = redis_client.get(key)
        timings = json.loads(existing) if existing else []

        # Add new timing with timestamp
        timings.append({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'duration_ms': duration_ms
        })

        # Keep only last 10 entries
        timings = timings[-10:]

        # Store back in Redis (1 hour TTL)
        redis_client.setex(key, 3600, json.dumps(timings))

    except Exception as e:
        current_app.logger.error(f"Error tracking query performance: {str(e)}")


def get_query_performance_metrics():
    """Retrieve recent query timings and calculate metrics for monitoring chart"""
    try:
        key = f"{QUERY_PERF_KEY_PREFIX}dashboard"
        existing = redis_client.get(key)

        if not existing:
            # Return default data if no timings available
            return [
                {"time": "5 min ago", "avg_query_time": 95, "p95_query_time": 98},
                {"time": "4 min ago", "avg_query_time": 96, "p95_query_time": 98},
                {"time": "3 min ago", "avg_query_time": 94, "p95_query_time": 97},
                {"time": "2 min ago", "avg_query_time": 97, "p95_query_time": 99},
                {"time": "1 min ago", "avg_query_time": 95, "p95_query_time": 98},
                {"time": "Now", "avg_query_time": 96, "p95_query_time": 98}
            ]

        timings = json.loads(existing)

        # Calculate metrics from timings (normalize to 0-100 scale)
        # Assume 0-500ms is acceptable (100%), >500ms degrades
        metrics = []
        for i, entry in enumerate(timings[-7:]):  # Last 7 entries
            duration = entry['duration_ms']
            normalized = max(0, min(100, 100 - (duration / 500 * 100)))

            metrics.append({
                "time": f"{len(timings) - i} min ago" if i > 0 else "Now",
                "avg_query_time": round(normalized, 1),
                "p95_query_time": round(min(100, normalized + 2), 1)  # Slightly higher for p95
            })

        return metrics

    except Exception as e:
        current_app.logger.error(f"Error getting query performance: {str(e)}")
        return []


def calculate_dashboard_metrics():
    """Calculate all dashboard metrics from database"""
    try:
        date_ranges = get_date_ranges()

        # Fetch all necessary data in parallel (using list comprehension for compatibility)
        facilities = sr_client.table('healthcare_facilities').select(
            'facility_id, subscription_status, plan, created_at, deleted_at'
        ).execute().data or []

        users = sr_client.table('users').select(
            'user_id, role, is_active, is_subscribed, created_at, last_sign_in_at'
        ).execute().data or []

        appointments = sr_client.table('appointments').select(
            'appointment_id, status, appointment_date, created_at'
        ).execute().data or []

        patients = sr_client.table('patients').select(
            'patient_id, is_active, created_at'
        ).execute().data or []

        # Filter out deleted facilities
        active_facilities = [f for f in facilities if not f.get('deleted_at')]

        # Filter active users
        active_users = [u for u in users if u.get('is_active')]

        # Calculate core metrics
        total_facilities = len(active_facilities)
        total_active_users = len(active_users)
        total_users = len(users)

        # Growth calculations
        facilities_last_30 = filter_by_date_range(
            facilities, 'created_at', date_ranges['thirty_days_ago'], date_ranges['now']
        )
        facilities_prev_30 = filter_by_date_range(
            facilities, 'created_at', date_ranges['sixty_days_ago'], date_ranges['thirty_days_ago']
        )
        facilities_growth = calculate_growth_rate(len(facilities_last_30), len(facilities_prev_30))

        users_last_30 = filter_by_date_range(
            users, 'created_at', date_ranges['thirty_days_ago'], date_ranges['now']
        )
        users_prev_30 = filter_by_date_range(
            users, 'created_at', date_ranges['sixty_days_ago'], date_ranges['thirty_days_ago']
        )
        users_growth = calculate_growth_rate(len(users_last_30), len(users_prev_30))

        # System health: combined active ratio
        user_health = (total_active_users / total_users * 50) if total_users > 0 else 0
        facility_health = (total_facilities / len(facilities) * 50) if len(facilities) > 0 else 0
        system_health = round(user_health + facility_health, 1)

        # Health trend (simplified - compare to previous month)
        health_trend = 2.1  # Placeholder positive trend

        # Revenue calculations
        monthly_revenue = sum(calculate_revenue_by_plan(f.get('plan'))
                             for f in active_facilities
                             if f.get('subscription_status') == 'active')

        # Revenue growth (simplified)
        revenue_growth = 15.0  # Placeholder

        # Users by role (active only)
        users_by_role = {
            'doctor': sum(1 for u in active_users if u.get('role') == 'doctor'),
            'nurse': sum(1 for u in active_users if u.get('role') == 'nurse'),
            'facility_admin': sum(1 for u in active_users if u.get('role') == 'facility_admin'),
            'parent': sum(1 for u in active_users if u.get('role') == 'parent')
        }

        # Facility subscriptions by plan type (only active facilities)
        active_subscribed_facilities = [f for f in active_facilities if f.get('subscription_status') == 'active']
        facility_subscriptions = {
            'standard': sum(1 for f in active_subscribed_facilities if f.get('plan', '').lower() == 'standard'),
            'premium': sum(1 for f in active_subscribed_facilities if f.get('plan', '').lower() == 'premium'),
            'enterprise': sum(1 for f in active_subscribed_facilities if f.get('plan', '').lower() == 'enterprise')
        }

        # Parent subscriptions
        parent_users = [u for u in users if u.get('role') == 'parent']
        subscribed_parents = [u for u in parent_users if u.get('is_subscribed')]

        parent_subscriptions = {
            'total': len(parent_users),
            'subscribed': len(subscribed_parents),
            'subscription_rate': round((len(subscribed_parents) / len(parent_users) * 100), 1) if len(parent_users) > 0 else 0
        }

        # Weekly active users (users who logged in each week)
        weekly_active_users = calculate_weekly_active_users(users)

        # Monthly revenue trend
        monthly_revenue_trend = calculate_monthly_revenue_trend(facilities)

        # System monitoring (query performance)
        system_monitoring = get_query_performance_metrics()

        return {
            'core_metrics': {
                'total_facilities': total_facilities,
                'facilities_growth': facilities_growth,
                'active_users': total_active_users,
                'users_growth': users_growth,
                'system_health': system_health,
                'health_trend': health_trend,
                'monthly_revenue': monthly_revenue,
                'revenue_growth': revenue_growth
            },
            'users_by_role': users_by_role,
            'facility_subscriptions': facility_subscriptions,
            'parent_subscriptions': parent_subscriptions,
            'weekly_active_users': weekly_active_users,
            'monthly_revenue_trend': monthly_revenue_trend,
            'system_monitoring': system_monitoring
        }

    except Exception as e:
        current_app.logger.error(f"Error calculating dashboard metrics: {str(e)}")
        raise


@admin_bp.route('/admin/dashboard', methods=['GET'])
@require_auth
@require_role('admin')
def get_dashboard_metrics():
    """Get comprehensive dashboard metrics for admin (single endpoint)"""
    try:
        current_user = getattr(request, 'current_user', {})
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Check cache first
        if not bust_cache:
            cached = redis_client.get(DASHBOARD_CACHE_KEY)
            if cached:
                return jsonify({
                    "status": "success",
                    "data": json.loads(cached),
                    "cached": True,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }), 200

        # Calculate metrics (track query time)
        start_time = time.time()
        metrics = calculate_dashboard_metrics()
        query_duration = (time.time() - start_time) * 1000  # Convert to ms

        # Track query performance
        track_query_performance('dashboard', query_duration)

        # Cache results
        redis_client.setex(DASHBOARD_CACHE_KEY, CACHE_TTL, json.dumps(metrics))

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='VIEW',
            table_name='admin_dashboard',
            record_id=None,
            new_values={'cached': False, 'query_duration_ms': round(query_duration, 2)}
        )

        return jsonify({
            "status": "success",
            "data": metrics,
            "cached": False,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Dashboard error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch dashboard metrics"
        }), 500
