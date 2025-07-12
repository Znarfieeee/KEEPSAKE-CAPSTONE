from flask import Blueprint, request, jsonify
from datetime import datetime
from config.settings import supabase
from gotrue.errors import AuthApiError
import jwt

facility_bp = Blueprint('facility', __name__)


# TRASH
@facility_bp.route('/auth/create_facility', methods=['POST'])
def create_facility():
    try:
        data = request.json
        sb = supabase
        user = sb.auth.get_user()
        print(dir(sb))
        
        
        facility_name = data.get("facility_name")
        address = data.get("address")
        city = data.get("city")
        zip_code = data.get("zip_code")
        contact_number = data.get("contact_number")
        email = data.get("email")
        website = data.get("website")
        sub_status = data.get("sub_status")
        sub_exp = data.get("sub_exp")
        
        facility_payload = {
            "FACILITY_NAME": facility_name,
            "ADDRESS": address,
            "CITY": city,
            "ZIP_CODE": zip_code,
            "CONTACT_NUMBER": contact_number,
            "EMAIL": email,
            "WEBSITE": website,
            "SUB_STATUS": sub_status,
            "SUB_EXP": sub_exp,
            "CREATED_AT": datetime.utcnow().isoformat(),
            # "CREATED_BY": user_id,
        }
        
        # facility_response = sb.table("HEALTHCARE_FACILITIES").insert(facility_payload).execute()
        
        # if facility_response.get("error"):
        #     return jsonify({
        #         "status": "error",
        #         "message": "Failed to create facility. Check RLS and payload.",
        #         "details": facility_response["error"]["message"],
        #     }), 400
        
        # new_facility = facility_response.data[0]
        
        return jsonify({
            "status": "success",
            "message": "Facility created successfully",
            "data": facility_payload,
            # "facility_id": new_facility["FACILITY_ID"],
            }), 200
        
        
        
    except AuthApiError as e:
        return jsonify({
            "status": "error",
            "message": f"Error creating facility: {str(e)}"
        }), 500
    
# Wala pa nahuman
@facility_bp.route('/auth/get_facility_by_id', methods=['GET'])
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
        
