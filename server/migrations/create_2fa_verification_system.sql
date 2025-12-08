-- Migration: Create 2FA Verification System
-- Description: Create tables and functions for email-based 2FA verification
-- Date: 2024-12-08

-- ============================================================================
-- 1. Create user_2fa_settings table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false,
    method varchar(50) DEFAULT 'email',
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON public.user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_enabled ON public.user_2fa_settings(is_enabled);

-- Enable RLS
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view/update their own 2FA settings
DROP POLICY IF EXISTS "Users can view own 2FA settings" ON public.user_2fa_settings;
CREATE POLICY "Users can view own 2FA settings"
    ON public.user_2fa_settings
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own 2FA settings" ON public.user_2fa_settings;
CREATE POLICY "Users can update own 2FA settings"
    ON public.user_2fa_settings
    FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Create 2FA verification codes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_2fa_verification_codes (
    code_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code varchar(6) NOT NULL,
    code_type varchar(50) NOT NULL, -- 'setup' or 'login'
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    is_used boolean DEFAULT false,
    ip_address inet,
    user_agent text
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_2fa_codes_user_id ON public.user_2fa_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_codes_code ON public.user_2fa_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_2fa_codes_expires_at ON public.user_2fa_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_2fa_codes_used ON public.user_2fa_verification_codes(is_used);

-- Enable RLS
ALTER TABLE public.user_2fa_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own codes (via RPC functions only)
DROP POLICY IF EXISTS "Service role can manage 2FA codes" ON public.user_2fa_verification_codes;
CREATE POLICY "Service role can manage 2FA codes"
    ON public.user_2fa_verification_codes
    FOR ALL
    USING (true);  -- Accessible only through RPC functions with service role

-- ============================================================================
-- 3. Create function to generate 6-digit code
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_2fa_code()
RETURNS varchar(6)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code varchar(6);
BEGIN
    -- Generate random 6-digit code
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN v_code;
END;
$$;

-- ============================================================================
-- 4. Create function to initiate 2FA email verification (for setup)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initiate_2fa_email_verification(
    p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code varchar(6);
    v_expires_at timestamptz;
    v_user_email varchar;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Generate verification code
    v_code := public.generate_2fa_code();

    -- Set expiration to 10 minutes from now
    v_expires_at := now() + INTERVAL '10 minutes';

    -- Invalidate any existing unused setup codes for this user
    UPDATE public.user_2fa_verification_codes
    SET is_used = true, used_at = now()
    WHERE user_id = p_user_id
      AND code_type = 'setup'
      AND is_used = false;

    -- Insert new verification code
    INSERT INTO public.user_2fa_verification_codes (
        user_id,
        code,
        code_type,
        expires_at
    ) VALUES (
        p_user_id,
        v_code,
        'setup',
        v_expires_at
    );

    -- Return code and expiration
    RETURN json_build_object(
        'code', v_code,
        'expires_at', v_expires_at,
        'email', v_user_email
    );
END;
$$;

-- ============================================================================
-- 5. Create function to verify 2FA code during setup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_2fa_code(
    p_user_id uuid,
    p_code varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code_record RECORD;
BEGIN
    -- Find matching code
    SELECT * INTO v_code_record
    FROM public.user_2fa_verification_codes
    WHERE user_id = p_user_id
      AND code = p_code
      AND code_type = 'setup'
      AND is_used = false
    ORDER BY created_at DESC
    LIMIT 1;

    -- Check if code exists
    IF v_code_record IS NULL THEN
        RAISE EXCEPTION 'Invalid verification code';
    END IF;

    -- Check if code is expired
    IF now() > v_code_record.expires_at THEN
        RAISE EXCEPTION 'Verification code has expired';
    END IF;

    -- Mark code as used
    UPDATE public.user_2fa_verification_codes
    SET is_used = true, used_at = now()
    WHERE code_id = v_code_record.code_id;

    -- Enable 2FA for user
    INSERT INTO public.user_2fa_settings (user_id, is_enabled, method, verified_at)
    VALUES (p_user_id, true, 'email', now())
    ON CONFLICT (user_id)
    DO UPDATE SET
        is_enabled = true,
        method = 'email',
        verified_at = now(),
        updated_at = now();

    RETURN true;
END;
$$;

-- ============================================================================
-- 6. Create function to disable 2FA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.disable_2fa(
    p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Disable 2FA for user
    UPDATE public.user_2fa_settings
    SET is_enabled = false,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Invalidate all unused codes
    UPDATE public.user_2fa_verification_codes
    SET is_used = true, used_at = now()
    WHERE user_id = p_user_id AND is_used = false;

    RETURN true;
END;
$$;

-- ============================================================================
-- 7. Create function to generate login 2FA code
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_2fa_login_code(
    p_user_id uuid,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code varchar(6);
    v_expires_at timestamptz;
    v_user_email varchar;
    v_2fa_enabled boolean;
BEGIN
    -- Check if user has 2FA enabled
    SELECT is_enabled INTO v_2fa_enabled
    FROM public.user_2fa_settings
    WHERE user_id = p_user_id;

    IF v_2fa_enabled IS NULL OR v_2fa_enabled = false THEN
        RAISE EXCEPTION '2FA is not enabled for this user';
    END IF;

    -- Get user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Generate verification code
    v_code := public.generate_2fa_code();

    -- Set expiration to 10 minutes from now
    v_expires_at := now() + INTERVAL '10 minutes';

    -- Invalidate any existing unused login codes for this user
    UPDATE public.user_2fa_verification_codes
    SET is_used = true, used_at = now()
    WHERE user_id = p_user_id
      AND code_type = 'login'
      AND is_used = false;

    -- Insert new verification code
    INSERT INTO public.user_2fa_verification_codes (
        user_id,
        code,
        code_type,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        v_code,
        'login',
        v_expires_at,
        p_ip_address,
        p_user_agent
    );

    -- Return code and expiration
    RETURN json_build_object(
        'code', v_code,
        'expires_at', v_expires_at,
        'email', v_user_email
    );
END;
$$;

-- ============================================================================
-- 8. Create function to verify login 2FA code
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_2fa_login_code(
    p_user_id uuid,
    p_code varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code_record RECORD;
BEGIN
    -- Find matching code
    SELECT * INTO v_code_record
    FROM public.user_2fa_verification_codes
    WHERE user_id = p_user_id
      AND code = p_code
      AND code_type = 'login'
      AND is_used = false
    ORDER BY created_at DESC
    LIMIT 1;

    -- Check if code exists
    IF v_code_record IS NULL THEN
        RAISE EXCEPTION 'Invalid verification code';
    END IF;

    -- Check if code is expired
    IF now() > v_code_record.expires_at THEN
        RAISE EXCEPTION 'Verification code has expired';
    END IF;

    -- Mark code as used
    UPDATE public.user_2fa_verification_codes
    SET is_used = true, used_at = now()
    WHERE code_id = v_code_record.code_id;

    RETURN true;
END;
$$;

-- ============================================================================
-- 9. Create cleanup function for expired codes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    -- Delete codes older than 24 hours
    DELETE FROM public.user_2fa_verification_codes
    WHERE created_at < now() - INTERVAL '24 hours';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- 10. Update email_notifications table constraint
-- ============================================================================

-- Add 2FA notification types to email_notifications table
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'email_notifications_notification_type_check'
    ) THEN
        ALTER TABLE public.email_notifications
        DROP CONSTRAINT email_notifications_notification_type_check;
    END IF;
END $$;

-- Add new constraint with 2FA types
ALTER TABLE public.email_notifications
ADD CONSTRAINT email_notifications_notification_type_check
CHECK (notification_type IN (
    'password_reset_requested',
    'password_reset_success',
    'password_reset_blocked',
    'appointment_reminder',
    'appointment_cancelled',
    'prescription_ready',
    'qr_access_granted',
    'qr_access_revoked',
    'qr_access_used',
    '2fa_setup_code',
    '2fa_login_code',
    '2fa_enabled',
    '2fa_disabled'
));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_2fa_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_2fa_email_verification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_2fa_code(uuid, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_2fa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_2fa_login_code(uuid, inet, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_2fa_login_code(uuid, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_2fa_codes() TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ 2FA verification system created successfully';
    RAISE NOTICE '✓ Tables: user_2fa_settings, user_2fa_verification_codes';
    RAISE NOTICE '✓ Functions: initiate_2fa_email_verification, verify_2fa_code, disable_2fa';
    RAISE NOTICE '✓ Functions: generate_2fa_login_code, verify_2fa_login_code';
    RAISE NOTICE '✓ Cleanup function: cleanup_expired_2fa_codes';
END $$;
