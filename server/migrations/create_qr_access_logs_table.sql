-- ============================================================================
-- QR ACCESS LOGS TABLE - KEEPSAKE Healthcare
-- ============================================================================
-- This migration creates the qr_access_logs table to track QR code access
-- and automatically trigger QR access alert notifications
-- ============================================================================

-- Create qr_access_logs table
CREATE TABLE IF NOT EXISTS qr_access_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    facility_id UUID REFERENCES facilities(facility_id) ON DELETE SET NULL,
    access_method TEXT DEFAULT 'qr_scan', -- 'qr_scan', 'manual', 'api'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_patient_id ON qr_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_accessed_by ON qr_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_accessed_at ON qr_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_facility_id ON qr_access_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_qr_id ON qr_access_logs(qr_id);

-- Enable Row Level Security
ALTER TABLE qr_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see logs for their own patients
CREATE POLICY "Users can view their patients' QR access logs"
    ON qr_access_logs
    FOR SELECT
    USING (
        patient_id IN (
            SELECT patient_id FROM patients
            WHERE parent_guardian_id = auth.uid()
        )
        OR
        accessed_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role IN ('system_admin', 'facility_admin')
        )
    );

-- RLS Policy: Service role can do anything
CREATE POLICY "Service role full access"
    ON qr_access_logs
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policy: Authenticated users can insert access logs
CREATE POLICY "Authenticated users can create access logs"
    ON qr_access_logs
    FOR INSERT
    WITH CHECK (
        accessed_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid()
            AND role IN ('system_admin', 'facility_admin', 'doctor')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON qr_access_logs TO authenticated;
GRANT ALL ON qr_access_logs TO service_role;

-- Add comment
COMMENT ON TABLE qr_access_logs IS 'Tracks QR code access for patient records and triggers automatic notifications';
