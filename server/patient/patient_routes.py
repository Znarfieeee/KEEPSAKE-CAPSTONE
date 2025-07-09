from flask import Blueprint, request, jsonify
from config.settings import supabase, get_user_supabase_client
from datetime import datetime

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/create_patient', methods=['POST'])
def create_patient():
    try:
        data = request.json

        # PATIENT TABLE
        patient_id = data.get('patient_id')
        firstname = data.get('firstname')
        lastname = data.get('lastname')
        dob = data.get('dob')
        gender = data.get('gender')
        weight = data.get('weight')
        height = data.get('height')
        blood_type = data.get('blood_type')
        gestation_weeks = data.get('gestation_weeks')
        is_active = True
        facility_id = data.get('facility_id') 

        sb = get_user_supabase_client()

        patient_insert_res = sb.table('PATIENTS').insert({
            'FIRSTNAME': firstname,
            'LASTNAME': lastname,
            'DATE_OF_BIRTH': dob,
            'GENDER': gender,
            'BIRTH_WEIGHT': weight,
            'BIRTH_HEIGHT': height,
            'BLOOD_TYPE': blood_type,
            'GESTATION_WEEKS': gestation_weeks,
            'IS_ACTIVE': is_active,
        }).execute()

        if patient_insert_res.get('error'):
            return jsonify({'message': patient_insert_res['error']['message'], 'status': 'error'}), 400

        new_patient = patient_insert_res.data[0]
        patient_id = new_patient['PATIENT_ID']

        # Link patient to the facility so the SELECT policies work
        current_user_id = sb.auth.get_user().user.id if sb.auth.get_user() else None
        pf_insert_res = sb.table('PATIENT_FACILITY').insert({
            'PATIENT_ID': patient_id,
            'FACILITY_ID': facility_id,
            'ASSIGNED_BY': current_user_id,
            'NOTES': None,
            'IS_ACTIVE': True,
        }).execute()

        if pf_insert_res.get('error'):
            return jsonify({'message': pf_insert_res['error']['message'], 'status': 'error'}), 400

        return jsonify({'message': 'Patient created successfully', 'patient_id': patient_id, 'status': 'success'}), 201
    except Exception as e:
        return jsonify({"message": "Error creating patient"}), 500

@patient_bp.route('/add_anthropometric', methods=['POST'])
def add_anthropometric():
    try:
        data = request.json
        
        # ANTHROPOMETRIC TABLE
        patient_id = data.get('patient_id')
        am_weight = data.get('am_weight')
        am_height = data.get('am_height')
        am_head_cc = data.get('am_head_cc')
        am_chest_cc = data.get('am_chest_cc')
        am_ag = data.get('am_ag')
        
        
        return jsonify({"message": "Anthropometric added successfully"}), 200
        
    except Exception as e:
        return jsonify({"message": "Error adding anthropometric"}), 500

@patient_bp.route('/add_allergy', methods=['POST'])
def add_allergy():
    try:
        data = request.json
        
        # ALLERGIES TABLE
        allergen = data.get('allergen')
        reaction_type = data.get('reaction_type')
        severity = data.get('severity')
        date_identified = data.get('date_identified')
        notes = data.get('notes')
        
        
        
        
    except Exception as e:
        return jsonify({"message": "Error adding allergy"}), 500
