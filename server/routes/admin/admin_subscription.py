from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from utils.access_control import require_auth, require_role
from config.settings import supabase, sr_client
from utils.redis_client import get_redis_client
from utils.audit_logger import log_action
from utils.sanitize import sanitize_request_data
from utils.invalidate_cache import invalidate_caches
import json
import uuid

subscription_bp = Blueprint('subscription', __name__)
redis_client = get_redis_client()

# Cache keys
SUBSCRIPTION_CACHE_KEY = "subscription:metrics"
INVOICE_CACHE_PREFIX = "invoice:"
CACHE_TTL = 300  # 5 minutes

# Plan pricing (matching existing PLAN_PRICING in admin_routes.py)
PLAN_PRICING = {
    'standard': 5544,    # ₱5,544/month (previously $99)
    'premium': 11144,    # ₱11,144/month (previously $199)
    'enterprise': 22344  # ₱22,344/month (previously $399)
}

# ============================================
# SUBSCRIPTION MANAGEMENT ENDPOINTS
# ============================================

@subscription_bp.route('/admin/subscriptions/upgrade', methods=['POST'])
@require_auth
@require_role('admin')
def upgrade_subscription():
    """Upgrade facility subscription plan"""
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})

        facility_id = data.get('facility_id')
        new_plan = data.get('new_plan')
        reason = data.get('reason', '')

        if not facility_id or not new_plan:
            return jsonify({
                "status": "error",
                "message": "Facility ID and new plan are required"
            }), 400

        # Validate plan
        if new_plan not in PLAN_PRICING:
            return jsonify({
                "status": "error",
                "message": f"Invalid plan. Must be one of: {', '.join(PLAN_PRICING.keys())}"
            }), 400

        # Get current facility data
        facility_resp = sr_client.table('healthcare_facilities')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .single()\
            .execute()

        if not facility_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility not found"
            }), 404

        current_plan = facility_resp.data.get('plan')

        # Calculate new expiry (extend by 30 days from current expiry or today)
        current_expiry = facility_resp.data.get('subscription_expires')
        if current_expiry:
            try:
                expiry_date = datetime.fromisoformat(str(current_expiry))
                if expiry_date < datetime.now(timezone.utc):
                    new_expiry = datetime.now(timezone.utc) + timedelta(days=30)
                else:
                    new_expiry = expiry_date + timedelta(days=30)
            except:
                new_expiry = datetime.now(timezone.utc) + timedelta(days=30)
        else:
            new_expiry = datetime.now(timezone.utc) + timedelta(days=30)

        # Update facility
        update_resp = sr_client.table('healthcare_facilities')\
            .update({
                'plan': new_plan,
                'subscription_status': 'active',
                'subscription_expires': new_expiry.date().isoformat()
            })\
            .eq('facility_id', facility_id)\
            .execute()

        if update_resp.error:
            current_app.logger.error(f"Error upgrading subscription: {update_resp.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to upgrade subscription"
            }), 500

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='UPDATE',
            table_name='healthcare_facilities',
            record_id=facility_id,
            old_values={'plan': current_plan},
            new_values={'plan': new_plan, 'reason': reason}
        )

        # Invalidate caches
        invalidate_caches('facility', facility_id)
        invalidate_caches('subscription')

        current_app.logger.info(f"Subscription upgraded: {facility_id} from {current_plan} to {new_plan}")

        return jsonify({
            "status": "success",
            "message": f"Subscription upgraded to {new_plan}",
            "data": {
                "facility_id": facility_id,
                "old_plan": current_plan,
                "new_plan": new_plan,
                "expires": new_expiry.date().isoformat()
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error upgrading subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to upgrade subscription"
        }), 500


@subscription_bp.route('/admin/subscriptions/downgrade', methods=['POST'])
@require_auth
@require_role('admin')
def downgrade_subscription():
    """Downgrade facility subscription plan"""
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})

        facility_id = data.get('facility_id')
        new_plan = data.get('new_plan')
        reason = data.get('reason', '')

        if not facility_id or not new_plan:
            return jsonify({
                "status": "error",
                "message": "Facility ID and new plan are required"
            }), 400

        # Validate plan
        if new_plan not in PLAN_PRICING:
            return jsonify({
                "status": "error",
                "message": f"Invalid plan. Must be one of: {', '.join(PLAN_PRICING.keys())}"
            }), 400

        # Get current facility data
        facility_resp = sr_client.table('healthcare_facilities')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .single()\
            .execute()

        if not facility_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility not found"
            }), 404

        current_plan = facility_resp.data.get('plan')

        # Update facility
        update_resp = sr_client.table('healthcare_facilities')\
            .update({
                'plan': new_plan,
                'subscription_status': 'active'
            })\
            .eq('facility_id', facility_id)\
            .execute()

        if update_resp.error:
            current_app.logger.error(f"Error downgrading subscription: {update_resp.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to downgrade subscription"
            }), 500

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='UPDATE',
            table_name='healthcare_facilities',
            record_id=facility_id,
            old_values={'plan': current_plan},
            new_values={'plan': new_plan, 'reason': reason}
        )

        # Invalidate caches
        invalidate_caches('facility', facility_id)
        invalidate_caches('subscription')

        current_app.logger.info(f"Subscription downgraded: {facility_id} from {current_plan} to {new_plan}")

        return jsonify({
            "status": "success",
            "message": f"Subscription downgraded to {new_plan}",
            "data": {
                "facility_id": facility_id,
                "old_plan": current_plan,
                "new_plan": new_plan
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error downgrading subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to downgrade subscription"
        }), 500


@subscription_bp.route('/admin/subscriptions/cancel', methods=['POST'])
@require_auth
@require_role('admin')
def cancel_subscription():
    """Cancel facility subscription"""
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})

        facility_id = data.get('facility_id')
        cancel_immediately = data.get('cancel_immediately', False)
        reason = data.get('reason', '')

        if not facility_id:
            return jsonify({
                "status": "error",
                "message": "Facility ID is required"
            }), 400

        # Update status
        update_data = {
            'subscription_status': 'suspended' if not cancel_immediately else 'inactive'
        }

        if cancel_immediately:
            update_data['subscription_expires'] = datetime.now(timezone.utc).date().isoformat()

        update_resp = sr_client.table('healthcare_facilities')\
            .update(update_data)\
            .eq('facility_id', facility_id)\
            .execute()

        if update_resp.error:
            current_app.logger.error(f"Error cancelling subscription: {update_resp.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to cancel subscription"
            }), 500

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='UPDATE',
            table_name='healthcare_facilities',
            record_id=facility_id,
            new_values={'subscription_status': update_data['subscription_status'], 'reason': reason}
        )

        # Invalidate caches
        invalidate_caches('facility', facility_id)
        invalidate_caches('subscription')

        current_app.logger.info(f"Subscription cancelled: {facility_id}")

        return jsonify({
            "status": "success",
            "message": "Subscription cancelled successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error cancelling subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to cancel subscription"
        }), 500


@subscription_bp.route('/admin/subscriptions/renew', methods=['POST'])
@require_auth
@require_role('admin')
def renew_subscription():
    """Renew facility subscription"""
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})

        facility_id = data.get('facility_id')
        duration = data.get('duration', 30)  # Default 30 days

        if not facility_id:
            return jsonify({
                "status": "error",
                "message": "Facility ID is required"
            }), 400

        # Get current facility data
        facility_resp = sr_client.table('healthcare_facilities')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .single()\
            .execute()

        if not facility_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility not found"
            }), 404

        # Calculate new expiry
        current_expiry = facility_resp.data.get('subscription_expires')
        if current_expiry:
            try:
                expiry_date = datetime.fromisoformat(str(current_expiry))
                if expiry_date < datetime.now(timezone.utc):
                    new_expiry = datetime.now(timezone.utc) + timedelta(days=duration)
                else:
                    new_expiry = expiry_date + timedelta(days=duration)
            except:
                new_expiry = datetime.now(timezone.utc) + timedelta(days=duration)
        else:
            new_expiry = datetime.now(timezone.utc) + timedelta(days=duration)

        # Update facility
        update_resp = sr_client.table('healthcare_facilities')\
            .update({
                'subscription_status': 'active',
                'subscription_expires': new_expiry.date().isoformat()
            })\
            .eq('facility_id', facility_id)\
            .execute()

        if update_resp.error:
            return jsonify({
                "status": "error",
                "message": "Failed to renew subscription"
            }), 500

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='UPDATE',
            table_name='healthcare_facilities',
            record_id=facility_id,
            new_values={'subscription_expires': new_expiry.date().isoformat()}
        )

        # Invalidate caches
        invalidate_caches('facility', facility_id)
        invalidate_caches('subscription')

        return jsonify({
            "status": "success",
            "message": f"Subscription renewed for {duration} days",
            "data": {
                "facility_id": facility_id,
                "expires": new_expiry.date().isoformat()
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error renewing subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to renew subscription"
        }), 500


# ============================================
# INVOICE MANAGEMENT ENDPOINTS
# ============================================

@subscription_bp.route('/admin/invoices', methods=['GET'])
@require_auth
@require_role('admin')
def list_invoices():
    """Get all invoices with filtering"""
    try:
        # Query parameters
        facility_id = request.args.get('facility_id')
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))

        # Build query
        query = sr_client.table('invoices')\
            .select('*, healthcare_facilities(facility_name, email)')

        if facility_id:
            query = query.eq('facility_id', facility_id)
        if status:
            query = query.eq('status', status)
        if start_date:
            query = query.gte('issue_date', start_date)
        if end_date:
            query = query.lte('issue_date', end_date)

        # Execute with pagination
        offset = (page - 1) * per_page
        query = query.order('issue_date', desc=True)\
            .range(offset, offset + per_page - 1)

        resp = query.execute()

        if resp.error:
            return jsonify({
                "status": "error",
                "message": "Failed to fetch invoices"
            }), 500

        return jsonify({
            "status": "success",
            "data": resp.data,
            "page": page,
            "per_page": per_page
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching invoices: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch invoices"
        }), 500


@subscription_bp.route('/admin/invoices/<invoice_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_invoice(invoice_id):
    """Get single invoice by ID"""
    try:
        resp = sr_client.table('invoices')\
            .select('*, healthcare_facilities(facility_name, address, city, email, contact_number)')\
            .eq('invoice_id', invoice_id)\
            .single()\
            .execute()

        if not resp.data:
            return jsonify({
                "status": "error",
                "message": "Invoice not found"
            }), 404

        return jsonify({
            "status": "success",
            "data": resp.data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching invoice: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch invoice"
        }), 500


@subscription_bp.route('/admin/invoices/generate', methods=['POST'])
@require_auth
@require_role('admin')
def generate_invoice():
    """Generate new invoice for a facility"""
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})

        facility_id = data.get('facility_id')
        billing_period_start = data.get('billing_period_start')
        billing_period_end = data.get('billing_period_end')
        notes = data.get('notes', '')

        if not all([facility_id, billing_period_start, billing_period_end]):
            return jsonify({
                "status": "error",
                "message": "Missing required fields"
            }), 400

        # Get facility data
        facility_resp = sr_client.table('healthcare_facilities')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .single()\
            .execute()

        if not facility_resp.data:
            return jsonify({
                "status": "error",
                "message": "Facility not found"
            }), 404

        plan = facility_resp.data.get('plan', 'standard')
        subtotal = PLAN_PRICING.get(plan, 99)
        tax_amount = round(subtotal * 0.12, 2)  # 12% tax
        total_amount = subtotal + tax_amount

        # Generate invoice number (format: INV-YYYY-XXXXXX)
        invoice_number = f"INV-{datetime.now().year}-{str(uuid.uuid4())[:6].upper()}"

        # Create invoice
        invoice_data = {
            'facility_id': facility_id,
            'invoice_number': invoice_number,
            'billing_period_start': billing_period_start,
            'billing_period_end': billing_period_end,
            'issue_date': datetime.now(timezone.utc).date().isoformat(),
            'due_date': (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat(),
            'subtotal': subtotal,
            'tax_amount': tax_amount,
            'total_amount': total_amount,
            'plan_type': plan,
            'status': 'pending',
            'notes': notes,
            'created_by': current_user.get('id')
        }

        invoice_resp = sr_client.table('invoices')\
            .insert(invoice_data)\
            .execute()

        if invoice_resp.error:
            current_app.logger.error(f"Error generating invoice: {invoice_resp.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to generate invoice"
            }), 500

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='CREATE',
            table_name='invoices',
            record_id=invoice_resp.data[0]['invoice_id'],
            new_values=invoice_data
        )

        current_app.logger.info(f"Invoice generated: {invoice_number} for facility {facility_id}")

        return jsonify({
            "status": "success",
            "message": "Invoice generated successfully",
            "data": invoice_resp.data[0]
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error generating invoice: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to generate invoice"
        }), 500


@subscription_bp.route('/admin/invoices/<invoice_id>/mark-paid', methods=['POST'])
@require_auth
@require_role('admin')
def mark_invoice_paid(invoice_id):
    """Mark invoice as paid and create payment transaction"""
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})

        payment_date = data.get('payment_date', datetime.now(timezone.utc).isoformat())
        amount = data.get('amount')
        payment_method = data.get('payment_method', 'manual')
        transaction_reference = data.get('transaction_reference', '')
        notes = data.get('notes', '')

        if not amount:
            return jsonify({
                "status": "error",
                "message": "Payment amount is required"
            }), 400

        # Get invoice
        invoice_resp = sr_client.table('invoices')\
            .select('*')\
            .eq('invoice_id', invoice_id)\
            .single()\
            .execute()

        if not invoice_resp.data:
            return jsonify({
                "status": "error",
                "message": "Invoice not found"
            }), 404

        # Create payment transaction
        transaction_data = {
            'invoice_id': invoice_id,
            'facility_id': invoice_resp.data['facility_id'],
            'transaction_date': payment_date,
            'amount': float(amount),
            'payment_method': payment_method,
            'transaction_reference': transaction_reference,
            'status': 'completed',
            'notes': notes,
            'processed_by': current_user.get('id')
        }

        transaction_resp = sr_client.table('payment_transactions')\
            .insert(transaction_data)\
            .execute()

        if transaction_resp.error:
            return jsonify({
                "status": "error",
                "message": "Failed to record payment"
            }), 500

        # Update invoice status
        invoice_update = sr_client.table('invoices')\
            .update({
                'status': 'paid',
                'paid_at': payment_date
            })\
            .eq('invoice_id', invoice_id)\
            .execute()

        # Audit log
        log_action(
            user_id=current_user.get('id'),
            action_type='CREATE',
            table_name='payment_transactions',
            record_id=transaction_resp.data[0]['transaction_id'],
            new_values=transaction_data
        )

        return jsonify({
            "status": "success",
            "message": "Payment recorded successfully",
            "data": {
                "transaction": transaction_resp.data[0],
                "invoice": invoice_update.data[0] if invoice_update.data else None
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error marking invoice paid: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to record payment"
        }), 500


# ============================================
# ANALYTICS & METRICS ENDPOINTS
# ============================================

@subscription_bp.route('/admin/subscriptions/analytics', methods=['GET'])
@require_auth
@require_role('admin')
def get_subscription_analytics():
    """Get subscription analytics and metrics"""
    try:
        current_app.logger.info("[ANALYTICS] Fetching subscription analytics...")
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'

        # Check cache
        if not bust_cache:
            cached = redis_client.get(SUBSCRIPTION_CACHE_KEY)
            if cached:
                current_app.logger.info("[ANALYTICS] Returning cached data")
                return jsonify({
                    "status": "success",
                    "data": json.loads(cached),
                    "cached": True
                }), 200

        # Fetch facilities
        current_app.logger.info("[ANALYTICS] Fetching facilities from database...")
        facilities_resp = sr_client.table('healthcare_facilities')\
            .select('*')\
            .is_('deleted_at', 'null')\
            .execute()

        facilities = facilities_resp.data or []
        current_app.logger.info(f"[ANALYTICS] Found {len(facilities)} facilities")

        # Fetch invoices
        invoices_resp = sr_client.table('invoices')\
            .select('*')\
            .execute()

        invoices = invoices_resp.data or []

        # Calculate metrics based on facility plans (ignoring subscription_expires)
        # Sum up revenue from ALL facilities based on their plan type
        total_revenue_ytd = 0
        plan_distribution = {}

        current_app.logger.info(f"[ANALYTICS] Calculating revenue from {len(facilities)} facilities")
        for facility in facilities:
            plan = facility.get('plan', 'standard').lower()
            # Count facilities by plan
            plan_distribution[plan] = plan_distribution.get(plan, 0) + 1
            # Add monthly revenue based on plan
            plan_revenue = PLAN_PRICING.get(plan, PLAN_PRICING['standard'])
            total_revenue_ytd += plan_revenue
            current_app.logger.info(f"[ANALYTICS] Facility: {facility.get('facility_name')} | Plan: {plan} | Revenue: ₱{plan_revenue}")

        current_app.logger.info(f"[ANALYTICS] Total Revenue Calculated: ₱{total_revenue_ytd}")
        current_app.logger.info(f"[ANALYTICS] Plan Distribution: {plan_distribution}")

        # Revenue by plan (monthly revenue per plan type)
        revenue_by_plan = {
            'standard': PLAN_PRICING['standard'] * plan_distribution.get('standard', 0),
            'premium': PLAN_PRICING['premium'] * plan_distribution.get('premium', 0),
            'enterprise': PLAN_PRICING['enterprise'] * plan_distribution.get('enterprise', 0)
        }

        # Subscription status distribution
        status_distribution = {}
        for facility in facilities:
            status = facility.get('subscription_status', 'inactive')
            status_distribution[status] = status_distribution.get(status, 0) + 1

        # Expiring soon (next 30 days)
        now = datetime.now(timezone.utc).date()
        thirty_days = now + timedelta(days=30)
        expiring_soon = []
        for f in facilities:
            if f.get('subscription_expires'):
                try:
                    expiry = datetime.fromisoformat(str(f['subscription_expires'])).date()
                    if now <= expiry <= thirty_days:
                        expiring_soon.append(f)
                except:
                    pass

        # Monthly revenue trend (last 12 months)
        monthly_revenue = calculate_monthly_revenue_trend(invoices)

        analytics_data = {
            'total_revenue_ytd': total_revenue_ytd,
            'total_active_subscriptions': len([f for f in facilities if f.get('subscription_status') == 'active']),
            'plan_distribution': plan_distribution,
            'revenue_by_plan': revenue_by_plan,
            'status_distribution': status_distribution,
            'expiring_soon_count': len(expiring_soon),
            'expiring_soon': expiring_soon[:10],  # Top 10
            'monthly_revenue_trend': monthly_revenue,
            'average_revenue_per_facility': total_revenue_ytd / len(facilities) if facilities else 0
        }

        current_app.logger.info(f"[ANALYTICS] Returning analytics data: total_revenue_ytd=₱{analytics_data['total_revenue_ytd']}, active_subscriptions={analytics_data['total_active_subscriptions']}")

        # Cache for 5 minutes
        redis_client.setex(SUBSCRIPTION_CACHE_KEY, CACHE_TTL, json.dumps(analytics_data))

        return jsonify({
            "status": "success",
            "data": analytics_data,
            "cached": False
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching subscription analytics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch analytics"
        }), 500


def calculate_monthly_revenue_trend(invoices):
    """Calculate revenue for last 12 months"""
    now = datetime.now(timezone.utc)
    months = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for i in range(11, -1, -1):
        month_date = now - relativedelta(months=i)
        month_name = month_names[month_date.month - 1]

        # Calculate revenue for this month
        revenue = sum(
            float(inv.get('total_amount', 0))
            for inv in invoices
            if inv.get('status') == 'paid' and
            datetime.fromisoformat(inv['issue_date']).month == month_date.month and
            datetime.fromisoformat(inv['issue_date']).year == month_date.year
        )

        months.append({
            "month": month_name,
            "revenue": revenue
        })

    return months


# ============================================
# PAYMENT HISTORY ENDPOINTS
# ============================================

@subscription_bp.route('/admin/payments', methods=['GET'])
@require_auth
@require_role('admin')
def list_payments():
    """Get payment transaction history"""
    try:
        # Query parameters
        facility_id = request.args.get('facility_id')
        invoice_id = request.args.get('invoice_id')
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))

        # Build query
        query = sr_client.table('payment_transactions')\
            .select('*, invoices(invoice_number), healthcare_facilities(facility_name)')

        if facility_id:
            query = query.eq('facility_id', facility_id)
        if invoice_id:
            query = query.eq('invoice_id', invoice_id)
        if status:
            query = query.eq('status', status)
        if start_date:
            query = query.gte('transaction_date', start_date)
        if end_date:
            query = query.lte('transaction_date', end_date)

        # Execute with pagination
        offset = (page - 1) * per_page
        query = query.order('transaction_date', desc=True)\
            .range(offset, offset + per_page - 1)

        resp = query.execute()

        if resp.error:
            return jsonify({
                "status": "error",
                "message": "Failed to fetch payment history"
            }), 500

        return jsonify({
            "status": "success",
            "data": resp.data,
            "page": page,
            "per_page": per_page
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching payment history: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch payment history"
        }), 500


# ============================================
# EMAIL NOTIFICATIONS ENDPOINT
# ============================================

@subscription_bp.route('/admin/notifications', methods=['GET'])
@require_auth
@require_role('admin')
def list_notifications():
    """Get email notifications"""
    try:
        # Query parameters
        notification_type = request.args.get('type')
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))

        # Build query
        query = sr_client.table('email_notifications').select('*')

        if notification_type:
            query = query.eq('notification_type', notification_type)
        if status:
            query = query.eq('status', status)

        # Execute with pagination
        offset = (page - 1) * per_page
        query = query.order('created_at', desc=True)\
            .range(offset, offset + per_page - 1)

        resp = query.execute()

        if resp.error:
            return jsonify({
                "status": "error",
                "message": "Failed to fetch notifications"
            }), 500

        return jsonify({
            "status": "success",
            "data": resp.data,
            "page": page,
            "per_page": per_page
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching notifications: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch notifications"
        }), 500
