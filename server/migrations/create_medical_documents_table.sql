-- ============================================================================
-- MEDICAL DOCUMENTS TABLE - KEEPSAKE Healthcare
-- ============================================================================
-- This migration creates the medical_documents table to store patient medical
-- documents with versioning support and secure access control
-- ============================================================================

-- Check if healthcare_facilities table exists (fallback to facilities if not)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'healthcare_facilities') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facilities') THEN
            RAISE NOTICE 'Using facilities table for foreign key reference';
        END IF;
    END IF;
END $$;

-- Create medical_documents table
CREATE TABLE IF NOT EXISTS medical_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    facility_id UUID NOT NULL,

    -- Document metadata
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('lab_result', 'imaging_report', 'vaccination_record', 'prescription', 'other')
    ),
    document_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Storage reference
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'medical-documents',
    storage_path TEXT NOT NULL UNIQUE,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Versioning support
    version INTEGER NOT NULL DEFAULT 1,
    parent_document_id UUID REFERENCES medical_documents(document_id) ON DELETE SET NULL,
    is_current_version BOOLEAN DEFAULT TRUE,

    -- Upload metadata
    uploaded_by UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Optional: Link to related records
    related_appointment_id BIGINT,
    related_prescription_id UUID,
    related_vaccination_id UUID,

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_version CHECK (version > 0),
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB max
    CONSTRAINT valid_storage_path CHECK (length(storage_path) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_documents_patient
    ON medical_documents(patient_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_medical_documents_facility
    ON medical_documents(facility_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_medical_documents_type
    ON medical_documents(document_type)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_medical_documents_uploaded_by
    ON medical_documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_medical_documents_uploaded_at
    ON medical_documents(uploaded_at DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_medical_documents_version
    ON medical_documents(parent_document_id, version);

CREATE INDEX IF NOT EXISTS idx_medical_documents_current_version
    ON medical_documents(patient_id, document_type, is_current_version)
    WHERE is_deleted = FALSE AND is_current_version = TRUE;

-- Enable Row Level Security
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy 1: Healthcare staff can view documents for patients at their facility
CREATE POLICY "Healthcare staff can view facility patient documents"
    ON medical_documents
    FOR SELECT
    USING (
        is_deleted = FALSE
        AND facility_id IN (
            SELECT fu.facility_id
            FROM facility_users fu
            WHERE fu.user_id = auth.uid()
        )
        AND patient_id IN (
            SELECT fp.patient_id
            FROM facility_patients fp
            JOIN facility_users fu ON fu.facility_id = fp.facility_id
            WHERE fu.user_id = auth.uid() AND fp.is_active = TRUE
        )
    );

-- Policy 2: Parents can view documents for their children
CREATE POLICY "Parents can view their children's documents"
    ON medical_documents
    FOR SELECT
    USING (
        is_deleted = FALSE
        AND patient_id IN (
            SELECT pa.patient_id
            FROM parent_access pa
            WHERE pa.user_id = auth.uid() AND pa.is_active = TRUE
        )
    );

-- Policy 3: Doctors, nurses, facility_admin can upload documents
CREATE POLICY "Healthcare staff can upload documents"
    ON medical_documents
    FOR INSERT
    WITH CHECK (
        facility_id IN (
            SELECT fu.facility_id
            FROM facility_users fu
            JOIN users u ON u.user_id = fu.user_id
            WHERE fu.user_id = auth.uid()
            AND u.role IN ('doctor', 'nurse', 'facility_admin')
        )
        AND patient_id IN (
            SELECT fp.patient_id
            FROM facility_patients fp
            JOIN facility_users fu ON fu.facility_id = fp.facility_id
            WHERE fu.user_id = auth.uid() AND fp.is_active = TRUE
        )
    );

-- Policy 4: Parents can upload documents for their children
CREATE POLICY "Parents can upload documents for their children"
    ON medical_documents
    FOR INSERT
    WITH CHECK (
        patient_id IN (
            SELECT pa.patient_id
            FROM parent_access pa
            WHERE pa.user_id = auth.uid() AND pa.is_active = TRUE
        )
    );

-- Policy 5: Uploader or facility admin can soft delete documents
CREATE POLICY "Staff can soft delete their uploaded documents"
    ON medical_documents
    FOR UPDATE
    USING (
        (
            uploaded_by = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM facility_users fu
                JOIN users u ON u.user_id = fu.user_id
                WHERE fu.user_id = auth.uid()
                AND fu.facility_id = medical_documents.facility_id
                AND u.role = 'facility_admin'
            )
        )
        AND facility_id IN (
            SELECT fu.facility_id FROM facility_users fu WHERE fu.user_id = auth.uid()
        )
    );

-- Policy 6: Service role full access (for backend operations)
CREATE POLICY "Service role full access on medical_documents"
    ON medical_documents
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_medical_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row update
CREATE TRIGGER medical_documents_updated_at_trigger
    BEFORE UPDATE ON medical_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_medical_documents_updated_at();

-- Function to handle document versioning
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If updating an existing document to create a new version
    IF NEW.parent_document_id IS NOT NULL AND NEW.version > 1 THEN
        -- Mark previous versions as not current
        UPDATE medical_documents
        SET is_current_version = FALSE
        WHERE patient_id = NEW.patient_id
        AND document_type = NEW.document_type
        AND (document_id = NEW.parent_document_id OR parent_document_id = NEW.parent_document_id)
        AND document_id != NEW.document_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle version management
CREATE TRIGGER document_version_trigger
    BEFORE INSERT ON medical_documents
    FOR EACH ROW
    EXECUTE FUNCTION create_document_version();

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON medical_documents TO authenticated;
GRANT UPDATE (is_deleted, deleted_at, deleted_by) ON medical_documents TO authenticated;
GRANT ALL ON medical_documents TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE medical_documents IS 'Stores patient medical documents with versioning support and secure access control';
COMMENT ON COLUMN medical_documents.document_type IS 'Type of medical document: lab_result, imaging_report, vaccination_record, prescription, other';
COMMENT ON COLUMN medical_documents.storage_path IS 'Path in Supabase storage bucket, format: {facility_id}/{patient_id}/{document_type}/{document_id}_v{version}_{filename}';
COMMENT ON COLUMN medical_documents.version IS 'Version number for document versioning, starts at 1';
COMMENT ON COLUMN medical_documents.parent_document_id IS 'Reference to original document if this is a newer version';
COMMENT ON COLUMN medical_documents.is_current_version IS 'Flag to indicate if this is the most recent version of the document';
COMMENT ON COLUMN medical_documents.is_deleted IS 'Soft delete flag to preserve audit trail';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
