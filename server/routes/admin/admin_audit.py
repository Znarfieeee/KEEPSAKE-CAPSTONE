from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import supabase
from datetime import datetime, timedelta

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/admin/audit-logs', methods=['GET'])
@require_auth
@require_role('admin')
def get_audit_logs():
    """Get audit logs with filtering, pagination, and search capabilities"""
    try:
        # Query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        action_type = request.args.get('action_type')  # CREATE, UPDATE, DELETE, VIEW
        table_name = request.args.get('table_name')
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        search_query = request.args.get('search')  # For searching user email/name

        # Calculate offset for pagination
        offset = (page - 1) * limit

        # Build query
        query = supabase.table("audit_logs").select(
            """
            *,
            users!audit_logs_user_id_fkey(
                user_id,
                email,
                firstname,
                lastname,
                role
            )
            """,
            count="exact"
        )

        # Apply filters
        if action_type:
            query = query.eq('action_type', action_type)

        if table_name:
            query = query.eq('table_name', table_name)

        if user_id:
            query = query.eq('user_id', user_id)

        if start_date:
            query = query.gte('action_timestamp', start_date)

        if end_date:
            # Add one day to include the entire end date
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            end_datetime = end_datetime + timedelta(days=1)
            query = query.lt('action_timestamp', end_datetime.isoformat())

        # Order by most recent first
        query = query.order('action_timestamp', desc=True)

        # Apply pagination
        query = query.range(offset, offset + limit - 1)

        # Execute query
        response = query.execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch audit logs: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch audit logs"
            }), 500

        # Get logs data
        logs = response.data

        # Get total count (before search filtering)
        total_count = response.count if hasattr(response, 'count') else len(logs)

        # Filter by search query if provided (post-filtering for user names/emails)
        # Note: This is post-filtering because Supabase doesn't support filtering on joined tables directly
        if search_query and logs:
            search_lower = search_query.lower()
            logs = [
                log for log in logs
                if (log.get('users') and (
                    search_lower in (log['users'].get('email') or '').lower() or
                    search_lower in (log['users'].get('firstname') or '').lower() or
                    search_lower in (log['users'].get('lastname') or '').lower()
                )) or search_lower in (log.get('table_name') or '').lower()
            ]
            # Update total count after filtering
            total_count = len(logs)

        return jsonify({
            "status": "success",
            "data": logs,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": (total_count + limit - 1) // limit
            }
        }), 200

    except ValueError as ve:
        current_app.logger.error(f"Invalid parameter: {str(ve)}")
        return jsonify({
            "status": "error",
            "message": "Invalid pagination parameters"
        }), 400
    except Exception as e:
        current_app.logger.error(f"Error fetching audit logs: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching audit logs: {str(e)}"
        }), 500

@audit_bp.route('/admin/audit-logs/stats', methods=['GET'])
@require_auth
@require_role('admin')
def get_audit_stats():
    """Get audit log statistics for dashboard"""
    try:
        # Get total count of all audit logs
        total_response = supabase.table('audit_logs').select('*', count='exact', head=True).execute()
        total_count = total_response.count if hasattr(total_response, 'count') else 0

        # Get counts by action type (all time)
        action_stats = {}
        for action in ['CREATE', 'UPDATE', 'DELETE', 'VIEW']:
            response = supabase.table('audit_logs').select('*', count='exact', head=True).eq('action_type', action).execute()
            action_stats[action.lower()] = response.count if hasattr(response, 'count') else 0

        # Get recent activity count (last 24 hours)
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        recent_response = supabase.table('audit_logs').select('*', count='exact', head=True).gte('action_timestamp', yesterday).execute()
        recent_count = recent_response.count if hasattr(recent_response, 'count') else 0

        # Get most active tables (top 5)
        table_response = supabase.table('audit_logs').select('table_name').execute()
        table_counts = {}
        if table_response.data:
            for log in table_response.data:
                table_name = log.get('table_name')
                if table_name:
                    table_counts[table_name] = table_counts.get(table_name, 0) + 1

        most_active_tables = sorted(
            [{"table": k, "count": v} for k, v in table_counts.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:5]

        return jsonify({
            "status": "success",
            "data": {
                "total_actions": total_count,
                "action_stats": action_stats,
                "recent_activity_24h": recent_count,
                "most_active_tables": most_active_tables
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching audit stats: {str(e)}")
        return jsonify({
            "status": "success",
            "data": {
                "total_actions": 0,
                "action_stats": {"create": 0, "update": 0, "delete": 0, "view": 0},
                "recent_activity_24h": 0,
                "most_active_tables": []
            }
        }), 200

@audit_bp.route('/admin/audit-logs/<log_id>', methods=['GET'])
@require_auth
@require_role('admin')
def get_audit_log_detail(log_id):
    """Get detailed information for a specific audit log entry"""
    try:
        response = supabase.table('audit_logs').select(
            '''
            *,
            users!audit_logs_user_id_fkey(
                user_id,
                email,
                firstname,
                lastname,
                role
            )
            '''
        ).eq('log_id', log_id).execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch audit log detail: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch audit log detail"
            }), 500

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "Audit log not found"
            }), 404

        return jsonify({
            "status": "success",
            "data": response.data[0]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching audit log detail {log_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching audit log detail: {str(e)}"
        }), 500

@audit_bp.route('/admin/audit-logs/clear', methods=['DELETE'])
@require_auth
@require_role('admin')
def clear_audit_logs():
    """Clear all audit logs (admin only)"""
    try:
        # Get count before deletion for confirmation
        count_response = supabase.table('audit_logs').select('*', count='exact', head=True).execute()
        total_count = count_response.count if hasattr(count_response, 'count') else 0

        # Delete all audit logs
        delete_response = supabase.table('audit_logs').delete().neq('log_id', '00000000-0000-0000-0000-000000000000').execute()

        if getattr(delete_response, 'error', None):
            current_app.logger.error(f"Failed to clear audit logs: {delete_response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to clear audit logs"
            }), 500

        current_app.logger.warning(f"Admin cleared all audit logs ({total_count} records deleted)")

        return jsonify({
            "status": "success",
            "message": f"Successfully cleared {total_count} audit log entries",
            "deleted_count": total_count
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error clearing audit logs: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while clearing audit logs: {str(e)}"
        }), 500

@audit_bp.route('/admin/audit-logs/tables', methods=['GET'])
@require_auth
@require_role('admin')
def get_auditable_tables():
    """Get list of tables that have audit logs"""
    try:
        # Query distinct table names from audit_logs
        response = supabase.table('audit_logs').select('table_name').execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch table names: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch table names"
            }), 500

        # Extract unique table names and sort them
        table_names = set()
        if response.data:
            for log in response.data:
                if log.get('table_name'):
                    table_names.add(log.get('table_name'))

        sorted_tables = sorted(list(table_names))

        return jsonify({
            "status": "success",
            "data": sorted_tables
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching table names: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching table names: {str(e)}"
        }), 500

@audit_bp.route('/admin/audit-logs/export', methods=['GET'])
@require_auth
@require_role('admin')
def export_audit_logs():
    """Export audit logs to CSV format"""
    try:
        from flask import make_response
        import csv
        from io import StringIO

        # Get query parameters for filtering
        action_type = request.args.get('action_type')
        table_name = request.args.get('table_name')
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Build query
        query = supabase.table('audit_logs').select(
            '''
            log_id,
            action_timestamp,
            action_type,
            table_name,
            record_id,
            ip_address,
            session_id,
            old_values,
            new_values,
            users!audit_logs_user_id_fkey(
                user_id,
                email,
                firstname,
                lastname,
                role
            )
            '''
        )

        # Apply filters
        if action_type:
            query = query.eq('action_type', action_type)
        if table_name:
            query = query.eq('table_name', table_name)
        if user_id:
            query = query.eq('user_id', user_id)
        if start_date:
            query = query.gte('action_timestamp', start_date)
        if end_date:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            end_datetime = end_datetime + timedelta(days=1)
            query = query.lt('action_timestamp', end_datetime.isoformat())

        # Order by most recent first
        query = query.order('action_timestamp', desc=True)

        # Execute query
        response = query.execute()

        if getattr(response, 'error', None):
            current_app.logger.error(f"Failed to fetch audit logs for export: {response.error}")
            return jsonify({
                "status": "error",
                "message": "Failed to fetch audit logs for export"
            }), 500

        logs = response.data

        # Create CSV
        si = StringIO()
        fieldnames = [
            'Log ID', 'Timestamp', 'User Email', 'User Name', 'User Role',
            'Action Type', 'Table Name', 'Record ID', 'IP Address',
            'Session ID', 'Old Values', 'New Values'
        ]
        writer = csv.DictWriter(si, fieldnames=fieldnames)
        writer.writeheader()

        for log in logs:
            user = log.get('users', {}) or {}
            writer.writerow({
                'Log ID': log.get('log_id', ''),
                'Timestamp': log.get('action_timestamp', ''),
                'User Email': user.get('email', ''),
                'User Name': f"{user.get('firstname', '')} {user.get('lastname', '')}".strip(),
                'User Role': user.get('role', ''),
                'Action Type': log.get('action_type', ''),
                'Table Name': log.get('table_name', ''),
                'Record ID': log.get('record_id', ''),
                'IP Address': log.get('ip_address', ''),
                'Session ID': log.get('session_id', ''),
                'Old Values': str(log.get('old_values', '')),
                'New Values': str(log.get('new_values', ''))
            })

        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = f"attachment; filename=audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        output.headers["Content-type"] = "text/csv"

        current_app.logger.info(f"Admin exported {len(logs)} audit log entries")

        return output

    except Exception as e:
        current_app.logger.error(f"Error exporting audit logs: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while exporting audit logs: {str(e)}"
        }), 500
