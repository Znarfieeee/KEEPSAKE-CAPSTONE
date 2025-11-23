-- ============================================================================
-- ENHANCED AUTOMATIC NOTIFICATION SYSTEM - KEEPSAKE Healthcare
-- ============================================================================
-- Additional notification triggers for record updates, prescriptions,
-- and other real-world scenarios
-- ============================================================================

-- ============================================================================
-- 1. PATIENT RECORD UPDATE NOTIFICATIONS
-- ============================================================================

-- Function to notify when patient records are updated
CREATE OR REPLACE FUNCTION notify_patient_record_update()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    updating_user RECORD;
    user_prefs RECORD;
    changes_text TEXT;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get updating user information
    SELECT * INTO updating_user
    FROM users
    WHERE user_id = NEW.updated_by;

    -- Skip if no parent/guardian (orphaned record)
    IF patient_record.parent_guardian_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id;

    -- Build changes description
    changes_text := 'Medical record was updated';

    -- Create notification for record update
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        facility_id,
        action_url,
        metadata,
        related_patient_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'record_update',
        'Medical Record Updated',
        format('%s''s medical record was updated by %s',
            patient_record.first_name || ' ' || patient_record.last_name,
            COALESCE(updating_user.first_name || ' ' || updating_user.last_name, 'Staff')
        ),
        'normal',
        patient_record.facility_id,
        '/patients/' || NEW.patient_id,
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'updated_by', NEW.updated_by,
            'updated_at', NEW.updated_at,
            'changes', changes_text
        ),
        NEW.patient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for patient record updates
DROP TRIGGER IF EXISTS trigger_patient_record_update ON patients;
CREATE TRIGGER trigger_patient_record_update
    AFTER UPDATE ON patients
    FOR EACH ROW
    WHEN (
        OLD.updated_at IS DISTINCT FROM NEW.updated_at
        AND OLD.updated_by IS NOT NULL
    )
    EXECUTE FUNCTION notify_patient_record_update();


-- ============================================================================
-- 2. PRESCRIPTION NOTIFICATIONS
-- ============================================================================

-- Function to notify when new prescription is created
CREATE OR REPLACE FUNCTION notify_new_prescription()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    doctor_record RECORD;
    user_prefs RECORD;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get doctor information
    SELECT * INTO doctor_record
    FROM users
    WHERE user_id = NEW.prescribed_by;

    -- Skip if no parent/guardian
    IF patient_record.parent_guardian_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id;

    -- Create notification for new prescription
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        facility_id,
        action_url,
        metadata,
        related_patient_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'new_prescription',
        'New Prescription',
        format('Dr. %s prescribed %s for %s',
            COALESCE(doctor_record.lastname, 'Unknown'),
            NEW.medication_name,
            patient_record.first_name || ' ' || patient_record.last_name
        ),
        'high',
        patient_record.facility_id,
        '/patients/' || NEW.patient_id || '/prescriptions',
        jsonb_build_object(
            'prescription_id', NEW.prescription_id,
            'patient_id', NEW.patient_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'medication_name', NEW.medication_name,
            'dosage', NEW.dosage,
            'prescribed_by', NEW.prescribed_by
        ),
        NEW.patient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new prescriptions
DROP TRIGGER IF EXISTS trigger_new_prescription ON prescriptions;
CREATE TRIGGER trigger_new_prescription
    AFTER INSERT ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_prescription();


-- ============================================================================
-- 3. APPOINTMENT STATUS CHANGE NOTIFICATIONS
-- ============================================================================

-- Function to notify when appointment status changes
CREATE OR REPLACE FUNCTION notify_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    user_prefs RECORD;
    status_message TEXT;
BEGIN
    -- Only trigger on status change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Skip if no parent/guardian
    IF patient_record.parent_guardian_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id;

    -- Build status message
    CASE NEW.status
        WHEN 'confirmed' THEN
            status_message := 'confirmed';
        WHEN 'cancelled' THEN
            status_message := 'cancelled';
        WHEN 'completed' THEN
            status_message := 'completed';
        WHEN 'rescheduled' THEN
            status_message := 'rescheduled';
        ELSE
            status_message := 'updated';
    END CASE;

    -- Create notification for appointment status change
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
        related_patient_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'appointment_status_change',
        'Appointment ' || INITCAP(status_message),
        format('%s''s appointment on %s has been %s',
            patient_record.first_name || ' ' || patient_record.last_name,
            TO_CHAR(NEW.appointment_date, 'Month DD, YYYY'),
            status_message
        ),
        CASE
            WHEN NEW.status = 'cancelled' THEN 'high'
            ELSE 'normal'
        END,
        NEW.facility_id,
        '/appointments/' || NEW.appointment_id,
        jsonb_build_object(
            'appointment_id', NEW.appointment_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'appointment_date', NEW.appointment_date
        ),
        NEW.appointment_id,
        NEW.patient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointment status changes
DROP TRIGGER IF EXISTS trigger_appointment_status_change ON appointments;
CREATE TRIGGER trigger_appointment_status_change
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_appointment_status_change();


-- ============================================================================
-- 4. ANTHROPOMETRIC MEASUREMENTS (GROWTH TRACKING) NOTIFICATIONS
-- ============================================================================

-- Function to notify when new measurements are recorded
CREATE OR REPLACE FUNCTION notify_new_measurement()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    recording_user RECORD;
    user_prefs RECORD;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get recording user information
    SELECT * INTO recording_user
    FROM users
    WHERE user_id = NEW.recorded_by;

    -- Skip if no parent/guardian
    IF patient_record.parent_guardian_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id;

    -- Create notification for new measurement
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        facility_id,
        action_url,
        metadata,
        related_patient_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'new_measurement',
        'Growth Measurement Recorded',
        format('New growth measurements recorded for %s',
            patient_record.first_name || ' ' || patient_record.last_name
        ),
        'normal',
        patient_record.facility_id,
        '/patients/' || NEW.patient_id || '/growth',
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'weight', NEW.weight,
            'height', NEW.height,
            'measurement_date', NEW.measurement_date,
            'recorded_by', NEW.recorded_by
        ),
        NEW.patient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new anthropometric measurements
DROP TRIGGER IF EXISTS trigger_new_measurement ON anthropometric_measurements;
CREATE TRIGGER trigger_new_measurement
    AFTER INSERT ON anthropometric_measurements
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_measurement();


-- ============================================================================
-- 5. MEDICAL DOCUMENT UPLOAD NOTIFICATIONS
-- ============================================================================

-- Function to notify when medical documents are uploaded
CREATE OR REPLACE FUNCTION notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    uploading_user RECORD;
    user_prefs RECORD;
BEGIN
    -- Skip if document is deleted
    IF NEW.is_deleted THEN
        RETURN NEW;
    END IF;

    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get uploading user information
    SELECT * INTO uploading_user
    FROM users
    WHERE user_id = NEW.uploaded_by;

    -- Skip if no parent/guardian
    IF patient_record.parent_guardian_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id;

    -- Create notification for document upload
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        facility_id,
        action_url,
        metadata,
        related_patient_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'document_upload',
        'New Medical Document',
        format('New %s document uploaded for %s',
            COALESCE(NEW.document_type, 'medical'),
            patient_record.first_name || ' ' || patient_record.last_name
        ),
        'normal',
        NEW.facility_id,
        '/patients/' || NEW.patient_id || '/documents',
        jsonb_build_object(
            'document_id', NEW.document_id,
            'patient_id', NEW.patient_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'document_name', NEW.document_name,
            'document_type', NEW.document_type,
            'uploaded_by', NEW.uploaded_by
        ),
        NEW.patient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document uploads
DROP TRIGGER IF EXISTS trigger_document_upload ON medical_documents;
CREATE TRIGGER trigger_document_upload
    AFTER INSERT ON medical_documents
    FOR EACH ROW
    WHEN (NEW.is_deleted = false)
    EXECUTE FUNCTION notify_document_upload();


-- ============================================================================
-- 6. ALLERGY ALERT NOTIFICATIONS
-- ============================================================================

-- Function to notify when new allergy is recorded
CREATE OR REPLACE FUNCTION notify_new_allergy()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    recording_user RECORD;
    user_prefs RECORD;
BEGIN
    -- Get patient information
    SELECT * INTO patient_record
    FROM patients
    WHERE patient_id = NEW.patient_id;

    -- Get recording user information
    SELECT * INTO recording_user
    FROM users
    WHERE user_id = NEW.recorded_by;

    -- Skip if no parent/guardian
    IF patient_record.parent_guardian_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = patient_record.parent_guardian_id;

    -- Create high-priority notification for new allergy
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        facility_id,
        action_url,
        metadata,
        related_patient_id
    ) VALUES (
        patient_record.parent_guardian_id,
        'allergy_alert',
        'New Allergy Recorded',
        format('ALERT: New allergy recorded for %s - %s',
            patient_record.first_name || ' ' || patient_record.last_name,
            NEW.allergen
        ),
        'urgent',
        patient_record.facility_id,
        '/patients/' || NEW.patient_id || '/allergies',
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
            'allergen', NEW.allergen,
            'severity', NEW.severity,
            'recorded_by', NEW.recorded_by
        ),
        NEW.patient_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new allergies
DROP TRIGGER IF EXISTS trigger_new_allergy ON allergies;
CREATE TRIGGER trigger_new_allergy
    AFTER INSERT ON allergies
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_allergy();


-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION notify_patient_record_update() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_prescription() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_appointment_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_measurement() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_document_upload() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_allergy() TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION notify_patient_record_update() TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_prescription() TO service_role;
GRANT EXECUTE ON FUNCTION notify_appointment_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_measurement() TO service_role;
GRANT EXECUTE ON FUNCTION notify_document_upload() TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_allergy() TO service_role;


-- ============================================================================
-- END OF ENHANCED NOTIFICATION SYSTEM
-- ============================================================================
