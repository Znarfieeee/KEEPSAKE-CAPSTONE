"""
Feedback Routes - API endpoints for feedback and feature suggestions
"""

from flask import Blueprint, jsonify, request
from utils.access_control import require_auth, require_role
from utils.sanitize import sanitize_request_data
from config.settings import supabase_service_role_client
from utils.audit_logger import create_audit_log
from datetime import datetime

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """
    Submit new feedback - can be anonymous or authenticated
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400

        # Sanitize input
        sanitized_data = sanitize_request_data(data)

        # Validate required fields
        required_fields = ['feedback_type', 'subject', 'message']
        for field in required_fields:
            if not sanitized_data.get(field):
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400

        # Validate feedback type
        valid_types = ['bug_report', 'feature_suggestion', 'general_feedback', 'question']
        if sanitized_data.get('feedback_type') not in valid_types:
            return jsonify({
                'status': 'error',
                'message': f'Invalid feedback type. Must be one of: {", ".join(valid_types)}'
            }), 400

        # Get user info if authenticated (from session)
        user_id = None
        user_role = sanitized_data.get('user_role', 'anonymous')
        is_anonymous = sanitized_data.get('is_anonymous', True)

        # Check if user is authenticated via request context
        if hasattr(request, 'current_user') and request.current_user:
            if not is_anonymous:
                user_id = request.current_user.get('id')
                user_role = request.current_user.get('role', 'unknown')

        # Prepare feedback data
        feedback_data = {
            'user_id': user_id,
            'user_role': user_role,
            'feedback_type': sanitized_data.get('feedback_type'),
            'category': sanitized_data.get('category'),
            'subject': sanitized_data.get('subject'),
            'message': sanitized_data.get('message'),
            'is_anonymous': is_anonymous,
            'status': 'submitted',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Insert into database
        response = supabase_service_role_client().table('feedback').insert(feedback_data).execute()

        if response.data:
            # Log the action
            create_audit_log({
                'action_type': 'FEEDBACK_SUBMITTED',
                'user_id': user_id if user_id else 'anonymous',
                'table_name': 'feedback',
                'new_values': {
                    'feedback_type': sanitized_data.get('feedback_type'),
                    'is_anonymous': is_anonymous
                }
            })

            return jsonify({
                'status': 'success',
                'message': 'Feedback submitted successfully',
                'data': response.data[0]
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to submit feedback'
            }), 500

    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while submitting feedback'
        }), 500


@feedback_bp.route('/feedback', methods=['GET'])
@require_auth
@require_role('admin', 'facility_admin')
def get_all_feedback():
    """
    Get all feedback - Admin only
    Supports filtering by status, type, and pagination
    """
    try:
        # Get query parameters
        status = request.args.get('status')
        feedback_type = request.args.get('type')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit

        # Build query
        query = supabase_service_role_client().table('feedback').select('*')

        # Apply filters
        if status:
            query = query.eq('status', status)
        if feedback_type:
            query = query.eq('feedback_type', feedback_type)

        # Order by most recent first
        query = query.order('created_at', desc=True)

        # Apply pagination
        query = query.range(offset, offset + limit - 1)

        response = query.execute()

        # Get total count for pagination
        count_query = supabase_service_role_client().table('feedback').select('feedback_id', count='exact')
        if status:
            count_query = count_query.eq('status', status)
        if feedback_type:
            count_query = count_query.eq('feedback_type', feedback_type)
        count_response = count_query.execute()

        total_count = count_response.count if count_response.count else len(response.data)

        return jsonify({
            'status': 'success',
            'data': response.data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'total_pages': (total_count + limit - 1) // limit
            }
        }), 200

    except Exception as e:
        print(f"Error fetching feedback: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while fetching feedback'
        }), 500


@feedback_bp.route('/feedback/<feedback_id>', methods=['GET'])
@require_auth
@require_role('admin', 'facility_admin')
def get_feedback_by_id(feedback_id):
    """
    Get single feedback by ID - Admin only
    """
    try:
        response = supabase_service_role_client().table('feedback')\
            .select('*')\
            .eq('feedback_id', feedback_id)\
            .single()\
            .execute()

        if response.data:
            return jsonify({
                'status': 'success',
                'data': response.data
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Feedback not found'
            }), 404

    except Exception as e:
        print(f"Error fetching feedback: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while fetching feedback'
        }), 500


@feedback_bp.route('/feedback/<feedback_id>', methods=['PATCH'])
@require_auth
@require_role('admin', 'facility_admin')
def update_feedback(feedback_id):
    """
    Update feedback status and admin notes - Admin only
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400

        # Only allow updating specific fields
        allowed_fields = ['status', 'admin_notes']
        update_data = {}

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        if not update_data:
            return jsonify({
                'status': 'error',
                'message': 'No valid fields to update'
            }), 400

        # Validate status if provided
        if 'status' in update_data:
            valid_statuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed']
            if update_data['status'] not in valid_statuses:
                return jsonify({
                    'status': 'error',
                    'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }), 400

        # Add updated timestamp
        update_data['updated_at'] = datetime.utcnow().isoformat()

        # Update in database
        response = supabase_service_role_client().table('feedback')\
            .update(update_data)\
            .eq('feedback_id', feedback_id)\
            .execute()

        if response.data:
            # Log the action
            user_id = request.current_user.get('id')
            create_audit_log({
                'action_type': 'UPDATE',
                'user_id': user_id,
                'table_name': 'feedback',
                'new_values': {
                    'feedback_id': feedback_id,
                    'updates': update_data
                }
            })

            return jsonify({
                'status': 'success',
                'message': 'Feedback updated successfully',
                'data': response.data[0]
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Feedback not found'
            }), 404

    except Exception as e:
        print(f"Error updating feedback: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while updating feedback'
        }), 500


@feedback_bp.route('/feedback/<feedback_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_feedback(feedback_id):
    """
    Delete feedback - System Admin only
    """
    try:
        # First check if feedback exists
        check_response = supabase_service_role_client().table('feedback')\
            .select('feedback_id')\
            .eq('feedback_id', feedback_id)\
            .single()\
            .execute()

        if not check_response.data:
            return jsonify({
                'status': 'error',
                'message': 'Feedback not found'
            }), 404

        # Delete the feedback
        response = supabase_service_role_client().table('feedback')\
            .delete()\
            .eq('feedback_id', feedback_id)\
            .execute()

        # Log the action
        user_id = request.current_user.get('id')
        create_audit_log({
            'action_type': 'DELETE',
            'user_id': user_id,
            'table_name': 'feedback',
            'new_values': {'feedback_id': feedback_id}
        })

        return jsonify({
            'status': 'success',
            'message': 'Feedback deleted successfully'
        }), 200

    except Exception as e:
        print(f"Error deleting feedback: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while deleting feedback'
        }), 500


@feedback_bp.route('/feedback/stats', methods=['GET'])
@require_auth
@require_role('admin', 'facility_admin')
def get_feedback_stats():
    """
    Get feedback statistics - Admin only
    """
    try:
        # Get counts by status
        status_counts = {}
        statuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed']

        for status in statuses:
            response = supabase_service_role_client().table('feedback')\
                .select('feedback_id', count='exact')\
                .eq('status', status)\
                .execute()
            status_counts[status] = response.count if response.count else 0

        # Get counts by type
        type_counts = {}
        types = ['bug_report', 'feature_suggestion', 'general_feedback', 'question']

        for feedback_type in types:
            response = supabase_service_role_client().table('feedback')\
                .select('feedback_id', count='exact')\
                .eq('feedback_type', feedback_type)\
                .execute()
            type_counts[feedback_type] = response.count if response.count else 0

        # Get total count
        total_response = supabase_service_role_client().table('feedback')\
            .select('feedback_id', count='exact')\
            .execute()
        total_count = total_response.count if total_response.count else 0

        return jsonify({
            'status': 'success',
            'data': {
                'total': total_count,
                'by_status': status_counts,
                'by_type': type_counts
            }
        }), 200

    except Exception as e:
        print(f"Error fetching feedback stats: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while fetching statistics'
        }), 500
