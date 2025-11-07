-- ============================================================================
-- AUTOMATIC NOTIFICATION SYSTEM - KEEPSAKE Healthcare
-- ============================================================================
-- This migration creates database functions and triggers that automatically
-- generate notifications based on database events, eliminating the need for
-- manual notification creation in the backend.
-- ============================================================================

-- ============================================================================
-- 1. AUTOMATIC APPOINTMENT REMINDER NOTIFICATIONS
-- ============================================================================

-- Function to create appointment reminder notification
CREATE OR REPLACE FUNCTION create_appointment_reminder_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    user_prefs RECORD;
    reminder_time INTEGER;
    scheduled_time TIMESTAMP;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Only create notification for confirmed appointments
    IF NEW.status != 'confirmed' THEN
        RETURN NEW;
    END IF;

    -- Get user preferences for appointment reminders
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id
    AND appointment_reminder_enabled = true;

    -- If user has disabled appointment reminders, skip
    IF user_prefs IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get reminder time (default 60 minutes)
    reminder_time := COALESCE(user_prefs.appointment_reminder_time, 60);

    -- Calculate when the notification should be relevant
    scheduled_time := NEW.appointment_date - (reminder_time || ' minutes')::INTERVAL;

    -- Only create notification if appointment is in the future
    IF NEW.appointment_date > NOW() THEN
        -- Insert appointment reminder notification
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            message,
            priority,
            facility_id,
            action_url,
            metadata,
            related_appointment_id,
            related_patient_id,
            expires_at
        ) VALUES (
            patient_record.parent_guardian_id,
            'appointment_reminder',
            'Upcoming Appointment Reminder',
            format('Reminder: %s has an appointment on %s at %s',
                patient_record.first_name || ' ' || patient_record.last_name,
                TO_CHAR(NEW.appointment_date, 'Month DD, YYYY'),
                TO_CHAR(NEW.appointment_date, 'HH12:MI AM')
            ),
            CASE
                WHEN NEW.appointment_date - NOW() < INTERVAL '2 hours' THEN 'high'
                ELSE 'normal'
            END,
            NEW.facility_id,
            '/appointments/' || NEW.appointment_id,
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
                'scheduled_time', scheduled_time,
                'reminder_minutes', reminder_time
            ),
            NEW.appointment_id,
            NEW.patient_id,
            NEW.appointment_date + INTERVAL '1 day' -- Expire 1 day after appointment
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicate notifications
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new appointments
DROP TRIGGER IF EXISTS trigger_appointment_reminder_on_insert ON appointments;
CREATE TRIGGER trigger_appointment_reminder_on_insert
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_reminder_notification();

-- Trigger for updated appointments (if date/time changes)
DROP TRIGGER IF EXISTS trigger_appointment_reminder_on_update ON appointments;
CREATE TRIGGER trigger_appointment_reminder_on_update
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (
        OLD.appointment_date IS DISTINCT FROM NEW.appointment_date
        OR OLD.status IS DISTINCT FROM NEW.status
    )
    EXECUTE FUNCTION create_appointment_reminder_notification();


-- ============================================================================
-- 2. AUTOMATIC QR ACCESS ALERT NOTIFICATIONS
-- ============================================================================

-- Function to create QR access alert notification
CREATE OR REPLACE FUNCTION create_qr_access_alert_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    accessing_user RECORD;
    user_prefs RECORD;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get accessing user information
    SELECT * INTO accessing_user
    FROM users
    WHERE user_id = NEW.accessed_by;

    -- Get user preferences for QR access alerts
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id
    AND qr_access_alert_enabled = true;

    -- If user has disabled QR access alerts, skip
    IF user_prefs IS NULL THEN
        RETURN NEW;
    END IF;

    -- Create QR access alert notification
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        facility_id,
        action_url,
        metadata,
        related_patient_id,
        related_qr_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'qr_access_alert',
        'Medical Record Accessed',
        format('%s accessed %s''s medical records via QR code on %s',
            accessing_user.first_name || ' ' || accessing_user.last_name,
            patient_record.first_name || ' ' || patient_record.last_name,
            TO_CHAR(NEW.accessed_at, 'Month DD, YYYY at HH12:MI AM')
        ),
        'high',
        patient_record.facility_id,
        '/patients/' || NEW.patient_id,
        jsonb_build_object(
            'qr_id', NEW.qr_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'accessed_by', accessing_user.first_name || ' ' || accessing_user.last_name,
            'accessed_by_role', accessing_user.role,
            'accessed_at', NEW.accessed_at
        ),
        NEW.patient_id,
        NEW.qr_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for QR code access (assuming you have a qr_access_log table)
-- Note: Adjust table name if different
DROP TRIGGER IF EXISTS trigger_qr_access_alert ON qr_access_logs;
CREATE TRIGGER trigger_qr_access_alert
    AFTER INSERT ON qr_access_logs
    FOR EACH ROW
    EXECUTE FUNCTION create_qr_access_alert_notification();


-- ============================================================================
-- 3. AUTOMATIC VACCINATION DUE NOTIFICATIONS
-- ============================================================================

-- Function to create vaccination due notification
CREATE OR REPLACE FUNCTION create_vaccination_due_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    user_prefs RECORD;
    reminder_days INTEGER;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Only create notification for scheduled/pending vaccinations
    IF NEW.status NOT IN ('scheduled', 'pending') THEN
        RETURN NEW;
    END IF;

    -- Get user preferences for vaccination reminders
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id
    AND vaccination_due_enabled = true;

    -- If user has disabled vaccination reminders, skip
    IF user_prefs IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get reminder days (default 7 days)
    reminder_days := COALESCE(user_prefs.vaccination_reminder_days, 7);

    -- Only create notification if vaccination is upcoming (within reminder window)
    IF NEW.due_date > NOW() AND NEW.due_date <= (NOW() + (reminder_days || ' days')::INTERVAL) THEN
        -- Insert vaccination due notification
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            message,
            priority,
            facility_id,
            action_url,
            metadata,
            related_patient_id,
            expires_at
        ) VALUES (
            patient_record.parent_guardian_id,
            'vaccination_due',
            'Vaccination Due Soon',
            format('%s''s %s vaccination is due on %s',
                patient_record.first_name || ' ' || patient_record.last_name,
                NEW.vaccine_name,
                TO_CHAR(NEW.due_date, 'Month DD, YYYY')
            ),
            CASE
                WHEN NEW.due_date - NOW() < INTERVAL '3 days' THEN 'high'
                ELSE 'normal'
            END,
            patient_record.facility_id,
            '/patients/' || NEW.patient_id || '/vaccinations',
            jsonb_build_object(
                'vaccination_id', NEW.vaccination_id,
                'vaccine_name', NEW.vaccine_name,
                'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
                'due_date', NEW.due_date,
                'reminder_days', reminder_days
            ),
            NEW.patient_id,
            NEW.due_date + INTERVAL '7 days' -- Expire 7 days after due date
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicate notifications
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new vaccinations (assuming you have a vaccinations table)
-- Note: Adjust table name if different
DROP TRIGGER IF EXISTS trigger_vaccination_due_on_insert ON vaccinations;
CREATE TRIGGER trigger_vaccination_due_on_insert
    AFTER INSERT ON vaccinations
    FOR EACH ROW
    EXECUTE FUNCTION create_vaccination_due_notification();

-- Trigger for updated vaccinations (if due date changes)
DROP TRIGGER IF EXISTS trigger_vaccination_due_on_update ON vaccinations;
CREATE TRIGGER trigger_vaccination_due_on_update
    AFTER UPDATE ON vaccinations
    FOR EACH ROW
    WHEN (
        OLD.due_date IS DISTINCT FROM NEW.due_date
        OR OLD.status IS DISTINCT FROM NEW.status
    )
    EXECUTE FUNCTION create_vaccination_due_notification();


-- ============================================================================
-- 4. AUTOMATIC UPCOMING APPOINTMENT NOTIFICATIONS (24 HOURS)
-- ============================================================================

-- Function to check and create 24-hour appointment notifications
-- This should be run via a scheduled job (pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION create_upcoming_appointment_notifications()
RETURNS void AS $$
DECLARE
    appointment_record RECORD;
    patient_record RECORD;
    user_prefs RECORD;
BEGIN
    -- Loop through appointments in the next 24-25 hours
    FOR appointment_record IN
        SELECT * FROM appointments
        WHERE status = 'confirmed'
        AND appointment_date BETWEEN NOW() + INTERVAL '24 hours' AND NOW() + INTERVAL '25 hours'
    LOOP
        -- Get patient information
        SELECT * INTO patient_record
        FROM patients
        WHERE patient_id = appointment_record.patient_id;

        -- Get user preferences
        SELECT * INTO user_prefs
        FROM notification_preferences
        WHERE user_id = patient_record.parent_guardian_id
        AND upcoming_appointment_enabled = true;

        -- If user has disabled upcoming appointment notifications, skip
        IF user_prefs IS NOT NULL THEN
            -- Check if notification already exists for this appointment
            IF NOT EXISTS (
                SELECT 1 FROM notifications
                WHERE related_appointment_id = appointment_record.appointment_id
                AND notification_type = 'upcoming_appointment'
                AND created_at > NOW() - INTERVAL '23 hours'
            ) THEN
                -- Insert upcoming appointment notification
                INSERT INTO notifications (
                    user_id,
                    notification_type,
                    title,
                    message,
                    priority,
                    facility_id,
                    action_url,
                    metadata,
                    related_appointment_id,
                    related_patient_id,
                    expires_at
                ) VALUES (
                    patient_record.parent_guardian_id,
                    'upcoming_appointment',
                    'Appointment Tomorrow',
                    format('%s has an appointment tomorrow at %s',
                        patient_record.first_name || ' ' || patient_record.last_name,
                        TO_CHAR(appointment_record.appointment_date, 'HH12:MI AM')
                    ),
                    'normal',
                    appointment_record.facility_id,
                    '/appointments/' || appointment_record.appointment_id,
                    jsonb_build_object(
                        'appointment_id', appointment_record.appointment_id,
                        'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
                        'appointment_date', appointment_record.appointment_date
                    ),
                    appointment_record.appointment_id,
                    appointment_record.patient_id,
                    appointment_record.appointment_date + INTERVAL '1 day'
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 5. CLEANUP FUNCTION FOR EXPIRED NOTIFICATIONS
-- ============================================================================

-- Function to cleanup old archived notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    -- Delete archived notifications older than 30 days
    DELETE FROM notifications
    WHERE is_archived = true
    AND archived_at < NOW() - INTERVAL '30 days';

    -- Delete expired notifications
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_archived = false;

    RAISE NOTICE 'Expired notifications cleaned up';
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 6. HELPER FUNCTION TO CHECK USER NOTIFICATION PREFERENCES
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_notification_enabled(
    p_user_id UUID,
    p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    CASE p_notification_type
        WHEN 'appointment_reminder' THEN
            SELECT appointment_reminder_enabled INTO result
            FROM notification_preferences
            WHERE user_id = p_user_id;
        WHEN 'upcoming_appointment' THEN
            SELECT upcoming_appointment_enabled INTO result
            FROM notification_preferences
            WHERE user_id = p_user_id;
        WHEN 'vaccination_due' THEN
            SELECT vaccination_due_enabled INTO result
            FROM notification_preferences
            WHERE user_id = p_user_id;
        WHEN 'qr_access_alert' THEN
            SELECT qr_access_alert_enabled INTO result
            FROM notification_preferences
            WHERE user_id = p_user_id;
        WHEN 'system_announcement' THEN
            SELECT system_announcement_enabled INTO result
            FROM notification_preferences
            WHERE user_id = p_user_id;
        ELSE
            result := true; -- Default to enabled for unknown types
    END CASE;

    RETURN COALESCE(result, true); -- Default to true if no preference found
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_appointment_reminder_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_qr_access_alert_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_vaccination_due_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_upcoming_appointment_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_notification_enabled(UUID, TEXT) TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION create_appointment_reminder_notification() TO service_role;
GRANT EXECUTE ON FUNCTION create_qr_access_alert_notification() TO service_role;
GRANT EXECUTE ON FUNCTION create_vaccination_due_notification() TO service_role;
GRANT EXECUTE ON FUNCTION create_upcoming_appointment_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION user_has_notification_enabled(UUID, TEXT) TO service_role;


-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================

-- 1. QR Access Logs Table
--    Make sure you have a table to track QR code access with these columns:
--    - qr_id (UUID)
--    - patient_id (UUID)
--    - accessed_by (UUID) - user who accessed
--    - accessed_at (TIMESTAMP)
--    - facility_id (UUID)

-- 2. Vaccinations Table
--    Make sure you have a vaccinations table with these columns:
--    - vaccination_id (UUID)
--    - patient_id (UUID)
--    - vaccine_name (TEXT)
--    - due_date (DATE)
--    - status (TEXT) - 'scheduled', 'pending', 'completed'

-- 3. Scheduled Jobs
--    Set up a scheduled job (pg_cron or external) to run:
--    - create_upcoming_appointment_notifications() - Run every hour
--    - cleanup_expired_notifications() - Run daily at 2 AM

--    Example with pg_cron:
--    SELECT cron.schedule('upcoming-appointments', '0 * * * *',
--           'SELECT create_upcoming_appointment_notifications()');
--
--    SELECT cron.schedule('cleanup-notifications', '0 2 * * *',
--           'SELECT cleanup_expired_notifications()');

-- 4. Testing
--    After migration, test by:
--    - Creating a new appointment → Should auto-create appointment_reminder notification
--    - Accessing a QR code → Should auto-create qr_access_alert notification
--    - Creating a vaccination → Should auto-create vaccination_due notification

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
