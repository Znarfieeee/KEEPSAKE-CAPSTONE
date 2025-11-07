"""
DEPRECATED: Notification Utilities - KEEPSAKE Healthcare System

⚠️  This file is DEPRECATED and kept for reference only.
    Notifications are now handled automatically by database triggers.

    See: server/migrations/create_automatic_notifications_system.sql

    The database automatically creates notifications when:
    - New appointments are created → appointment_reminder notification
    - QR codes are accessed → qr_access_alert notification
    - Vaccinations are scheduled → vaccination_due notification
    - Appointments are within 24 hours → upcoming_appointment notification

    No manual notification creation is needed in the backend!
"""

# This file is intentionally empty as all functionality has been moved to database triggers
pass
