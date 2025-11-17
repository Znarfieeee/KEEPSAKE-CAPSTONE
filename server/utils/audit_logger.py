import logging, os, json
from typing import Optional
from functools import wraps
from flask import request, current_app, session
from config.settings import supabase, sr_client
import uuid


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

def create_audit_log(log_data: dict):
    """Create a comprehensive audit log entry with structured data

    Args:
        log_data (dict): Dictionary containing audit information with fields:
            - user_id: ID of the user performing the action
            - action_type: Type of action (CREATE, VIEW, UPDATE, DELETE, ERROR, DENIED)
            - table_name: Name of the table being accessed
            - patient_id: Optional - ID of the patient whose data is being accessed
            - qr_id: Optional - ID of the QR code being used
            - error_details: Optional - Details of any error that occurred
            - ip_address: Optional - IP address of the requestor
            - new_values: Optional - New values being set
            - reason: Optional - Reason for denial or error
    """
    try:
        # Structure the log message
        message_parts = [
            f"USER[{log_data.get('user_id', 'unknown')}]",
            f"ACTION[{log_data.get('action_type', 'UNKNOWN')}]",
            f"TABLE[{log_data.get('table_name', 'unknown')}]"
        ]

        # Add optional fields if present
        if 'patient_id' in log_data:
            message_parts.append(f"PATIENT[{log_data['patient_id']}]")
        if 'qr_id' in log_data:
            message_parts.append(f"QR[{log_data['qr_id']}]")
        if 'ip_address' in log_data:
            message_parts.append(f"IP[{log_data['ip_address']}]")
        if 'reason' in log_data:
            message_parts.append(f"REASON[{log_data['reason']}]")
        if 'error_details' in log_data:
            message_parts.append(f"ERROR[{log_data['error_details']}]")
        if 'new_values' in log_data:
            message_parts.append(f"VALUES{json.dumps(log_data['new_values'], sort_keys=True)}")

        # Combine all parts into one message
        log_message = ' '.join(message_parts)

        # Log using the configured logger
        current_app.logger.info(f"AUDIT: {log_message}")

    except Exception as e:
        # Fallback logging in case of error
        current_app.logger.error(f"AUDIT LOGGING ERROR: Failed to create audit log - {str(e)}")
        current_app.logger.error(f"Original log data: {json.dumps(log_data)}")

def log_action(user_id, action_type, table_name, record_id=None, patient_id=None,
                old_values=None, new_values=None, qr_id=None):
    """
    Log an action to the database audit_logs table

    Args:
        user_id (str): UUID of the user performing the action
        action_type (str): Type of action (CREATE, UPDATE, DELETE, VIEW)
        table_name (str): Name of the table being accessed
        record_id (str, optional): ID of the record being modified
        patient_id (str, optional): ID of the patient whose data is being accessed
        old_values (dict, optional): Old values before update/delete
        new_values (dict, optional): New values after create/update
        qr_id (str, optional): ID of the QR code if applicable

    Returns:
        bool: True if logging succeeded, False otherwise
    """
    try:
        # Get session_id from Flask session if available
        session_id = session.get('session_id') if session else None

        # Get IP address from request context
        ip_address = None
        if request:
            # Try to get real IP address (handles proxies)
            ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
            if ip_address and ',' in ip_address:
                ip_address = ip_address.split(',')[0].strip()

        # Prepare audit log data
        audit_data = {
            'user_id': user_id,
            'action_type': action_type.upper(),
            'table_name': table_name,
            'ip_address': ip_address,
            'session_id': session_id,
        }

        # Add optional fields
        if record_id:
            audit_data['record_id'] = record_id

        if patient_id:
            audit_data['patient_id'] = patient_id

        if qr_id:
            audit_data['qr_id'] = qr_id

        # Convert old_values and new_values to JSON if provided
        if old_values:
            # Convert to JSON-serializable format
            audit_data['old_values'] = json.loads(json.dumps(old_values, default=str))

        if new_values:
            # Convert to JSON-serializable format
            audit_data['new_values'] = json.loads(json.dumps(new_values, default=str))

        # Insert into audit_logs table using service role client to bypass RLS
        response = sr_client.table('audit_logs').insert(audit_data).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to create audit log: {response.error}")
            return False

        # Also log to file for backup
        create_audit_log({
            'user_id': user_id,
            'action_type': action_type,
            'table_name': table_name,
            'patient_id': patient_id,
            'ip_address': ip_address,
            'record_id': record_id
        })

        return True

    except Exception as e:
        # Don't let audit logging errors break the application
        current_app.logger.error(f"Error creating audit log: {str(e)}")
        current_app.logger.error(f"Audit data: user_id={user_id}, action={action_type}, table={table_name}")
        return False


def audit_access(action):
    """Decorator for HIPAA audit logging"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_id = getattr(request, 'current_user', {}).get('id', 'anonymous')
            patient_id = request.json.get('patient_id') if request.json else request.args.get('patient_id')

            # Log access attempt using create_audit_log
            create_audit_log({
                'user_id': user_id,
                'action_type': f'ATTEMPT_{action}',
                'patient_id': patient_id,
                'ip_address': request.remote_addr
            })

            result = f(*args, **kwargs)

            # Log successful access using create_audit_log
            create_audit_log({
                'user_id': user_id,
                'action_type': action,
                'patient_id': patient_id,
                'ip_address': request.remote_addr,
                'new_values': {'status': 'success'}
            })

            return result
        return decorated
    return decorator