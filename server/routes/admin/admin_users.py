from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase
from gotrue.errors import AuthApiError
from datetime import datetime

# Create blueprint for user routes
users_bp = Blueprint('users', __name__)

@users_bp.route('/admin/add_user', methods=['POST'])
def add_user():
    """Register a new user in Supabase Auth and mirror the data in the public.users table."""

    data = request.json or {}

    email = data.get("email")
    password = data.get("password")
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    specialty = data.get("specialty")
    role = data.get("role")
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