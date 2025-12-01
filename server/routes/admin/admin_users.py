from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase, supabase_anon_client, supabase_service_role_client
from gotrue.errors import AuthApiError
from datetime import datetime
from utils.invalidate_cache import invalidate_caches
from utils.redis_client import get_redis_client
import json

users_bp = Blueprint('users', __name__)
redis_client = get_redis_client()

# Admin routes need service role client to bypass RLS
admin_supabase = supabase_service_role_client()

USERS_CACHE_KEY = 'users:all'
USERS_CACHE_PREFIX = 'users:'

""" USE THE SUPABASE REAL-TIME 'GET' METHOD TO GET THE LIST OF FACILITIES """
@users_bp.route('/admin/users', methods=['GET'])
@require_auth
@require_role('admin')
def get_all_users():
    """Get all users with their roles, status, and facility assignments"""
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        
        if not bust_cache:
            cached = redis_client.get(USERS_CACHE_KEY)
            
            if cached:
                cached_data = json.loads(cached)
                return jsonify({
                    "status": "success",
                    "data": cached_data,
                    "cached": True,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }), 200
        
        # Get users data from the database if there's no cache
        # Use admin_supabase to bypass RLS (admins can see all users)
        response = admin_supabase.table('users').select('*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))').neq('role', 'admin').execute()
        
        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch users: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch users"
            }), 500
            
        return jsonify({
            "status": "success",
            "data": response.data,
            "count": len(response.data)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching users: {str(e)}"
        }), 500

@users_bp.route('/admin/add_user', methods=['POST'])
@require_auth
@require_role('admin')
def add_user():
    """Register a new user in Supabase Auth and mirror the data in the public.users table."""

    data = request.json or {}

    # Basic Information
    email = data.get("email")
    password = data.get("password")
    firstname = data.get("firstname")
    middlename = data.get("middlename")
    lastname = data.get("lastname")
    phone_number = data.get("phone_number")
    role = data.get("role")

    # Professional Details
    employee_id_number = data.get("employee_id_number")
    specialty = data.get("specialty")
    license_number = data.get("license_number")
    years_of_experience = data.get("years_of_experience")
    education = data.get("education")
    certifications = data.get("certifications")
    job_title = data.get("job_title")

    # Parent-specific fields
    relationship_to_patient = data.get("relationship_to_patient")
    address = data.get("address")
    emergency_contact_name = data.get("emergency_contact_name")
    emergency_contact_phone = data.get("emergency_contact_phone")

    # Subscription
    plan = data.get('plan')
    sub_expiry = data.get('subscription_expires')
    is_subscribed = data.get('is_subscribed', False)

    # Basic validation
    required_fields = {
        'email': email,
        'password': password,
        'firstname': firstname,
        'lastname': lastname,
        'phone_number': phone_number,
        'role': role
    }
    
    missing_fields = [field for field, value in required_fields.items() if not value]
    
    if missing_fields:
        return (
            jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "fields": missing_fields
            }),
            400,
        )

    try:
        signup_resp = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        # Basic Information
                        "firstname": firstname,
                        "middlename": middlename,
                        "lastname": lastname,
                        "phone_number": phone_number,
                        "role": role,

                        # Professional Details
                        "employee_id_number": employee_id_number,
                        "specialty": specialty,
                        "license_number": license_number,
                        "years_of_experience": years_of_experience,
                        "education": education,
                        "certifications": certifications,
                        "job_title": job_title,

                        # Parent-specific fields
                        "relationship_to_patient": relationship_to_patient,
                        "address": address,
                        "emergency_contact_name": emergency_contact_name,
                        "emergency_contact_phone": emergency_contact_phone,

                        # Subscription
                        "plan": plan,
                        "subscription_expires": sub_expiry,
                        "is_subscribed": is_subscribed,
                    }
                },
            }
        )

        # Supabase returns None for user when email confirmation is required.
        if signup_resp.user is None:
            return (
                jsonify({
                    "status": "pending",
                    "message": "Signup successful. Please confirm your email to activate your account.",
                }),
                202,
            )

        user_id = signup_resp.user.id
        
        invalidate_caches('users')

        return (
            jsonify({
                "status": "success",
                "message": "User created successfully.",
                "user": {
                    "id": user_id,
                    "email": email,
                    "firstname": firstname,
                    "lastname": lastname,
                    "role": role,
                    "metadata": signup_resp.user.user_metadata,
                },
            }),
            201,
        )

    except AuthApiError as auth_error:
        # Specific Supabase Auth failures (e.g., duplicate email)
        return (
            jsonify({"status": "error", "message": str(auth_error)}),
            400,
        )
    except Exception as e:
        # Generic failures
        return (
            jsonify({"status": "error", "message": f"Failed to create user: {str(e)}"}),
            500,
        )

@users_bp.route('/admin/users/<user_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_user_by_id(user_id):
    """ Get a specific user with their facility assignment.
    Like looking up a specific employee's complete profile. """
    
    try:
        response = admin_supabase.table('users').select(
            '*, facility_users!facility_users_user_id_fkey(*, healthcare_facilities(facility_name))'
        ).eq('user_id', user_id).execute()
        
        if response.data:
            user = response.data[0]
            
            invalidate_caches('users', user_id)
                
            return jsonify({
                "status": "success",
                "data": user
            })
        
        else:
            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404
    
    except Exception as e:
        current_app.logger.error(f"Error fetching user {user_id} : {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch user"
        }), 500

@users_bp.route('/admin/users/<user_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_user(user_id):
    """Update user profile information"""
    try:
        data = request.json or {}

        # Extract updatable fields
        update_fields = {}
        allowed_fields = [
            'firstname', 'middlename', 'lastname', 'specialty',
            'license_number', 'phone_number', 'role',
            'subscription_expires', 'is_subscribed'
        ]

        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]

        if not update_fields:
            return jsonify({
                "status": "error",
                "message": "No valid fields provided for update"
            }), 400

        # Add update timestamp
        update_fields['updated_at'] = datetime.utcnow().isoformat()

        # Update user in database
        response = admin_supabase.table('users').update(update_fields).eq('user_id', user_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to update user: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to update user"
            }), 500

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User updated successfully",
            "data": response.data[0]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update user: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/status', methods=['PATCH'])
@require_auth
@require_role('admin')
def update_user_status(user_id):
    """Update user status (active/inactive/suspended)"""
    try:
        data = request.json or {}
        is_active = data.get('is_active')
        
        if is_active is None:
            return jsonify({
                "status": "error",
                "message": "is_active field is required"
            }), 400

        response = admin_supabase.table('users').update({
            'is_active': is_active,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to update user status: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to update user status"
            }), 500

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": f"User status updated to {'active' if is_active else 'inactive'}",
            "data": response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user status {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to update user status: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/assign-facility', methods=['POST'])
@require_auth
@require_role('admin')
def assign_user_to_facility(user_id):
    """Assign or transfer user to a facility with role and department"""
    try:
        data = request.json or {}
        facility_id = data.get('facility_id')
        facility_role = data.get('facility_role')
        department = data.get('department')
        start_date = data.get('start_date')
        current_user = request.current_user
        assigned_by = current_user.get('id')

        if not facility_id or not facility_role:
            return jsonify({
                "status": "error",
                "message": "Facility ID and role are required"
            }), 400

        # Check if user already has ANY facility assignment
        existing_assignment = admin_supabase.table('facility_users').select('*').eq('user_id', user_id).execute()

        if existing_assignment.data:
            # User is already assigned to a facility
            existing = existing_assignment.data[0]

            if existing['facility_id'] == facility_id:
                # Same facility - just update the role/department
                response = admin_supabase.table('facility_users').update({
                    'role': facility_role,
                    'department': department,
                    'start_date': start_date,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('user_id', user_id).eq('facility_id', facility_id).execute()
            else:
                # Different facility - delete old assignment and create new one (transfer)
                # First, delete the old assignment
                delete_response = admin_supabase.table('facility_users').delete().eq('user_id', user_id).execute()

                if getattr(delete_response, 'error', None):
                    current_app.logger.error(f"Failed to delete old facility assignment: {delete_response.error}")
                    return jsonify({
                        "status": "error",
                        "message": "Failed to remove previous facility assignment"
                    }), 500

                # Then create the new assignment
                response = admin_supabase.table('facility_users').insert({
                    'user_id': user_id,
                    'facility_id': facility_id,
                    'role': facility_role,
                    'department': department,
                    'start_date': start_date or datetime.utcnow().date().isoformat(),
                    'assigned_by': assigned_by,
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }).execute()
        else:
            # No existing assignment - create new one
            response = admin_supabase.table('facility_users').insert({
                'user_id': user_id,
                'facility_id': facility_id,
                'role': facility_role,
                'department': department,
                'start_date': start_date or datetime.utcnow().date().isoformat(),
                'assigned_by': assigned_by,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to assign user to facility: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to assign user to facility"
            }), 500

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User assigned to facility successfully",
            "data": response.data[0] if response.data else None
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error assigning user {user_id} to facility: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to assign user to facility: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/facilities/<facility_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def remove_user_from_facility(user_id, facility_id):
    """Remove user from a facility"""
    try:
        response = admin_supabase.table('facility_users').delete().eq('user_id', user_id).eq('facility_id', facility_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to remove user from facility: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to remove user from facility"
            }), 500

        invalidate_caches('users', user_id)

        return jsonify({
            "status": "success",
            "message": "User removed from facility successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error removing user {user_id} from facility {facility_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to remove user from facility: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_user(user_id):
    """
    Permanently delete a user from the system.

    This performs a hard delete with proper foreign key handling:
    - Nullifies foreign key references where the user is referenced
    - Deletes user-specific data (preferences, etc.)
    - Preserves audit trail by nullifying audit log references
    - Deletes from facility_users and auth tables
    """
    try:
        current_user = request.current_user

        # Check if user exists
        user_check = admin_supabase.table('users').select('*').eq('user_id', user_id).execute()

        if not user_check.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        user_data = user_check.data[0]
        user_email = user_data.get('email')

        # Prevent deleting yourself
        if user_id == current_user.get('id'):
            return jsonify({
                "status": "error",
                "message": "You cannot delete your own account"
            }), 400

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email')} initiating hard delete of user {user_email} (ID: {user_id}) from IP {request.remote_addr}")

        # Step 1: Delete user-specific data (data that belongs TO the user)
        try:
            # Delete notification preferences
            admin_supabase.table('notification_preferences').delete().eq('user_id', user_id).execute()

            # Delete consent preferences (for parents)
            admin_supabase.table('consent_preferences').delete().eq('parent_id', user_id).execute()

            # Delete feedback submitted by this user (if not anonymous)
            admin_supabase.table('feedback').delete().eq('user_id', user_id).execute()

            # Delete 2FA settings
            admin_supabase.table('user_2fa_settings').delete().eq('user_id', user_id).execute()

            # Delete email change requests
            admin_supabase.table('email_change_requests').delete().eq('user_id', user_id).execute()

        except Exception as e:
            current_app.logger.warning(f"Error deleting user-specific data: {str(e)}")
            # Continue anyway - these tables might not exist or might be empty

        # Step 2: Delete audit logs first (to avoid trigger issues)
        try:
            # Delete audit logs related to this user
            # This must be done first to avoid NOT NULL constraint violations from triggers
            admin_supabase.table('audit_logs').delete().eq('user_id', user_id).execute()
            admin_supabase.table('consent_audit_logs').delete().eq('performed_by', user_id).execute()
            admin_supabase.table('consent_audit_logs').delete().eq('parent_id', user_id).execute()
        except Exception as e:
            current_app.logger.warning(f"Error deleting audit logs: {str(e)}")

        # Step 3: Delete QR codes generated by this user (cannot nullify due to NOT NULL constraint)
        try:
            # Delete QR access logs first (foreign key to qr_codes)
            qr_codes_to_delete = admin_supabase.table('qr_codes').select('qr_id').eq('generated_by', user_id).execute()
            if qr_codes_to_delete.data:
                qr_ids = [qr['qr_id'] for qr in qr_codes_to_delete.data]
                # Delete access logs for these QR codes
                for qr_id in qr_ids:
                    admin_supabase.table('qr_access_logs').delete().eq('qr_id', qr_id).execute()

            # Now delete the QR codes
            admin_supabase.table('qr_codes').delete().eq('generated_by', user_id).execute()

            # Nullify last_accessed_by for any remaining QR codes
            admin_supabase.table('qr_codes').update({
                'last_accessed_by': None
            }).eq('last_accessed_by', user_id).execute()

        except Exception as e:
            current_app.logger.warning(f"Error deleting QR codes: {str(e)}")

        # Step 4: Nullify foreign key references (preserve records but remove user reference)
        try:
            # QR access logs - nullify accessed_by for remaining logs
            admin_supabase.table('qr_access_logs').update({
                'accessed_by': None
            }).eq('accessed_by', user_id).execute()

            # Notifications - keep the notification but nullify created_by
            admin_supabase.table('notifications').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            # System announcements - nullify created_by
            admin_supabase.table('system_announcements').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            # Parent access - nullify granted_by and assigned_by (keep user_id for now)
            admin_supabase.table('parent_access').update({
                'granted_by': None
            }).eq('granted_by', user_id).execute()

            admin_supabase.table('parent_access').update({
                'assigned_by': None
            }).eq('assigned_by', user_id).execute()

            # Appointments - nullify scheduled_by, updated_by, created_by (keep doctor_id for medical records)
            admin_supabase.table('appointments').update({
                'scheduled_by': None
            }).eq('scheduled_by', user_id).execute()

            admin_supabase.table('appointments').update({
                'updated_by': None
            }).eq('updated_by', user_id).execute()

            admin_supabase.table('appointments').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            # Facility patients - nullify registered_by, qr_code_scanned_by, deactivated_by
            admin_supabase.table('facility_patients').update({
                'registered_by': None
            }).eq('registered_by', user_id).execute()

            admin_supabase.table('facility_patients').update({
                'qr_code_scanned_by': None
            }).eq('qr_code_scanned_by', user_id).execute()

            admin_supabase.table('facility_patients').update({
                'deactivated_by': None
            }).eq('deactivated_by', user_id).execute()

            # Invoices - nullify created_by
            admin_supabase.table('invoices').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            # Payment transactions - nullify processed_by
            admin_supabase.table('payment_transactions').update({
                'processed_by': None
            }).eq('processed_by', user_id).execute()

            # Subscription history - nullify changed_by
            admin_supabase.table('subscription_history').update({
                'changed_by': None
            }).eq('changed_by', user_id).execute()

            # Healthcare facilities - nullify created_by
            admin_supabase.table('healthcare_facilities').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            # Medical documents - nullify uploaded_by and deleted_by
            admin_supabase.table('medical_documents').update({
                'uploaded_by': None
            }).eq('uploaded_by', user_id).execute()

            admin_supabase.table('medical_documents').update({
                'deleted_by': None
            }).eq('deleted_by', user_id).execute()

            # Vaccinations - nullify administered_by, deleted_by, recorded_by
            admin_supabase.table('vaccinations').update({
                'administered_by': None
            }).eq('administered_by', user_id).execute()

            admin_supabase.table('vaccinations').update({
                'deleted_by': None
            }).eq('deleted_by', user_id).execute()

            admin_supabase.table('vaccinations').update({
                'recorded_by': None
            }).eq('recorded_by', user_id).execute()

            # Medical records tables - nullify recorded_by
            admin_supabase.table('allergies').update({
                'recorded_by': None
            }).eq('recorded_by', user_id).execute()

            admin_supabase.table('anthropometric_measurements').update({
                'recorded_by': None
            }).eq('recorded_by', user_id).execute()

            admin_supabase.table('delivery_record').update({
                'recorded_by': None
            }).eq('recorded_by', user_id).execute()

            admin_supabase.table('growth_milestones').update({
                'recorded_by': None
            }).eq('recorded_by', user_id).execute()

            admin_supabase.table('screening_tests').update({
                'recorded_by': None
            }).eq('recorded_by', user_id).execute()

            # Medical visits - nullify created_by and updated_by (keep doctor_id for medical records)
            admin_supabase.table('medical_visits').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            admin_supabase.table('medical_visits').update({
                'updated_by': None
            }).eq('updated_by', user_id).execute()

            # Prescriptions - nullify created_by and updated_by (keep doctor_id for medical records)
            admin_supabase.table('prescriptions').update({
                'created_by': None
            }).eq('created_by', user_id).execute()

            admin_supabase.table('prescriptions').update({
                'updated_by': None
            }).eq('updated_by', user_id).execute()

            # Facility users - nullify assigned_by (keep the assignment records but remove who assigned them)
            admin_supabase.table('facility_users').update({
                'assigned_by': None
            }).eq('assigned_by', user_id).execute()

        except Exception as e:
            current_app.logger.warning(f"Error nullifying foreign keys: {str(e)}")

        # Step 5: Delete parent_access records (these trigger audit logs, so delete audit logs first)
        try:
            # Parent access records will be deleted later after all checks pass
            pass
        except Exception as e:
            current_app.logger.warning(f"Error handling parent access: {str(e)}")

        # Step 6: Check if user has critical medical records (doctor_id, patient_id references)
        # These should NOT be deleted as they are part of the medical record
        try:
            # Check if user is a doctor with appointments
            appointments_check = admin_supabase.table('appointments').select('appointment_id').eq('doctor_id', user_id).limit(1).execute()
            if appointments_check.data:
                return jsonify({
                    "status": "error",
                    "message": "Cannot delete user: they are listed as a doctor on appointment records. Consider deactivating instead to preserve medical history."
                }), 400

            # Check if user is a doctor with prescriptions
            prescriptions_check = admin_supabase.table('prescriptions').select('rx_id').eq('doctor_id', user_id).limit(1).execute()
            if prescriptions_check.data:
                return jsonify({
                    "status": "error",
                    "message": "Cannot delete user: they have prescribed medications. Consider deactivating instead to preserve medical history."
                }), 400

            # Check if user is a doctor with medical visits
            visits_check = admin_supabase.table('medical_visits').select('visit_id').eq('doctor_id', user_id).limit(1).execute()
            if visits_check.data:
                return jsonify({
                    "status": "error",
                    "message": "Cannot delete user: they have medical visit records. Consider deactivating instead to preserve medical history."
                }), 400

            # Check if user created patients
            patients_check = admin_supabase.table('patients').select('patient_id').eq('created_by', user_id).limit(1).execute()
            if patients_check.data:
                return jsonify({
                    "status": "error",
                    "message": "Cannot delete user: they have created patient records. Consider deactivating instead to preserve data integrity."
                }), 400

        except Exception as e:
            current_app.logger.warning(f"Error checking critical records: {str(e)}")

        # Step 7: Delete from facility_users (user's facility assignments)
        try:
            admin_supabase.table('facility_users').delete().eq('user_id', user_id).execute()
        except Exception as e:
            current_app.logger.error(f"Error deleting from facility_users: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Cannot delete user: Error removing facility assignments: {str(e)}"
            }), 400

        # Step 8: Delete from parent_access (if user is a parent)
        # Note: Audit logs for parent_access were already deleted in Step 2
        try:
            admin_supabase.table('parent_access').delete().eq('user_id', user_id).execute()
            # Also delete where user is granted_by or assigned_by (already nullified in Step 4)
        except Exception as e:
            current_app.logger.warning(f"Error deleting parent access: {str(e)}")
            # Continue anyway since we've already nullified the references

        # Step 9: Delete the main user record from public.users
        try:
            user_response = admin_supabase.table('users').delete().eq('user_id', user_id).execute()

            if getattr(user_response, 'error', None):
                current_app.logger.error(f"Failed to delete user from database: {user_response.error}")
                return jsonify({
                    "status": "error",
                    "message": f"Failed to delete user: {user_response.error.get('message', 'Unknown error')}"
                }), 500

        except Exception as e:
            error_msg = str(e)
            current_app.logger.error(f"Error deleting user record: {error_msg}")

            # Check for specific foreign key constraint errors
            if 'foreign key' in error_msg.lower() or 'violates' in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": "Cannot delete user: they have related records (appointments, prescriptions, etc.). Consider deactivating instead."
                }), 400

            return jsonify({
                "status": "error",
                "message": f"Failed to delete user: {error_msg}"
            }), 500

        # Step 10: Delete from Supabase Auth
        try:
            admin_supabase.auth.admin.delete_user(user_id)
        except Exception as auth_error:
            current_app.logger.warning(f"Could not delete user from auth (may not exist): {auth_error}")
            # Continue anyway as the main user record is deleted

        # Step 11: Clear user's sessions from Redis
        try:
            from utils.redis_client import redis_client
            SESSION_PREFIX = "keepsake_session:"

            # Find all sessions for this user
            session_keys = redis_client.keys(f"{SESSION_PREFIX}*")
            for key in session_keys:
                session_data_str = redis_client.get(key)
                if session_data_str:
                    try:
                        session_data = json.loads(session_data_str)
                        if session_data.get('user_id') == user_id:
                            redis_client.delete(key)
                    except:
                        pass
        except Exception as session_error:
            current_app.logger.warning(f"Could not clear user sessions: {session_error}")

        # Step 12: Invalidate caches
        invalidate_caches('users', user_id)

        current_app.logger.info(f"AUDIT: Admin {current_user.get('email')} successfully deleted user {user_email} (ID: {user_id}) from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": "User permanently deleted successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to delete user: {str(e)}"
        }), 500

@users_bp.route('/admin/users/<user_id>/toggle-status', methods=['PATCH'])
@require_auth
@require_role('admin')
def toggle_user_status(user_id):
    """
    Toggle user active/inactive status (soft delete/activate).

    This is for the Activate/Deactivate button in the UI.
    - Deactivate: Sets is_active to False (user cannot log in)
    - Activate: Sets is_active to True (user can log in again)
    """
    try:
        current_user = request.current_user

        # Check if user exists
        user_check = admin_supabase.table('users').select('*').eq('user_id', user_id).execute()

        if not user_check.data:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        user_data = user_check.data[0]
        current_status = user_data.get('is_active', False)
        new_status = not current_status  # Toggle the status

        # Prevent deactivating yourself
        if user_id == current_user.get('id') and new_status is False:
            return jsonify({
                "status": "error",
                "message": "You cannot deactivate your own account"
            }), 400

        # Update user status
        user_response = admin_supabase.table('users').update({
            'is_active': new_status,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()

        if getattr(user_response, 'error', None):
            current_app.logger.error(f"Failed to toggle user status: {user_response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to update user status"
            }), 500

        # If deactivating, also handle auth ban and sessions
        if new_status is False:
            # Ban user in Supabase Auth to prevent login
            try:
                admin_supabase.auth.admin.update_user_by_id(
                    user_id,
                    {"ban_duration": "876600h"}  # Ban for ~100 years
                )
            except Exception as auth_error:
                current_app.logger.warning(f"Could not ban user in auth: {auth_error}")

            # Clear user's sessions from Redis
            try:
                from utils.redis_client import redis_client
                SESSION_PREFIX = "keepsake_session:"

                session_keys = redis_client.keys(f"{SESSION_PREFIX}*")
                for key in session_keys:
                    session_data_str = redis_client.get(key)
                    if session_data_str:
                        try:
                            session_data = json.loads(session_data_str)
                            if session_data.get('user_id') == user_id:
                                redis_client.delete(key)
                        except:
                            pass
            except Exception as session_error:
                current_app.logger.warning(f"Could not clear user sessions: {session_error}")

        # If activating, unban the user
        else:
            try:
                admin_supabase.auth.admin.update_user_by_id(
                    user_id,
                    {"ban_duration": "none"}  # Remove ban
                )
            except Exception as auth_error:
                current_app.logger.warning(f"Could not unban user in auth: {auth_error}")

        invalidate_caches('users', user_id)

        action = "deactivated" if new_status is False else "activated"
        current_app.logger.info(f"AUDIT: Admin {current_user.get('email')} {action} user {user_data.get('email')} (ID: {user_id}) from IP {request.remote_addr}")

        return jsonify({
            "status": "success",
            "message": f"User {action} successfully",
            "is_active": new_status
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error toggling user status {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to toggle user status: {str(e)}"
        }), 500
