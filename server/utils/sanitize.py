"""
Medical Data Sanitization Utility for HIPAA-Compliant Pediatric Records

This module provides comprehensive sanitization for medical data while preserving
clinical accuracy and maintaining HIPAA compliance standards.
"""

import re
import html
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import unicodedata

logger = logging.getLogger(__name__)

class MedicalDataSanitizer:
    """
    HIPAA-compliant data sanitizer for pediatric medical records.
    Focuses on preventing XSS, SQL injection, and maintaining data integrity.
    """
    
    # Field length limits based on medical standards and database constraints
    FIELD_LIMITS = {
        # Patient basic info
        'firstname': 50,
        'lastname': 50,
        'sex': 10,
        'bloodtype': 5,
        
        # Medical measurements (formatted strings)
        'birth_weight': 20,
        'birth_height': 20,
        'weight': 20,
        'height': 20,
        'head_circumference': 20,
        'chest_circumference': 20,
        'abdominal_circumference': 20,
        
        # Delivery record fields
        'type_of_delivery': 50,
        'mother_blood_type': 5,
        'father_blood_type': 5,
        'patient_blood_type': 5,
        'distinguishable_marks': 500,
        'vitamin_k_location': 100,
        'hepatitis_b_location': 100,
        'bcg_vaccination_location': 100,
        'other_medications': 1000,
        'follow_up_visit_site': 200,
        'discharge_diagnosis': 500,
        'obstetrician': 100,
        'pediatrician': 100,
        
        # Screening test fields
        'ens_remarks': 500,
        'nhs_right_ear': 50,
        'nhs_left_ear': 50,
        'pos_for_cchd_right': 50,
        'pos_for_cchd_left': 50,
        'ror_remarks': 500,
        
        # Allergy fields
        'allergen': 200,
        'reaction_type': 100,
        'severity': 50,
        'notes': 1000,
        
        # Prescription fields
        'findings': 2000,
        'consultation_notes': 2000,
        'doctor_instructions': 2000,
        'medication_name': 200,
        'dosage': 100,
        'frequency': 100,
        'duration': 100,
        'quantity': 50,
        'special_instructions': 1000,
    }
    
    # Patterns for medical data validation
    MEDICAL_PATTERNS = {
        'blood_type': re.compile(r'^(A|B|AB|O)[+-]?$', re.IGNORECASE),
        'sex': re.compile(r'^(male|female)$', re.IGNORECASE),
        'date': re.compile(r'^\d{4}-\d{2}-\d{2}$'),
        'datetime': re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$'),
        'measurement': re.compile(r'^\d+(\.\d+)?\s*(kg|g|cm|mm|lbs|oz|in)?$', re.IGNORECASE),
        'apgar_score': re.compile(r'^([0-9]|10)$'),  # APGAR scores are 0-10
    }
    
    # Dangerous patterns that should be completely removed
    DANGEROUS_PATTERNS = [
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'vbscript:', re.IGNORECASE),
        re.compile(r'onload\s*=', re.IGNORECASE),
        re.compile(r'onerror\s*=', re.IGNORECASE),
        re.compile(r'onclick\s*=', re.IGNORECASE),
        re.compile(r'onmouse\w+\s*=', re.IGNORECASE),
        # SQL injection patterns
        re.compile(r'\bunion\b.*\bselect\b', re.IGNORECASE),
        re.compile(r'\bdrop\b.*\btable\b', re.IGNORECASE),
        re.compile(r'\bdelete\b.*\bfrom\b', re.IGNORECASE),
        re.compile(r'\binsert\b.*\binto\b', re.IGNORECASE),
        re.compile(r'\bupdate\b.*\bset\b', re.IGNORECASE),
    ]
    
    @staticmethod
    def sanitize_text(value: str, max_length: Optional[int] = None, 
                     preserve_medical: bool = True) -> str:
        """
        Sanitize text while preserving medical terminology and formatting.
        
        Args:
            value: Input string to sanitize
            max_length: Maximum allowed length
            preserve_medical: Whether to preserve medical symbols/formatting
        
        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            return str(value) if value is not None else ""
        
        # Remove dangerous patterns first
        sanitized = value
        for pattern in MedicalDataSanitizer.DANGEROUS_PATTERNS:
            sanitized = pattern.sub('', sanitized)
        
        # Normalize unicode characters
        sanitized = unicodedata.normalize('NFKC', sanitized)
        
        # HTML escape but preserve medical symbols if needed
        if preserve_medical:
            # Temporarily replace medical symbols
            medical_symbols = {
                '°': '__DEGREE__',
                '±': '__PLUSMINUS__',
                '≤': '__LESSEQUAL__',
                '≥': '__GREATEREQUAL__',
                'µ': '__MICRO__',
                'α': '__ALPHA__',
                'β': '__BETA__',
                'γ': '__GAMMA__',
            }
            
            for symbol, placeholder in medical_symbols.items():
                sanitized = sanitized.replace(symbol, placeholder)
            
            # HTML escape
            sanitized = html.escape(sanitized, quote=True)
            
            # Restore medical symbols
            for symbol, placeholder in medical_symbols.items():
                sanitized = sanitized.replace(placeholder, symbol)
        else:
            sanitized = html.escape(sanitized, quote=True)
        
        # Remove excessive whitespace but preserve single spaces
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        
        # Enforce length limits
        if max_length and len(sanitized) > max_length:
            logger.warning(f"Text truncated from {len(sanitized)} to {max_length} characters")
            sanitized = sanitized[:max_length].rstrip()
        
        return sanitized
    
    @staticmethod
    def validate_medical_field(field_name: str, value: Any) -> tuple[bool, str]:
        """
        Validate medical field against expected patterns.
        
        Args:
            field_name: Name of the field being validated
            value: Value to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if value is None or value == "":
            return True, ""
        
        value_str = str(value).strip()
        
        # Blood type validation
        if 'blood' in field_name.lower():
            if not MedicalDataSanitizer.MEDICAL_PATTERNS['blood_type'].match(value_str):
                return False, f"Invalid blood type format: {value_str}"
        
        # Sex validation
        elif field_name == 'sex':
            if not MedicalDataSanitizer.MEDICAL_PATTERNS['sex'].match(value_str):
                return False, f"Sex must be 'male' or 'female', got: {value_str}"
        
        # Date validation
        elif 'date' in field_name and not field_name.endswith('_date_time'):
            if not MedicalDataSanitizer.MEDICAL_PATTERNS['date'].match(value_str):
                return False, f"Invalid date format. Expected YYYY-MM-DD, got: {value_str}"
        
        # Datetime validation
        elif field_name.endswith('_date_time') or 'datetime' in field_name:
            if not MedicalDataSanitizer.MEDICAL_PATTERNS['datetime'].match(value_str):
                return False, f"Invalid datetime format. Expected ISO format, got: {value_str}"
        
        # APGAR score validation
        elif field_name == 'apgar_score':
            if not MedicalDataSanitizer.MEDICAL_PATTERNS['apgar_score'].match(value_str):
                return False, f"APGAR score must be 0-10, got: {value_str}"
        
        # Measurement validation (weight, height, etc.)
        elif any(keyword in field_name.lower() for keyword in ['weight', 'height', 'circumference']):
            if isinstance(value, str) and not MedicalDataSanitizer.MEDICAL_PATTERNS['measurement'].match(value_str):
                return False, f"Invalid measurement format: {value_str}"
        
        # Gestation weeks validation
        elif field_name == 'gestation_weeks':
            try:
                weeks = int(value)
                if not (1 <= weeks <= 50):
                    return False, f"Gestation weeks must be between 1-50, got: {weeks}"
            except (ValueError, TypeError):
                return False, f"Gestation weeks must be a number, got: {value}"
        
        # Consultation type validation
        elif field_name == 'consultation_type':
            try:
                consult_type = int(value)
                if not (1 <= consult_type <= 10):
                    return False, f"Consultation type must be between 1-10, got: {consult_type}"
            except (ValueError, TypeError):
                return False, f"Consultation type must be a number, got: {value}"
        
        return True, ""
    
    @classmethod
    def sanitize_patient_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize patient record data with medical field-specific handling.
        
        Args:
            data: Dictionary of patient data
        
        Returns:
            Sanitized data dictionary
        
        Raises:
            ValueError: If critical validation fails
        """
        if not isinstance(data, dict):
            raise ValueError("Patient data must be a dictionary")
        
        sanitized = {}
        errors = []
        
        for field, value in data.items():
            if value is None or value == "":
                sanitized[field] = value
                continue
            
            try:
                # Get field-specific length limit
                max_length = cls.FIELD_LIMITS.get(field)
                
                # Validate medical field patterns
                is_valid, error_msg = cls.validate_medical_field(field, value)
                if not is_valid:
                    errors.append(f"Field '{field}': {error_msg}")
                    continue
                
                # Sanitize based on field type
                if isinstance(value, str):
                    # Preserve medical formatting for clinical fields
                    preserve_medical = field in [
                        'findings', 'consultation_notes', 'doctor_instructions',
                        'distinguishable_marks', 'other_medications', 'notes',
                        'special_instructions', 'discharge_diagnosis', 'ens_remarks',
                        'ror_remarks'
                    ]
                    
                    sanitized[field] = cls.sanitize_text(
                        value, max_length, preserve_medical
                    )
                
                elif isinstance(value, (int, float)):
                    # Numeric validation for specific fields
                    if field == 'gestation_weeks' and not (1 <= value <= 50):
                        errors.append(f"Field '{field}': Must be between 1-50, got {value}")
                        continue
                    elif field == 'consultation_type' and not (1 <= value <= 10):
                        errors.append(f"Field '{field}': Must be between 1-10, got {value}")
                        continue
                    elif field == 'apgar_score' and not (0 <= value <= 10):
                        errors.append(f"Field '{field}': APGAR score must be 0-10, got {value}")
                        continue
                    
                    sanitized[field] = value
                
                elif isinstance(value, list):
                    # Handle medication arrays
                    if field == 'medications':
                        sanitized[field] = [
                            cls.sanitize_medication_data(med) for med in value
                        ]
                    else:
                        sanitized[field] = [
                            cls.sanitize_text(str(item), max_length) for item in value
                        ]
                
                else:
                    # For other types, convert to string and sanitize
                    sanitized[field] = cls.sanitize_text(str(value), max_length)
            
            except Exception as e:
                logger.error(f"Error sanitizing field '{field}': {str(e)}")
                errors.append(f"Field '{field}': Sanitization error - {str(e)}")
        
        if errors:
            logger.warning(f"Sanitization errors: {'; '.join(errors)}")
            # For medical data, we might want to be strict
            raise ValueError(f"Data validation failed: {'; '.join(errors)}")
        
        return sanitized
    
    @classmethod
    def sanitize_medication_data(cls, medication: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize medication data with pharmacy-specific validation.
        
        Args:
            medication: Dictionary of medication data
        
        Returns:
            Sanitized medication dictionary
        """
        if not isinstance(medication, dict):
            raise ValueError("Medication data must be a dictionary")
        
        sanitized = {}
        
        # Required fields for medications
        required_fields = ['medication_name', 'dosage', 'frequency']
        for field in required_fields:
            if not medication.get(field):
                raise ValueError(f"Missing required medication field: {field}")
        
        for field, value in medication.items():
            if value is None or value == "":
                sanitized[field] = value
                continue
            
            max_length = cls.FIELD_LIMITS.get(field, 500)  # Default for medication fields
            
            if isinstance(value, str):
                # Preserve medical formatting for medication instructions
                preserve_medical = field in ['special_instructions', 'dosage', 'frequency']
                sanitized[field] = cls.sanitize_text(value, max_length, preserve_medical)
            elif isinstance(value, (int, float)):
                # Validate numeric fields
                if field == 'refills_authorized' and value < 0:
                    raise ValueError(f"Refills authorized cannot be negative: {value}")
                elif field == 'quantity' and value <= 0:
                    raise ValueError(f"Quantity must be positive: {value}")
                sanitized[field] = value
            else:
                sanitized[field] = cls.sanitize_text(str(value), max_length)
        
        return sanitized
    
    @classmethod
    def audit_log_sanitized_data(cls, original_data: Dict[str, Any], 
                                sanitized_data: Dict[str, Any], 
                                user_id: str, action: str) -> None:
        """
        Create audit log entries for data sanitization (HIPAA compliance).
        
        Args:
            original_data: Original unsanitized data
            sanitized_data: Sanitized data
            user_id: User performing the action
            action: Action being performed (create, update, etc.)
        """
        changes = []
        
        for field, sanitized_value in sanitized_data.items():
            original_value = original_data.get(field)
            
            if original_value != sanitized_value:
                changes.append({
                    'field': field,
                    'original_length': len(str(original_value)) if original_value else 0,
                    'sanitized_length': len(str(sanitized_value)) if sanitized_value else 0,
                    'was_truncated': (
                        len(str(original_value)) > len(str(sanitized_value))
                        if original_value and sanitized_value else False
                    )
                })
        
        if changes:
            logger.info(
                f"HIPAA AUDIT: User {user_id} performed {action} with data sanitization. "
                f"Fields modified: {len(changes)}. "
                f"Details: {changes}"
            )


def sanitize_request_data(data: Dict[str, Any], data_type: str = 'patient') -> Dict[str, Any]:
    """
    Convenience function for sanitizing request data in Flask routes.
    
    Args:
        data: Request data to sanitize
        data_type: Type of data ('patient', 'medication', 'general')
    
    Returns:
        Sanitized data
    
    Usage in Flask routes:
        data = request.json
        sanitized_data = sanitize_request_data(data, 'patient')
    """
    try:
        if data_type == 'patient':
            return MedicalDataSanitizer.sanitize_patient_data(data)
        elif data_type == 'medication':
            return {
                'medications': [
                    MedicalDataSanitizer.sanitize_medication_data(med) 
                    for med in data.get('medications', [])
                ]
            }
        else:
            # General sanitization
            sanitized = {}
            for field, value in data.items():
                if isinstance(value, str):
                    max_length = MedicalDataSanitizer.FIELD_LIMITS.get(field, 1000)
                    sanitized[field] = MedicalDataSanitizer.sanitize_text(value, max_length)
                else:
                    sanitized[field] = value
            return sanitized
            
    except ValueError as e:
        logger.error(f"Data sanitization failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during sanitization: {str(e)}")
        raise ValueError(f"Data sanitization failed: {str(e)}")


# Decorator for automatic request data sanitization
def sanitize_medical_data(data_type: str = 'patient'):
    """
    Decorator to automatically sanitize request data in Flask routes.
    
    Usage:
        @patrecord_bp.route('/patient_records', methods=['POST'])
        @require_auth
        @require_role('doctor', 'facility_admin')
        @sanitize_medical_data('patient')
        def add_patient_record():
            # request.sanitized_json will contain sanitized data
            data = request.sanitized_json
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            from flask import request
            
            if hasattr(request, 'json') and request.json:
                try:
                    sanitized = sanitize_request_data(request.json, data_type)
                    # Add sanitized data to request object
                    request.sanitized_json = sanitized
                    
                    # Create audit log
                    if hasattr(request, 'current_user') and request.current_user:
                        MedicalDataSanitizer.audit_log_sanitized_data(
                            request.json,
                            sanitized,
                            request.current_user.get('id'),
                            f.__name__
                        )
                except ValueError as e:
                    from flask import jsonify
                    return jsonify({
                        'status': 'error',
                        'message': f'Data validation failed: {str(e)}'
                    }), 400
            
            return f(*args, **kwargs)
        
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator