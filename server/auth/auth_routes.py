from flask import Blueprint, request, jsonify
from config.settings import supabase
import datetime

auth_bp = Blueprint('auth', __name__)

# Invite a new user to the platform via email
@auth_bp.route('/create_invite', methods=['POST'])
def create_invite():
    """Create an invitation for a new user using Supabase's invite system"""
    data = request.json
    email = data.get('email')
    child_id = data.get('child_id')
    created_by = data.get('created_by')
    
    try:
        invite_result = supabase.table('INVITE_TOKENS').insert({
            'EMAIL': email,
            'CHILD_ID': child_id,
            'TOKEN': None,  # Supabase will handle the actual invite token
            'EXPIRES_AT': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'CREATED_BY': created_by
        }).execute()

        if invite_result.get('error'):
            raise Exception(invite_result.get('error'))

        # Use Supabase's invite user functionality
        invite = supabase.auth.admin.invite_user({
            'email': email,
            'data': {
                'invite_id': invite_result.data[0]['INV_ID']
            }
        })
        
        return jsonify({
            "message": "Invite sent successfully",
            "status": "success"
        }), 201

    except Exception as e:
        return jsonify({
            "message": f"Failed to create invite: {str(e)}",
            "status": "error"
        }), 400


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    result = supabase.auth.sign_in_with_password({"email": email, "encrypted_password": password})
    if result.get('error'):
        return jsonify({"error": result['error']['message']}), 401
    return jsonify({"message": "Login successful!", "status": "success", "session": result['session']}), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    result = supabase.auth.sign_out()
    return jsonify({"message": "Logged out"}), 200