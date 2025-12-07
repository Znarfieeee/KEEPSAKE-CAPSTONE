"""
Password Reset Service for KEEPSAKE Healthcare System
Handles password reset logic with enhanced security features
"""
import secrets
import hashlib
import time
from datetime import datetime, timedelta
import logging
from config.settings import supabase_anon_client, supabase_service_role_client
from utils.email_service import EmailService

logger = logging.getLogger(__name__)

# Get Supabase clients
supabase = supabase_anon_client()
supabase_admin = supabase_service_role_client()


class PasswordResetService:
    """Service for handling password reset requests with security features"""

    # Security configuration
    TOKEN_LENGTH = 32  # bytes (results in 43-char URL-safe string)
    TOKEN_EXPIRY_MINUTES = 30
    EMAIL_RATE_LIMIT = 5  # requests per hour
    IP_RATE_LIMIT = 10  # requests per hour
    RATE_LIMIT_WINDOW_HOURS = 1
    BLOCK_DURATION_HOURS = 1

    @staticmethod
    def generate_reset_token():
        """
        Generate a cryptographically secure reset token

        Returns:
            str: URL-safe 32-byte token (43 characters)
        """
        return secrets.token_urlsafe(PasswordResetService.TOKEN_LENGTH)

    @staticmethod
    def hash_token(token):
        """
        Hash a token using SHA-256

        Args:
            token (str): Plain text token

        Returns:
            str: SHA-256 hash (64 characters hex)
        """
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def check_rate_limit(identifier, identifier_type):
        """
        Check if identifier (email or IP) is rate limited

        Args:
            identifier (str): Email address or IP address
            identifier_type (str): 'email' or 'ip'

        Returns:
            tuple: (allowed: bool, message: str)
        """
        try:
            # Get rate limit for this identifier
            rate_limit_response = supabase_admin.table('password_reset_rate_limits').select('*').eq(
                'identifier', identifier
            ).eq('identifier_type', identifier_type).execute()

            limit = PasswordResetService.EMAIL_RATE_LIMIT if identifier_type == 'email' else PasswordResetService.IP_RATE_LIMIT

            if not rate_limit_response.data:
                # First request - create new rate limit record
                supabase_admin.table('password_reset_rate_limits').insert({
                    'identifier': identifier,
                    'identifier_type': identifier_type,
                    'attempt_count': 1,
                    'first_attempt_at': datetime.utcnow().isoformat(),
                    'last_attempt_at': datetime.utcnow().isoformat()
                }).execute()
                return True, "Request allowed"

            rate_limit_record = rate_limit_response.data[0]

            # Check if currently blocked
            if rate_limit_record.get('blocked_until'):
                blocked_until = datetime.fromisoformat(rate_limit_record['blocked_until'].replace('Z', '+00:00'))
                if datetime.utcnow() < blocked_until.replace(tzinfo=None):
                    minutes_remaining = int((blocked_until.replace(tzinfo=None) - datetime.utcnow()).total_seconds() / 60)
                    logger.warning(f"Rate limit blocked: {identifier_type} {identifier} - {minutes_remaining} min remaining")
                    return False, f"Too many password reset attempts. Please try again in {minutes_remaining} minutes."

            # Check if window has expired (reset counter)
            first_attempt = datetime.fromisoformat(rate_limit_record['first_attempt_at'].replace('Z', '+00:00'))
            if datetime.utcnow() > first_attempt.replace(tzinfo=None) + timedelta(hours=PasswordResetService.RATE_LIMIT_WINDOW_HOURS):
                # Reset counter - window expired
                supabase_admin.table('password_reset_rate_limits').update({
                    'attempt_count': 1,
                    'first_attempt_at': datetime.utcnow().isoformat(),
                    'last_attempt_at': datetime.utcnow().isoformat(),
                    'blocked_until': None
                }).eq('identifier', identifier).eq('identifier_type', identifier_type).execute()
                return True, "Request allowed (counter reset)"

            # Increment counter
            new_count = rate_limit_record['attempt_count'] + 1

            if new_count > limit:
                # Exceeded limit - block for 1 hour
                blocked_until = datetime.utcnow() + timedelta(hours=PasswordResetService.BLOCK_DURATION_HOURS)
                supabase_admin.table('password_reset_rate_limits').update({
                    'attempt_count': new_count,
                    'last_attempt_at': datetime.utcnow().isoformat(),
                    'blocked_until': blocked_until.isoformat()
                }).eq('identifier', identifier).eq('identifier_type', identifier_type).execute()

                logger.warning(f"Rate limit exceeded: {identifier_type} {identifier} - blocked until {blocked_until}")
                return False, f"Too many password reset attempts. Please try again in {PasswordResetService.BLOCK_DURATION_HOURS} hour."

            # Update counter
            supabase_admin.table('password_reset_rate_limits').update({
                'attempt_count': new_count,
                'last_attempt_at': datetime.utcnow().isoformat()
            }).eq('identifier', identifier).eq('identifier_type', identifier_type).execute()

            return True, "Request allowed"

        except Exception as e:
            logger.error(f"Error checking rate limit: {str(e)}")
            # Fail open - allow request if rate limit check fails
            return True, "Request allowed (rate limit check failed)"

    @staticmethod
    def request_password_reset(email, ip_address, user_agent, request_url_root):
        """
        Request a password reset for a user

        Args:
            email (str): User's email address
            ip_address (str): Request IP address
            user_agent (str): Request user agent
            request_url_root (str): Base URL for reset link

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Check email rate limit
            email_allowed, email_msg = PasswordResetService.check_rate_limit(email, 'email')
            if not email_allowed:
                # Send rate limited email if configured
                EmailService.send_rate_limited_email(email)
                logger.warning(f"Password reset rate limited for email: {email} from IP {ip_address}")
                return False, email_msg

            # Check IP rate limit
            ip_allowed, ip_msg = PasswordResetService.check_rate_limit(ip_address, 'ip')
            if not ip_allowed:
                logger.warning(f"Password reset rate limited for IP: {ip_address}")
                return False, ip_msg

            # Look up user by email
            user_response = supabase.table('users').select('user_id, email, firstname, lastname, is_active').eq(
                'email', email
            ).execute()

            if not user_response.data:
                # User doesn't exist - return error message
                logger.info(f"Password reset requested for non-existent email: {email}")
                return False, "No account found with this email address. Please check your email and try again."

            user = user_response.data[0]

            # Check if user is active
            if not user.get('is_active', False):
                # Inactive account - return error message
                logger.info(f"Password reset requested for inactive account: {email}")
                return False, "This account is currently inactive. Please contact your administrator for assistance."

            # Generate reset token
            reset_token = PasswordResetService.generate_reset_token()
            token_hash = PasswordResetService.hash_token(reset_token)

            # Calculate expiry time
            expires_at = datetime.utcnow() + timedelta(minutes=PasswordResetService.TOKEN_EXPIRY_MINUTES)

            # Store hashed token in database
            token_data = {
                'user_id': user['user_id'],
                'email': email,
                'token_hash': token_hash,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'expires_at': expires_at.isoformat(),
                'is_used': False
            }

            supabase_admin.table('password_reset_tokens').insert(token_data).execute()

            # Build reset URL (plain token in URL, NOT hash)
            # Use frontend URL, not backend URL
            import os
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password?token={reset_token}"

            # Send reset email
            user_name = f"{user.get('firstname', '')} {user.get('lastname', '')}".strip()
            success, email_msg = EmailService.send_password_reset_email(
                recipient_email=email,
                reset_url=reset_url,
                user_name=user_name if user_name else None
            )

            if success:
                logger.info(f"Password reset email sent to {email} from IP {ip_address}")
                return True, "Password reset email sent successfully. Please check your inbox."
            else:
                logger.error(f"Failed to send password reset email to {email}: {email_msg}")
                return False, "Failed to send reset email. Please try again later."

        except Exception as e:
            logger.error(f"Error requesting password reset: {str(e)}")
            return False, "An error occurred. Please try again later."

    @staticmethod
    def verify_reset_token(token):
        """
        Verify a reset token is valid

        Args:
            token (str): Plain text reset token

        Returns:
            tuple: (valid: bool, data: dict or None, message: str)
        """
        try:
            # Hash the token to look up in database
            token_hash = PasswordResetService.hash_token(token)

            # Look up token
            token_response = supabase_admin.table('password_reset_tokens').select('*').eq(
                'token_hash', token_hash
            ).execute()

            if not token_response.data:
                logger.warning(f"Invalid password reset token attempted")
                return False, None, "Invalid or expired reset link"

            token_record = token_response.data[0]

            # Check if already used
            if token_record.get('is_used', False):
                logger.warning(f"Attempted reuse of password reset token for {token_record['email']}")
                return False, None, "This reset link has already been used"

            # Check expiry
            expires_at = datetime.fromisoformat(token_record['expires_at'].replace('Z', '+00:00'))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                logger.warning(f"Expired password reset token for {token_record['email']}")
                return False, None, "This reset link has expired. Please request a new one."

            # Token is valid
            logger.info(f"Valid password reset token verified for {token_record['email']}")
            return True, {
                'token_id': token_record['token_id'],
                'user_id': token_record['user_id'],
                'email': token_record['email']
            }, "Token is valid"

        except Exception as e:
            logger.error(f"Error verifying reset token: {str(e)}")
            return False, None, "An error occurred verifying your reset link"

    @staticmethod
    def reset_password(token, new_password, confirm_password):
        """
        Reset user password using a valid token

        Args:
            token (str): Plain text reset token
            new_password (str): New password
            confirm_password (str): Confirmation password

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Validate passwords match
            if new_password != confirm_password:
                return False, "Passwords do not match"

            # Validate password strength (use existing validation from user_settings.py)
            from routes.user_settings import validate_password_strength
            is_valid, error_msg = validate_password_strength(new_password)
            if not is_valid:
                return False, error_msg

            # Verify token
            valid, token_data, verify_msg = PasswordResetService.verify_reset_token(token)
            if not valid:
                return False, verify_msg

            # Update password using Supabase RPC (same as user_settings.py)
            user_id = token_data['user_id']
            email = token_data['email']

            result = supabase.rpc('update_auth_user_password', {
                'p_user_id': user_id,
                'p_new_password': new_password
            }).execute()

            if not result.data:
                logger.error(f"Failed to update password for user {email}")
                return False, "Failed to update password. Please try again."

            # Mark token as used
            token_hash = PasswordResetService.hash_token(token)
            supabase_admin.table('password_reset_tokens').update({
                'is_used': True,
                'used_at': datetime.utcnow().isoformat()
            }).eq('token_hash', token_hash).execute()

            # Send success confirmation email
            user_response = supabase.table('users').select('firstname, lastname').eq('user_id', user_id).execute()
            user_name = None
            if user_response.data:
                user = user_response.data[0]
                user_name = f"{user.get('firstname', '')} {user.get('lastname', '')}".strip()

            EmailService.send_password_reset_success_email(
                recipient_email=email,
                user_name=user_name if user_name else None
            )

            logger.info(f"Password successfully reset for user {email}")
            return True, "Password reset successful"

        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            return False, "An error occurred resetting your password. Please try again."


# Cleanup utility
def cleanup_expired_tokens():
    """
    Cleanup expired and used password reset tokens
    This can be run periodically via a cron job

    Returns:
        int: Number of tokens cleaned up
    """
    try:
        result = supabase_admin.rpc('cleanup_expired_password_reset_tokens').execute()
        count = result.data if result.data is not None else 0
        logger.info(f"Cleaned up {count} expired password reset tokens")
        return count
    except Exception as e:
        logger.error(f"Error cleaning up expired tokens: {str(e)}")
        return 0


def cleanup_expired_rate_limits():
    """
    Cleanup expired rate limit records
    This can be run periodically via a cron job

    Returns:
        int: Number of rate limits reset
    """
    try:
        result = supabase_admin.rpc('cleanup_expired_rate_limits').execute()
        count = result.data if result.data is not None else 0
        logger.info(f"Reset {count} expired rate limits")
        return count
    except Exception as e:
        logger.error(f"Error cleaning up expired rate limits: {str(e)}")
        return 0
