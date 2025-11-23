from flask import Blueprint, request, jsonify, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from datetime import datetime
from utils.audit_logger import log_action

vaccinations_bp = Blueprint('vaccinations', __name__)

@vaccinations_bp.route('/pediapro/patients/<patient_id>/vaccinations', methods=['POST'])
@require_auth
@require_role('doctor', 'admin', 'nurse', 'facility_admin')
def create_vaccination(patient_id):
    """Create a new vaccination record for a patient"""
    try:
        user_id = request.current_user.get('id')
        data = request.get_json()

        # Validate required fields
        if not data.get('vaccine_name'):
            return jsonify({
                "status": "error",
                "message": "Vaccine name is required"
            }), 400

        # Prepare vaccination data with HIPAA-compliant fields
        vaccination_data = {
            'patient_id': patient_id,
            'vaccine_name': data.get('vaccine_name'),
            'dose_number': data.get('dose_number'),
            'administered_date': data.get('administered_date'),
            'administered_by': user_id,
            'manufacturer': data.get('manufacturer'),
            'lot_number': data.get('lot_number'),
            'administration_site': data.get('administration_site'),
            'next_dose_due': data.get('next_dose_due'),
            'notes': data.get('notes'),
            'visit_id': data.get('visit_id'),
            # HIPAA-compliant fields
            'route_of_administration': data.get('route_of_administration'),
            'body_site': data.get('body_site'),
            'vaccine_expiration_date': data.get('vaccine_expiration_date'),
            'vis_publication_date': data.get('vis_publication_date'),
            'vis_given_date': data.get('vis_given_date'),
            'adverse_reaction': data.get('adverse_reaction', False),
            'adverse_reaction_details': data.get('adverse_reaction_details')
        }

        # Remove None values
        vaccination_data = {k: v for k, v in vaccination_data.items() if v is not None}

        # Insert vaccination record
        response = supabase.table('vaccinations').insert(vaccination_data).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Error creating vaccination: {response.error.message}")
            return jsonify({
                "status": "error",
                "message": f"Failed to create vaccination: {response.error.message}"
            }), 500

        # Get the created vaccination with administered_by user info
        vaccination = response.data[0] if response.data else None

        if vaccination:
            # Fetch user info for administered_by
            user_response = supabase.table('users').select('firstname, lastname').eq('user_id', user_id).execute()
            if user_response.data:
                user = user_response.data[0]
                vaccination['administered_by_name'] = f"{user.get('firstname', '')} {user.get('lastname', '')}".strip()

        # Log the action
        log_action(
            user_id=user_id,
            action_type='CREATE',
            table_name='vaccinations',
            record_id=vaccination.get('vax_id') if vaccination else None,
            patient_id=patient_id,
            new_values=vaccination_data
        )

        return jsonify({
            "status": "success",
            "message": "Vaccination record created successfully",
            "data": vaccination
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error creating vaccination: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500


@vaccinations_bp.route('/pediapro/patients/<patient_id>/vaccinations/<vax_id>', methods=['PUT'])
@require_auth
@require_role('doctor', 'admin', 'nurse', 'facility_admin')
def update_vaccination(patient_id, vax_id):
    """Update a vaccination record"""
    try:
        user_id = request.current_user.get('id')
        data = request.get_json()

        # Get existing vaccination (only non-deleted records)
        existing_response = supabase.table('vaccinations')\
            .select('*')\
            .eq('vax_id', vax_id)\
            .eq('patient_id', patient_id)\
            .eq('is_deleted', False)\
            .execute()

        if not existing_response.data:
            return jsonify({
                "status": "error",
                "message": "Vaccination record not found or has been deleted"
            }), 404

        old_vaccination = existing_response.data[0]

        # Prepare update data with HIPAA-compliant fields
        update_data = {}
        allowed_fields = [
            'vaccine_name', 'dose_number', 'administered_date', 'manufacturer',
            'lot_number', 'administration_site', 'next_dose_due', 'notes',
            # HIPAA-compliant fields
            'route_of_administration', 'body_site', 'vaccine_expiration_date',
            'vis_publication_date', 'vis_given_date', 'adverse_reaction', 'adverse_reaction_details'
        ]

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        if not update_data:
            return jsonify({
                "status": "error",
                "message": "No valid fields to update"
            }), 400

        # Update vaccination record
        response = supabase.table('vaccinations').update(update_data).eq('vax_id', vax_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Error updating vaccination: {response.error.message}")
            return jsonify({
                "status": "error",
                "message": f"Failed to update vaccination: {response.error.message}"
            }), 500

        vaccination = response.data[0] if response.data else None

        # Log the action
        log_action(
            user_id=user_id,
            action_type='UPDATE',
            table_name='vaccinations',
            record_id=vax_id,
            patient_id=patient_id,
            old_values=old_vaccination,
            new_values=update_data
        )

        return jsonify({
            "status": "success",
            "message": "Vaccination record updated successfully",
            "data": vaccination
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating vaccination: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500


@vaccinations_bp.route('/pediapro/patients/<patient_id>/vaccinations/<vax_id>', methods=['DELETE'])
@require_auth
@require_role('doctor', 'admin', 'nurse', 'facility_admin')
def delete_vaccination(patient_id, vax_id):
    """Soft delete a vaccination record (HIPAA/GDPR compliant)"""
    try:
        user_id = request.current_user.get('id')

        # Get existing vaccination for audit log (only non-deleted records)
        existing_response = supabase.table('vaccinations')\
            .select('*')\
            .eq('vax_id', vax_id)\
            .eq('patient_id', patient_id)\
            .eq('is_deleted', False)\
            .execute()

        if not existing_response.data:
            return jsonify({
                "status": "error",
                "message": "Vaccination record not found or already deleted"
            }), 404

        old_vaccination = existing_response.data[0]

        # Soft delete: Set is_deleted flag, deleted_at timestamp, and deleted_by user
        # Use service role client to bypass RLS for administrative soft delete operation
        sr_client = supabase_service_role_client()
        response = sr_client.table('vaccinations')\
            .update({
                'is_deleted': True,
                'deleted_at': datetime.now().isoformat(),
                'deleted_by': user_id
            })\
            .eq('vax_id', vax_id)\
            .execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Error soft-deleting vaccination: {response.error.message}")
            return jsonify({
                "status": "error",
                "message": f"Failed to delete vaccination: {response.error.message}"
            }), 500

        # Log the soft delete action
        log_action(
            user_id=user_id,
            action_type='DELETE',
            table_name='vaccinations',
            record_id=vax_id,
            patient_id=patient_id,
            old_values=old_vaccination,
            new_values={'is_deleted': True, 'deleted_at': datetime.now().isoformat(), 'deleted_by': user_id}
        )

        return jsonify({
            "status": "success",
            "message": "Vaccination record deleted successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting vaccination: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500


@vaccinations_bp.route('/pediapro/patients/<patient_id>/vaccinations/<vax_id>/restore', methods=['POST'])
@require_auth
@require_role('admin', 'facility_admin')
def restore_vaccination(patient_id, vax_id):
    """Restore a soft-deleted vaccination record (Admin only - HIPAA/GDPR compliance)"""
    try:
        user_id = request.current_user.get('id')

        # Use service role client to access deleted records and perform restore
        sr_client = supabase_service_role_client()

        # Get soft-deleted vaccination
        existing_response = sr_client.table('vaccinations')\
            .select('*')\
            .eq('vax_id', vax_id)\
            .eq('patient_id', patient_id)\
            .eq('is_deleted', True)\
            .execute()

        if not existing_response.data:
            return jsonify({
                "status": "error",
                "message": "Deleted vaccination record not found"
            }), 404

        old_vaccination = existing_response.data[0]

        # Restore: Clear is_deleted flag, deleted_at and deleted_by
        response = sr_client.table('vaccinations')\
            .update({
                'is_deleted': False,
                'deleted_at': None,
                'deleted_by': None
            })\
            .eq('vax_id', vax_id)\
            .execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Error restoring vaccination: {response.error.message}")
            return jsonify({
                "status": "error",
                "message": f"Failed to restore vaccination: {response.error.message}"
            }), 500

        # Log the restore action
        log_action(
            user_id=user_id,
            action_type='UPDATE',
            table_name='vaccinations',
            record_id=vax_id,
            patient_id=patient_id,
            old_values={'is_deleted': True, 'deleted_at': old_vaccination.get('deleted_at'), 'deleted_by': old_vaccination.get('deleted_by')},
            new_values={'is_deleted': False, 'deleted_at': None, 'deleted_by': None, 'restored_by': user_id}
        )

        vaccination = response.data[0] if response.data else None

        return jsonify({
            "status": "success",
            "message": "Vaccination record restored successfully",
            "data": vaccination
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error restoring vaccination: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500
