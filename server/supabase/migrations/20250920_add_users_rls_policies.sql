-- Migration: Add RLS policies for authenticated users to INSERT and UPDATE users table
-- Date: 2025-09-20
-- Description: Enable authenticated users to insert and update records in the users table

-- Check if RLS is enabled (for reference)
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON public.users;

-- Create RLS policy to allow authenticated users to INSERT into users table
CREATE POLICY "Allow authenticated users to insert users" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create RLS policy to allow authenticated users to UPDATE users table
CREATE POLICY "Allow authenticated users to update users" ON public.users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;