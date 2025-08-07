from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_anon_client
from gotrue.errors import AuthApiError
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/admin/add_user', methods=['POST'])
@require_auth
@require_role('admin')
def add_user():
    """Register a new user in Supabase Auth and mirror the data in the public.users table."""

    data = request.json or {}

    email = data.get("email")
    password = data.get("password")
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    specialty = data.get("specialty")
    role = data.get("role")
    plan = data.get('plan')
    sub_expiry = data.get('subscription_expires')
    license_number = data.get("license_number")
    phone_number = data.get("phone_number")

    # Basic validation
    if not email or not password:
        return (
            jsonify({"status": "error", "message": "Email and password are required."}),
            400,
        )
        
    if not firstname or not lastname or not phone_number:
        return (
            jsonify({"status": "error", "message": "Firstname, lastname, and phone number are required."}),
            400,
        )
        
    try:
        signup_resp = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "firstname": firstname,
                        "lastname": lastname,
                        "specialty": specialty,
                        "role": role,
                        "plan": plan,
                        "subscription_expires": sub_expiry,
                        "license_number": license_number,
                        "phone_number": phone_number,
                    }
                },
            }
        )

        # Supabase returns None for user when email confirmation is required.
        if signup_resp.user is None:
            return (
                jsonify({
                    "status": "pending",
                    "message": "Signup successful. Please confirm your email to activate your account.",
                }),
                202,
            )

        user_id = signup_resp.user.id

        return (
            jsonify({
                "status": "success",
                "message": "User created successfully.",
                "user": {
                    "id": user_id,
                    "email": email,
                    "firstname": firstname,
                    "lastname": lastname,
                    "role": role,
                    "metadata": signup_resp.user.user_metadata,
                },
            }),
            201,
        )

    except AuthApiError as auth_error:
        # Specific Supabase Auth failures (e.g., duplicate email)
        return (
            jsonify({"status": "error", "message": str(auth_error)}),
            400,
        )
    except Exception as e:
        # Generic failures
        return (
            jsonify({"status": "error", "message": f"Failed to create user: {str(e)}"}),
            500,
        )
        
""" USE THE SUPABASE REAL-TIME 'GET' METHOD TO GET THE LIST OF FACILITIES """
# @users_bp.route('/admin/users', methods=['GET'])
# @require_auth
# @require_role('admin')
# def get_all_users():
#     """Get all users with their roles, status, and facility assignments"""
#     try:
#         # Get users data from the database
#         response = supabase.table('users').select('*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))').neq('role', 'admin').execute()
        
#         if getattr(response, 'error', None):
#             current_app.logger.error(f"Failed to fetch users: {response.error}")
#             return jsonify({
#                 "status": "error",
#                 "message": "Failed to fetch users"
#             }), 500
            
#         return jsonify({
#             "status": "success",
#             "data": response.data,
#             "count": len(response.data)
#         }), 200

#     except Exception as e:
#         current_app.logger.error(f"Error fetching users: {str(e)}")
#         return jsonify({
#             "status": "error",
#             "message": f"An error occurred while fetching users: {str(e)}"
#         }), 500

@users_bp.route('/admin/users/<user_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_user_by_id(user_id):
    """ Get a specific user with their facility assignment.
    Like looking up a specific employee's complete profile. """
    
    try:
        response = supabase.table('users').select(
            '*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))'
        ).eq('user_id', user_id).execute()
        
        if response.data:
            user = response.data[0]
                
            return jsonify({
                "status": "success",
                "data": user
            })
        
        else:
            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404
    
    except Exception as e:
        current_app.logger.error(f"Error fetching user {user_id} : {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch user"
        }), 500
    