"""
Rich HTML Email Templates for KEEPSAKE Healthcare System
Responsive email templates with KEEPSAKE branding
"""
from datetime import datetime


class EmailTemplates:
    """Rich HTML email templates with KEEPSAKE branding"""

    # KEEPSAKE brand colors (from client/src/index.css)
    PRIMARY_COLOR = "#5770c4"  # KEEPSAKE primary blue-purple (oklch(0.5649 0.1079 225.9002))
    SECONDARY_COLOR = "#c4dee3"  # KEEPSAKE secondary light blue
    SUCCESS_COLOR = "#10b981"  # Green
    WARNING_COLOR = "#f59e0b"  # Orange
    DANGER_COLOR = "#ef4444"  # Red
    TEXT_COLOR = "#3f3f3f"  # KEEPSAKE black
    LIGHT_BG = "#fffafa"  # KEEPSAKE white background

    @staticmethod
    def _base_template(content, preheader_text=""):
        """
        Base email template with KEEPSAKE branding

        Args:
            content (str): Main email content HTML
            preheader_text (str): Preview text shown in email clients

        Returns:
            str: Complete HTML email
        """
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>KEEPSAKE Healthcare</title>
    <style>
        /* Reset styles */
        body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
        table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
        img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
        body {{ margin: 0; padding: 0; width: 100% !important; height: 100% !important; }}

        /* Responsive styles */
        @media only screen and (max-width: 600px) {{
            .email-container {{ width: 100% !important; }}
            .content-padding {{ padding: 20px !important; }}
            .button {{ width: 100% !important; }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: {EmailTemplates.LIGHT_BG};">
    <!-- Preheader text (hidden) -->
    <div style="display: none; max-height: 0; overflow: hidden;">
        {preheader_text}
    </div>

    <!-- Email container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header with gradient (matching login page) -->
                    <tr>
                        <td style="background: linear-gradient(27deg, {EmailTemplates.SECONDARY_COLOR} 50%, {EmailTemplates.LIGHT_BG} 50%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: {EmailTemplates.PRIMARY_COLOR}; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">
                                KEEPSAKE
                            </h1>
                            <p style="margin: 8px 0 0 0; color: {EmailTemplates.TEXT_COLOR}; font-size: 14px;">
                                Healthcare Management System
                            </p>
                        </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px; color: {EmailTemplates.TEXT_COLOR};">
                            {content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: {EmailTemplates.LIGHT_BG}; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                                This email was sent by KEEPSAKE Healthcare System
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                &copy; {datetime.now().year} KEEPSAKE. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    @staticmethod
    def _button(text, url, color=None):
        """
        Create a styled button for emails

        Args:
            text (str): Button text
            url (str): Button URL
            color (str, optional): Button color (defaults to PRIMARY_COLOR)

        Returns:
            str: Button HTML
        """
        bg_color = color or EmailTemplates.PRIMARY_COLOR
        return f"""
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
    <tr>
        <td align="center">
            <a href="{url}" target="_blank" class="button" style="display: inline-block; background-color: {bg_color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                {text}
            </a>
        </td>
    </tr>
</table>
"""

    @staticmethod
    def password_reset_request(reset_url, recipient_email, user_name=None):
        """
        Password reset request email with reset link

        Args:
            reset_url (str): Password reset URL with token
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            str: Complete HTML email
        """
        greeting = f"Hello {user_name}" if user_name else "Hello"

        content = f"""
<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.TEXT_COLOR}; font-size: 24px; font-weight: 600;">
    Reset Your Password
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    {greeting},
</p>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    We received a request to reset the password for your KEEPSAKE account (<strong>{recipient_email}</strong>).
</p>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    Click the button below to create a new password. This link will expire in <strong>30 minutes</strong>.
</p>

{EmailTemplates._button("Reset My Password", reset_url)}

<p style="margin: 25px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Or copy and paste this URL into your browser:
</p>
<p style="margin: 0 0 25px 0; padding: 12px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 4px; word-break: break-all; font-size: 13px; color: #4b5563;">
    {reset_url}
</p>

<div style="margin: 30px 0 0 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid {EmailTemplates.WARNING_COLOR}; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    </p>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        preheader = "Reset your KEEPSAKE password - Link expires in 30 minutes"
        return EmailTemplates._base_template(content, preheader)

    @staticmethod
    def password_reset_success(recipient_email, user_name=None):
        """
        Password reset success confirmation email

        Args:
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            str: Complete HTML email
        """
        greeting = f"Hello {user_name}" if user_name else "Hello"
        reset_time = datetime.now().strftime("%B %d, %Y at %I:%M %p UTC")

        content = f"""
<div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 60px; height: 60px; background-color: {EmailTemplates.SUCCESS_COLOR}; border-radius: 50%; text-align: center; line-height: 60px;">
        <span style="color: #ffffff; font-size: 32px;">✓</span>
    </div>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.SUCCESS_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Password Reset Successful
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    {greeting},
</p>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    Your KEEPSAKE account password has been successfully reset.
</p>

<div style="margin: 25px 0; padding: 20px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 6px;">
    <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
        <strong>Account:</strong> {recipient_email}
    </p>
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
        <strong>Reset Time:</strong> {reset_time}
    </p>
</div>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    You can now sign in to KEEPSAKE using your new password.
</p>

<div style="margin: 30px 0; padding: 16px; background-color: #fee2e2; border-left: 4px solid {EmailTemplates.DANGER_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        <strong>Didn't reset your password?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        If you didn't perform this password reset, your account may be compromised. Please contact your system administrator immediately.
    </p>
</div>

<div style="margin: 30px 0 0 0; padding: 16px; background-color: #dbeafe; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 13px; color: #1e40af; font-weight: 600;">
        Security Best Practices:
    </p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
        <li>Use a unique password for KEEPSAKE</li>
        <li>Never share your password with anyone</li>
        <li>Enable two-factor authentication if available</li>
        <li>Sign out after using shared computers</li>
    </ul>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        preheader = "Your KEEPSAKE password has been successfully reset"
        return EmailTemplates._base_template(content, preheader)

    @staticmethod
    def password_reset_blocked(recipient_email):
        """
        Rate limit notification email

        Args:
            recipient_email (str): Recipient email address

        Returns:
            str: Complete HTML email
        """
        content = f"""
<div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 60px; height: 60px; background-color: {EmailTemplates.WARNING_COLOR}; border-radius: 50%; text-align: center; line-height: 60px;">
        <span style="color: #ffffff; font-size: 32px;">⚠</span>
    </div>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.WARNING_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Too Many Password Reset Attempts
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    Hello,
</p>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    We've detected multiple password reset requests for your KEEPSAKE account (<strong>{recipient_email}</strong>) in a short period of time.
</p>

<div style="margin: 25px 0; padding: 20px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 6px;">
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        <strong style="color: {EmailTemplates.TEXT_COLOR};">Security Measure:</strong><br>
        To protect your account, we've temporarily limited password reset requests.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        <strong style="color: {EmailTemplates.TEXT_COLOR};">Wait Time:</strong><br>
        Please wait <strong>1 hour</strong> before requesting another password reset.
    </p>
</div>

<div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid {EmailTemplates.WARNING_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Suspicious Activity?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        If you didn't request these password resets, someone may be trying to access your account. Please contact your system administrator.
    </p>
</div>

<p style="margin: 30px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    <strong>What you can do:</strong>
</p>
<ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; color: #4b5563; line-height: 1.8;">
    <li>Wait 1 hour and try again</li>
    <li>Check your spam folder for previous reset emails</li>
    <li>Contact your system administrator if you need immediate assistance</li>
</ul>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        preheader = "Your account has been temporarily limited due to multiple password reset attempts"
        return EmailTemplates._base_template(content, preheader)


# Plain text versions for email clients that don't support HTML
class PlainTextEmailTemplates:
    """Plain text email templates (fallback for HTML)"""

    @staticmethod
    def password_reset_request(reset_url, recipient_email, user_name=None):
        greeting = f"Hello {user_name}" if user_name else "Hello"
        return f"""
{greeting},

We received a request to reset the password for your KEEPSAKE account ({recipient_email}).

Click the link below to create a new password. This link will expire in 30 minutes:

{reset_url}

SECURITY NOTICE: If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
KEEPSAKE Healthcare Team

---
This email was sent by KEEPSAKE Healthcare System
© {datetime.now().year} KEEPSAKE. All rights reserved.
"""

    @staticmethod
    def password_reset_success(recipient_email, user_name=None):
        greeting = f"Hello {user_name}" if user_name else "Hello"
        reset_time = datetime.now().strftime("%B %d, %Y at %I:%M %p UTC")
        return f"""
PASSWORD RESET SUCCESSFUL

{greeting},

Your KEEPSAKE account password has been successfully reset.

Account: {recipient_email}
Reset Time: {reset_time}

You can now sign in to KEEPSAKE using your new password.

DIDN'T RESET YOUR PASSWORD?
If you didn't perform this password reset, your account may be compromised. Please contact your system administrator immediately.

Security Best Practices:
- Use a unique password for KEEPSAKE
- Never share your password with anyone
- Enable two-factor authentication if available
- Sign out after using shared computers

Best regards,
KEEPSAKE Healthcare Team

---
This email was sent by KEEPSAKE Healthcare System
© {datetime.now().year} KEEPSAKE. All rights reserved.
"""

    @staticmethod
    def password_reset_blocked(recipient_email):
        return f"""
TOO MANY PASSWORD RESET ATTEMPTS

Hello,

We've detected multiple password reset requests for your KEEPSAKE account ({recipient_email}) in a short period of time.

To protect your account, we've temporarily limited password reset requests.

Please wait 1 hour before requesting another password reset.

SUSPICIOUS ACTIVITY?
If you didn't request these password resets, someone may be trying to access your account. Please contact your system administrator.

What you can do:
- Wait 1 hour and try again
- Check your spam folder for previous reset emails
- Contact your system administrator if you need immediate assistance

Best regards,
KEEPSAKE Healthcare Team

---
This email was sent by KEEPSAKE Healthcare System
© {datetime.now().year} KEEPSAKE. All rights reserved.
"""
