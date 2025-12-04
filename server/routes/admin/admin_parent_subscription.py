"""
Admin Parent Subscription Routes
System admin endpoints for managing and viewing parent subscriptions
"""

from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import sr_client
from datetime import datetime, timezone, timedelta

admin_parent_subscription_bp = Blueprint('admin_parent_subscription', __name__)


@admin_parent_subscription_bp.route('/admin/parent-subscriptions', methods=['GET'])
@require_auth
@require_role('admin')
def list_parent_subscriptions():
    """
    Get all parent subscriptions with optional filtering

    Query Parameters:
        status (str, optional): Filter by subscription status
        plan_type (str, optional): Filter by plan type (free/premium)
        page (int, optional): Page number (default: 1)
        per_page (int, optional): Results per page (default: 50, max: 100)

    Returns:
        200: List of parent subscriptions with user details
        500: Server error
    """
    try:
        # Get query parameters
        status = request.args.get('status')
        plan_type = request.args.get('plan_type')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)

        # Build query with user information
        query = sr_client.table('parent_subscriptions')\
            .select('*, users(user_id, first_name, last_name, email, phone_number)')

        # Apply filters
        if status:
            query = query.eq('status', status)
        if plan_type:
            query = query.eq('plan_type', plan_type)

        # Apply pagination and ordering
        offset = (page - 1) * per_page
        query = query.order('created_at', desc=True)\
            .range(offset, offset + per_page - 1)

        # Execute query
        resp = query.execute()

        # Get total count
        count_query = sr_client.table('parent_subscriptions').select('subscription_id', count='exact')
        if status:
            count_query = count_query.eq('status', status)
        if plan_type:
            count_query = count_query.eq('plan_type', plan_type)
        count_resp = count_query.execute()

        total_count = count_resp.count if hasattr(count_resp, 'count') else len(resp.data or [])

        return jsonify({
            "status": "success",
            "data": resp.data or [],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "total_pages": (total_count + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching parent subscriptions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch subscriptions"
        }), 500


@admin_parent_subscription_bp.route('/admin/parent-subscriptions/<subscription_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_parent_subscription(subscription_id):
    """
    Get single parent subscription with detailed information

    Returns:
        200: Subscription details with user info and payment history
        404: Subscription not found
        500: Server error
    """
    try:
        # Get subscription with user details
        sub_resp = sr_client.table('parent_subscriptions')\
            .select('*, users(user_id, first_name, last_name, email, phone_number)')\
            .eq('subscription_id', subscription_id)\
            .execute()

        if not sub_resp.data or len(sub_resp.data) == 0:
            return jsonify({
                "status": "error",
                "message": "Subscription not found"
            }), 404

        subscription = sub_resp.data[0]

        # Get payment history for this subscription
        payments_resp = sr_client.table('parent_payments')\
            .select('*')\
            .eq('subscription_id', subscription_id)\
            .order('created_at', desc=True)\
            .execute()

        # Get subscription change history
        history_resp = sr_client.table('parent_subscription_history')\
            .select('*')\
            .eq('subscription_id', subscription_id)\
            .order('created_at', desc=True)\
            .execute()

        return jsonify({
            "status": "success",
            "data": {
                "subscription": subscription,
                "payments": payments_resp.data or [],
                "history": history_resp.data or []
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching subscription details: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch subscription details"
        }), 500


@admin_parent_subscription_bp.route('/admin/parent-subscriptions/analytics', methods=['GET'])
@require_auth
@require_role('admin')
def get_parent_subscription_analytics():
    """
    Get comprehensive analytics for parent subscriptions

    Query Parameters:
        bust_cache (bool, optional): Bypass cache and recalculate

    Returns:
        200: Analytics data including revenue, subscriber counts, plan distribution
        500: Server error
    """
    try:
        # Get all subscriptions
        subs_resp = sr_client.table('parent_subscriptions')\
            .select('*')\
            .execute()

        subscriptions = subs_resp.data or []

        # Get all successful payments
        payments_resp = sr_client.table('parent_payments')\
            .select('*')\
            .eq('status', 'succeeded')\
            .execute()

        payments = payments_resp.data or []

        # Calculate metrics
        total_subscriptions = len(subscriptions)
        premium_subscribers = len([s for s in subscriptions if s.get('plan_type') == 'premium'])
        free_subscribers = len([s for s in subscriptions if s.get('plan_type') == 'free'])
        active_subscriptions = len([s for s in subscriptions if s.get('status') == 'active'])
        cancelled_subscriptions = len([s for s in subscriptions if s.get('status') == 'cancelled'])
        past_due_subscriptions = len([s for s in subscriptions if s.get('status') == 'past_due'])

        # Revenue calculations
        total_revenue = sum(float(p.get('amount', 0)) for p in payments)

        # Monthly revenue (current month)
        now = datetime.now(timezone.utc)
        monthly_revenue = sum(
            float(p.get('amount', 0)) for p in payments
            if p.get('created_at') and datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')).month == now.month
            and datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')).year == now.year
        )

        # Revenue by month (last 6 months)
        monthly_revenue_trend = []
        for i in range(5, -1, -1):
            target_date = now - timedelta(days=30 * i)
            month_revenue = sum(
                float(p.get('amount', 0)) for p in payments
                if p.get('created_at')
                and datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')).month == target_date.month
                and datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')).year == target_date.year
            )
            monthly_revenue_trend.append({
                'month': target_date.strftime('%B %Y'),
                'revenue': month_revenue
            })

        # Expiring soon (subscriptions ending in next 7 days)
        seven_days_from_now = now + timedelta(days=7)
        expiring_soon = len([
            s for s in subscriptions
            if s.get('current_period_end')
            and s.get('status') == 'active'
            and datetime.fromisoformat(s['current_period_end'].replace('Z', '+00:00')) <= seven_days_from_now
            and not s.get('cancel_at_period_end', False)
        ])

        # Plan distribution
        plan_distribution = {
            'free': free_subscribers,
            'premium': premium_subscribers
        }

        # Status distribution
        status_distribution = {
            'active': active_subscriptions,
            'cancelled': cancelled_subscriptions,
            'past_due': past_due_subscriptions,
            'trialing': len([s for s in subscriptions if s.get('status') == 'trialing']),
            'incomplete': len([s for s in subscriptions if s.get('status') == 'incomplete'])
        }

        # Revenue by plan type
        revenue_by_plan = {}
        for payment in payments:
            # Get subscription for this payment
            sub = next((s for s in subscriptions if s.get('subscription_id') == payment.get('subscription_id')), None)
            if sub:
                plan_type = sub.get('plan_type', 'unknown')
                revenue_by_plan[plan_type] = revenue_by_plan.get(plan_type, 0) + float(payment.get('amount', 0))

        # Average revenue per user (ARPU)
        arpu = total_revenue / premium_subscribers if premium_subscribers > 0 else 0

        # Conversion rate (free to premium)
        conversion_rate = (premium_subscribers / total_subscriptions * 100) if total_subscriptions > 0 else 0

        analytics = {
            'total_subscriptions': total_subscriptions,
            'premium_subscribers': premium_subscribers,
            'free_subscribers': free_subscribers,
            'active_subscriptions': active_subscriptions,
            'cancelled_subscriptions': cancelled_subscriptions,
            'past_due_subscriptions': past_due_subscriptions,
            'total_revenue': round(total_revenue, 2),
            'monthly_revenue': round(monthly_revenue, 2),
            'arpu': round(arpu, 2),
            'conversion_rate': round(conversion_rate, 2),
            'plan_distribution': plan_distribution,
            'status_distribution': status_distribution,
            'revenue_by_plan': {k: round(v, 2) for k, v in revenue_by_plan.items()},
            'monthly_revenue_trend': monthly_revenue_trend,
            'expiring_soon': expiring_soon,
            'total_payments': len(payments)
        }

        return jsonify({
            "status": "success",
            "data": analytics
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching analytics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch analytics"
        }), 500


@admin_parent_subscription_bp.route('/admin/parent-subscriptions/<subscription_id>/payments', methods=['GET'])
@require_auth
@require_role('admin')
def get_subscription_payments(subscription_id):
    """
    Get all payments for a specific subscription

    Returns:
        200: List of payments
        500: Server error
    """
    try:
        resp = sr_client.table('parent_payments')\
            .select('*')\
            .eq('subscription_id', subscription_id)\
            .order('created_at', desc=True)\
            .execute()

        return jsonify({
            "status": "success",
            "data": resp.data or []
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching subscription payments: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch payments"
        }), 500


@admin_parent_subscription_bp.route('/admin/parent-payments', methods=['GET'])
@require_auth
@require_role('admin')
def list_all_payments():
    """
    Get all parent payment transactions with filtering

    Query Parameters:
        status (str, optional): Filter by payment status
        user_id (str, optional): Filter by user
        page (int, optional): Page number
        per_page (int, optional): Results per page

    Returns:
        200: List of payments with user details
        500: Server error
    """
    try:
        status = request.args.get('status')
        user_id = request.args.get('user_id')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)

        # Build query
        query = sr_client.table('parent_payments')\
            .select('*, users(first_name, last_name, email)')

        if status:
            query = query.eq('status', status)
        if user_id:
            query = query.eq('user_id', user_id)

        offset = (page - 1) * per_page
        query = query.order('created_at', desc=True)\
            .range(offset, offset + per_page - 1)

        resp = query.execute()

        return jsonify({
            "status": "success",
            "data": resp.data or []
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching payments: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch payments"
        }), 500


@admin_parent_subscription_bp.route('/admin/parent-subscriptions/export', methods=['GET'])
@require_auth
@require_role('admin')
def export_subscriptions():
    """
    Export all parent subscriptions data (CSV format)

    Query Parameters:
        format (str, optional): Export format (csv/json) - default: csv

    Returns:
        200: Exported data
        500: Server error
    """
    try:
        export_format = request.args.get('format', 'json').lower()

        # Get all subscriptions with user details
        resp = sr_client.table('parent_subscriptions')\
            .select('*, users(first_name, last_name, email, phone_number)')\
            .execute()

        subscriptions = resp.data or []

        if export_format == 'json':
            return jsonify({
                "status": "success",
                "data": subscriptions
            }), 200
        else:
            # TODO: Implement CSV export
            return jsonify({
                "status": "error",
                "message": "CSV export not yet implemented"
            }), 501

    except Exception as e:
        current_app.logger.error(f"Error exporting subscriptions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to export subscriptions"
        }), 500
