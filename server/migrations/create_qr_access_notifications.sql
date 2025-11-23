-- ============================================================================
-- QR ACCESS ALERT NOTIFICATIONS (PARENTS/GUARDIANS ONLY)
-- ============================================================================
-- Notifies parents/guardians when their child's medical records are accessed
-- via QR code at external facilities
-- ============================================================================

-- Function to notify parents when QR code is accessed
CREATE OR REPLACE FUNCTION notify_qr_access()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    accessing_facility RECORD;
    parent_user_id UUID;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get accessing facility information (if available)
    SELECT * INTO accessing_facility
    FROM healthcare_facilities
    WHERE facility_id = NEW.last_accessed_by;

    -- Get parent/guardian from parent_access table
    -- QR access alerts are ONLY for parents/guardians, not healthcare staff
    SELECT user_id INTO parent_user_id
    FROM parent_access pa
    JOIN users u ON pa.user_id = u.user_id
    WHERE pa.patient_id = NEW.patient_id
    AND pa.is_active = true
    AND u.role IN ('parent', 'guardian')  -- Only parent/guardian roles
    LIMIT 1;

    -- Skip if no parent/guardian found
    IF parent_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Create URGENT notification for QR access
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        action_url,
        metadata,
        related_patient_id,
        related_qr_id
    ) VALUES (
        parent_user_id,
        'qr_access_alert',
        'Medical Record Accessed',
        format('%s''s medical records were accessed via QR code at %s',
            patient_record.firstname || ' ' || patient_record.lastname,
            COALESCE(accessing_facility.facility_name, 'an external facility')
        ),
        'urgent',
        '/qr-access-logs',
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'patient_name', patient_record.firstname || ' ' || patient_record.lastname,
            'qr_id', NEW.qr_id,
            'accessed_at', NEW.last_accessed_at,
            'accessing_facility', COALESCE(accessing_facility.facility_name, 'Unknown Facility'),
            'access_count', NEW.use_count
        ),
        NEW.patient_id,
        NEW.qr_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for QR code access
DROP TRIGGER IF EXISTS trigger_qr_access_alert ON qr_codes;
CREATE TRIGGER trigger_qr_access_alert
    AFTER UPDATE ON qr_codes
    FOR EACH ROW
    WHEN (
        OLD.last_accessed_at IS DISTINCT FROM NEW.last_accessed_at
        AND NEW.last_accessed_at IS NOT NULL
    )
    EXECUTE FUNCTION notify_qr_access();

-- Grant permissions
GRANT EXECUTE ON FUNCTION notify_qr_access() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_qr_access() TO service_role;

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. QR access alerts are ONLY sent to parents/guardians (role='parent' or 'guardian')
-- 2. Doctors, nurses, and facility_admin do NOT receive QR access alerts
-- 3. This is intentional for privacy - healthcare staff access is logged separately
-- 4. Parents are notified when their child's records are accessed at external facilities
-- 5. Notification priority is URGENT as it involves unauthorized facility access
-- ============================================================================
