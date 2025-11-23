from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from postgrest.exceptions import APIError as AuthApiError
import json
import traceback
import uuid

# Create blueprint for parent routes
parent_bp = Blueprint('parent', __name__)


def is_valid_uuid(value):
    """Validate that a string is a valid UUID"""
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

@parent_bp.route('/parent/children', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_children():
    """
    Get all children (patients) that a parent has access to.
    Returns patient information with their medical data access.
    """
    try:
        current_user = request.current_user
        user_id = current_user.get('id')

        current_app.logger.info(f"AUDIT: Parent {current_user.get('email')} requesting children list")

        # Get all active parent_access records for this user
        access_resp = supabase.table('parent_access').select('''
            access_id,
            patient_id,
            relationship,
            granted_at,
            is_active,
            patients!parent_access_patient_id_fkey(
                patient_id,
                firstname,
                lastname,
                middlename,
                date_of_birth,
                sex,
                bloodtype,
                created_at
            )
        ''').eq('user_id', user_id).eq('is_active', True).execute()

        if getattr(access_resp, 'error', None):
            current_app.logger.error(f"Error fetching parent's children: {access_resp.error.message}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch children",
                "details": access_resp.error.message if access_resp.error else "Unknown"
            }), 400

        children_data = []
        for access_record in access_resp.data:
            patient = access_record.get('patients')
            if patient:
                # Calculate age for each child
                try:
                    age_resp = supabase.rpc('calculate_age', {
                        'date_of_birth': patient['date_of_birth']
                    }).execute()

                    if age_resp.data is not None:
                        age_data = age_resp.data
                        patient['age_info'] = {
                            'formatted_age': age_data.get('formatted_age', 'Unknown'),
                            'years': age_data.get('years', 0),
                            'months': age_data.get('months', 0),
                            'days': age_data.get('days', 0),
                        }
                        patient['age'] = age_data.get('formatted_age')
                except Exception as age_error:
                    current_app.logger.warning(f"Age calculation failed for patient {patient['patient_id']}: {str(age_error)}")
                    patient['age'] = 'Unknown'

                children_data.append({
                    'access_id': access_record['access_id'],
                    'relationship': access_record['relationship'],
                    'granted_at': access_record['granted_at'],
                    'patient': patient
                })

        current_app.logger.info(f"AUDIT: Successfully fetched {len(children_data)} children for parent {current_user.get('email')}")

        return jsonify({
            "status": "success",
            "data": children_data,
            "count": len(children_data)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_parent_children: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred while fetching children"
        }), 500

@parent_bp.route('/parent/child/<patient_id>', methods=['GET'])
@require_auth
@require_role('parent', 'keepsaker')
def get_child_details(patient_id):
    """
    Get detailed information about a specific child (read-only).
    Verifies that the parent has access to this child.
    """
    try:
        # Validate patient_id format
        if not patient_id or not is_valid_uuid(patient_id):
            return jsonify({
                "status": "error",
                "message": "Invalid patient ID format"
            }), 400

        current_user = request.current_user
        user_id = current_user.get('id')

        current_app.logger.info(f"AUDIT: Parent {current_user.get('email')} requesting details for child {patient_id}")

        # Use service role client to bypass RLS for parent access verification and data fetching
        service_client = supabase_service_role_client()

        # Verify parent has access to this child
        access_check = service_client.table('parent_access')\
            .select('access_id, relationship')\
            .eq('user_id', user_id)\
            .eq('patient_id', patient_id)\
            .eq('is_active', True)\
            .execute()

        if not access_check.data or len(access_check.data) == 0:
            current_app.logger.warning(f"AUDIT: Unauthorized access attempt - Parent {current_user.get('email')} tried to access child {patient_id}")
            return jsonify({
                "status": "error",
                "message": "You do not have access to this child's records"
            }), 403

        # Get patient data with all related records using service role client
        patient_resp = service_client.table('patients')\
            .select('*')\
            .eq('patient_id', patient_id)\
            .single()\
            .execute()

        if getattr(patient_resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Child not found",
                "details": patient_resp.error.message if patient_resp.error else "Unknown"
            }), 404

        patient_data = patient_resp.data

        # Calculate age
        try:
            age_resp = service_client.rpc('calculate_age', {'date_of_birth': patient_data['date_of_birth']}).execute()
            if age_resp.data is not None:
                age_data = age_resp.data
                patient_data['age_info'] = {
                    'formatted_age': age_data.get('formatted_age', 'Unknown'),
                    'years': age_data.get('years', 0),
                    'months': age_data.get('months', 0),
                    'days': age_data.get('days', 0),
                }
                patient_data['age'] = age_data.get('formatted_age')
        except Exception as age_error:
            current_app.logger.warning(f"Age calculation failed: {str(age_error)}")
            patient_data['age'] = 'Unknown'

        # Get all related medical records using service role client to bypass RLS
        related_data = {}

        try:
            # Delivery record
            delivery_resp = service_client.table('delivery_record').select('*').eq('patient_id', patient_id).execute()
            related_data['delivery'] = delivery_resp.data[0] if delivery_resp.data else None

            # Anthropometric measurements
            anthro_resp = service_client.table('anthropometric_measurements')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('measurement_date', desc=True)\
                .execute()
            related_data['anthropometric_measurements'] = anthro_resp.data or []

            # Screening tests
            screening_resp = service_client.table('screening_tests').select('*').eq('patient_id', patient_id).execute()
            related_data['screening'] = screening_resp.data[0] if screening_resp.data else None

            # Allergies
            allergy_resp = service_client.table('allergies')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('date_identified', desc=True)\
                .execute()
            related_data['allergies'] = allergy_resp.data or []

            # Prescriptions with doctor info
            rx_resp = service_client.table('prescriptions').select('''
                *,
                users!prescriptions_doctor_id_fkey(
                    firstname,
                    lastname,
                    specialty
                )
            ''').eq('patient_id', patient_id).order('prescription_date', desc=True).execute()
            related_data['prescriptions'] = rx_resp.data or []

            # Vaccinations
            vaccination_resp = service_client.table('vaccinations')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('administered_date', desc=True)\
                .execute()
            related_data['vaccinations'] = vaccination_resp.data or []

            # Appointments with doctor info
            appointments_resp = service_client.table('appointments').select('''
                *,
                users!appointments_doctor_id_fkey(
                    firstname,
                    lastname,
                    specialty
                )
            ''').eq('patient_id', patient_id).order('appointment_date', desc=True).execute()
            related_data['appointments'] = appointments_resp.data or []

        except Exception as related_error:
            current_app.logger.error(f"Error fetching related records: {str(related_error)}")
            # Initialize empty arrays if there's an error
            related_data = {
                'delivery': None,
                'anthropometric_measurements': [],
                'screening': None,
                'allergies': [],
                'prescriptions': [],
                'vaccinations': [],
                'appointments': []
            }

        patient_data['related_records'] = related_data
        patient_data['relationship'] = access_check.data[0]['relationship']

        current_app.logger.info(f"AUDIT: Successfully fetched child details for parent {current_user.get('email')}")

        return jsonify({
            "status": "success",
            "data": patient_data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_child_details: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred while fetching child details"
        }), 500

@parent_bp.route('/parent/child/<patient_id>/appointments', methods=['GET'])
@require_auth
@require_role('parent', 'keepsaker')
def get_child_appointments(patient_id):
    """Get appointments for a specific child"""
    try:
        # Validate patient_id format
        if not patient_id or not is_valid_uuid(patient_id):
            return jsonify({
                "status": "error",
                "message": "Invalid patient ID format"
            }), 400

        current_user = request.current_user
        user_id = current_user.get('id')

        # Verify access
        access_check = supabase.table('parent_access')\
            .select('access_id')\
            .eq('user_id', user_id)\
            .eq('patient_id', patient_id)\
            .eq('is_active', True)\
            .execute()

        if not access_check.data or len(access_check.data) == 0:
            return jsonify({
                "status": "error",
                "message": "You do not have access to this child's records"
            }), 403

        # Get appointments
        appointments_resp = supabase.table('appointments').select('''
            *,
            users!appointments_doctor_id_fkey(
                firstname,
                lastname,
                specialty
            ),
            healthcare_facilities(
                facility_name,
                address,
                contact_number
            )
        ''').eq('patient_id', patient_id).order('appointment_date', desc=True).execute()

        if getattr(appointments_resp, 'error', None):
            return jsonify({
                "status": "error",
                "message": "Failed to fetch appointments",
                "details": appointments_resp.error.message
            }), 400

        return jsonify({
            "status": "success",
            "data": appointments_resp.data or []
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_child_appointments: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error fetching appointments: {str(e)}"
        }), 500
