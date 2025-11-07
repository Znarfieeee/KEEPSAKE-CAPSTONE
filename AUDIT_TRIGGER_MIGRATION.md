# Notification Audit Logging Migration

## Overview

The notification system's audit logging has been migrated from manual backend logging to automatic database triggers for improved reliability and consistency.

## Changes Made

### 1. Database Migration ✅

**Migration:** `add_notification_audit_triggers`

**Created Functions:**
- `audit_notification_changes()` - Automatically logs all notification operations
- `audit_system_announcement_changes()` - Automatically logs system announcement operations

**Created Triggers:**
- `audit_notification_changes_trigger` - Fires on INSERT/UPDATE/DELETE for `notifications` table
- `audit_system_announcement_changes_trigger` - Fires on INSERT/UPDATE/DELETE for `system_announcements` table

### 2. Backend Code Cleanup ✅

**File:** `server/routes/notification_routes.py`

**Removed:**
- Manual `log_audit()` import
- Manual `log_audit()` function call in `create_system_announcement()`

**Result:** Audit logging is now fully automatic via database triggers

## How It Works

### Automatic Audit Logging

When any operation occurs on the `notifications` or `system_announcements` tables, the database automatically:

1. **Captures the operation type** (INSERT/UPDATE/DELETE)
2. **Extracts relevant data**:
   - User ID (who performed the action)
   - Record ID (which notification/announcement)
   - Patient ID (if applicable)
   - Old/new values (what changed)
   - IP address (if available via `inet_client_addr()`)
   - Session ID (if set via `current_setting('app.session_id')`)

3. **Inserts audit log** into `audit_logs` table

### Audit Log Structure

```sql
INSERT INTO public.audit_logs (
    user_id,           -- Who performed the action
    action_type,       -- CREATE, UPDATE, or DELETE
    table_name,        -- 'notifications' or 'system_announcements'
    record_id,         -- UUID of the affected record
    patient_id,        -- Patient ID (for notifications)
    old_values,        -- JSONB of old values (UPDATE/DELETE)
    new_values,        -- JSONB of new values (INSERT/UPDATE)
    ip_address,        -- IP address of client
    session_id         -- Session ID
)
```

### Logged Events

#### Notifications Table
- **INSERT**: Logs notification creation with type, title, priority, facility_id
- **UPDATE**: Logs changes to is_read, is_archived, read_at, archived_at
- **DELETE**: Logs notification deletion with type, title, read/archive status

#### System Announcements Table
- **INSERT**: Logs announcement creation with title, priority, target roles/facilities
- **UPDATE**: Logs changes to is_active and title
- **DELETE**: Logs announcement deletion with title, priority, active status

## Benefits

### 1. **Reliability**
- Audit logs cannot be bypassed or forgotten
- All operations are automatically logged
- No risk of developer error

### 2. **Consistency**
- Uniform audit format across all notification operations
- Same logging regardless of which API endpoint is used
- Direct database operations are also logged

### 3. **Performance**
- Single database transaction includes both operation and audit
- No extra network round trips
- Atomic operation (audit log or entire operation fails)

### 4. **Simplicity**
- Less backend code to maintain
- No need to remember to call `log_audit()`
- Automatic for all notification operations

### 5. **Security**
- Audit trigger runs with SECURITY DEFINER
- Cannot be disabled without database permissions
- Tamper-resistant logging

## Migration Impact

### No Breaking Changes ✅

- All existing functionality remains the same
- API endpoints work identically
- Frontend code requires no changes
- Audit logs continue to populate `audit_logs` table

### Improved Reliability ✅

- Previously, only system announcement creation was manually audited
- Now ALL notification and announcement operations are audited:
  - Notification creation
  - Notification read/unread
  - Notification archiving
  - Notification deletion
  - Announcement creation
  - Announcement updates
  - Announcement deletion

## Testing

### Verify Audit Logging

```sql
-- Test notification creation audit
INSERT INTO notifications (user_id, notification_type, title, message)
VALUES ('user-uuid', 'system_announcement', 'Test', 'Test message');

-- Check audit log was created
SELECT * FROM audit_logs
WHERE table_name = 'notifications'
ORDER BY action_timestamp DESC
LIMIT 1;

-- Test notification update audit
UPDATE notifications
SET is_read = true
WHERE notification_id = 'notification-uuid';

-- Check audit log
SELECT * FROM audit_logs
WHERE table_name = 'notifications'
AND action_type = 'UPDATE'
ORDER BY action_timestamp DESC
LIMIT 1;

-- Test notification deletion audit
DELETE FROM notifications
WHERE notification_id = 'notification-uuid';

-- Check audit log
SELECT * FROM audit_logs
WHERE table_name = 'notifications'
AND action_type = 'DELETE'
ORDER BY action_timestamp DESC
LIMIT 1;
```

### Verify Backend Integration

```bash
# Create system announcement via API
curl -X POST http://localhost:5000/api/notifications/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "message": "Testing audit logging",
    "priority": "normal"
  }'

# Check audit log in database
SELECT * FROM audit_logs
WHERE table_name = 'system_announcements'
ORDER BY action_timestamp DESC
LIMIT 1;
```

## Rollback Plan

If needed, the migration can be rolled back:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS audit_notification_changes_trigger ON public.notifications;
DROP TRIGGER IF EXISTS audit_system_announcement_changes_trigger ON public.system_announcements;

-- Drop functions
DROP FUNCTION IF EXISTS audit_notification_changes();
DROP FUNCTION IF EXISTS audit_system_announcement_changes();
```

Then restore manual `log_audit()` calls in backend code.

## Future Enhancements

- [ ] Add session context setting in Flask middleware
- [ ] Capture more detailed change information
- [ ] Add audit log retention policies
- [ ] Create audit log reporting views
- [ ] Add audit log search/filter functionality

## Technical Notes

### IP Address Capture

The trigger uses `inet_client_addr()` which returns the IP address of the current client. This works when:
- Connection is made via TCP/IP
- Client is not localhost (returns NULL for local connections)

For local development, IP may be NULL. In production, this will capture real client IPs.

### Session ID Capture

The trigger uses `current_setting('app.session_id', true)` to capture session ID. This requires:
- Backend sets session context: `SET LOCAL app.session_id = 'session-id';`
- Missing by default (returns NULL)
- Can be added to Flask middleware for future enhancement

### Security Definer

Triggers run with `SECURITY DEFINER` to ensure they have permissions to write to `audit_logs` even when RLS policies might restrict the user's direct access.

---

**Migration Date:** 2025-10-08
**Status:** ✅ Complete
**Database Migration:** `add_notification_audit_triggers`
**Backend Changes:** `server/routes/notification_routes.py`
