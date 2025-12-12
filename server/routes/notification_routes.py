"""
Notification Routes - KEEPSAKE Healthcare System
Handles real-time notifications, preferences, and system announcements
"""

from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timedelta
from utils.access_control import require_auth, require_role
from utils.sanitize import sanitize_request_data
from config.settings import supabase, supabase_service_role_client

notification_bp = Blueprint('notifications', __name__)

def count_unread_notifications(notifications):
    """Count unread notifications from a list of notifications"""
    return sum(1 for notification in notifications if not notification.get('is_read', False))

@notification_bp.route('/notifications', methods=['GET'])
@require_auth
def get_notifications():
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        # Query parameters
        is_read = request.args.get('is_read')
        notification_type = request.args.get('notification_type')
        is_archived = request.args.get('is_archived')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        # Use service role client to bypass RLS
        supabase_admin = supabase_service_role_client()

        # Build query
        query = supabase_admin.table('notifications').select('*').eq('user_id', user_id)

        # Apply filters
        if is_read is not None:
            query = query.eq('is_read', is_read.lower() == 'true')

        if notification_type:
            query = query.eq('notification_type', notification_type)

        # Handle archived filter
        if is_archived is not None:
            query = query.eq('is_archived', is_archived.lower() == 'true')
        else:
            # By default, exclude archived notifications
            query = query.eq('is_archived', False)

        # Only apply expiration filter for non-archived notifications
        if is_archived != 'true':
            query = query.or_(f'expires_at.is.null,expires_at.gt.{datetime.utcnow().isoformat()}')

        # Order and paginate
        query = query.order('created_at', desc=True).range(offset, offset + limit - 1)

        response = query.execute()

        # Count unread notifications from the response data
        unread_count = count_unread_notifications(response.data)

        return jsonify({
            'status': 'success',
            'notifications': response.data,
            'unread_count': unread_count,
            'total_returned': len(response.data)
        }), 200

    except Exception as e:
        print(f"Error in get_notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notification_bp.route('/notifications/<notification_id>/mark-read', methods=['PATCH'])
@require_auth
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        # Verify notification belongs to user
        notification = supabase_service_role_client().table('notifications').select('*').eq('notification_id', notification_id).eq('user_id', user_id).execute()

        if not notification.data:
            return jsonify({'status': 'error', 'message': 'Notification not found'}), 404

        # Update notification
        response = supabase_service_role_client().table('notifications').update({
            'is_read': True,
            'read_at': datetime.utcnow().isoformat()
        }).eq('notification_id', notification_id).execute()

        return jsonify({
            'status': 'success',
            'notification': response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIIT: Error in mark_notification_read: {str(e)}")

        return jsonify({'status': 'error', 'message': str(e)}), 500


@notification_bp.route('/notifications/<notification_id>/mark-unread', methods=['PATCH'])
@require_auth
def mark_notification_unread(notification_id):
    """Mark a specific notification as unread"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        # Verify notification belongs to user
        notification = supabase_service_role_client().table('notifications').select('*').eq('notification_id', notification_id).eq('user_id', user_id).execute()

        if not notification.data:
            return jsonify({'status': 'error', 'message': 'Notification not found'}), 404

        # Update notification to unread
        response = supabase_service_role_client().table('notifications').update({
            'is_read': False,
            'read_at': None
        }).eq('notification_id', notification_id).execute()

        return jsonify({
            'status': 'success',
            'notification': response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error in mark_notification_unread: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notification_bp.route('/notifications/mark-all-read', methods=['PATCH'])
@require_auth
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        response = supabase_service_role_client().table('notifications').update({
            'is_read': True,
            'read_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).eq('is_read', False).execute()

        return jsonify({
            'status': 'success',
            'message': 'All notifications marked as read',
            'updated_count': len(response.data) if response.data else 0
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error in mark_all_notifications_read: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': str(e)
            }), 500


@notification_bp.route('/notifications/<notification_id>/archive', methods=['PATCH'])
@require_auth
def archive_notification(notification_id):
    """Archive a specific notification"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        # Verify notification belongs to user
        notification = supabase_service_role_client().table('notifications').select('*').eq('notification_id', notification_id).eq('user_id', user_id).execute()

        if not notification.data:
            return jsonify({'status': 'error', 'message': 'Notification not found'}), 404

        # Archive notification
        response = supabase_service_role_client().table('notifications').update({
            'is_archived': True,
            'archived_at': datetime.utcnow().isoformat()
        }).eq('notification_id', notification_id).execute()

        return jsonify({
            'status': 'success',
            'message': 'Notification archived'
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error in archive_notification: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': str(e)
            }), 500


@notification_bp.route('/notifications/<notification_id>', methods=['DELETE'])
@require_auth
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        # Verify notification belongs to user
        notification = supabase_service_role_client().table('notifications').select('*').eq('notification_id', notification_id).eq('user_id', user_id).execute()

        if not notification.data:
            return jsonify({'status': 'error', 'message': 'Notification not found'}), 404

        # Delete notification
        supabase_service_role_client().table('notifications').delete().eq('notification_id', notification_id).execute()

        return jsonify({
            'status': 'success',
            'message': 'Notification deleted'
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error in delete_notification: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': str(e)
            }), 500


# ============================================================================
# NOTIFICATION PREFERENCES ENDPOINTS
# ============================================================================

@notification_bp.route('/notifications/preferences', methods=['GET'])
@require_auth
def get_notification_preferences():
    """Get notification preferences for the current user"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        response = supabase_service_role_client().table('notification_preferences').select('*').eq('user_id', user_id).execute()

        if not response.data:
            # Create default preferences if they don't exist
            default_prefs = {
                'user_id': user_id,
                # Primary notification types
                'appointment_reminder_enabled': True,
                'upcoming_appointment_enabled': True,
                'vaccination_due_enabled': True,
                'qr_access_alert_enabled': True,
                'system_announcement_enabled': True,
                # Additional notification types
                'record_update_enabled': True,
                'new_prescription_enabled': True,
                'appointment_status_change_enabled': True,
                'document_upload_enabled': True,
                'allergy_alert_enabled': True,
                # Sound settings
                'sound_enabled': True,
                'sound_type': 'default',
                # Timing settings
                'appointment_reminder_time': 60,
                'vaccination_reminder_days': 7,
                # Quiet hours settings
                'quiet_hours_enabled': False,
                'quiet_hours_start': '22:00:00',
                'quiet_hours_end': '07:00:00',
                # Priority filtering
                'priority_filter_enabled': False,
                'minimum_priority': 'normal',
                # Notification grouping
                'notification_grouping_enabled': True,
                'grouping_interval_minutes': 15,
                # Delivery methods
                'desktop_notifications': True,
                'email_notifications': False
            }

            create_response = supabase_service_role_client().table('notification_preferences').insert(default_prefs).execute()

            return jsonify({
                'status': 'success',
                'preferences': create_response.data[0] if create_response.data else default_prefs
            }), 200

        return jsonify({
            'status': 'success',
            'preferences': response.data[0]
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error in get_notification_preferences: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': str(e)
            }), 500


@notification_bp.route('/notifications/preferences', methods=['PATCH'])
@require_auth
def update_notification_preferences():
    """Update notification preferences for the current user"""
    try:
        user_id = request.current_user.get('id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

        raw_data = request.json
        
        # Validate request data exists
        if raw_data is None:
            return jsonify({
                'status': 'error',
                'message': 'Request body is required'
            }), 400
        
        data = sanitize_request_data(raw_data, data_type='general')

        # Allowed fields to update
        allowed_fields = [
            # Primary notification types
            'appointment_reminder_enabled',
            'upcoming_appointment_enabled',
            'vaccination_due_enabled',
            'qr_access_alert_enabled',
            'system_announcement_enabled',
            # Additional notification types
            'record_update_enabled',
            'new_prescription_enabled',
            'appointment_status_change_enabled',
            'document_upload_enabled',
            'allergy_alert_enabled',
            # Sound settings
            'sound_enabled',
            'sound_type',
            'custom_sound_url',
            # Timing settings
            'appointment_reminder_time',
            'vaccination_reminder_days',
            # Quiet hours settings
            'quiet_hours_enabled',
            'quiet_hours_start',
            'quiet_hours_end',
            # Priority filtering
            'priority_filter_enabled',
            'minimum_priority',
            # Notification grouping
            'notification_grouping_enabled',
            'grouping_interval_minutes',
            # Delivery methods
            'desktop_notifications',
            'email_notifications'
        ]

        # Filter data to only allowed fields
        update_data = {key: value for key, value in data.items() if key in allowed_fields}
        update_data['updated_at'] = datetime.utcnow().isoformat()

        # Check if preferences exist
        existing = supabase_service_role_client().table('notification_preferences').select('*').eq('user_id', user_id).execute()

        if existing.data:
            # Update existing preferences
            response = supabase_service_role_client().table('notification_preferences').update(update_data).eq('user_id', user_id).execute()
        else:
            # Create new preferences
            update_data['user_id'] = user_id
            response = supabase_service_role_client().table('notification_preferences').insert(update_data).execute()

        return jsonify({
            'status': 'success',
            'preferences': response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error in update_notification_preferences: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': str(e)
            }), 500

@notification_bp.route('/announcements', methods=['GET'])
@require_auth
def get_system_announcements():
    """Get active system announcements for the current user"""
    try:
        user_id = request.current_user.get('id')
        user_role = request.current_user.get('role')
        facility_id = request.current_user.get('facility_id')

        # Get active announcements
        query = supabase.table('system_announcements').select('*').eq('is_active', True).lte('published_at', datetime.utcnow().isoformat())

        # Filter by expiration
        query = query.or_(f'expires_at.is.null,expires_at.gt.{datetime.utcnow().isoformat()}')

        response = query.order('published_at', desc=True).execute()

        # Filter announcements by role and facility
        filtered_announcements = []
        for announcement in response.data:
            # Check role targeting
            if announcement.get('target_roles') and user_role not in announcement['target_roles']:
                continue

            # Check facility targeting
            if announcement.get('target_facilities') and facility_id not in announcement['target_facilities']:
                continue

            filtered_announcements.append(announcement)

        return jsonify({
            'status': 'success',
            'announcements': filtered_announcements
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notification_bp.route('/announcements', methods=['POST'])
@require_auth
@require_role('admin', 'facility_admin')
def create_system_announcement():
    """Create a new system announcement (admin only)"""
    try:
        user_id = request.current_user.get('id')
        raw_data = request.json
        data = sanitize_request_data(raw_data, data_type='general')

        # Validate required fields
        required_fields = ['title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'{field} is required'}), 400

        announcement_data = {
            'title': data['title'],
            'message': data['message'],
            'priority': data.get('priority', 'normal'),
            'target_roles': data.get('target_roles', ['doctor', 'facility_admin', 'system_admin']),
            'target_facilities': data.get('target_facilities'),
            'expires_at': data.get('expires_at'),
            'created_by': user_id,
            'metadata': data.get('metadata', {})
        }

        response = supabase_service_role_client().table('system_announcements').insert(announcement_data).execute()

        # Create notifications for all targeted users
        create_announcement_notifications(response.data[0])

        # Audit logging handled automatically by database trigger

        return jsonify({
            'status': 'success',
            'announcement': response.data[0]
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error creating system announcement: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


def create_announcement_notifications(announcement):
    """Helper function to create notifications for system announcements"""
    try:    
        # Get all users matching the target criteria
        query = supabase_service_role_client().table('users').select('user_id, role').eq('is_active', True)

        # Filter by roles if specified
        if announcement.get('target_roles'):
            query = query.in_('role', announcement['target_roles'])

        users_response = query.execute()

        # Create notifications for each user
        notifications = []
        for user in users_response.data:
            # If target_facilities is specified, check if user belongs to one
            if announcement.get('target_facilities'):
                facility_check = supabase.table('facility_users').select('facility_id').eq('user_id', user['user_id']).in_('facility_id', announcement['target_facilities']).execute()

                if not facility_check.data:
                    continue

            notification = {
                'user_id': user['user_id'],
                'notification_type': 'system_announcement',
                'title': announcement['title'],
                'message': announcement['message'],
                'priority': announcement.get('priority', 'normal'),
                'metadata': {
                    'announcement_id': announcement['announcement_id']
                },
                'expires_at': announcement.get('expires_at')
            }

            notifications.append(notification)

        # Bulk insert notifications
        if notifications:
            supabase.table('notifications').insert(notifications).execute()

    except Exception as e:
        current_app.logger.error(f"Error creating announcement notifications: {e}")

def create_notification(user_id, notification_type, title, message, **kwargs):
    """
    Helper function to create a notification

    Args:
        user_id: User to notify
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        **kwargs: Additional fields (priority, action_url, metadata, etc.)
    """
    try:
        notification_data = {
            'user_id': user_id,
            'notification_type': notification_type,
            'title': title,
            'message': message,
            'priority': kwargs.get('priority', 'normal'),
            'facility_id': kwargs.get('facility_id'),
            'action_url': kwargs.get('action_url'),
            'metadata': kwargs.get('metadata', {}),
            'related_appointment_id': kwargs.get('related_appointment_id'),
            'related_patient_id': kwargs.get('related_patient_id'),
            'related_qr_id': kwargs.get('related_qr_id'),
            'expires_at': kwargs.get('expires_at')
        }

        response = supabase_service_role_client().table('notifications').insert(notification_data).execute()
        return response.data[0] if response.data else None

    except Exception as e:
        current_app.logger.error(f"AUDIT: Error creating notification: {e}")
        return None
