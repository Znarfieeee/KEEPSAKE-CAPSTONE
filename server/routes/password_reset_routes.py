"""
Password Reset API Routes for KEEPSAKE Healthcare System
Handles password reset requests via REST API
"""
from flask import Blueprint, request, jsonify, current_app, session
import logging
from utils.password_reset_service import PasswordResetService

logger = logging.getLogger(__name__)

# Create Blueprint
password_reset_bp = Blueprint('password_reset', __name__)

@password_reset_bp.route('/password-reset/request', methods=['POST', 'OPTIONS'])
def request_password_reset():
    """
    Request a password reset link

    POST /password-reset/request
    Body: { "email": "user@example.com" }

    Returns:
        JSON: Always returns success to prevent account enumeration
        Status: 200 (success), 400 (validation error), 429 (rate limited), 500 (server error)
    """
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        data = request.json or {}
        email = data.get('email', '').strip().lower()

        # Validate email provided
        if not email:
            return jsonify({
                "status": "error",
                "message": "Email address is required"
            }), 400

        # Basic email format validation
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({
                "status": "error",
                "message": "Please provide a valid email address"
            }), 400

        # Get request metadata
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', 'Unknown')
        request_url_root = request.url_root

        # Log request
        logger.info(f"Password reset requested for {email} from IP {ip_address}")

        # Request password reset
        success, message = PasswordResetService.request_password_reset(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            request_url_root=request_url_root
        )

        if not success:
            # Rate limited
            return jsonify({
                "status": "error",
                "message": message
            }), 429

        # Always return success (prevents account enumeration)
        return jsonify({
            "status": "success",
            "message": message
        }), 200

    except Exception as e:
        logger.error(f"Error in request_password_reset endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred processing your request"
        }), 500


@password_reset_bp.route('/password-reset/verify', methods=['POST'])
def verify_reset_token():
    """
    Verify a password reset token

    POST /password-reset/verify
    Body: { "token": "reset_token_here" }

    Returns:
        JSON: Token validity and user email
        Status: 200 (valid), 400 (validation error/invalid token), 500 (server error)
    """
    try:
        data = request.json or {}
        token = data.get('token', '').strip()

        # Validate token provided
        if not token:
            return jsonify({
                "status": "error",
                "message": "Reset token is required"
            }), 400

        # Verify token
        valid, token_data, message = PasswordResetService.verify_reset_token(token)

        if not valid:
            logger.warning(f"Invalid token verification attempt from IP {request.remote_addr}")
            return jsonify({
                "status": "error",
                "message": message
            }), 400

        # Token is valid
        logger.info(f"Token verified successfully for {token_data['email']}")
        return jsonify({
            "status": "success",
            "valid": True,
            "email": token_data['email'],
            "message": message
        }), 200

    except Exception as e:
        logger.error(f"Error in verify_reset_token endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred verifying your reset link"
        }), 500


@password_reset_bp.route('/password-reset/reset', methods=['POST'])
def reset_password():
    """
    Reset password using a valid token

    POST /password-reset/reset
    Body: {
        "token": "reset_token_here",
        "new_password": "NewSecurePassword123!",
        "confirm_password": "NewSecurePassword123!"
    }

    Returns:
        JSON: Success or error message
        Status: 200 (success), 400 (validation error/invalid token), 500 (server error)
    """
    try:
        data = request.json or {}
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        # Validate required fields
        if not token:
            return jsonify({
                "status": "error",
                "message": "Reset token is required"
            }), 400

        if not new_password or not confirm_password:
            return jsonify({
                "status": "error",
                "message": "Password and confirmation are required"
            }), 400

        # Reset password
        success, message = PasswordResetService.reset_password(
            token=token,
            new_password=new_password,
            confirm_password=confirm_password
        )

        if not success:
            logger.warning(f"Failed password reset attempt from IP {request.remote_addr}: {message}")
            return jsonify({
                "status": "error",
                "message": message
            }), 400

        # Password reset successful
        logger.info(f"Password reset successful from IP {request.remote_addr}")
        return jsonify({
            "status": "success",
            "message": message
        }), 200

    except Exception as e:
        logger.error(f"Error in reset_password endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred resetting your password"
        }), 500


# Health check endpoint (optional)
@password_reset_bp.route('/password-reset/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for password reset service

    GET /password-reset/health

    Returns:
        JSON: Service status
        Status: 200
    """
    from config.email_config import EmailConfig

    smtp_configured = EmailConfig.is_configured()

    return jsonify({
        "status": "healthy",
        "smtp_configured": smtp_configured,
        "message": "Password reset service is operational" if smtp_configured else "SMTP not configured - emails will not be sent"
    }), 200


# Cleanup endpoint (admin only - optional)
@password_reset_bp.route('/password-reset/cleanup', methods=['POST'])
def cleanup_expired():
    """
    Manually trigger cleanup of expired tokens and rate limits
    This should be restricted to admin users in production

    POST /password-reset/cleanup

    Returns:
        JSON: Cleanup statistics
        Status: 200
    """
    try:
        from utils.password_reset_service import cleanup_expired_tokens, cleanup_expired_rate_limits

        tokens_cleaned = cleanup_expired_tokens()
        limits_reset = cleanup_expired_rate_limits()

        logger.info(f"Manual cleanup: {tokens_cleaned} tokens, {limits_reset} rate limits")

        return jsonify({
            "status": "success",
            "tokens_cleaned": tokens_cleaned,
            "rate_limits_reset": limits_reset,
            "message": "Cleanup completed successfully"
        }), 200

    except Exception as e:
        logger.error(f"Error in cleanup_expired endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred during cleanup"
        }), 500


# Error handlers for this blueprint
@password_reset_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "status": "error",
        "message": "Endpoint not found"
    }), 404


@password_reset_bp.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        "status": "error",
        "message": "Method not allowed"
    }), 405


@password_reset_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "status": "error",
        "message": "An internal server error occurred"
    }), 500
