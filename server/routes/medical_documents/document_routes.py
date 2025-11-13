from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_service_role_client
from utils.audit_logger import log_action
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import os

# Create blueprint for medical documents
documents_bp = Blueprint('documents', __name__)

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'tiff', 'tif', 'dcm'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/tif',
    'application/dicom',
    'image/dicom'
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

DOCUMENT_TYPES = ['lab_result', 'imaging_report', 'vaccination_record', 'prescription', 'other']

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def verify_patient_access(user_id, user_role, facility_id, patient_id):
    """
    Verify if user has access to the patient

    Returns:
        tuple: (has_access: bool, error_message: str or None)
    """
    try:
        if user_role == 'parent':
            # Check parent access
            access_check = supabase.table('parent_access')\
                .select('access_id')\
                .eq('user_id', user_id)\
                .eq('patient_id', patient_id)\
                .eq('is_active', True)\
                .execute()

            if not access_check.data:
                return False, "You do not have access to this patient's records"
        else:
            # Check facility access for healthcare staff
            patient_check = supabase.table('facility_patients')\
                .select('facility_patient_id')\
                .eq('facility_id', facility_id)\
                .eq('patient_id', patient_id)\
                .eq('is_active', True)\
                .execute()

            if not patient_check.data:
                return False, "Patient not found in your facility"

        return True, None

    except Exception as e:
        current_app.logger.error(f"Error verifying patient access: {str(e)}")
        return False, "Error verifying patient access"


@documents_bp.route('/documents/upload', methods=['POST'])
@require_auth
@require_role('doctor', 'nurse', 'facility_admin', 'parent')
def upload_document():
    """Upload a medical document for a patient"""
    try:
        current_user = request.current_user
        user_id = current_user.get('id')
        user_role = current_user.get('role')
        facility_id = current_user.get('facility_id')

        # Validate file presence
        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No file provided"
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "status": "error",
                "message": "No file selected"
            }), 400

        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                "status": "error",
                "message": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        # Get form data
        patient_id = request.form.get('patient_id')
        document_type = request.form.get('document_type')
        description = request.form.get('description', '')
        related_appointment_id = request.form.get('related_appointment_id')
        related_prescription_id = request.form.get('related_prescription_id')
        related_vaccination_id = request.form.get('related_vaccination_id')

        # Validate required fields
        if not patient_id:
            return jsonify({
                "status": "error",
                "message": "Patient ID is required"
            }), 400

        if not document_type:
            return jsonify({
                "status": "error",
                "message": "Document type is required"
            }), 400

        if document_type not in DOCUMENT_TYPES:
            return jsonify({
                "status": "error",
                "message": f"Invalid document type. Allowed types: {', '.join(DOCUMENT_TYPES)}"
            }), 400

        # For parents, get facility_id from patient record
        if user_role == 'parent':
            patient_facility = supabase.table('facility_patients')\
                .select('facility_id')\
                .eq('patient_id', patient_id)\
                .eq('is_active', True)\
                .limit(1)\
                .execute()

            if not patient_facility.data:
                return jsonify({
                    "status": "error",
                    "message": "Patient facility not found"
                }), 404

            facility_id = patient_facility.data[0]['facility_id']

        # Verify access to patient
        has_access, error_message = verify_patient_access(user_id, user_role, facility_id, patient_id)
        if not has_access:
            log_action(
                user_id=user_id,
                action_type='DENIED',
                table_name='medical_documents',
                patient_id=patient_id,
                new_values={'reason': error_message}
            )
            return jsonify({
                "status": "error",
                "message": error_message
            }), 403

        # Read file data
        file_bytes = file.read()
        file_size = len(file_bytes)

        # Validate file size
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                "status": "error",
                "message": f"File too large. Maximum size: 10MB"
            }), 400

        # Generate document ID and storage path
        document_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()

        # Storage path format: {facility_id}/{patient_id}/{document_type}/{document_id}_v1.{extension}
        storage_path = f"{facility_id}/{patient_id}/{document_type}/{document_id}_v1.{file_extension}"

        # Upload to Supabase Storage
        try:
            upload_response = supabase.storage.from_('medical-documents').upload(
                storage_path,
                file_bytes,
                {'content-type': file.content_type or 'application/octet-stream'}
            )

            # Check for storage errors
            if hasattr(upload_response, 'error') and upload_response.error:
                current_app.logger.error(f"Storage upload error: {upload_response.error}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to upload file to storage"
                }), 500

        except Exception as storage_error:
            current_app.logger.error(f"Storage upload exception: {str(storage_error)}")
            return jsonify({
                "status": "error",
                "message": "Failed to upload file to storage"
            }), 500

        # Create database record
        document_data = {
            'document_id': document_id,
            'patient_id': patient_id,
            'facility_id': facility_id,
            'document_type': document_type,
            'document_name': filename,
            'description': description,
            'storage_bucket': 'medical-documents',
            'storage_path': storage_path,
            'file_size': file_size,
            'mime_type': file.content_type or 'application/octet-stream',
            'version': 1,
            'is_current_version': True,
            'uploaded_by': user_id
        }

        # Add optional related record IDs
        if related_appointment_id:
            document_data['related_appointment_id'] = related_appointment_id
        if related_prescription_id:
            document_data['related_prescription_id'] = related_prescription_id
        if related_vaccination_id:
            document_data['related_vaccination_id'] = related_vaccination_id

        # Insert into database
        try:
            db_response = supabase.table('medical_documents').insert(document_data).execute()

            if hasattr(db_response, 'error') and db_response.error:
                # Rollback storage upload
                try:
                    supabase.storage.from_('medical-documents').remove([storage_path])
                except:
                    pass

                current_app.logger.error(f"Database insert error: {db_response.error}")
                return jsonify({
                    "status": "error",
                    "message": "Failed to save document metadata"
                }), 500

        except Exception as db_error:
            # Rollback storage upload
            try:
                supabase.storage.from_('medical-documents').remove([storage_path])
            except:
                pass

            current_app.logger.error(f"Database insert exception: {str(db_error)}")
            return jsonify({
                "status": "error",
                "message": "Failed to save document metadata"
            }), 500

        # Audit log
        log_action(
            user_id=user_id,
            action_type='CREATE',
            table_name='medical_documents',
            record_id=document_id,
            patient_id=patient_id,
            new_values={
                'document_type': document_type,
                'filename': filename,
                'file_size': file_size
            }
        )

        current_app.logger.info(
            f"AUDIT: User {user_id} ({user_role}) uploaded {document_type} "
            f"for patient {patient_id} (document_id: {document_id})"
        )

        return jsonify({
            "status": "success",
            "message": "Document uploaded successfully",
            "data": db_response.data[0] if db_response.data else document_data
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error uploading document: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": "An error occurred while uploading the document"
        }), 500


@documents_bp.route('/documents/patient/<patient_id>', methods=['GET'])
@require_auth
@require_role('doctor', 'nurse', 'facility_admin', 'parent', 'staff')
def get_patient_documents(patient_id):
    """Get all documents for a specific patient"""
    try:
        current_user = request.current_user
        user_id = current_user.get('id')
        user_role = current_user.get('role')
        facility_id = current_user.get('facility_id')

        # Get query parameters for filtering
        document_type = request.args.get('document_type')
        include_deleted = request.args.get('include_deleted', 'false').lower() == 'true'

        # Verify access to patient
        has_access, error_message = verify_patient_access(user_id, user_role, facility_id, patient_id)
        if not has_access:
            log_action(
                user_id=user_id,
                action_type='DENIED',
                table_name='medical_documents',
                patient_id=patient_id,
                new_values={'reason': error_message}
            )
            return jsonify({
                "status": "error",
                "message": error_message
            }), 403

        # Build query
        query = supabase.table('medical_documents').select('''
            *,
            uploader:users!medical_documents_uploaded_by_fkey(
                user_id,
                firstname,
                lastname,
                role
            )
        ''').eq('patient_id', patient_id)

        # Apply filters
        if not include_deleted:
            query = query.eq('is_deleted', False)

        if document_type and document_type in DOCUMENT_TYPES:
            query = query.eq('document_type', document_type)

        # Execute query with ordering
        documents = query.order('uploaded_at', desc=True).execute()

        # Generate signed URLs for each document (1 hour expiry)
        if documents.data:
            for doc in documents.data:
                try:
                    signed_url_response = supabase.storage.from_('medical-documents').create_signed_url(
                        doc['storage_path'],
                        3600  # 1 hour expiry
                    )

                    if hasattr(signed_url_response, 'get'):
                        doc['download_url'] = signed_url_response.get('signedURL')
                    else:
                        doc['download_url'] = None
                        current_app.logger.warning(f"Could not generate signed URL for document {doc['document_id']}")

                except Exception as url_error:
                    doc['download_url'] = None
                    current_app.logger.error(f"Error generating signed URL: {str(url_error)}")

        # Audit log
        log_action(
            user_id=user_id,
            action_type='VIEW',
            table_name='medical_documents',
            patient_id=patient_id,
            new_values={'count': len(documents.data) if documents.data else 0}
        )

        return jsonify({
            "status": "success",
            "data": documents.data or [],
            "count": len(documents.data) if documents.data else 0
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching documents: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": "An error occurred while fetching documents"
        }), 500


@documents_bp.route('/documents/<document_id>', methods=['GET'])
@require_auth
def get_document(document_id):
    """Get a specific document with download URL"""
    try:
        user_id = request.current_user.get('id')

        # Get document metadata (RLS will enforce access control)
        doc_response = supabase.table('medical_documents')\
            .select('''
                *,
                uploader:users!medical_documents_uploaded_by_fkey(
                    user_id,
                    firstname,
                    lastname,
                    role
                )
            ''')\
            .eq('document_id', document_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()

        if not doc_response.data:
            return jsonify({
                "status": "error",
                "message": "Document not found or access denied"
            }), 404

        doc = doc_response.data

        # Generate signed URL for download (1 hour expiry)
        try:
            signed_url_response = supabase.storage.from_('medical-documents').create_signed_url(
                doc['storage_path'],
                3600
            )

            if hasattr(signed_url_response, 'get'):
                doc['download_url'] = signed_url_response.get('signedURL')
            else:
                return jsonify({
                    "status": "error",
                    "message": "Could not generate download URL"
                }), 500

        except Exception as url_error:
            current_app.logger.error(f"Error generating signed URL: {str(url_error)}")
            return jsonify({
                "status": "error",
                "message": "Could not generate download URL"
            }), 500

        # Audit log
        log_action(
            user_id=user_id,
            action_type='VIEW',
            table_name='medical_documents',
            record_id=document_id,
            patient_id=doc['patient_id']
        )

        current_app.logger.info(
            f"AUDIT: User {user_id} accessed document {document_id} "
            f"for patient {doc['patient_id']}"
        )

        return jsonify({
            "status": "success",
            "data": doc
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching document: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": "An error occurred while fetching the document"
        }), 500


@documents_bp.route('/documents/<document_id>', methods=['DELETE'])
@require_auth
@require_role('doctor', 'nurse', 'facility_admin')
def delete_document(document_id):
    """Soft delete a document (marks as deleted, doesn't remove from storage)"""
    try:
        current_user = request.current_user
        user_id = current_user.get('id')
        user_role = current_user.get('role')
        facility_id = current_user.get('facility_id')

        # Get document metadata using service role to bypass RLS
        # User authentication already verified by @require_auth decorator
        doc_response = supabase_service_role_client.table('medical_documents')\
            .select('*')\
            .eq('document_id', document_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()

        if not doc_response.data:
            return jsonify({
                "status": "error",
                "message": "Document not found"
            }), 404

        doc = doc_response.data

        # Verify permission: must be uploader or facility admin
        if doc['uploaded_by'] != user_id and user_role != 'facility_admin':
            log_action(
                user_id=user_id,
                action_type='DENIED',
                table_name='medical_documents',
                record_id=document_id,
                patient_id=doc['patient_id'],
                new_values={'reason': 'User not authorized to delete this document'}
            )
            return jsonify({
                "status": "error",
                "message": "You are not authorized to delete this document"
            }), 403

        # Soft delete: update is_deleted flag
        # Use service role client since we've already verified permissions
        update_response = supabase_service_role_client.table('medical_documents').update({
            'is_deleted': True,
            'deleted_at': datetime.utcnow().isoformat(),
            'deleted_by': user_id
        }).eq('document_id', document_id).execute()

        if hasattr(update_response, 'error') and update_response.error:
            current_app.logger.error(f"Error soft deleting document: {update_response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to delete document"
            }), 500

        # Audit log
        log_action(
            user_id=user_id,
            action_type='DELETE',
            table_name='medical_documents',
            record_id=document_id,
            patient_id=doc['patient_id'],
            old_values={'document_name': doc['document_name'], 'document_type': doc['document_type']}
        )

        current_app.logger.info(
            f"AUDIT: User {user_id} ({user_role}) soft deleted document {document_id} "
            f"for patient {doc['patient_id']}"
        )

        return jsonify({
            "status": "success",
            "message": "Document deleted successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting document: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": "An error occurred while deleting the document"
        }), 500


@documents_bp.route('/documents/types', methods=['GET'])
@require_auth
def get_document_types():
    """Get list of available document types"""
    return jsonify({
        "status": "success",
        "data": {
            "types": [
                {"value": "lab_result", "label": "Lab Result"},
                {"value": "imaging_report", "label": "Imaging Report"},
                {"value": "vaccination_record", "label": "Vaccination Record"},
                {"value": "prescription", "label": "Prescription"},
                {"value": "other", "label": "Other"}
            ]
        }
    }), 200
