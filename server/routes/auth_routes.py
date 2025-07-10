from flask import Blueprint, request, jsonify
from config.settings import supabase
import datetime
from gotrue.errors import AuthApiError

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
    try:
        data = request.json
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400

        email = data.get('email')
        password = data.get('password')

        # Attempt to sign in
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            # On success, auth_response.user and auth_response.session will be available
            return jsonify({
                "status": "success",
                "message": "Login successful!",
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "created_at": auth_response.user.created_at
                },
                "session": {
                    "access_token": auth_response.session.access_token,
                    "expires_at": auth_response.session.expires_at
                }
            }), 200

        except AuthApiError as auth_error:
            # Handle specific Supabase auth errors
            return jsonify({
                "status": "error",
                "message": "Invalid login credentials",
                "details": str(auth_error)
            }), 401

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "An error occurred during login",
            "details": str(e)
        }), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        supabase.auth.sign_out()
        return jsonify({
            "status": "success",
            "message": "Logged out successfully"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Error during logout",
            "details": str(e)
        }), 500