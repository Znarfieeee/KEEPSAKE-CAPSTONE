from flask import Flask, Blueprint, current_app, request, jsonify
from utils.access_control import require_auth, require_role
from utils.redis_client import get_redis_client

appointment_bp = Blueprint('appointment', __name__)
redis_client = get_redis_client()

APPOINTMENT_CACHE_KEY = 'appointments:all'
APPOINTMENT_CACHE_PREFIX = 'appointments:'

@appointment_bp.route('/pediapro/appointments', methods=['GET'])
@require_auth
@require_role('facility_admin', 'doctor', 'nurse', 'staff')
def get_appointments():
    return