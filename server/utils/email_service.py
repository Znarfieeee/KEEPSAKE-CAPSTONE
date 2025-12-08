"""
Email Service for KEEPSAKE Healthcare System
Handles sending emails via Gmail SMTP with queue logging
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
from config.email_config import EmailConfig
from config.settings import supabase_service_role_client

logger = logging.getLogger(__name__)

# Get Supabase admin client
supabase_admin = supabase_service_role_client()


class EmailService:
    """Service for sending emails and logging to email_notifications table"""

    @staticmethod
    def send_email(
        recipient_email,
        subject,
        body_html,
        body_text=None,
        notification_type='password_reset_requested',
        facility_id=None,
        metadata=None
    ):
        """
        Send an email via Gmail SMTP and log to email_notifications table

        Args:
            recipient_email (str): Recipient email address
            subject (str): Email subject line
            body_html (str): HTML email body
            body_text (str, optional): Plain text email body (fallback)
            notification_type (str): Type of notification for logging
            facility_id (str, optional): Associated facility ID
            metadata (dict, optional): Additional metadata to store

        Returns:
            tuple: (success: bool, message: str)
        """
        # Check if SMTP is configured
        if not EmailConfig.is_configured():
            error_msg = "SMTP not configured. Email cannot be sent."
            logger.warning(error_msg)
            EmailService._log_email(
                recipient_email,
                subject,
                body_text or body_html[:100],
                body_html,
                notification_type,
                'failed',
                error_msg,
                facility_id,
                metadata
            )
            return False, error_msg

        # Generate plain text fallback if not provided
        if not body_text:
            # Simple HTML to text conversion (strip tags)
            import re
            body_text = re.sub('<[^<]+?>', '', body_html)

        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = EmailConfig.get_from_address()
            message['To'] = recipient_email

            # Attach plain text and HTML parts
            part_text = MIMEText(body_text, 'plain', 'utf-8')
            part_html = MIMEText(body_html, 'html', 'utf-8')
            message.attach(part_text)
            message.attach(part_html)

            # Get SMTP connection
            server = EmailConfig.get_smtp_connection()

            # Send email
            server.send_message(message)
            server.quit()

            logger.info(f"Email sent successfully to {recipient_email}: {subject}")

            # Log success to database
            EmailService._log_email(
                recipient_email,
                subject,
                body_text,
                body_html,
                notification_type,
                'sent',
                None,
                facility_id,
                metadata
            )

            return True, "Email sent successfully"

        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"Recipient email rejected: {recipient_email}"
            logger.error(error_msg)
            EmailService._log_email(
                recipient_email,
                subject,
                body_text,
                body_html,
                notification_type,
                'failed',
                error_msg,
                facility_id,
                metadata
            )
            return False, error_msg

        except smtplib.SMTPException as e:
            error_msg = f"SMTP error: {str(e)}"
            logger.error(error_msg)
            EmailService._log_email(
                recipient_email,
                subject,
                body_text,
                body_html,
                notification_type,
                'failed',
                error_msg,
                facility_id,
                metadata
            )
            return False, error_msg

        except Exception as e:
            error_msg = f"Failed to send email: {str(e)}"
            logger.error(error_msg)
            EmailService._log_email(
                recipient_email,
                subject,
                body_text,
                body_html,
                notification_type,
                'failed',
                error_msg,
                facility_id,
                metadata
            )
            return False, error_msg

    @staticmethod
    def _log_email(
        recipient_email,
        subject,
        body_text,
        body_html,
        notification_type,
        status,
        error_message=None,
        facility_id=None,
        metadata=None
    ):
        """
        Log email to email_notifications table

        Args:
            recipient_email (str): Recipient email
            subject (str): Email subject
            body_text (str): Plain text body
            body_html (str): HTML body
            notification_type (str): Notification type
            status (str): Status (queued, sent, failed, bounced)
            error_message (str, optional): Error message if failed
            facility_id (str, optional): Associated facility
            metadata (dict, optional): Additional metadata
        """
        try:
            email_data = {
                'recipient_email': recipient_email,
                'notification_type': notification_type,
                'subject': subject,
                'body_text': body_text,
                'body_html': body_html,
                'status': status,
                'error_message': error_message,
                'metadata': metadata
            }

            # Add facility_id if provided
            if facility_id:
                email_data['facility_id'] = facility_id

            # Add sent_at timestamp if status is sent
            if status == 'sent':
                email_data['sent_at'] = datetime.utcnow().isoformat()

            # Insert into email_notifications table using service role client (bypasses RLS)
            result = supabase_admin.table('email_notifications').insert(email_data).execute()

            if result.data:
                logger.info(f"Email logged to database: {recipient_email} - {status}")
            else:
                logger.warning(f"Failed to log email to database: {recipient_email}")

        except Exception as e:
            logger.error(f"Error logging email to database: {str(e)}")
            # Don't raise - logging failure shouldn't prevent email sending

    @staticmethod
    def send_password_reset_email(recipient_email, reset_url, user_name=None):
        """
        Send password reset email with reset link

        Args:
            recipient_email (str): Recipient email address
            reset_url (str): Password reset URL with token
            user_name (str, optional): User's name for personalization

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Reset Your KEEPSAKE Password"
        body_html = EmailTemplates.password_reset_request(
            reset_url=reset_url,
            recipient_email=recipient_email,
            user_name=user_name
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='password_reset_requested',
            metadata={'reset_url_length': len(reset_url)}
        )

    @staticmethod
    def send_password_reset_success_email(recipient_email, user_name=None):
        """
        Send confirmation email after successful password reset

        Args:
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Your KEEPSAKE Password Has Been Reset"
        body_html = EmailTemplates.password_reset_success(
            recipient_email=recipient_email,
            user_name=user_name
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='password_reset_success'
        )

    @staticmethod
    def send_rate_limited_email(recipient_email):
        """
        Send notification when user is rate limited

        Args:
            recipient_email (str): Recipient email address

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Too Many Password Reset Attempts - KEEPSAKE"
        body_html = EmailTemplates.password_reset_blocked(
            recipient_email=recipient_email
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='password_reset_blocked'
        )

    @staticmethod
    def send_2fa_setup_code(recipient_email, code, user_name=None):
        """
        Send 2FA setup verification code email

        Args:
            recipient_email (str): Recipient email address
            code (str): 6-digit verification code
            user_name (str, optional): User's name for personalization

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Your KEEPSAKE 2FA Verification Code"
        body_html = EmailTemplates.twofa_setup_code(
            code=code,
            recipient_email=recipient_email,
            user_name=user_name
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='2fa_setup_code',
            metadata={'code_length': len(code)}
        )

    @staticmethod
    def send_2fa_login_code(recipient_email, code, user_name=None, ip_address=None):
        """
        Send 2FA login verification code email

        Args:
            recipient_email (str): Recipient email address
            code (str): 6-digit verification code
            user_name (str, optional): User's name for personalization
            ip_address (str, optional): Login IP address

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Your KEEPSAKE Login Verification Code"
        body_html = EmailTemplates.twofa_login_code(
            code=code,
            recipient_email=recipient_email,
            user_name=user_name,
            ip_address=ip_address
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='2fa_login_code',
            metadata={'code_length': len(code), 'ip_address': ip_address}
        )

    @staticmethod
    def send_2fa_enabled_notification(recipient_email, user_name=None):
        """
        Send notification confirming 2FA has been enabled

        Args:
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Two-Factor Authentication Enabled - KEEPSAKE"
        body_html = EmailTemplates.twofa_enabled(
            recipient_email=recipient_email,
            user_name=user_name
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='2fa_enabled'
        )

    @staticmethod
    def send_2fa_disabled_notification(recipient_email, user_name=None):
        """
        Send notification confirming 2FA has been disabled

        Args:
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            tuple: (success: bool, message: str)
        """
        from utils.email_templates import EmailTemplates

        subject = "Two-Factor Authentication Disabled - KEEPSAKE"
        body_html = EmailTemplates.twofa_disabled(
            recipient_email=recipient_email,
            user_name=user_name
        )

        return EmailService.send_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            notification_type='2fa_disabled'
        )


# Utility function for testing email service
def test_email_service():
    """
    Test function to verify email service is working
    Run this from Python console to test SMTP configuration
    """
    # Test SMTP connection
    success, message = EmailConfig.test_connection()
    print(f"SMTP Connection Test: {message}")

    if not success:
        print("\nPlease configure your Gmail App Password:")
        print("1. Enable 2FA on Gmail")
        print("2. Generate App Password: https://myaccount.google.com/apppasswords")
        print("3. Add to .env file:")
        print("   SMTP_EMAIL=your-email@gmail.com")
        print("   SMTP_PASSWORD=your-16-char-app-password")
        return

    # Send test email
    test_recipient = EmailConfig.SMTP_EMAIL  # Send to self for testing
    subject = "KEEPSAKE Email Service Test"
    body_html = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #7c3aed;">Email Service Test</h2>
            <p>This is a test email from KEEPSAKE Healthcare System.</p>
            <p>If you received this, your email service is configured correctly!</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Sent from KEEPSAKE Email Service
            </p>
        </body>
    </html>
    """

    success, message = EmailService.send_email(
        recipient_email=test_recipient,
        subject=subject,
        body_html=body_html,
        notification_type='password_reset_requested'
    )

    print(f"\nTest Email Result: {message}")

    if success:
        print(f"✓ Test email sent to {test_recipient}")
        print("✓ Check your inbox (and spam folder)")
    else:
        print(f"✗ Failed to send test email")


if __name__ == '__main__':
    # Run test when executed directly
    test_email_service()
