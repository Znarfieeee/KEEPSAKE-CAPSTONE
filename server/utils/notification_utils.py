"""
Notification Utilities - KEEPSAKE Healthcare System
Helper functions for notification system management

⚠️  IMPORTANT: Most notifications are now created automatically by database triggers!
    See: server/migrations/create_automatic_notifications_system.sql

    Database triggers automatically handle:
    - Appointment reminders (when appointments are created/updated)
    - QR access alerts (when QR codes are accessed)
    - Vaccination due notifications (when vaccinations are scheduled)

    This file now only contains:
    - Scheduled job functions (for cron/scheduler)
    - Utility functions for notification management
"""

from datetime import datetime, timedelta
from config.settings import supabase_service_role_client
from typing import Optional, List, Dict


# ============================================================================
# SCHEDULED JOB FUNCTIONS
# These should be called by a scheduler (e.g., cron, celery, APScheduler)
# ============================================================================

def create_upcoming_appointment_notifications():
    """
    Create 24-hour upcoming appointment notifications

    This function should be called by a scheduler every hour.
    It calls the database function that automatically creates notifications
    for appointments happening in the next 24 hours.

    Returns:
        Dict with status and message
    """
    try:
        supabase = supabase_service_role_client()

        # Call the database function
        result = supabase.rpc('create_upcoming_appointment_notifications').execute()

        print(f"✅ Created upcoming appointment notifications: {datetime.now()}")

        return {
            'status': 'success',
            'message': 'Upcoming appointment notifications created',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error creating upcoming appointment notifications: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }


def cleanup_expired_notifications():
    """
    Cleanup expired and old archived notifications

    This function should be called by a scheduler daily (e.g., at 2 AM).
    It calls the database function that removes:
    - Archived notifications older than 30 days
    - Expired notifications

    Returns:
        Dict with status and message
    """
    try:
        supabase = supabase_service_role_client()

        # Call the database function
        result = supabase.rpc('cleanup_expired_notifications').execute()

        print(f"✅ Cleaned up expired notifications: {datetime.now()}")

        return {
            'status': 'success',
            'message': 'Expired notifications cleaned up',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error cleaning up notifications: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }


def check_and_create_vaccination_reminders():
    """
    Check for upcoming vaccinations and create reminders

    This function should be called by a scheduler every 6 hours.
    Note: Vaccination notifications are primarily handled by database triggers
    when vaccinations are created/updated. This function is a backup check.

    Returns:
        Dict with status and message
    """
    try:
        supabase = supabase_service_role_client()

        # Get vaccinations due within the next 7 days that don't have notifications yet
        today = datetime.utcnow()
        next_week = today + timedelta(days=7)

        # Note: This is a fallback. Database triggers should handle most cases.
        vaccinations = supabase.table('vaccinations').select(
            '*'
        ).eq('status', 'pending').gte('due_date', today.date().isoformat()).lte(
            'due_date', next_week.date().isoformat()
        ).execute()

        count = len(vaccinations.data) if vaccinations.data else 0
        print(f"✅ Checked vaccination reminders: {count} vaccinations found")

        return {
            'status': 'success',
            'message': f'Checked {count} vaccinations',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error checking vaccination reminders: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }


# ============================================================================
# MANUAL NOTIFICATION CREATION (FOR SYSTEM ANNOUNCEMENTS ONLY)
# ============================================================================

def create_system_announcement_notifications(announcement_id: str, target_users: List[str]):
    """
    Create notifications for system announcements

    This is still done manually because system announcements are
    created by admins and need to be broadcast to specific users.

    Args:
        announcement_id: The announcement ID
        target_users: List of user IDs to notify

    Returns:
        Dict with status and count of notifications created
    """
    try:
        supabase = supabase_service_role_client()

        # Get announcement details
        announcement = supabase.table('system_announcements').select('*').eq(
            'announcement_id', announcement_id
        ).execute()

        if not announcement.data:
            return {'status': 'error', 'message': 'Announcement not found'}

        ann = announcement.data[0]

        # Create notifications for each target user
        notifications = []
        for user_id in target_users:
            notification = {
                'user_id': user_id,
                'notification_type': 'system_announcement',
                'title': ann['title'],
                'message': ann['message'],
                'priority': ann.get('priority', 'normal'),
                'metadata': {
                    'announcement_id': announcement_id,
                    **ann.get('metadata', {})
                },
                'expires_at': ann.get('expires_at')
            }
            notifications.append(notification)

        # Bulk insert
        if notifications:
            result = supabase.table('notifications').insert(notifications).execute()

            return {
                'status': 'success',
                'count': len(notifications),
                'message': f'Created {len(notifications)} notifications'
            }

        return {'status': 'success', 'count': 0, 'message': 'No users to notify'}

    except Exception as e:
        print(f"❌ Error creating system announcement notifications: {e}")
        return {'status': 'error', 'message': str(e)}


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def check_user_notification_preference(user_id: str, notification_type: str) -> bool:
    """
    Check if a user has a specific notification type enabled

    Args:
        user_id: User ID
        notification_type: Type of notification to check

    Returns:
        Boolean indicating if the notification type is enabled
    """
    try:
        supabase = supabase_service_role_client()

        # Call the database function
        result = supabase.rpc('user_has_notification_enabled', {
            'p_user_id': user_id,
            'p_notification_type': notification_type
        }).execute()

        return result.data if result.data is not None else True

    except Exception as e:
        print(f"❌ Error checking notification preference: {e}")
        return True  # Default to enabled


def get_user_notification_stats(user_id: str) -> Dict:
    """
    Get notification statistics for a user

    Args:
        user_id: User ID

    Returns:
        Dict with notification counts by type and status
    """
    try:
        supabase = supabase_service_role_client()

        # Get all notifications for user
        notifications = supabase.table('notifications').select(
            'notification_type, is_read, is_archived'
        ).eq('user_id', user_id).execute()

        if not notifications.data:
            return {
                'total': 0,
                'unread': 0,
                'archived': 0,
                'by_type': {}
            }

        # Calculate stats
        total = len(notifications.data)
        unread = sum(1 for n in notifications.data if not n['is_read'])
        archived = sum(1 for n in notifications.data if n['is_archived'])

        # Count by type
        by_type = {}
        for n in notifications.data:
            ntype = n['notification_type']
            by_type[ntype] = by_type.get(ntype, 0) + 1

        return {
            'total': total,
            'unread': unread,
            'archived': archived,
            'by_type': by_type
        }

    except Exception as e:
        print(f"❌ Error getting notification stats: {e}")
        return {
            'total': 0,
            'unread': 0,
            'archived': 0,
            'by_type': {},
            'error': str(e)
        }


# ============================================================================
# LEGACY FUNCTIONS (DEPRECATED - Kept for backwards compatibility)
# ============================================================================

def create_appointment_reminder(*args, **kwargs):
    """
    DEPRECATED: Appointment reminders are now created automatically by database triggers.

    This function is kept for backwards compatibility but does nothing.
    See: server/migrations/create_automatic_notifications_system.sql
    """
    print("⚠️  create_appointment_reminder() is deprecated. Using database triggers instead.")
    return None


def create_qr_access_alert(*args, **kwargs):
    """
    DEPRECATED: QR access alerts are now created automatically by database triggers.

    This function is kept for backwards compatibility but does nothing.
    See: server/migrations/create_automatic_notifications_system.sql
    """
    print("⚠️  create_qr_access_alert() is deprecated. Using database triggers instead.")
    return None


def create_vaccination_due_notification(*args, **kwargs):
    """
    DEPRECATED: Vaccination notifications are now created automatically by database triggers.

    This function is kept for backwards compatibility but does nothing.
    See: server/migrations/create_automatic_notifications_system.sql
    """
    print("⚠️  create_vaccination_due_notification() is deprecated. Using database triggers instead.")
    return None


def check_and_create_appointment_reminders(*args, **kwargs):
    """
    DEPRECATED: Use create_upcoming_appointment_notifications() instead.

    This function is kept for backwards compatibility.
    """
    print("⚠️  check_and_create_appointment_reminders() is deprecated. Use create_upcoming_appointment_notifications() instead.")
    return create_upcoming_appointment_notifications()
