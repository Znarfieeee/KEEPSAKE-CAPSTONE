from flask import Blueprint, request, jsonify
from config.settings import get_user_supabase_client
from datetime import datetime

facility_bp = Blueprint('facility', __name__)

@facility_bp.route('/create_facility', methods=['POST'])
def create_facility():
    try:
        data = request.json
        
        # Required fields validation
        required_fields = ['facility_name', 'address', 'city', 'zip_code', 'contact_number', 'email']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        sb = get_user_supabase_client()
        
        # Insert facility - will only work if user is admin due to RLS policy
        facility_insert = sb.table('HEALTHCARE_FACILITIES').insert({
            'FACILITY_NAME': data.get('facility_name'),
            'ADDRESS': data.get('address'),
            'CITY': data.get('city'),
            'ZIP_CODE': data.get('zip_code'),
            'CONTACT_NUMBER': data.get('contact_number'),
            'EMAIL': data.get('email'),
            'WEBSITE': data.get('website'),
            'SUB_STATUS': data.get('sub_status', 'active'),  # Default to active
            'SUB_EXP': data.get('sub_expiry'),
            'CREATED_AT': datetime.utcnow().isoformat()
        }).execute()

        if facility_insert.get('error'):
            return jsonify({
                "status": "error",
                "message": "Failed to create facility. Make sure you have admin privileges.",
                "details": facility_insert['error']['message']
            }), 403

        new_facility = facility_insert.data[0]

        return jsonify({
            "status": "success",
            "message": "Facility created successfully",
            "facility_id": new_facility['FACILITY_ID']
        }), 201
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error creating facility: {str(e)}"
        }), 500

# Wala pa nahuman
@facility_bp.route('/get_facility_by_id', methods=['GET'])
def get_facility_by_id():
    try:
        facility_id = request.args.get('facility_id')
        if not facility_id:
            return jsonify({
                "status": "error",
                "message": "Facility ID is required"
            }), 400
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error getting facility by ID: {str(e)}",
            "details": str(e)
        }), 500

@facility_bp.route('/add_facility_user', methods=['POST'])
def add_facility_user():
    try:
        data = request.json
        
        # After successful facility creation, create a FACILITY_USERS entry for the admin
        # current_user_id = sb.auth.get_user().user.id if sb.auth.get_user() else None
        # if current_user_id:
        #     facility_user_insert = sb.table('FACILITY_USERS').insert({
        #         'FACILITY_ID': new_facility['FACILITY_ID'],
        #         'USER_ID': current_user_id,
        #         'ROLE': 'admin',
        #         'START_DATE': datetime.utcnow().date().isoformat()
        #     }).execute()

        #     if facility_user_insert.get('error'):
        #         # Log this error but don't fail the request since facility was created
        #         print(f"Warning: Failed to create facility_user record: {facility_user_insert['error']}")
        
        return jsonify({
            "status": "success",
            "message": "Facility user added successfully"
            }), 201
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error adding facility user: {str(e)}",
            "details": str(e)
        }), 500
        
