import logging, os, json
from typing import Optional
from functools import wraps
from flask import request, current_app


DEFAULT_LOG_FORMAT = '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
DEFAULT_LOGFILE_PATH = 'logs/keepsake_audit.log'

def _ensure_log_directory(logfile: str):
    """Ensure that the directory for the logfile exists."""
    directory = os.path.dirname(os.path.abspath(logfile))
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)


def configure_audit_logger(logfile: str = DEFAULT_LOGFILE_PATH,
                           level: int = logging.INFO,
                           log_format: str = DEFAULT_LOG_FORMAT,
                           attach_to_logger: Optional[logging.Logger] = None) -> logging.Logger:
    """Configure and return an audit logger.

    This helper prevents duplicate handlers when imported multiple times by
    checking whether a handler for *logfile* is already attached.

    If *attach_to_logger* is provided (e.g. a Flask app's ``app.logger``), the
    handlers will be added to that logger. Otherwise a standalone logger named
    "keepsake" is returned.
    """
    _ensure_log_directory(logfile)

    logger = attach_to_logger or logging.getLogger("keepsake")

    # Avoid adding multiple handlers in case this function is called again.
    if any(isinstance(h, logging.FileHandler) and h.baseFilename == os.path.abspath(logfile)
           for h in logger.handlers):
        return logger

    logger.setLevel(level)

    formatter = logging.Formatter(log_format)

    file_handler = logging.FileHandler(logfile)
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    stream_handler.setLevel(level)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)

    return logger

def audit_access(action):
    """Decorator for HIPAA audit logging"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_id = getattr(request, 'current_user', {}).get('id', 'anonymous')
            patient_id = request.json.get('patient_id') if request.json else request.args.get('patient_id')
            
            # Log access attempt
            current_app.logger.info(f"AUDIT: User {user_id} attempted {action} on patient {patient_id} from IP {request.remote_addr}")
            
            result = f(*args, **kwargs)
            
            # Log successful access
            current_app.logger.info(f"AUDIT: User {user_id} successfully performed {action} on patient {patient_id}")
            
            return result
        return decorated
    return decorator