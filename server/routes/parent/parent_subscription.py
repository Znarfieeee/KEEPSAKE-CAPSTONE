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

# Validate Stripe configuration on module load
if not stripe.api_key:
    import logging
    logging.warning("STRIPE_SECRET_KEY not configured! Payment features will not work. Please set STRIPE_SECRET_KEY in server/.env")

if not STRIPE_WEBHOOK_SECRET:
    import logging
    logging.warning("STRIPE_WEBHOOK_SECRET not configured! Webhook processing will fail. Please set STRIPE_WEBHOOK_SECRET in server/.env")

# ============================================
# PARENT SUBSCRIPTION ENDPOINTS
# ============================================

@parent_subscription_bp.route('/parent/subscription', methods=['GET'])
@require_auth
@require_role('parent')
def get_my_subscription():
    """
    Get current user's subscription information from users table

    Returns:
        200: Subscription data
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Get subscription from users table
        resp = sr_client.table('users')\
            .select('user_id, is_subscribed, subscription_expires')\
            .eq('user_id', user_id)\
            .execute()

        if resp.data and len(resp.data) > 0:
            user = resp.data[0]
            is_subscribed = user.get('is_subscribed', False)
            subscription_expires = user.get('subscription_expires')

            # Check if subscription is still active
            if is_subscribed and subscription_expires:
                from datetime import datetime
                try:
                    expiry_date = datetime.strptime(subscription_expires, '%Y-%m-%d').date()
                    is_active = expiry_date >= datetime.now().date()
                except:
                    is_active = False
            else:
                is_active = False

            plan_type = 'premium' if is_active else 'free'
            status = 'active' if is_active else 'inactive'

            return jsonify({
                "status": "success",
                "data": {
                    "plan_type": plan_type,
                    "status": status,
                    "subscription_expires": subscription_expires,
                    "user_id": user_id
                }
            }), 200
        else:
            # No user record found
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

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
    Mock payment session for testing (bypasses Stripe)
    Returns mock session data for frontend testing

    Returns:
        200: Mock session created
        400: Already subscribed
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Check if already has active premium subscription in users table
        user_resp = sr_client.table('users')\
            .select('is_subscribed, subscription_expires')\
            .eq('user_id', user_id)\
            .execute()

        if user_resp.data and len(user_resp.data) > 0:
            user = user_resp.data[0]
            is_subscribed = user.get('is_subscribed', False)
            subscription_expires = user.get('subscription_expires')

            if is_subscribed and subscription_expires:
                from datetime import datetime
                try:
                    expiry_date = datetime.strptime(subscription_expires, '%Y-%m-%d').date()
                    if expiry_date >= datetime.now().date():
                        return jsonify({
                            "status": "error",
                            "message": "Already subscribed to Premium plan"
                        }), 400
                except:
                    pass

        # Return mock session for testing
        return jsonify({
            "status": "success",
            "mock_payment": True,
            "amount": 299,
            "currency": "PHP"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error creating checkout session: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to create checkout session"
        }), 500


@parent_subscription_bp.route('/parent/subscription/mock-payment', methods=['POST'])
@require_auth
@require_role('parent')
def process_mock_payment():
    """
    Process mock payment for testing (bypasses Stripe)
    Activates premium subscription immediately

    Returns:
        200: Payment successful, subscription activated
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Calculate subscription expiry (30 days from now)
        from datetime import datetime, timedelta
        expiry_date = (datetime.now() + timedelta(days=30)).date()

        # Update user subscription in users table
        sr_client.table('users')\
            .update({
                'is_subscribed': True,
                'subscription_expires': expiry_date.isoformat()
            })\
            .eq('user_id', user_id)\
            .execute()

        current_app.logger.info(f"Mock payment: Premium subscription activated for user {user_id} until {expiry_date}")

        # Log action
        log_action(
            user_id=user_id,
            action_type='UPDATE',
            table_name='users',
            record_id=user_id,
            new_values={
                'action': 'premium_subscription_activated_mock',
                'amount': 299,
                'expires': expiry_date.isoformat()
            }
        )

        return jsonify({
            "status": "success",
            "message": "Payment successful! Premium subscription activated.",
            "subscription": {
                "plan_type": "premium",
                "status": "active",
                "subscription_expires": expiry_date.isoformat()
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error processing mock payment: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to process payment"
        }), 500


@parent_subscription_bp.route('/parent/subscription/cancel', methods=['POST'])
@require_auth
@require_role('parent')
def cancel_subscription():
    """
    Cancel Premium subscription by setting expiry to today

    Returns:
        200: Cancellation successful
        404: No subscription found
        500: Server error
    """
    try:
        current_user = getattr(request, 'current_user', {})
        user_id = current_user.get('id')

        # Get user subscription status
        user_resp = sr_client.table('users')\
            .select('is_subscribed')\
            .eq('user_id', user_id)\
            .execute()

        if not user_resp.data or not user_resp.data[0].get('is_subscribed'):
            return jsonify({
                "status": "error",
                "message": "No active subscription found"
            }), 404

        # Cancel subscription by setting is_subscribed to False
        from datetime import datetime
        sr_client.table('users')\
            .update({
                'is_subscribed': False,
                'subscription_expires': datetime.now().date().isoformat()
            })\
            .eq('user_id', user_id)\
            .execute()

        # Log action
        log_action(
            user_id=user_id,
            action_type='UPDATE',
            table_name='users',
            record_id=user_id,
            new_values={'action': 'subscription_cancelled'}
        )

        return jsonify({
            "status": "success",
            "message": "Subscription has been cancelled"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error cancelling subscription: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to cancel subscription"
        }), 500


# ============================================
# STRIPE WEBHOOK HANDLER
# ============================================

@parent_subscription_bp.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhook events for payment processing

    Events handled:
    - payment_intent.succeeded: Activate premium subscription for 30 days

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

        if event_type == 'payment_intent.succeeded':
            handle_payment_succeeded(event['data']['object'])
        else:
            current_app.logger.info(f"Unhandled event type: {event_type}")

        return jsonify({"status": "success"}), 200

    except Exception as e:
        current_app.logger.error(f"Webhook error: {str(e)}")
        return jsonify({"error": str(e)}), 500


def handle_payment_succeeded(payment_intent):
    """
    Handle successful payment and activate premium subscription

    Args:
        payment_intent: Stripe PaymentIntent object
    """
    try:
        metadata = payment_intent.get('metadata', {})
        user_id = metadata.get('user_id')

        if not user_id:
            current_app.logger.warning("No user_id in payment_intent metadata")
            return

        # Calculate subscription expiry (30 days from now for monthly)
        from datetime import datetime, timedelta
        expiry_date = (datetime.now() + timedelta(days=30)).date()

        # Update user subscription in users table
        sr_client.table('users')\
            .update({
                'is_subscribed': True,
                'subscription_expires': expiry_date.isoformat()
            })\
            .eq('user_id', user_id)\
            .execute()

        current_app.logger.info(f"Premium subscription activated for user {user_id} until {expiry_date}")

        # Log action
        log_action(
            user_id=user_id,
            action_type='UPDATE',
            table_name='users',
            record_id=user_id,
            new_values={
                'action': 'premium_subscription_activated',
                'amount': payment_intent.get('amount') / 100,
                'expires': expiry_date.isoformat()
            }
        )

    except Exception as e:
        current_app.logger.error(f"Error handling payment succeeded: {str(e)}")
        raise
