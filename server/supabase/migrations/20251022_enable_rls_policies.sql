-- Migration: Enable RLS policies for multiple tables
-- Date: 2025-10-22
-- Description: Enable Row Level Security and create policies for authenticated users
--              on healthcare_facilities, facility_users, invite_tokens,
--              consultation_types, and qr_codes tables

-- ============================================================================
-- HEALTHCARE FACILITIES TABLE
-- ============================================================================

-- Enable RLS on healthcare_facilities
ALTER TABLE public.healthcare_facilities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read facilities" ON public.healthcare_facilities;
DROP POLICY IF EXISTS "Allow authenticated users to insert facilities" ON public.healthcare_facilities;
DROP POLICY IF EXISTS "Allow authenticated users to update facilities" ON public.healthcare_facilities;
DROP POLICY IF EXISTS "Allow authenticated users to delete facilities" ON public.healthcare_facilities;

-- Create RLS policies for healthcare_facilities
CREATE POLICY "Allow authenticated users to read facilities" ON public.healthcare_facilities
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert facilities" ON public.healthcare_facilities
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update facilities" ON public.healthcare_facilities
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete facilities" ON public.healthcare_facilities
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- FACILITY USERS TABLE
-- ============================================================================

-- Enable RLS on facility_users
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read facility_users" ON public.facility_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert facility_users" ON public.facility_users;
DROP POLICY IF EXISTS "Allow authenticated users to update facility_users" ON public.facility_users;
DROP POLICY IF EXISTS "Allow authenticated users to delete facility_users" ON public.facility_users;

-- Create RLS policies for facility_users
CREATE POLICY "Allow authenticated users to read facility_users" ON public.facility_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert facility_users" ON public.facility_users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update facility_users" ON public.facility_users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete facility_users" ON public.facility_users
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- INVITE TOKENS TABLE
-- ============================================================================

-- Enable RLS on invite_tokens
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read invite_tokens" ON public.invite_tokens;
DROP POLICY IF EXISTS "Allow authenticated users to insert invite_tokens" ON public.invite_tokens;
DROP POLICY IF EXISTS "Allow authenticated users to update invite_tokens" ON public.invite_tokens;
DROP POLICY IF EXISTS "Allow authenticated users to delete invite_tokens" ON public.invite_tokens;

-- Create RLS policies for invite_tokens
CREATE POLICY "Allow authenticated users to read invite_tokens" ON public.invite_tokens
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert invite_tokens" ON public.invite_tokens
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invite_tokens" ON public.invite_tokens
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete invite_tokens" ON public.invite_tokens
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- CONSULTATION TYPES TABLE
-- ============================================================================

-- Enable RLS on consultation_types
ALTER TABLE public.consultation_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read consultation_types" ON public.consultation_types;
DROP POLICY IF EXISTS "Allow authenticated users to insert consultation_types" ON public.consultation_types;
DROP POLICY IF EXISTS "Allow authenticated users to update consultation_types" ON public.consultation_types;
DROP POLICY IF EXISTS "Allow authenticated users to delete consultation_types" ON public.consultation_types;

-- Create RLS policies for consultation_types
CREATE POLICY "Allow authenticated users to read consultation_types" ON public.consultation_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert consultation_types" ON public.consultation_types
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update consultation_types" ON public.consultation_types
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete consultation_types" ON public.consultation_types
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- QR CODES TABLE
-- ============================================================================

-- Enable RLS on qr_codes
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Allow authenticated users to insert qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Allow authenticated users to update qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Allow authenticated users to delete qr_codes" ON public.qr_codes;

-- Create RLS policies for qr_codes
CREATE POLICY "Allow authenticated users to read qr_codes" ON public.qr_codes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert qr_codes" ON public.qr_codes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update qr_codes" ON public.qr_codes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete qr_codes" ON public.qr_codes
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration enables RLS on 5 tables and creates policies allowing:
-- - SELECT: Read access for all authenticated users
-- - INSERT: Create access for all authenticated users
-- - UPDATE: Modify access for all authenticated users
-- - DELETE: Delete access for all authenticated users
--
-- Note: These policies grant broad access to authenticated users.
-- For production, consider implementing more restrictive policies based on:
-- - User roles (system_admin, facility_admin, doctor, etc.)
-- - Facility membership (users can only access data from their facility)
-- - Ownership (users can only modify their own records)
