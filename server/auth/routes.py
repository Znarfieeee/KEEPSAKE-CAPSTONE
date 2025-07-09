from flask import Blueprint, request, jsonify
from config.settings import supabase
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/create_user', methods=['POST'])
def create_user():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    role = data.get('role')
    
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    response = supabase.table("USERS").insert({
        "EMAIL": email,
        "PASSWORD": hashed_password.decode('utf-8'),
        "FIRSTNAME": firstname,
        "LASTNAME": lastname,
        "ROLE": role
    }).execute()
    
    return jsonify({"message": "Account created successfully!", "status":"success"}), 201

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