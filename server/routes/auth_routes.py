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
    role = data.get('role')
    
    try:
        invite_result = supabase.table('INVITE_TOKENS').insert({
            'EMAIL': email,
            'CHILD_ID': child_id,
            'TOKEN': None,  # Supabase will handle the actual invite token
            'EXPIRES_AT': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'CREATED_BY': created_by,
            'ROLE': role
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
            
            # Build response without exposing tokens in the body
            response = jsonify({
                "status": "success",
                "message": "Login successful!",
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "token": auth_response.session.access_token,
                    # "role": auth_response.user.user_metadata.role,
                },
                "expires_at": auth_response.session.expires_at,
            })

            # Set HttpOnly, Secure cookies so they are inaccessible to JS
            access_expires = datetime.datetime.utcfromtimestamp(
                auth_response.session.expires_at
            )

            response.set_cookie(
                "sb-access-token",
                auth_response.session.access_token,
                httponly=True,
                secure=True,
                samesite="Strict",
                expires=access_expires,
            )

            # Refresh token is long-lived (1 week sample)
            response.set_cookie(
                "sb-refresh-token",
                auth_response.session.refresh_token,
                httponly=True,
                secure=True,
                samesite="Strict",
                max_age=60 * 60 * 24 * 7,
            )

            return response, 200

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
        response = jsonify({
            "status": "success",
            "message": "Logged out successfully",
        })
        # Clear cookies
        response.delete_cookie("sb-access-token")
        response.delete_cookie("sb-refresh-token")

        return response, 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Error during logout",
            "details": str(e)
        }), 500