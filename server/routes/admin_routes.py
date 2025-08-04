from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from config.settings import supabase, supabase_service_role_client
from gotrue.errors import AuthApiError
from utils.access_control import require_auth, require_role
import jwt
import json
from utils.redis_client import redis_client
from utils.gen_password import generate_password

# Use project-specific cookie names instead of the Supabase defaults
ACCESS_COOKIE = "keepsake_session"      # short-lived JWT
REFRESH_COOKIE = "keepsake_session"    # long-lived refresh token
SESSION_PREFIX = "keepsake_session:"
SESSION_TIMEOUT = 1800 #30 minutes
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
    