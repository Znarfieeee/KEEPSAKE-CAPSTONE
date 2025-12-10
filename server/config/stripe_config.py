# """
# Stripe Configuration Module
# Manages Stripe SDK initialization and pricing configuration for parent subscriptions
# """

# # import stripe
# import os
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Initialize Stripe with secret key
# stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# # Stripe webhook signing secret for verifying webhook events
# STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# # Parent plan pricing (in cents for Stripe API, Philippine Peso currency)
# PARENT_PLAN_PRICING = {
#     'free': 0,           # ₱0/month - Free plan
#     'premium': 29900     # ₱299/month - Premium plan (in cents: 299.00 * 100)
# }

# # Stripe Product and Price IDs (configured in Stripe Dashboard)
# # These should be set up in your Stripe account and added to .env
# STRIPE_PRODUCTS = {
#     'premium': os.environ.get('STRIPE_PREMIUM_PRICE_ID'),  # Price ID for premium subscription
# }

# # Currency code for all transactions
# CURRENCY = 'PHP'  # Philippine Peso

# def get_stripe_client():
#     """
#     Returns the configured Stripe client instance

#     Returns:
#         stripe: Configured Stripe SDK client
#     """
#     return stripe


# def validate_stripe_config():
#     """
#     Validates that all required Stripe configuration is present

#     Raises:
#         ValueError: If required Stripe configuration is missing
#     """
#     if not stripe.api_key:
#         raise ValueError("STRIPE_SECRET_KEY environment variable is not set")

#     if not STRIPE_WEBHOOK_SECRET:
#         raise ValueError("STRIPE_WEBHOOK_SECRET environment variable is not set")

#     if not STRIPE_PRODUCTS.get('premium'):
#         raise ValueError("STRIPE_PREMIUM_PRICE_ID environment variable is not set")


# def get_plan_price(plan_type):
#     """
#     Get the price for a subscription plan

#     Args:
#         plan_type (str): Plan type ('free' or 'premium')

#     Returns:
#         int: Price in cents

#     Raises:
#         ValueError: If plan_type is invalid
#     """
#     if plan_type not in PARENT_PLAN_PRICING:
#         raise ValueError(f"Invalid plan type: {plan_type}")

#     return PARENT_PLAN_PRICING[plan_type]


# def get_stripe_price_id(plan_type):
#     """
#     Get the Stripe Price ID for a subscription plan

#     Args:
#         plan_type (str): Plan type ('premium')

#     Returns:
#         str: Stripe Price ID

#     Raises:
#         ValueError: If plan_type doesn't have a Stripe product
#     """
#     if plan_type == 'free':
#         return None  # Free plan doesn't have a Stripe product

#     if plan_type not in STRIPE_PRODUCTS:
#         raise ValueError(f"No Stripe product configured for plan: {plan_type}")

#     price_id = STRIPE_PRODUCTS[plan_type]
#     if not price_id:
#         raise ValueError(f"Stripe Price ID not configured for plan: {plan_type}")

#     return price_id


# # Export commonly used items
# __all__ = [
#     'stripe',
#     'get_stripe_client',
#     'STRIPE_WEBHOOK_SECRET',
#     'PARENT_PLAN_PRICING',
#     'STRIPE_PRODUCTS',
#     'CURRENCY',
#     'validate_stripe_config',
#     'get_plan_price',
#     'get_stripe_price_id'
# ]
