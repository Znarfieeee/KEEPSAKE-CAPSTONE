-- ============================================================================
-- ENHANCE NOTIFICATION PREFERENCES
-- ============================================================================
-- Description: Add advanced notification preference fields including:
--   - Additional notification type toggles
--   - Quiet hours / Do Not Disturb settings
--   - Priority filtering options
--   - Notification grouping settings
-- Author: KEEPSAKE Development Team
-- Created: 2025-11-14
-- ============================================================================

-- Add additional notification type toggles
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS record_update_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS new_prescription_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS appointment_status_change_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS document_upload_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allergy_alert_enabled BOOLEAN DEFAULT TRUE;

-- Add quiet hours / Do Not Disturb settings
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00:00';

-- Add priority filtering settings
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS priority_filter_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_priority VARCHAR(20) DEFAULT 'normal'
    CHECK (minimum_priority IN ('urgent', 'high', 'normal', 'low'));

-- Add notification grouping settings
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS notification_grouping_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS grouping_interval_minutes INTEGER DEFAULT 15
    CHECK (grouping_interval_minutes > 0 AND grouping_interval_minutes <= 120);

-- Add comments for documentation
COMMENT ON COLUMN notification_preferences.record_update_enabled IS 'Enable notifications when patient records are updated';
COMMENT ON COLUMN notification_preferences.new_prescription_enabled IS 'Enable notifications when new prescriptions are created';
COMMENT ON COLUMN notification_preferences.appointment_status_change_enabled IS 'Enable notifications when appointment status changes';
COMMENT ON COLUMN notification_preferences.document_upload_enabled IS 'Enable notifications when medical documents are uploaded';
COMMENT ON COLUMN notification_preferences.allergy_alert_enabled IS 'Enable notifications for allergy alerts';
COMMENT ON COLUMN notification_preferences.quiet_hours_enabled IS 'Enable Do Not Disturb mode during specified hours';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for quiet hours (24-hour format)';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'End time for quiet hours (24-hour format)';
COMMENT ON COLUMN notification_preferences.priority_filter_enabled IS 'Enable filtering notifications by minimum priority level';
COMMENT ON COLUMN notification_preferences.minimum_priority IS 'Minimum priority level to receive notifications (urgent, high, normal, low)';
COMMENT ON COLUMN notification_preferences.notification_grouping_enabled IS 'Enable grouping similar notifications together';
COMMENT ON COLUMN notification_preferences.grouping_interval_minutes IS 'Time window in minutes for grouping similar notifications';

-- Update existing rows to have default values for new columns
UPDATE notification_preferences
SET
    record_update_enabled = TRUE,
    new_prescription_enabled = TRUE,
    appointment_status_change_enabled = TRUE,
    document_upload_enabled = TRUE,
    allergy_alert_enabled = TRUE,
    quiet_hours_enabled = FALSE,
    quiet_hours_start = '22:00:00',
    quiet_hours_end = '07:00:00',
    priority_filter_enabled = FALSE,
    minimum_priority = 'normal',
    notification_grouping_enabled = TRUE,
    grouping_interval_minutes = 15
WHERE record_update_enabled IS NULL
   OR new_prescription_enabled IS NULL
   OR appointment_status_change_enabled IS NULL
   OR document_upload_enabled IS NULL
   OR allergy_alert_enabled IS NULL;

-- Create index for faster preference lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
ON notification_preferences(user_id);

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Enhanced notification preferences migration completed successfully';
END $$;
