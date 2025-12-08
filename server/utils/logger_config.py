"""
Centralized Logging Configuration for KEEPSAKE Backend
Provides consistent logging across all modules
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime

def setup_logging(app=None):
    """
    Configure logging for the application

    Args:
        app: Flask application instance (optional)

    Returns:
        Logger instance
    """
    # Get log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

    # Create logs directory if it doesn't exist
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Create logger
    logger = logging.getLogger('keepsake')
    logger.setLevel(getattr(logging, log_level))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level))
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler for all logs
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'),
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Error file handler
    error_handler = RotatingFileHandler(
        os.path.join(log_dir, 'error.log'),
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    logger.addHandler(error_handler)

    # Configure Flask app logger if provided
    if app:
        app.logger.handlers = logger.handlers
        app.logger.setLevel(logger.level)

    logger.info(f"Logging configured with level: {log_level}")
    return logger


def get_logger(name):
    """
    Get a logger instance for a specific module

    Args:
        name: Name of the module/component

    Returns:
        Logger instance
    """
    return logging.getLogger(f'keepsake.{name}')


class LoggerMixin:
    """
    Mixin class to add logging capability to any class
    """
    @property
    def logger(self):
        if not hasattr(self, '_logger'):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger


def log_exception(logger, exception, context=''):
    """
    Log exception with context

    Args:
        logger: Logger instance
        exception: Exception object
        context: Additional context string
    """
    logger.error(
        f"{context}: {type(exception).__name__}: {str(exception)}",
        exc_info=True
    )


def log_api_request(logger, request):
    """
    Log API request details

    Args:
        logger: Logger instance
        request: Flask request object
    """
    logger.info(
        f"{request.method} {request.path} - "
        f"IP: {request.remote_addr} - "
        f"User-Agent: {request.headers.get('User-Agent', 'Unknown')[:100]}"
    )


def log_api_response(logger, request, response, duration_ms):
    """
    Log API response details

    Args:
        logger: Logger instance
        request: Flask request object
        response: Flask response object
        duration_ms: Request duration in milliseconds
    """
    logger.info(
        f"{request.method} {request.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {duration_ms:.2f}ms"
    )


def sanitize_log_data(data):
    """
    Remove sensitive information from log data

    Args:
        data: Dictionary or object to sanitize

    Returns:
        Sanitized copy of data
    """
    if not isinstance(data, dict):
        return data

    sensitive_keys = {
        'password', 'token', 'secret', 'api_key',
        'jwt', 'pin', 'ssn', 'credit_card'
    }

    sanitized = {}
    for key, value in data.items():
        key_lower = key.lower()
        if any(sensitive in key_lower for sensitive in sensitive_keys):
            sanitized[key] = '***REDACTED***'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_log_data(item) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value

    return sanitized


# Create default logger instance
default_logger = get_logger('default')
