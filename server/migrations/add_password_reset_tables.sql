-- Migration: Add Password Reset Tables
-- Created: 2025-12-06
-- Purpose: Add tables for self-service password reset with enhanced security

-- 1. Password Reset Tokens Table
-- Stores hashed tokens for password reset requests
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    token_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    email character varying NOT NULL,
    token_hash character varying(255) NOT NULL,  -- SHA-256 hash of the actual token
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,  -- 30 minutes from creation
    used_at timestamp with time zone,
    is_used boolean DEFAULT false,
    CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id),
    CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON public.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email
    ON public.password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
    ON public.password_reset_tokens(expires_at)
    WHERE is_used = false;

-- Comment on password_reset_tokens table
COMMENT ON TABLE public.password_reset_tokens IS 'Stores password reset tokens with SHA-256 hashing for security';
COMMENT ON COLUMN public.password_reset_tokens.token_hash IS 'SHA-256 hash of the reset token (plain token never stored)';
COMMENT ON COLUMN public.password_reset_tokens.expires_at IS 'Token expires 30 minutes after creation';
COMMENT ON COLUMN public.password_reset_tokens.is_used IS 'One-time use flag - prevents token reuse';


-- 2. Password Reset Rate Limits Table
-- Tracks rate limiting for password reset requests
CREATE TABLE IF NOT EXISTS public.password_reset_rate_limits (
    limit_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    identifier character varying NOT NULL,  -- email address or IP address
    identifier_type character varying NOT NULL CHECK (identifier_type IN ('email', 'ip')),
    attempt_count integer DEFAULT 1,
    first_attempt_at timestamp with time zone DEFAULT now(),
    last_attempt_at timestamp with time zone DEFAULT now(),
    blocked_until timestamp with time zone,
    CONSTRAINT password_reset_rate_limits_pkey PRIMARY KEY (limit_id),
    CONSTRAINT unique_identifier_type UNIQUE (identifier, identifier_type)
);

-- Index for password_reset_rate_limits
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_identifier
    ON public.password_reset_rate_limits(identifier, identifier_type);

-- Comment on password_reset_rate_limits table
COMMENT ON TABLE public.password_reset_rate_limits IS 'Rate limiting for password reset requests (5/hr per email, 10/hr per IP)';
COMMENT ON COLUMN public.password_reset_rate_limits.identifier IS 'Email address or IP address being rate limited';
COMMENT ON COLUMN public.password_reset_rate_limits.identifier_type IS 'Type of identifier: email or ip';
COMMENT ON COLUMN public.password_reset_rate_limits.attempt_count IS 'Number of attempts within the rate limit window';
COMMENT ON COLUMN public.password_reset_rate_limits.blocked_until IS 'Timestamp when the block expires (NULL if not blocked)';


-- 3. Update email_notifications table to support password reset notification types
-- Add new notification types to existing CHECK constraint
DO $$
BEGIN
    -- Drop the old check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'email_notifications_notification_type_check'
        AND table_name = 'email_notifications'
    ) THEN
        ALTER TABLE public.email_notifications
        DROP CONSTRAINT email_notifications_notification_type_check;
    END IF;

    -- Add the new check constraint with additional notification types
    ALTER TABLE public.email_notifications
    ADD CONSTRAINT email_notifications_notification_type_check
    CHECK (notification_type::text = ANY (ARRAY[
        'invoice_generated'::character varying,
        'payment_reminder'::character varying,
        'payment_received'::character varying,
        'subscription_expiring'::character varying,
        'subscription_expired'::character varying,
        'subscription_upgraded'::character varying,
        'subscription_downgraded'::character varying,
        'subscription_cancelled'::character varying,
        'password_reset_requested'::character varying,
        'password_reset_success'::character varying,
        'password_reset_blocked'::character varying
    ]::text[]));
END $$;

-- Comment on new notification types
COMMENT ON COLUMN public.email_notifications.notification_type IS 'Type of email notification (includes password reset types: password_reset_requested, password_reset_success, password_reset_blocked)';


-- 4. Cleanup function to remove expired tokens (optional, run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Delete tokens that are either:
    -- 1. Expired (past expires_at timestamp)
    -- 2. Already used (is_used = true) and older than 24 hours
    DELETE FROM public.password_reset_tokens
    WHERE
        (expires_at < now())
        OR
        (is_used = true AND created_at < now() - interval '24 hours');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_password_reset_tokens IS 'Cleanup function to remove expired and used password reset tokens. Returns count of deleted rows.';


-- 5. Cleanup function to reset rate limits (optional, run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reset_count integer;
BEGIN
    -- Reset rate limits where:
    -- 1. Blocked period has expired (blocked_until < now())
    -- 2. First attempt was more than 1 hour ago and not currently blocked
    DELETE FROM public.password_reset_rate_limits
    WHERE
        (blocked_until IS NOT NULL AND blocked_until < now())
        OR
        (blocked_until IS NULL AND first_attempt_at < now() - interval '1 hour');

    GET DIAGNOSTICS reset_count = ROW_COUNT;

    RETURN reset_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_rate_limits IS 'Cleanup function to reset expired rate limit entries. Returns count of reset rows.';


-- Grant necessary permissions (adjust based on your RLS policies)
-- These grants ensure the application can read/write to the new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_password_reset_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits TO authenticated;

-- Migration complete
-- Next steps:
-- 1. Run this migration using Supabase migration tools or SQL editor
-- 2. Verify tables created: SELECT * FROM information_schema.tables WHERE table_name LIKE 'password_reset%';
-- 3. Set up periodic cleanup job (optional): SELECT cron.schedule('cleanup-password-reset', '0 * * * *', 'SELECT cleanup_expired_password_reset_tokens(); SELECT cleanup_expired_rate_limits();');
