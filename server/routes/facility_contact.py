"""
Facility Contact Routes
Handles facility contact form submissions and admin management of contact requests
"""

from flask import Blueprint, jsonify, request, current_app
from config.settings import sr_client
from utils.sanitize import sanitize_request_data
from utils.access_control import require_auth, require_role
import re

facility_contact_bp = Blueprint('facility_contact', __name__)

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validate_email(email):
    """Validate email format"""
    return EMAIL_REGEX.match(email) is not None


def validate_phone(phone):
    """Validate phone format (Philippine format)"""
    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    # Check if it's a valid length (10-13 digits)
    return len(cleaned) >= 10 and len(cleaned) <= 13 and cleaned.isdigit()


@facility_contact_bp.route('/facility-contact', methods=['POST'])
def submit_facility_contact():
    """
    Submit facility contact request (public endpoint - no authentication required)

    Request Body:
        facility_name (str, required): Name of the healthcare facility
        contact_person (str, required): Name of the contact person
        email (str, required): Email address
        phone (str, required): Phone number
        plan_interest (str, optional): Interested plan (standard/premium/enterprise)
        message (str, optional): Additional message

    Returns:
        201: Request submitted successfully
        400: Validation error or missing required fields
        500: Server error
    """
    try:
        data = sanitize_request_data(request.json or {})

        # Validate required fields
        required_fields = ['facility_name', 'contact_person', 'email', 'phone']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Validate email format
        if not validate_email(data['email']):
            return jsonify({
                "status": "error",
                "message": "Invalid email format"
            }), 400

        # Validate phone format
        if not validate_phone(data['phone']):
            return jsonify({
                "status": "error",
                "message": "Invalid phone number format"
            }), 400

        # Validate plan_interest if provided
        valid_plans = ['standard', 'premium', 'enterprise']
        plan_interest = data.get('plan_interest', '').lower()
        if plan_interest and plan_interest not in valid_plans:
            return jsonify({
                "status": "error",
                "message": f"Invalid plan_interest. Must be one of: {', '.join(valid_plans)}"
            }), 400

        # Prepare contact request data
        contact_data = {
            'facility_name': data['facility_name'].strip(),
            'contact_person': data['contact_person'].strip(),
            'email': data['email'].strip().lower(),
            'phone': data['phone'].strip(),
            'plan_interest': plan_interest if plan_interest else None,
            'message': data.get('message', '').strip() if data.get('message') else None,
            'status': 'pending'
        }

        # Insert into database
        resp = sr_client.table('facility_contact_requests')\
            .insert(contact_data)\
            .execute()

        if resp.data:
            current_app.logger.info(f"Facility contact request submitted: {data['facility_name']}")

            # TODO: Send email notification to admin team
            # This would require email sending functionality
            try:
                send_facility_contact_notification(contact_data)
            except Exception as email_error:
                current_app.logger.error(f"Failed to send notification email: {email_error}")

            return jsonify({
                "status": "success",
                "message": "Thank you for your interest! Our team will contact you within 24 hours.",
                "data": {
                    "request_id": resp.data[0].get('request_id')
                }
            }), 201
        else:
            raise Exception("Failed to insert contact request")

    except Exception as e:
        current_app.logger.error(f"Error submitting facility contact: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to submit request. Please try again later."
        }), 500


@facility_contact_bp.route('/admin/facility-contacts', methods=['GET'])
@require_auth
@require_role('admin')
def list_facility_contacts():
    """
    List all facility contact requests (admin only)

    Query Parameters:
        status (str, optional): Filter by status (pending/contacted/converted/declined)
        plan_interest (str, optional): Filter by interested plan
        page (int, optional): Page number (default: 1)
        per_page (int, optional): Results per page (default: 50, max: 100)

    Returns:
        200: List of contact requests
        500: Server error
    """
    try:
        # Get query parameters
        status = request.args.get('status')
        plan_interest = request.args.get('plan_interest')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)

        # Build query
        query = sr_client.table('facility_contact_requests').select('*')

        # Apply filters
        if status:
            query = query.eq('status', status)
        if plan_interest:
            query = query.eq('plan_interest', plan_interest)

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.order('created_at', desc=True)\
            .range(offset, offset + per_page - 1)

        # Execute query
        resp = query.execute()

        # Get total count (for pagination)
        count_query = sr_client.table('facility_contact_requests').select('request_id', count='exact')
        if status:
            count_query = count_query.eq('status', status)
        if plan_interest:
            count_query = count_query.eq('plan_interest', plan_interest)
        count_resp = count_query.execute()

        total_count = count_resp.count if hasattr(count_resp, 'count') else len(resp.data)

        return jsonify({
            "status": "success",
            "data": resp.data or [],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "total_pages": (total_count + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching facility contacts: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch contact requests"
        }), 500


@facility_contact_bp.route('/admin/facility-contacts/<request_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_facility_contact(request_id):
    """
    Get single facility contact request details (admin only)

    Returns:
        200: Contact request details
        404: Contact request not found
        500: Server error
    """
    try:
        resp = sr_client.table('facility_contact_requests')\
            .select('*')\
            .eq('request_id', request_id)\
            .execute()

        if resp.data and len(resp.data) > 0:
            return jsonify({
                "status": "success",
                "data": resp.data[0]
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Contact request not found"
            }), 404

    except Exception as e:
        current_app.logger.error(f"Error fetching facility contact: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch contact request"
        }), 500


@facility_contact_bp.route('/admin/facility-contacts/<request_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_facility_contact(request_id):
    """
    Update facility contact request (admin only)

    Request Body:
        status (str, optional): New status (pending/contacted/converted/declined)
        notes (str, optional): Admin notes
        contacted_by (str, optional): User ID of admin who contacted

    Returns:
        200: Update successful
        404: Contact request not found
        500: Server error
    """
    try:
        data = sanitize_request_data(request.json or {})
        current_user = getattr(request, 'current_user', {})
        admin_id = current_user.get('id')

        # Prepare update data
        update_data = {}

        if 'status' in data:
            valid_statuses = ['pending', 'contacted', 'converted', 'declined']
            if data['status'] not in valid_statuses:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                }), 400
            update_data['status'] = data['status']

        if 'notes' in data:
            update_data['notes'] = data['notes']

        # Auto-set contacted_at and contacted_by if status is being changed to 'contacted'
        if data.get('status') == 'contacted':
            from datetime import datetime, timezone
            update_data['contacted_at'] = datetime.now(timezone.utc).isoformat()
            update_data['contacted_by'] = admin_id

        if not update_data:
            return jsonify({
                "status": "error",
                "message": "No valid fields to update"
            }), 400

        # Update in database
        resp = sr_client.table('facility_contact_requests')\
            .update(update_data)\
            .eq('request_id', request_id)\
            .execute()

        if resp.data and len(resp.data) > 0:
            current_app.logger.info(f"Facility contact request {request_id} updated by admin {admin_id}")
            return jsonify({
                "status": "success",
                "message": "Contact request updated successfully",
                "data": resp.data[0]
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Contact request not found"
            }), 404

    except Exception as e:
        current_app.logger.error(f"Error updating facility contact: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to update contact request"
        }), 500


@facility_contact_bp.route('/admin/facility-contacts/<request_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_facility_contact(request_id):
    """
    Delete facility contact request (admin only)

    Returns:
        200: Deletion successful
        404: Contact request not found
        500: Server error
    """
    try:
        resp = sr_client.table('facility_contact_requests')\
            .delete()\
            .eq('request_id', request_id)\
            .execute()

        if resp.data and len(resp.data) > 0:
            current_app.logger.info(f"Facility contact request {request_id} deleted")
            return jsonify({
                "status": "success",
                "message": "Contact request deleted successfully"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Contact request not found"
            }), 404

    except Exception as e:
        current_app.logger.error(f"Error deleting facility contact: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to delete contact request"
        }), 500


def send_facility_contact_notification(contact_data):
    """
    Send email notification to admin team about new facility contact request

    Args:
        contact_data (dict): Contact request data

    Note:
        This is a placeholder function. Implement email sending using your email service.
    """
    # TODO: Implement email sending
    # This could use:
    # - Flask-Mail
    # - SendGrid
    # - AWS SES
    # - Supabase Email (if configured)

    subject = f"New Facility Inquiry: {contact_data['facility_name']}"
    body = f"""
    New facility contact request received:

    Facility Name: {contact_data['facility_name']}
    Contact Person: {contact_data['contact_person']}
    Email: {contact_data['email']}
    Phone: {contact_data['phone']}
    Plan Interest: {contact_data.get('plan_interest', 'Not specified')}

    Message:
    {contact_data.get('message', 'No message provided')}

    Please follow up with this inquiry.

    ---
    KEEPSAKE Healthcare Management System
    """

    # Log for now (replace with actual email sending)
    current_app.logger.info(f"Email notification would be sent: {subject}")
    # TODO: Implement actual email sending here
