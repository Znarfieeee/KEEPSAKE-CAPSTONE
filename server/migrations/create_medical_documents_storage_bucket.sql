-- ============================================================================
-- MEDICAL DOCUMENTS STORAGE BUCKET - KEEPSAKE Healthcare
-- ============================================================================
-- This migration creates the Supabase storage bucket for medical documents
-- ============================================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-documents',
    'medical-documents',
    FALSE,  -- Private bucket (not publicly accessible)
    10485760,  -- 10MB file size limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/tiff',
        'image/tif',
        'application/dicom',
        'image/dicom'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/tiff',
        'image/tif',
        'application/dicom',
        'image/dicom'
    ];

-- ============================================================================
-- FOLDER STRUCTURE DOCUMENTATION
-- ============================================================================
-- The folder structure in the medical-documents bucket follows this pattern:
-- {facility_id}/{patient_id}/{document_type}/{document_id}_v{version}_{filename}
--
-- Example:
-- 123e4567-e89b-12d3-a456-426614174000/
--   ├── 234e5678-e89b-12d3-a456-426614174001/
--   │   ├── lab_result/
--   │   │   ├── 345e6789-e89b-12d3-a456-426614174002_v1_blood_test.pdf
--   │   │   └── 345e6789-e89b-12d3-a456-426614174002_v2_blood_test.pdf
--   │   ├── imaging_report/
--   │   │   └── 456e7890-e89b-12d3-a456-426614174003_v1_xray.jpg
--   │   └── prescription/
--   │       └── 567e8901-e89b-12d3-a456-426614174004_v1_prescription.pdf
--
-- This structure ensures:
-- 1. Facility isolation (first level folder)
-- 2. Patient organization (second level folder)
-- 3. Document type categorization (third level folder)
-- 4. Version tracking in filename
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
