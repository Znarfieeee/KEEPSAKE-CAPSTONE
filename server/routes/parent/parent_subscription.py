"""
Parent Subscription Routes
Handles parent subscription management, Stripe checkout, cancellation, and webhook processing
"""

from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timezone
from utils.access_control import require_auth, require_role
from config.settings import supabase, sr_client
from config.stripe_config import get_stripe_client, PARENT_PLAN_PRICING, STRIPE_WEBHOOK_SECRET, get_stripe_price_id
from utils.audit_logger import log_action
from utils.sanitize import sanitize_request_data
import uuid

parent_subscription_bp = Blueprint('parent_subscription', __name__)
stripe = get_stripe_client()

# ============================================
# PARENT SUBSCRIPTION ENDPOINTS
# ============================================

@parent_subscription_bp.route('/parent/subscription', methods=['GET'])
@require_auth
@require_role('parent')
def get_my_subscription():
    """
    Get current user's subscription information

    Returns:
        200: Subscription data
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Get subscription from database
        resp = sr_client.table('parent_subscriptions')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        if resp.data and len(resp.data) > 0:
            subscription = resp.data[0]
            return jsonify({
                "status": "success",
                "data": subscription
            }), 200
        else:
            # No subscription record yet, return default free plan
            return jsonify({
                "status": "success",
                "data": {
                    "plan_type": "free",
                    "status": "active",
                    "user_id": user_id,
                    "message": "Default free plan (no subscription record)"
                }
            }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch subscription"
        }), 500


@parent_subscription_bp.route('/parent/subscription/checkout', methods=['POST'])
@require_auth
@require_role('parent')
def create_checkout_session():
    """
    Create Stripe checkout session for Premium subscription upgrade

    Returns:
        200: Checkout session URL
        400: Already subscribed or invalid request
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')
        user_email = current_user.get('email')
        user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip()

        # Check if already has premium subscription
        existing_resp = sr_client.table('parent_subscriptions')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        existing = existing_resp.data[0] if existing_resp.data and len(existing_resp.data) > 0 else None

        if existing and existing.get('plan_type') == 'premium' and existing.get('status') == 'active':
            return jsonify({
                "status": "error",
                "message": "Already subscribed to Premium plan"
            }), 400

        # Create or get Stripe customer
        stripe_customer_id = None
        if existing and existing.get('stripe_customer_id'):
            stripe_customer_id = existing['stripe_customer_id']
        else:
            customer = stripe.Customer.create(
                email=user_email,
                name=user_name,
                metadata={'user_id': user_id}
            )
            stripe_customer_id = customer.id

        # Get Stripe Price ID for premium plan
        premium_price_id = get_stripe_price_id('premium')

        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': premium_price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{request.host_url}parent?subscription=success",
            cancel_url=f"{request.host_url}pricing?subscription=cancelled",
            metadata={
                'user_id': user_id,
                'plan_type': 'premium'
            },
            allow_promotion_codes=True,  # Enable promo codes
            billing_address_collection='required'
        )

        # Log action
        log_action(
            user_id=user_id,
            action_type='CREATE',
            table_name='parent_subscriptions',
            record_id=None,
            new_values={'action': 'checkout_session_created', 'session_id': checkout_session.id}
        )

        return jsonify({
            "status": "success",
            "data": {
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error creating checkout session: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to create checkout session: {str(e)}"
        }), 500


@parent_subscription_bp.route('/parent/subscription/cancel', methods=['POST'])
@require_auth
@require_role('parent')
def cancel_subscription():
    """
    Cancel Premium subscription (remains active until period end)

    Returns:
        200: Cancellation successful
        404: No subscription found
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Get subscription
        sub_resp = sr_client.table('parent_subscriptions')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        if not sub_resp.data or len(sub_resp.data) == 0:
            return jsonify({
                "status": "error",
                "message": "No subscription found"
            }), 404

        subscription = sub_resp.data[0]

        if subscription.get('plan_type') == 'free':
            return jsonify({
                "status": "error",
                "message": "Cannot cancel free plan"
            }), 400

        # Cancel in Stripe (at period end)
        if subscription.get('stripe_subscription_id'):
            stripe.Subscription.modify(
                subscription['stripe_subscription_id'],
                cancel_at_period_end=True
            )

        # Update database
        sr_client.table('parent_subscriptions')\
            .update({
                'cancel_at_period_end': True,
                'cancelled_at': datetime.now(timezone.utc).isoformat()
            })\
            .eq('user_id', user_id)\
            .execute()

        # Log action
        log_action(
            user_id=user_id,
            action_type='UPDATE',
            table_name='parent_subscriptions',
            record_id=subscription['subscription_id'],
            new_values={'action': 'subscription_cancelled'}
        )

        return jsonify({
            "status": "success",
            "message": "Subscription will be cancelled at the end of your billing period"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error cancelling subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to cancel subscription"
        }), 500


@parent_subscription_bp.route('/parent/subscription/payment-history', methods=['GET'])
@require_auth
@require_role('parent')
def get_payment_history():
    """
    Get user's payment transaction history

    Returns:
        200: List of payment transactions
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Get payment history
        resp = sr_client.table('parent_payments')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .execute()

        return jsonify({
            "status": "success",
            "data": resp.data or []
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching payment history: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch payment history"
        }), 500


# ============================================
# STRIPE WEBHOOK HANDLER
# ============================================

@parent_subscription_bp.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhook events for subscription lifecycle

    Events handled:
    - checkout.session.completed: Create subscription after successful checkout
    - invoice.payment_succeeded: Record successful payment
    - invoice.payment_failed: Update subscription status to past_due
    - customer.subscription.deleted: Mark subscription as cancelled

    Returns:
        200: Event processed successfully
        400: Invalid payload or signature
        500: Server error
    """
    try:
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            current_app.logger.error("Invalid webhook payload")
            return jsonify({"error": "Invalid payload"}), 400
        except stripe.error.SignatureVerificationError:
            current_app.logger.error("Invalid webhook signature")
            return jsonify({"error": "Invalid signature"}), 400

        # Handle different event types
        event_type = event['type']
        current_app.logger.info(f"Processing Stripe webhook: {event_type}")

        if event_type == 'checkout.session.completed':
            handle_checkout_completed(event['data']['object'])
        elif event_type == 'invoice.payment_succeeded':
            handle_payment_succeeded(event['data']['object'])
        elif event_type == 'invoice.payment_failed':
            handle_payment_failed(event['data']['object'])
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event['data']['object'])
        else:
            current_app.logger.info(f"Unhandled event type: {event_type}")

        return jsonify({"status": "success"}), 200

    except Exception as e:
        current_app.logger.error(f"Webhook error: {str(e)}")
        return jsonify({"error": str(e)}), 500


def handle_checkout_completed(session):
    """
    Handle successful checkout session completion

    Args:
        session: Stripe checkout session object
    """
    try:
        user_id = session['metadata']['user_id']
        stripe_customer_id = session['customer']
        stripe_subscription_id = session['subscription']

        # Get subscription details from Stripe
        subscription = stripe.Subscription.retrieve(stripe_subscription_id)

        # Create or update subscription in database
        sub_data = {
            'user_id': user_id,
            'plan_type': 'premium',
            'stripe_customer_id': stripe_customer_id,
            'stripe_subscription_id': stripe_subscription_id,
            'status': 'active',
            'current_period_start': datetime.fromtimestamp(subscription.current_period_start, tz=timezone.utc).isoformat(),
            'current_period_end': datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat(),
            'cancel_at_period_end': False
        }

        # Upsert subscription (insert or update if exists)
        sr_client.table('parent_subscriptions')\
            .upsert(sub_data, on_conflict='user_id')\
            .execute()

        current_app.logger.info(f"Subscription created for user {user_id}")

        # Log action
        log_action(
            user_id=user_id,
            action_type='CREATE',
            table_name='parent_subscriptions',
            record_id=stripe_subscription_id,
            new_values={'action': 'subscription_activated', 'plan': 'premium'}
        )

    except Exception as e:
        current_app.logger.error(f"Error handling checkout completed: {str(e)}")
        raise


def handle_payment_succeeded(invoice):
    """
    Handle successful payment for subscription invoice

    Args:
        invoice: Stripe invoice object
    """
    try:
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return  # Not a subscription invoice

        # Get subscription from database
        sub_resp = sr_client.table('parent_subscriptions')\
            .select('*')\
            .eq('stripe_subscription_id', subscription_id)\
            .execute()

        if not sub_resp.data or len(sub_resp.data) == 0:
            current_app.logger.warning(f"Subscription not found for invoice: {invoice['id']}")
            return

        subscription = sub_resp.data[0]

        # Record payment in database
        payment_data = {
            'payment_id': str(uuid.uuid4()),
            'subscription_id': subscription['subscription_id'],
            'user_id': subscription['user_id'],
            'stripe_payment_intent_id': invoice.get('payment_intent'),
            'stripe_invoice_id': invoice['id'],
            'amount': invoice['amount_paid'] / 100,  # Convert from cents to pesos
            'currency': invoice['currency'].upper(),
            'status': 'succeeded',
            'payment_method': 'card',
            'billing_period_start': datetime.fromtimestamp(invoice['period_start']).date().isoformat(),
            'billing_period_end': datetime.fromtimestamp(invoice['period_end']).date().isoformat(),
            'paid_at': datetime.now(timezone.utc).isoformat(),
            'metadata': {
                'invoice_number': invoice.get('number'),
                'hosted_invoice_url': invoice.get('hosted_invoice_url')
            }
        }

        sr_client.table('parent_payments')\
            .insert(payment_data)\
            .execute()

        # Update subscription status if it was past_due
        if subscription.get('status') == 'past_due':
            sr_client.table('parent_subscriptions')\
                .update({'status': 'active'})\
                .eq('subscription_id', subscription['subscription_id'])\
                .execute()

        current_app.logger.info(f"Payment recorded for subscription {subscription_id}")

    except Exception as e:
        current_app.logger.error(f"Error handling payment succeeded: {str(e)}")
        raise


def handle_payment_failed(invoice):
    """
    Handle failed payment attempt

    Args:
        invoice: Stripe invoice object
    """
    try:
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return

        # Update subscription status to past_due
        update_resp = sr_client.table('parent_subscriptions')\
            .update({'status': 'past_due'})\
            .eq('stripe_subscription_id', subscription_id)\
            .execute()

        if update_resp.data:
            current_app.logger.warning(f"Subscription {subscription_id} marked as past_due")

    except Exception as e:
        current_app.logger.error(f"Error handling payment failed: {str(e)}")
        raise


def handle_subscription_deleted(subscription):
    """
    Handle subscription deletion/cancellation

    Args:
        subscription: Stripe subscription object
    """
    try:
        stripe_subscription_id = subscription['id']

        # Update subscription to cancelled and revert to free plan
        sr_client.table('parent_subscriptions')\
            .update({
                'status': 'cancelled',
                'plan_type': 'free'
            })\
            .eq('stripe_subscription_id', stripe_subscription_id)\
            .execute()

        current_app.logger.info(f"Subscription {stripe_subscription_id} marked as cancelled")

    except Exception as e:
        current_app.logger.error(f"Error handling subscription deleted: {str(e)}")
        raise
