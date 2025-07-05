from flask import Blueprint, request, jsonify
from config.settings import supabase
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/create_user', methods=['GET','POST'])
def create_user():
    data = request.json
    email = data.get('email')
    
    
    return jsonify({"message": "Account created successfully!", "status":"sucess"}), 201

@auth_bp.route('/login', methods=['GET','POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    result = supabase.auth.sign_in_with_password({"email": email, "password": password})
    if result.get('error'):
        return jsonify({"error": result['error']['message']}), 401
    return jsonify({"session": result['session']}), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    result = supabase.auth.sign_out()
    return jsonify({"message": "Logged out"}), 200