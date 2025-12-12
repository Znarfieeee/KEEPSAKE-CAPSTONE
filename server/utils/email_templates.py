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

    @staticmethod
    def twofa_setup_code(code, recipient_email, user_name=None):
        """
        Email template for 2FA setup verification code

        Args:
            code (str): 6-digit verification code
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            str: HTML email template
        """
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        preheader_text = f"Your KEEPSAKE 2FA verification code is {code}"

        content = f"""
<div style="margin: 0 0 25px 0; padding: 15px; background-color: #dbeafe; border-left: 4px solid {EmailTemplates.PRIMARY_COLOR}; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
        <strong>Security Notice:</strong> Enable Two-Factor Authentication
    </p>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.PRIMARY_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Verification Code for 2FA Setup
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    {greeting}
</p>

<p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
    You're setting up Two-Factor Authentication (2FA) for your KEEPSAKE account (<strong>{recipient_email}</strong>).
</p>

<p style="margin: 0 0 10px 0; line-height: 1.6; font-size: 15px;">
    Enter this verification code to complete the setup:
</p>

<!-- Verification Code Display -->
<div style="margin: 30px 0; text-align: center;">
    <div style="display: inline-block; background: linear-gradient(135deg, {EmailTemplates.PRIMARY_COLOR} 0%, {EmailTemplates.SECONDARY_COLOR} 100%); padding: 25px 40px; border-radius: 10px; box-shadow: 0 4px 12px rgba(87, 112, 196, 0.3);">
        <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
            Verification Code
        </p>
        <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            {code}
        </p>
    </div>
</div>

<div style="margin: 25px 0; padding: 20px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 6px; text-align: center;">
    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        <strong style="color: {EmailTemplates.TEXT_COLOR};">Expires in:</strong> 10 minutes
    </p>
</div>

<div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid {EmailTemplates.WARNING_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Didn't request this?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        If you didn't try to enable 2FA, please ignore this email and contact your system administrator.
    </p>
</div>

<p style="margin: 30px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    <strong>What is Two-Factor Authentication?</strong>
</p>
<p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
    2FA adds an extra layer of security to your account. When enabled, you'll need to enter a verification code sent to your email in addition to your password when logging in.
</p>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        return EmailTemplates._base_template(content, preheader_text)

    @staticmethod
    def twofa_login_code(code, recipient_email, user_name=None, ip_address=None):
        """
        Email template for 2FA login verification code

        Args:
            code (str): 6-digit verification code
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization
            ip_address (str, optional): Login IP address

        Returns:
            str: HTML email template
        """
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        preheader_text = f"Your KEEPSAKE login verification code is {code}"

        ip_info = f"""
<div style="margin: 25px 0; padding: 20px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 6px;">
    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        <strong style="color: {EmailTemplates.TEXT_COLOR};">Login Attempt From:</strong><br>
        IP Address: <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace;">{ip_address}</code>
    </p>
</div>
""" if ip_address else ""

        content = f"""
<div style="margin: 0 0 25px 0; padding: 15px; background-color: #dbeafe; border-left: 4px solid {EmailTemplates.PRIMARY_COLOR}; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
        <strong>Login Attempt Detected:</strong> Verification Required
    </p>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.PRIMARY_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Your Login Verification Code
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    {greeting}
</p>

<p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
    Someone is trying to log into your KEEPSAKE account (<strong>{recipient_email}</strong>). Enter the verification code below to complete your login:
</p>

<!-- Verification Code Display -->
<div style="margin: 30px 0; text-align: center;">
    <div style="display: inline-block; padding: 25px 40px; border-radius: 10px; box-shadow: 0 4px 12px rgba(87, 112, 196, 0.3);">
        <p style="margin: 0 0 8px 0; color: #3f3f3f; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
            Verification Code
        </p>
        <p style="margin: 0; color: #3f3f3f; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            {code}
        </p>
    </div>
</div>

<div style="margin: 25px 0; padding: 20px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 6px; text-align: center;">
    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        <strong style="color: {EmailTemplates.TEXT_COLOR};">Expires in:</strong> 10 minutes
    </p>
</div>

{ip_info}

<div style="margin: 30px 0; padding: 16px; background-color: #fee2e2; border-left: 4px solid {EmailTemplates.DANGER_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        <strong>Not you trying to log in?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        If you didn't attempt to log in, your password may be compromised. Please change your password immediately and contact your system administrator.
    </p>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        return EmailTemplates._base_template(content, preheader_text)

    @staticmethod
    def twofa_enabled(recipient_email, user_name=None):
        """
        Email template confirming 2FA has been enabled

        Args:
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            str: HTML email template
        """
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        preheader_text = "Two-Factor Authentication enabled successfully"

        content = f"""
<div style="margin: 0 0 25px 0; padding: 15px; background-color: #d1fae5; border-left: 4px solid {EmailTemplates.SUCCESS_COLOR}; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.5;">
        <strong>Security Enhancement:</strong> 2FA Successfully Enabled
    </p>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.SUCCESS_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Two-Factor Authentication Enabled
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    {greeting}
</p>

<p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
    Two-Factor Authentication (2FA) has been successfully enabled for your KEEPSAKE account (<strong>{recipient_email}</strong>).
</p>

<div style="margin: 30px 0; padding: 30px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 8px; text-align: center;">
    <div style="margin: 0 0 15px 0;">
        <div style="display: inline-block; width: 60px; height: 60px; background-color: {EmailTemplates.SUCCESS_COLOR}; border-radius: 50%; line-height: 60px;">
            <span style="color: #ffffff; font-size: 30px;">✓</span>
        </div>
    </div>
    <p style="margin: 0; color: {EmailTemplates.TEXT_COLOR}; font-size: 16px; font-weight: 600;">
        Your Account is Now More Secure
    </p>
</div>

<p style="margin: 30px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    <strong>What happens next?</strong>
</p>
<ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; color: #4b5563; line-height: 1.8;">
    <li>When you log in, you'll receive a verification code via email</li>
    <li>Enter the code to complete your login</li>
    <li>Codes expire after 10 minutes for security</li>
</ul>

<p style="margin: 30px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    <strong>Need to disable 2FA?</strong>
</p>
<p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
    You can disable 2FA anytime from your account settings. You'll need to enter your password to confirm.
</p>

<div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid {EmailTemplates.WARNING_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Didn't enable 2FA?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        If you didn't enable 2FA, someone may have accessed your account. Please contact your system administrator immediately.
    </p>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        return EmailTemplates._base_template(content, preheader_text)

    @staticmethod
    def twofa_disabled(recipient_email, user_name=None):
        """
        Email template confirming 2FA has been disabled

        Args:
            recipient_email (str): Recipient email address
            user_name (str, optional): User's name for personalization

        Returns:
            str: HTML email template
        """
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        preheader_text = "Two-Factor Authentication disabled"

        content = f"""
<div style="margin: 0 0 25px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid {EmailTemplates.WARNING_COLOR}; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        <strong>Security Notice:</strong> 2FA Disabled
    </p>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.WARNING_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Two-Factor Authentication Disabled
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    {greeting}
</p>

<p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
    Two-Factor Authentication (2FA) has been disabled for your KEEPSAKE account (<strong>{recipient_email}</strong>).
</p>

<div style="margin: 30px 0; padding: 30px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 8px; text-align: center;">
    <div style="margin: 0 0 15px 0;">
        <div style="display: inline-block; width: 60px; height: 60px; background-color: {EmailTemplates.WARNING_COLOR}; border-radius: 50%; line-height: 60px;">
            <span style="color: #ffffff; font-size: 30px;">⚠</span>
        </div>
    </div>
    <p style="margin: 0; color: {EmailTemplates.TEXT_COLOR}; font-size: 16px; font-weight: 600;">
        Your Account Security Has Been Reduced
    </p>
</div>

<p style="margin: 30px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    <strong>What this means:</strong>
</p>
<ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; color: #4b5563; line-height: 1.8;">
    <li>You'll no longer need to enter verification codes when logging in</li>
    <li>Only your password will be required for login</li>
    <li>Your account is less protected against unauthorized access</li>
</ul>

<p style="margin: 30px 0 16px 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    <strong>Want to enable 2FA again?</strong>
</p>
<p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
    You can re-enable 2FA anytime from your account settings to add an extra layer of security.
</p>

<div style="margin: 30px 0; padding: 16px; background-color: #fee2e2; border-left: 4px solid {EmailTemplates.DANGER_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        <strong>Didn't disable 2FA?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
        If you didn't disable 2FA, someone may have accessed your account. Please change your password immediately and contact your system administrator.
    </p>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Team</strong>
</p>
"""

        return EmailTemplates._base_template(content, preheader_text)

    @staticmethod
    def facility_contact_notification(contact_data):
        """
        Email template for notifying admin team about new facility contact request

        Args:
            contact_data (dict): Contact request data

        Returns:
            str: HTML email template
        """
        preheader_text = f"New facility inquiry from {contact_data['facility_name']}"

        plan_names = {
            'standard': 'Standard (₱5,544/month)',
            'premium': 'Premium (₱11,144/month)',
            'enterprise': 'Enterprise (₱22,344/month)'
        }
        plan_display = plan_names.get(contact_data.get('plan_interest'), 'Not specified')

        message_html = f"""
<div style="margin: 20px 0; padding: 16px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 6px;">
    <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
        {contact_data.get('message', 'No message provided')}
    </p>
</div>
""" if contact_data.get('message') else ""

        content = f"""
<div style="margin: 0 0 25px 0; padding: 15px; background-color: #dbeafe; border-left: 4px solid {EmailTemplates.PRIMARY_COLOR}; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
        <strong>New Lead:</strong> Facility Contact Request
    </p>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.PRIMARY_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    New Facility Inquiry
</h2>

<p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
    A potential healthcare facility has submitted a contact request for KEEPSAKE. Please follow up within 24 hours.
</p>

<div style="margin: 30px 0; padding: 25px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 8px;">
    <h3 style="margin: 0 0 15px 0; color: {EmailTemplates.TEXT_COLOR}; font-size: 18px; font-weight: 600;">
        Facility Information
    </h3>

    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                Facility Name:
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR};">
                {contact_data['facility_name']}
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                Contact Person:
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR};">
                {contact_data['contact_person']}
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                Email:
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR};">
                <a href="mailto:{contact_data['email']}" style="color: {EmailTemplates.PRIMARY_COLOR}; text-decoration: none;">
                    {contact_data['email']}
                </a>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                Phone:
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR};">
                <a href="tel:{contact_data['phone']}" style="color: {EmailTemplates.PRIMARY_COLOR}; text-decoration: none;">
                    {contact_data['phone']}
                </a>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                Plan Interest:
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR};">
                <strong>{plan_display}</strong>
            </td>
        </tr>
    </table>
</div>

{message_html}

<div style="margin: 30px 0; padding: 16px; background-color: #d1fae5; border-left: 4px solid {EmailTemplates.SUCCESS_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46; line-height: 1.5;">
        <strong>Next Steps:</strong>
    </p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #047857; line-height: 1.6;">
        <li>Review the inquiry details above</li>
        <li>Contact the facility within 24 hours</li>
        <li>Schedule a demo or consultation call</li>
        <li>Update the CRM with follow-up notes</li>
    </ul>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    This email was automatically generated by the KEEPSAKE system.<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Sales System</strong>
</p>
"""

        return EmailTemplates._base_template(content, preheader_text)

    @staticmethod
    def facility_contact_confirmation(contact_data):
        """
        Email template for confirming receipt of facility contact request

        Args:
            contact_data (dict): Contact request data

        Returns:
            str: HTML email template
        """
        preheader_text = "Thank you for your interest in KEEPSAKE"

        plan_names = {
            'standard': 'Standard Plan',
            'premium': 'Premium Plan',
            'enterprise': 'Enterprise Plan'
        }
        plan_display = plan_names.get(contact_data.get('plan_interest'), 'KEEPSAKE')

        content = f"""
<div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 60px; height: 60px; background-color: {EmailTemplates.SUCCESS_COLOR}; border-radius: 50%; text-align: center; line-height: 60px;">
        <span style="color: #ffffff; font-size: 32px;">✓</span>
    </div>
</div>

<h2 style="margin: 0 0 20px 0; color: {EmailTemplates.SUCCESS_COLOR}; font-size: 24px; font-weight: 600; text-align: center;">
    Thank You for Your Interest!
</h2>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    Dear {contact_data['contact_person']},
</p>

<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
    Thank you for your interest in KEEPSAKE Healthcare Management System. We've received your inquiry about the <strong>{plan_display}</strong> and our sales team will be in touch with you shortly.
</p>

<div style="margin: 30px 0; padding: 25px; background-color: {EmailTemplates.LIGHT_BG}; border-radius: 8px;">
    <h3 style="margin: 0 0 15px 0; color: {EmailTemplates.TEXT_COLOR}; font-size: 18px; font-weight: 600; text-align: center;">
        What Happens Next?
    </h3>

    <div style="margin: 20px 0;">
        <div style="display: flex; align-items: start; margin-bottom: 15px;">
            <div style="background-color: {EmailTemplates.PRIMARY_COLOR}; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 15px; flex-shrink: 0;">
                1
            </div>
            <div style="flex: 1;">
                <p style="margin: 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 600;">
                    Review & Contact
                </p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    Our sales team will review your request and contact you within 24 hours
                </p>
            </div>
        </div>

        <div style="display: flex; align-items: start; margin-bottom: 15px;">
            <div style="background-color: {EmailTemplates.PRIMARY_COLOR}; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 15px; flex-shrink: 0;">
                2
            </div>
            <div style="flex: 1;">
                <p style="margin: 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 600;">
                    Personalized Demo
                </p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    Schedule a live demo tailored to your facility's needs
                </p>
            </div>
        </div>

        <div style="display: flex; align-items: start;">
            <div style="background-color: {EmailTemplates.PRIMARY_COLOR}; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 15px; flex-shrink: 0;">
                3
            </div>
            <div style="flex: 1;">
                <p style="margin: 0; font-size: 14px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 600;">
                    Custom Proposal
                </p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    Receive a tailored proposal with pricing and implementation plan
                </p>
            </div>
        </div>
    </div>
</div>

<div style="margin: 30px 0; padding: 20px; background-color: #dbeafe; border-radius: 8px;">
    <h3 style="margin: 0 0 12px 0; color: {EmailTemplates.PRIMARY_COLOR}; font-size: 16px; font-weight: 600;">
        Your Inquiry Details
    </h3>
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                Facility:
            </td>
            <td style="padding: 6px 0; font-size: 13px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 500;">
                {contact_data['facility_name']}
            </td>
        </tr>
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                Email:
            </td>
            <td style="padding: 6px 0; font-size: 13px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 500;">
                {contact_data['email']}
            </td>
        </tr>
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                Phone:
            </td>
            <td style="padding: 6px 0; font-size: 13px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 500;">
                {contact_data['phone']}
            </td>
        </tr>
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                Plan Interest:
            </td>
            <td style="padding: 6px 0; font-size: 13px; color: {EmailTemplates.TEXT_COLOR}; font-weight: 500;">
                {plan_display}
            </td>
        </tr>
    </table>
</div>

<div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid {EmailTemplates.WARNING_COLOR}; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Questions in the meantime?</strong>
    </p>
    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        Feel free to reply to this email or call us at <strong>+63 123 456 789</strong>
    </p>
</div>

<p style="margin: 30px 0 0 0; line-height: 1.6; font-size: 14px; color: #6b7280;">
    We're excited to help transform your facility's healthcare management!<br><br>
    Best regards,<br>
    <strong style="color: {EmailTemplates.PRIMARY_COLOR};">KEEPSAKE Healthcare Sales Team</strong>
</p>
"""

        return EmailTemplates._base_template(content, preheader_text)


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
