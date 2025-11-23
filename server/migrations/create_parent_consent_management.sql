-- Parent Consent Management System Migration
-- This migration creates tables for managing parental sharing rights and consent tracking

-- ============================================================================
-- 1. CONSENT PREFERENCES TABLE
-- Stores parent's default preferences for sharing their children's data
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Default sharing settings
    default_expiry_days INTEGER DEFAULT 7 CHECK (default_expiry_days BETWEEN 1 AND 365),
    default_max_uses INTEGER DEFAULT 10 CHECK (default_max_uses BETWEEN 1 AND 100),
    default_scope JSONB DEFAULT '["view_only", "allergies", "vaccinations"]'::jsonb,

    -- Security preferences
    always_require_pin BOOLEAN DEFAULT false,
    pin_code VARCHAR(4), -- Optional default PIN (hashed in production)

    -- Notification preferences
    notify_on_access BOOLEAN DEFAULT true,
    notify_on_expiry BOOLEAN DEFAULT true,
    notify_before_expiry_days INTEGER DEFAULT 3,

    -- Emergency access settings
    allow_emergency_override BOOLEAN DEFAULT false,
    emergency_contact_notified BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(parent_id)
);

-- ============================================================================
-- 2. SHARING CONSENTS TABLE
-- Tracks individual consent grants for sharing patient data
-- ============================================================================
CREATE TABLE IF NOT EXISTS sharing_consents (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core relationships
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    qr_id UUID REFERENCES qr_codes(qr_id) ON DELETE SET NULL,

    -- Consent target (who was granted access)
    facility_id UUID REFERENCES healthcare_facilities(facility_id) ON DELETE SET NULL,
    provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Consent details
    consent_type VARCHAR(50) NOT NULL DEFAULT 'one_time'
        CHECK (consent_type IN ('one_time', 'recurring', 'emergency', 'permanent')),
    scope JSONB NOT NULL DEFAULT '["view_only"]'::jsonb,

    -- Consent reason/context
    consent_reason VARCHAR(500),
    share_type VARCHAR(100) DEFAULT 'medical_record',
    notes TEXT,

    -- Status and timing
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(500),

    -- Usage tracking
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by UUID REFERENCES users(user_id),

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CONSENT AUDIT LOGS TABLE
-- Comprehensive audit trail for all consent-related activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Related entities
    consent_id UUID REFERENCES sharing_consents(consent_id) ON DELETE SET NULL,
    qr_id UUID REFERENCES qr_codes(qr_id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE SET NULL,
    parent_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Action details
    action VARCHAR(100) NOT NULL
        CHECK (action IN (
            'consent_granted', 'consent_revoked', 'consent_modified', 'consent_expired',
            'qr_generated', 'qr_accessed', 'qr_revoked', 'qr_expired',
            'preferences_updated', 'emergency_revoke_all',
            'access_attempt_blocked', 'suspicious_activity_detected'
        )),

    -- Actor information
    performed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Context and details
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,

    -- Outcome
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Consent preferences indexes
CREATE INDEX IF NOT EXISTS idx_consent_preferences_parent
    ON consent_preferences(parent_id);

-- Sharing consents indexes
CREATE INDEX IF NOT EXISTS idx_sharing_consents_patient
    ON sharing_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_sharing_consents_parent
    ON sharing_consents(parent_id);
CREATE INDEX IF NOT EXISTS idx_sharing_consents_qr
    ON sharing_consents(qr_id);
CREATE INDEX IF NOT EXISTS idx_sharing_consents_status
    ON sharing_consents(status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sharing_consents_expires
    ON sharing_consents(expires_at) WHERE status = 'active';

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_consent_audit_consent
    ON consent_audit_logs(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_qr
    ON consent_audit_logs(qr_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_patient
    ON consent_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_parent
    ON consent_audit_logs(parent_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_action
    ON consent_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_consent_audit_performed_at
    ON consent_audit_logs(performed_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_logs ENABLE ROW LEVEL SECURITY;

-- Consent Preferences Policies
CREATE POLICY "Parents can view own preferences"
    ON consent_preferences FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can update own preferences"
    ON consent_preferences FOR UPDATE
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own preferences"
    ON consent_preferences FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

-- Sharing Consents Policies
CREATE POLICY "Parents can view own children consents"
    ON sharing_consents FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can manage own children consents"
    ON sharing_consents FOR ALL
    USING (auth.uid() = parent_id);

CREATE POLICY "Admins can view all consents"
    ON sharing_consents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role IN ('system_admin', 'facility_admin')
        )
    );

-- Audit Logs Policies
CREATE POLICY "Parents can view own audit logs"
    ON consent_audit_logs FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Admins can view all audit logs"
    ON consent_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role IN ('system_admin', 'facility_admin')
        )
    );

-- ============================================================================
-- 6. TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_consent_preferences_timestamp
    BEFORE UPDATE ON consent_preferences
    FOR EACH ROW EXECUTE FUNCTION update_consent_timestamp();

CREATE TRIGGER update_sharing_consents_timestamp
    BEFORE UPDATE ON sharing_consents
    FOR EACH ROW EXECUTE FUNCTION update_consent_timestamp();

-- Function to auto-expire consents
CREATE OR REPLACE FUNCTION auto_expire_consents()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if consent has expired
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'active' THEN
        NEW.status := 'expired';
        NEW.is_active := false;

        -- Log the expiration
        INSERT INTO consent_audit_logs (
            consent_id, patient_id, parent_id, action, details
        ) VALUES (
            NEW.consent_id,
            NEW.patient_id,
            NEW.parent_id,
            'consent_expired',
            jsonb_build_object(
                'expired_at', NOW(),
                'original_expires_at', NEW.expires_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_consent_expiry
    BEFORE UPDATE ON sharing_consents
    FOR EACH ROW EXECUTE FUNCTION auto_expire_consents();

-- Function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    log_details JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'consent_granted';
        log_details := jsonb_build_object(
            'scope', NEW.scope,
            'consent_type', NEW.consent_type,
            'expires_at', NEW.expires_at
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = true AND NEW.is_active = false THEN
            action_type := 'consent_revoked';
            log_details := jsonb_build_object(
                'revoked_reason', NEW.revoked_reason,
                'previous_status', OLD.status
            );
        ELSE
            action_type := 'consent_modified';
            log_details := jsonb_build_object(
                'old_scope', OLD.scope,
                'new_scope', NEW.scope,
                'old_status', OLD.status,
                'new_status', NEW.status
            );
        END IF;
    END IF;

    -- Insert audit log
    INSERT INTO consent_audit_logs (
        consent_id, patient_id, parent_id, action, performed_by, details
    ) VALUES (
        NEW.consent_id,
        NEW.patient_id,
        NEW.parent_id,
        action_type,
        auth.uid(),
        log_details
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_consent_activity
    AFTER INSERT OR UPDATE ON sharing_consents
    FOR EACH ROW EXECUTE FUNCTION log_consent_changes();

-- ============================================================================
-- 7. SYNC QR CODES WITH CONSENTS
-- Creates consent records when QR codes are generated
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_qr_to_consent()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- Get parent_id for this patient
    SELECT pa.user_id INTO v_parent_id
    FROM parent_access pa
    JOIN users u ON u.user_id = pa.user_id
    WHERE pa.patient_id = NEW.patient_id
    AND pa.is_active = true
    AND u.role = 'parent'
    LIMIT 1;

    -- If parent found, create consent record
    IF v_parent_id IS NOT NULL THEN
        INSERT INTO sharing_consents (
            patient_id,
            parent_id,
            qr_id,
            facility_id,
            consent_type,
            scope,
            share_type,
            expires_at,
            max_access_count,
            consent_reason
        ) VALUES (
            NEW.patient_id,
            v_parent_id,
            NEW.qr_id,
            NEW.facility_id,
            CASE
                WHEN NEW.share_type = 'emergency_access' THEN 'emergency'
                WHEN NEW.max_uses > 50 THEN 'recurring'
                ELSE 'one_time'
            END,
            COALESCE(NEW.scope, '["view_only"]'::jsonb),
            NEW.share_type,
            NEW.expires_at,
            NEW.max_uses,
            'Generated via QR code sharing'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to qr_codes table
DROP TRIGGER IF EXISTS sync_qr_consent ON qr_codes;
CREATE TRIGGER sync_qr_consent
    AFTER INSERT ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION sync_qr_to_consent();

-- ============================================================================
-- 8. HELPER VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for active shares with full details
CREATE OR REPLACE VIEW v_active_shares AS
SELECT
    sc.consent_id,
    sc.patient_id,
    p.first_name || ' ' || p.last_name AS patient_name,
    sc.parent_id,
    u.first_name || ' ' || u.last_name AS parent_name,
    sc.qr_id,
    qr.share_type,
    sc.scope,
    sc.consent_type,
    sc.status,
    sc.granted_at,
    sc.expires_at,
    sc.access_count,
    sc.max_access_count,
    sc.last_accessed_at,
    qr.is_active AS qr_active,
    CASE
        WHEN sc.expires_at < NOW() THEN 'expired'
        WHEN sc.max_access_count IS NOT NULL AND sc.access_count >= sc.max_access_count THEN 'limit_reached'
        WHEN sc.status = 'revoked' THEN 'revoked'
        ELSE 'active'
    END AS effective_status,
    hf.facility_name,
    hf.facility_id
FROM sharing_consents sc
JOIN patients p ON p.patient_id = sc.patient_id
JOIN users u ON u.user_id = sc.parent_id
LEFT JOIN qr_codes qr ON qr.qr_id = sc.qr_id
LEFT JOIN healthcare_facilities hf ON hf.facility_id = sc.facility_id
WHERE sc.is_active = true;

-- View for access history with user details
CREATE OR REPLACE VIEW v_consent_access_history AS
SELECT
    cal.log_id,
    cal.consent_id,
    cal.qr_id,
    cal.patient_id,
    p.first_name || ' ' || p.last_name AS patient_name,
    cal.parent_id,
    cal.action,
    cal.performed_at,
    cal.details,
    cal.ip_address,
    cal.success,
    u.first_name || ' ' || u.last_name AS performed_by_name,
    u.role AS performed_by_role,
    hf.facility_name AS performed_at_facility
FROM consent_audit_logs cal
LEFT JOIN patients p ON p.patient_id = cal.patient_id
LEFT JOIN users u ON u.user_id = cal.performed_by
LEFT JOIN healthcare_facilities hf ON hf.facility_id = (cal.details->>'facility_id')::uuid
ORDER BY cal.performed_at DESC;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE consent_preferences IS 'Stores parent default preferences for data sharing';
COMMENT ON TABLE sharing_consents IS 'Tracks individual consent grants for patient data sharing';
COMMENT ON TABLE consent_audit_logs IS 'Comprehensive audit trail for consent activities';
COMMENT ON VIEW v_active_shares IS 'View showing all currently active data shares with full details';
COMMENT ON VIEW v_consent_access_history IS 'View showing consent access history with user details';
