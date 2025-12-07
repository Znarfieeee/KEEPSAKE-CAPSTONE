"""
Email Configuration for KEEPSAKE Healthcare System
Uses Gmail SMTP for sending password reset and notification emails
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)


class EmailConfig:
    """Gmail SMTP configuration for sending emails"""

    # Gmail SMTP settings
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587  # TLS port
    SMTP_USE_TLS = True

    # Email credentials from environment variables
    SMTP_EMAIL = os.environ.get('SMTP_EMAIL', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')  # Gmail App Password

    # Sender information
    SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SMTP_EMAIL)
    SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'KEEPSAKE Healthcare')

    # Email configuration
    SMTP_TIMEOUT = 10  # Connection timeout in seconds

    @classmethod
    def is_configured(cls):
        """Check if SMTP credentials are configured"""
        if not cls.SMTP_EMAIL or not cls.SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured. Email functionality will be disabled.")
            return False
        return True

    @classmethod
    def get_smtp_connection(cls):
        """
        Create and return an authenticated SMTP connection

        Returns:
            smtplib.SMTP: Authenticated SMTP connection

        Raises:
            Exception: If connection or authentication fails
        """
        if not cls.is_configured():
            raise Exception("SMTP credentials not configured. Please set SMTP_EMAIL and SMTP_PASSWORD environment variables.")

        try:
            # Create SMTP connection
            logger.info(f"Connecting to {cls.SMTP_SERVER}:{cls.SMTP_PORT}")
            server = smtplib.SMTP(cls.SMTP_SERVER, cls.SMTP_PORT, timeout=cls.SMTP_TIMEOUT)

            # Enable TLS encryption
            if cls.SMTP_USE_TLS:
                server.starttls()
                logger.info("TLS encryption enabled")

            # Authenticate
            server.login(cls.SMTP_EMAIL, cls.SMTP_PASSWORD)
            logger.info(f"Successfully authenticated as {cls.SMTP_EMAIL}")

            return server

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {str(e)}")
            raise Exception("Email authentication failed. Please check your Gmail App Password.")
        except smtplib.SMTPConnectError as e:
            logger.error(f"SMTP connection failed: {str(e)}")
            raise Exception("Failed to connect to Gmail SMTP server.")
        except Exception as e:
            logger.error(f"SMTP connection error: {str(e)}")
            raise Exception(f"Email service error: {str(e)}")

    @classmethod
    def test_connection(cls):
        """
        Test SMTP connection and authentication

        Returns:
            tuple: (success: bool, message: str)
        """
        if not cls.is_configured():
            return False, "SMTP credentials not configured"

        try:
            server = cls.get_smtp_connection()
            server.quit()
            return True, "SMTP connection successful"
        except Exception as e:
            return False, str(e)

    @classmethod
    def get_from_address(cls):
        """Get formatted 'From' address for emails"""
        if cls.SMTP_FROM_NAME:
            return f"{cls.SMTP_FROM_NAME} <{cls.SMTP_FROM_EMAIL}>"
        return cls.SMTP_FROM_EMAIL


# Gmail App Password Setup Instructions
"""
GMAIL APP PASSWORD SETUP:

1. Enable 2-Factor Authentication on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Under "Signing in to Google", enable "2-Step Verification"

2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)" → Enter "KEEPSAKE"
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. Add to your .env file:
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=noreply@keepsake.com  # Optional: Custom "from" email
   SMTP_FROM_NAME=KEEPSAKE Healthcare     # Optional: Custom "from" name

4. IMPORTANT:
   - Use the App Password, NOT your regular Gmail password
   - Keep the App Password secret (never commit to git)
   - If compromised, revoke and generate a new one

TROUBLESHOOTING:

1. "Authentication failed":
   - Verify 2FA is enabled on Gmail account
   - Regenerate App Password
   - Check for typos in .env file
   - Remove spaces from App Password

2. "Connection timeout":
   - Check firewall settings (allow port 587)
   - Verify internet connectivity
   - Try different network (some ISPs block SMTP)

3. "Too many requests":
   - Gmail limits: 500 emails/day (free), 2000/day (Workspace)
   - Wait 24 hours or upgrade to Google Workspace
   - Consider alternative email service (SendGrid, AWS SES)

ALTERNATIVE SMTP PROVIDERS:

If Gmail doesn't work, you can use:
- SendGrid: smtp.sendgrid.net:587
- AWS SES: email-smtp.us-east-1.amazonaws.com:587
- Mailgun: smtp.mailgun.org:587

Just update SMTP_SERVER and SMTP_PORT in this file.
"""
