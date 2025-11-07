"""
Notification Utilities - KEEPSAKE Healthcare System
Helper functions for creating various types of notifications
"""

from datetime import datetime, timedelta
from config.settings import supabase_service_role_client
from typing import Optional, List, Dict


def create_appointment_reminder(appointment_id: int, minutes_before: int = 60):
    """
    Create appointment reminder notification

    Args:
        appointment_id: Appointment ID
        minutes_before: Minutes before appointment to remind (default 60)
    """
    try:
        supabase = supabase_service_role_client()

        # Get appointment details
        appointment = supabase.table('appointments').select(
            '*, patients(firstname, lastname, patient_id)'
        ).eq('appointment_id', appointment_id).execute()

        if not appointment.data:
            return None

        appt = appointment.data[0]

        # Calculate reminder time
        appointment_time = datetime.fromisoformat(appt['appointment_date'].replace('Z', '+00:00'))
        reminder_time = appointment_time - timedelta(minutes=minutes_before)

        # Don't create reminder if appointment is in the past
        if appointment_time < datetime.utcnow():
            return None

        # Get the user who scheduled the appointment (could be parent/guardian)
        scheduled_by = appt.get('scheduled_by')

        if not scheduled_by:
            return None

        # Format the message
        patient_name = f"{appt['patients']['firstname']} {appt['patients']['lastname']}" if appt.get('patients') else "Patient"
        appointment_date_str = appointment_time.strftime("%B %d, %Y at %I:%M %p")

        notification_data = {
            'user_id': scheduled_by,
            'facility_id': appt.get('facility_id'),
            'notification_type': 'appointment_reminder',
            'title': 'Upcoming Appointment Reminder',
            'message': f"Reminder: {patient_name} has an appointment on {appointment_date_str}. Reason: {appt.get('reason', 'General consultation')}",
            'priority': 'high',
            'action_url': f'/appointments/{appointment_id}',
            'metadata': {
                'appointment_id': appointment_id,
                'patient_id': appt['patients']['patient_id'] if appt.get('patients') else None,
                'appointment_date': appt['appointment_date'],
                'reminder_minutes': minutes_before
            },
            'related_appointment_id': appointment_id,
            'related_patient_id': appt['patients']['patient_id'] if appt.get('patients') else None
        }

        response = supabase.table('notifications').insert(notification_data).execute()
        return response.data[0] if response.data else None

    except Exception as e:
        print(f"Error creating appointment reminder: {e}")
        return None


def create_upcoming_appointment_notification(appointment_id: int):
    """
    Create notification for upcoming appointment (usually 24 hours before)

    Args:
        appointment_id: Appointment ID
    """
    try:
        supabase = supabase_service_role_client()

        # Get appointment details
        appointment = supabase.table('appointments').select(
            '*, patients(firstname, lastname, patient_id), users(firstname, lastname)'
        ).eq('appointment_id', appointment_id).execute()

        if not appointment.data:
            return None

        appt = appointment.data[0]
        appointment_time = datetime.fromisoformat(appt['appointment_date'].replace('Z', '+00:00'))

        # Don't create notification if appointment is in the past
        if appointment_time < datetime.utcnow():
            return None

        patient_name = f"{appt['patients']['firstname']} {appt['patients']['lastname']}" if appt.get('patients') else "Patient"
        doctor_name = f"Dr. {appt['users']['lastname']}" if appt.get('users') else appt.get('doctor_name', 'Doctor')
        appointment_date_str = appointment_time.strftime("%B %d, %Y at %I:%M %p")

        # Notify both the person who scheduled and the doctor
        users_to_notify = []

        if appt.get('scheduled_by'):
            users_to_notify.append({
                'user_id': appt['scheduled_by'],
                'message': f"{patient_name}'s appointment with {doctor_name} is tomorrow at {appointment_time.strftime('%I:%M %p')}."
            })

        if appt.get('doctor_id') and appt['doctor_id'] != appt.get('scheduled_by'):
            users_to_notify.append({
                'user_id': appt['doctor_id'],
                'message': f"You have an appointment with {patient_name} tomorrow at {appointment_time.strftime('%I:%M %p')}."
            })

        notifications = []
        for user_info in users_to_notify:
            notification_data = {
                'user_id': user_info['user_id'],
                'facility_id': appt.get('facility_id'),
                'notification_type': 'upcoming_appointment',
                'title': 'Appointment Tomorrow',
                'message': user_info['message'],
                'priority': 'high',
                'action_url': f'/appointments/{appointment_id}',
                'metadata': {
                    'appointment_id': appointment_id,
                    'patient_id': appt['patients']['patient_id'] if appt.get('patients') else None,
                    'appointment_date': appt['appointment_date']
                },
                'related_appointment_id': appointment_id,
                'related_patient_id': appt['patients']['patient_id'] if appt.get('patients') else None
            }
            notifications.append(notification_data)

        if notifications:
            response = supabase.table('notifications').insert(notifications).execute()
            return response.data

        return None

    except Exception as e:
        print(f"Error creating upcoming appointment notification: {e}")
        return None


def create_vaccination_due_notification(patient_id: str, vaccine_name: str, due_date: str):
    """
    Create notification for upcoming vaccination due date

    Args:
        patient_id: Patient UUID
        vaccine_name: Name of the vaccine
        due_date: Due date for vaccination (ISO format)
    """
    try:
        supabase = supabase_service_role_client()

        # Get patient details
        patient = supabase.table('patients').select('*, facility_patients(facility_id)').eq('patient_id', patient_id).execute()

        if not patient.data:
            return None

        patient_data = patient.data[0]
        patient_name = f"{patient_data['firstname']} {patient_data['lastname']}"

        # Get parent/guardian access for this patient
        parent_access = supabase.table('parent_access').select('user_id').eq('patient_id', patient_id).eq('is_active', True).execute()

        # Also get the facility users who can view this patient
        facility_doctors = []
        if patient_data.get('facility_patients') and len(patient_data['facility_patients']) > 0:
            facility_id = patient_data['facility_patients'][0]['facility_id']
            facility_users = supabase.table('facility_users').select('user_id, role').eq('facility_id', facility_id).in_('role', ['doctor', 'facility_admin']).execute()
            facility_doctors = [fu['user_id'] for fu in facility_users.data]

        # Format due date
        due_date_obj = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
        due_date_str = due_date_obj.strftime("%B %d, %Y")

        # Create notifications
        notifications = []
        users_to_notify = set()

        # Add parents/guardians
        if parent_access.data:
            for access in parent_access.data:
                users_to_notify.add(access['user_id'])

        # Add facility doctors
        users_to_notify.update(facility_doctors)

        for user_id in users_to_notify:
            notification_data = {
                'user_id': user_id,
                'facility_id': patient_data['facility_patients'][0]['facility_id'] if patient_data.get('facility_patients') and len(patient_data['facility_patients']) > 0 else None,
                'notification_type': 'vaccination_due',
                'title': 'Vaccination Due',
                'message': f"{patient_name} is due for {vaccine_name} vaccination on {due_date_str}.",
                'priority': 'normal',
                'action_url': f'/patients/{patient_id}/vaccinations',
                'metadata': {
                    'patient_id': patient_id,
                    'vaccine_name': vaccine_name,
                    'due_date': due_date
                },
                'related_patient_id': patient_id
            }
            notifications.append(notification_data)

        if notifications:
            response = supabase.table('notifications').insert(notifications).execute()
            return response.data

        return None

    except Exception as e:
        print(f"Error creating vaccination due notification: {e}")
        return None


def create_qr_access_alert(qr_id: str, accessed_by_user_id: str, patient_id: str):
    """
    Create notification when patient QR code is accessed

    Args:
        qr_id: QR code UUID
        accessed_by_user_id: User who accessed the QR code
        patient_id: Patient UUID
    """
    try:
        supabase = supabase_service_role_client()

        # Get QR code details
        qr_code = supabase.table('qr_codes').select('*').eq('qr_id', qr_id).execute()

        if not qr_code.data:
            return None

        qr_data = qr_code.data[0]

        # Get patient details
        patient = supabase.table('patients').select('firstname, lastname').eq('patient_id', patient_id).execute()

        if not patient.data:
            return None

        patient_data = patient.data[0]
        patient_name = f"{patient_data['firstname']} {patient_data['lastname']}"

        # Get accessing user details
        accessing_user = supabase.table('users').select('firstname, lastname, role').eq('user_id', accessed_by_user_id).execute()

        accessing_user_name = "Unknown User"
        accessing_user_role = "user"
        if accessing_user.data:
            accessing_user_name = f"{accessing_user.data[0]['firstname']} {accessing_user.data[0]['lastname']}"
            accessing_user_role = accessing_user.data[0].get('role', 'user')

        # Get parent/guardian access for notifications
        parent_access = supabase.table('parent_access').select('user_id').eq('patient_id', patient_id).eq('is_active', True).execute()

        # Create notifications for parents/guardians
        notifications = []
        if parent_access.data:
            for access in parent_access.data:
                # Don't notify the person who accessed it
                if access['user_id'] == accessed_by_user_id:
                    continue

                notification_data = {
                    'user_id': access['user_id'],
                    'facility_id': qr_data.get('facility_id'),
                    'notification_type': 'qr_access_alert',
                    'title': 'QR Code Accessed',
                    'message': f"{patient_name}'s medical record QR code was accessed by {accessing_user_name} ({accessing_user_role}) at {datetime.utcnow().strftime('%I:%M %p on %B %d, %Y')}.",
                    'priority': 'high',
                    'action_url': f'/patients/{patient_id}',
                    'metadata': {
                        'qr_id': qr_id,
                        'patient_id': patient_id,
                        'accessed_by': accessed_by_user_id,
                        'accessed_by_name': accessing_user_name,
                        'accessed_by_role': accessing_user_role,
                        'access_time': datetime.utcnow().isoformat()
                    },
                    'related_patient_id': patient_id,
                    'related_qr_id': qr_id
                }
                notifications.append(notification_data)

        if notifications:
            response = supabase.table('notifications').insert(notifications).execute()
            return response.data

        return None

    except Exception as e:
        print(f"Error creating QR access alert: {e}")
        return None


def check_and_create_vaccination_reminders(days_ahead: int = 7):
    """
    Check for upcoming vaccinations and create reminders

    Args:
        days_ahead: Number of days to look ahead for due vaccinations
    """
    try:
        supabase = supabase_service_role_client()

        # Calculate date range
        start_date = datetime.utcnow().date()
        end_date = start_date + timedelta(days=days_ahead)

        # Get vaccinations due in the next X days
        vaccinations = supabase.table('vaccinations').select(
            'vax_id, patient_id, vaccine_name, next_dose_due'
        ).gte('next_dose_due', start_date.isoformat()).lte('next_dose_due', end_date.isoformat()).execute()

        created_notifications = []
        for vaccination in vaccinations.data:
            # Check if notification already exists for this vaccination
            existing = supabase.table('notifications').select('notification_id').eq(
                'notification_type', 'vaccination_due'
            ).eq('related_patient_id', vaccination['patient_id']).contains(
                'metadata', {'vaccine_name': vaccination['vaccine_name']}
            ).gte('created_at', (datetime.utcnow() - timedelta(days=7)).isoformat()).execute()

            if not existing.data:
                # Create notification
                result = create_vaccination_due_notification(
                    patient_id=vaccination['patient_id'],
                    vaccine_name=vaccination['vaccine_name'],
                    due_date=vaccination['next_dose_due']
                )
                if result:
                    created_notifications.extend(result)

        return created_notifications

    except Exception as e:
        print(f"Error checking vaccination reminders: {e}")
        return []


def check_and_create_appointment_reminders(hours_ahead: int = 24):
    """
    Check for upcoming appointments and create reminders

    Args:
        hours_ahead: Number of hours to look ahead for appointments
    """
    try:
        supabase = supabase_service_role_client()

        # Calculate time range
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=hours_ahead)

        # Get appointments in the next X hours
        appointments = supabase.table('appointments').select(
            'appointment_id, appointment_date, scheduled_by'
        ).gte('appointment_date', start_time.isoformat()).lte(
            'appointment_date', end_time.isoformat()
        ).in_('status', ['scheduled', 'confirmed']).execute()

        created_notifications = []
        for appointment in appointments.data:
            # Check if notification already exists for this appointment
            existing = supabase.table('notifications').select('notification_id').eq(
                'notification_type', 'upcoming_appointment'
            ).eq('related_appointment_id', appointment['appointment_id']).gte(
                'created_at', (datetime.utcnow() - timedelta(hours=12)).isoformat()
            ).execute()

            if not existing.data:
                # Create notification
                result = create_upcoming_appointment_notification(appointment['appointment_id'])
                if result:
                    created_notifications.extend(result if isinstance(result, list) else [result])

        return created_notifications

    except Exception as e:
        print(f"Error checking appointment reminders: {e}")
        return []


def cleanup_expired_notifications():
    """Clean up expired and old archived notifications"""
    try:
        supabase = supabase_service_role_client()

        # Delete expired notifications
        supabase.table('notifications').delete().lt('expires_at', datetime.utcnow().isoformat()).execute()

        # Delete old archived notifications (older than 30 days)
        old_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
        supabase.table('notifications').delete().eq('is_archived', True).lt('archived_at', old_date).execute()

        return True

    except Exception as e:
        print(f"Error cleaning up notifications: {e}")
        return False
