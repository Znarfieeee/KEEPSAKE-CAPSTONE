"""
Public Routes - No Authentication Required
These endpoints provide public-facing data for the KEEPSAKE landing pages.
"""

from flask import Blueprint, jsonify, request, current_app
from config.settings import supabase
from utils.redis_client import get_redis_client
import json
import datetime

# Create blueprint for public routes
public_bp = Blueprint('public', __name__)
redis_client = get_redis_client()

PUBLIC_FACILITIES_CACHE_KEY = "public:facilities:active"
PUBLIC_FACILITIES_CACHE_TTL = 600  # 10 minutes


@public_bp.route('/public/facilities', methods=['GET'])
def get_public_facilities():
    """
    Get list of active facilities with valid subscriptions for public display.
    No authentication required.

    Returns only public-safe information:
    - facility_name
    - address
    - city
    - zip_code
    - contact_number
    - email
    - type

    Filters:
    - subscription_status = 'active'
    - subscription_expires > current date
    - deleted_at IS NULL
    """
    try:

        # Fetch from database with filters
        current_date = datetime.datetime.utcnow().isoformat()

        resp = supabase.table('healthcare_facilities')\
            .select('facility_name, address, city, zip_code, contact_number, email, type')\
            .eq('subscription_status', 'active')\
            .gt('subscription_expires', current_date)\
            .is_('deleted_at', 'null')\
            .order('facility_name')\
            .execute()

        if getattr(resp, 'error', None):
            current_app.logger.error(f"Supabase error fetching public facilities: {resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch facilities"
            }), 500

        facilities = resp.data or []

        current_app.logger.info(f"Fetched {len(facilities)} active public facilities from database")

        return jsonify({
            "status": "success",
            "data": facilities,
            "cached": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error fetching public facilities: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while fetching facilities"
        }), 500
