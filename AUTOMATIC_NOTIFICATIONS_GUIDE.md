# Automatic Notification System - Implementation Guide

## 🎯 Overview

KEEPSAKE now uses **database triggers** to automatically create notifications, eliminating the need for manual notification creation in the backend. This approach is more reliable, efficient, and ensures notifications are never missed.

## 📋 Table of Contents

1. [How It Works](#how-it-works)
2. [Migration Setup](#migration-setup)
3. [What Changed](#what-changed)
4. [Automatic Notifications](#automatic-notifications)
5. [Scheduled Jobs](#scheduled-jobs)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 How It Works

### Old System (Manual) ❌
```python
# Backend code manually creates notifications
def create_appointment(data):
    appointment = create_appointment_in_db(data)
    create_appointment_reminder(appointment.id)  # Manual call
    return appointment
```

**Problems:**
- Forgot to call notification function → No notification
- Error in notification creation → Notification lost
- Backend crashes → Notifications not created
- Code duplication across endpoints

### New System (Automatic) ✅
```sql
-- Database trigger automatically creates notifications
CREATE TRIGGER trigger_appointment_reminder_on_insert
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_reminder_notification();
```

**Benefits:**
- ✅ **Never forget** - Triggers always fire
- ✅ **More reliable** - Database-level guarantee
- ✅ **Less code** - No manual calls needed
- ✅ **Consistent** - Same logic everywhere
- ✅ **Atomic** - Part of the database transaction

---

## 🚀 Migration Setup

### Step 1: Apply Migrations

#### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of these files **in order**:

   **First:** `server/migrations/create_qr_access_logs_table.sql`
   ```sql
   -- Creates qr_access_logs table for tracking QR code access
   ```

   **Second:** `server/migrations/create_automatic_notifications_system.sql`
   ```sql
   -- Creates all automatic notification functions and triggers
   ```

4. Click **Run** for each SQL file

#### Option B: Using psql

```bash
# Make sure you have your DATABASE_URL environment variable set
psql $DATABASE_URL -f server/migrations/create_qr_access_logs_table.sql
psql $DATABASE_URL -f server/migrations/create_automatic_notifications_system.sql
```

#### Option C: Using Python Script

```bash
cd server/migrations
python apply_automatic_notifications.py
```

This will guide you through the migration process.

### Step 2: Verify Migration

Run this SQL query to verify triggers are created:

```sql
-- Check if triggers exist
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_%notification%'
ORDER BY event_object_table, trigger_name;
```

You should see:
- `trigger_appointment_reminder_on_insert`
- `trigger_appointment_reminder_on_update`
- `trigger_qr_access_alert`
- `trigger_vaccination_due_on_insert`
- `trigger_vaccination_due_on_update`

### Step 3: Set Up Scheduled Jobs

The system needs two scheduled jobs:

#### Job 1: Upcoming Appointments (Every Hour)

Create a scheduled job that calls:
```sql
SELECT create_upcoming_appointment_notifications();
```

**Options:**

**A) Using pg_cron (if available):**
```sql
SELECT cron.schedule(
    'upcoming-appointments',
    '0 * * * *',  -- Every hour
    'SELECT create_upcoming_appointment_notifications()'
);
```

**B) Using Python APScheduler:**

```python
# server/schedulers/notification_scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from utils.notification_utils import create_upcoming_appointment_notifications

scheduler = BackgroundScheduler()
scheduler.add_job(
    create_upcoming_appointment_notifications,
    'cron',
    hour='*'  # Every hour
)
scheduler.start()
```

**C) Using system cron:**
```bash
# Add to crontab
0 * * * * cd /path/to/server && python -c "from utils.notification_utils import create_upcoming_appointment_notifications; create_upcoming_appointment_notifications()"
```

#### Job 2: Cleanup Old Notifications (Daily at 2 AM)

Create a scheduled job that calls:
```sql
SELECT cleanup_expired_notifications();
```

**Options:**

**A) Using pg_cron:**
```sql
SELECT cron.schedule(
    'cleanup-notifications',
    '0 2 * * *',  -- Daily at 2 AM
    'SELECT cleanup_expired_notifications()'
);
```

**B) Using Python APScheduler:**
```python
from utils.notification_utils import cleanup_expired_notifications

scheduler.add_job(
    cleanup_expired_notifications,
    'cron',
    hour=2,
    minute=0
)
```

---

## 🔄 What Changed

### Backend Changes

#### Before: Manual Notification Creation ❌

```python
# server/routes/appointment_routes.py
from utils.notification_utils import create_appointment_reminder

@app.route('/appointments', methods=['POST'])
def create_appointment():
    # Create appointment
    appointment = create_appointment_in_db(data)

    # Manual notification call
    create_appointment_reminder(appointment.id, minutes_before=60)

    return jsonify(appointment)
```

#### After: No Manual Calls Needed ✅

```python
# server/routes/appointment_routes.py
# No notification imports needed!

@app.route('/appointments', methods=['POST'])
def create_appointment():
    # Create appointment
    appointment = create_appointment_in_db(data)

    # Notification automatically created by database trigger!

    return jsonify(appointment)
```

### Deprecated Functions

These functions are now **deprecated** and do nothing:

```python
# ❌ DEPRECATED - Don't use these
from utils.notification_utils import (
    create_appointment_reminder,  # Automatic via trigger
    create_qr_access_alert,  # Automatic via trigger
    create_vaccination_due_notification,  # Automatic via trigger
)
```

### New Functions (For Scheduled Jobs Only)

```python
# ✅ Use these for scheduled jobs
from utils.notification_utils import (
    create_upcoming_appointment_notifications,  # Call hourly
    cleanup_expired_notifications,  # Call daily
    check_and_create_vaccination_reminders,  # Backup check
)
```

---

## 📬 Automatic Notifications

### 1. Appointment Reminder Notifications

**Triggered by:** Creating or updating appointments

**When:** Automatically created when:
- New appointment is inserted
- Appointment date/time is updated
- Appointment status changes to 'confirmed'

**Database Function:** `create_appointment_reminder_notification()`

**Example:**
```python
# Backend code - Just create the appointment
appointment = {
    'patient_id': 'patient-uuid',
    'appointment_date': '2025-10-10 14:00:00',
    'status': 'confirmed',
    'facility_id': 'facility-uuid'
}
supabase.table('appointments').insert(appointment).execute()

# ✅ Notification automatically created by trigger!
# No need to call create_appointment_reminder()
```

**Notification Details:**
- **Type:** `appointment_reminder`
- **Title:** "Upcoming Appointment Reminder"
- **Message:** "Reminder: {patient_name} has an appointment on {date} at {time}"
- **Priority:** `high` if < 2 hours away, else `normal`
- **Expires:** 1 day after appointment

### 2. QR Access Alert Notifications

**Triggered by:** Accessing patient records via QR code

**When:** Automatically created when:
- QR code is scanned
- Record is inserted into `qr_access_logs` table

**Database Function:** `create_qr_access_alert_notification()`

**Example:**
```python
# Backend code - Just log the QR access
access_log = {
    'qr_id': 'qr-uuid',
    'patient_id': 'patient-uuid',
    'accessed_by': current_user_id,
    'facility_id': 'facility-uuid',
    'accessed_at': datetime.now()
}
supabase.table('qr_access_logs').insert(access_log).execute()

# ✅ Notification automatically created by trigger!
# No need to call create_qr_access_alert()
```

**Notification Details:**
- **Type:** `qr_access_alert`
- **Title:** "Medical Record Accessed"
- **Message:** "{accessor_name} accessed {patient_name}'s medical records via QR code on {date}"
- **Priority:** `high`
- **Sent to:** Patient's parent/guardian

### 3. Vaccination Due Notifications

**Triggered by:** Creating or updating vaccination schedules

**When:** Automatically created when:
- New vaccination is scheduled
- Vaccination due date is updated
- Vaccination is within reminder window (default 7 days)

**Database Function:** `create_vaccination_due_notification()`

**Example:**
```python
# Backend code - Just create the vaccination record
vaccination = {
    'patient_id': 'patient-uuid',
    'vaccine_name': 'MMR Vaccine',
    'due_date': '2025-10-15',
    'status': 'scheduled'
}
supabase.table('vaccinations').insert(vaccination).execute()

# ✅ Notification automatically created by trigger!
# No need to call create_vaccination_due_notification()
```

**Notification Details:**
- **Type:** `vaccination_due`
- **Title:** "Vaccination Due Soon"
- **Message:** "{patient_name}'s {vaccine_name} vaccination is due on {date}"
- **Priority:** `high` if < 3 days away, else `normal`
- **Expires:** 7 days after due date

### 4. Upcoming Appointment Notifications (24 Hours)

**Triggered by:** Scheduled job (runs hourly)

**When:** Created for appointments happening in 24-25 hours

**Database Function:** `create_upcoming_appointment_notifications()`

**Setup:**
```python
# In your scheduler
scheduler.add_job(
    create_upcoming_appointment_notifications,
    'cron',
    hour='*'  # Every hour
)
```

**Notification Details:**
- **Type:** `upcoming_appointment`
- **Title:** "Appointment Tomorrow"
- **Message:** "{patient_name} has an appointment tomorrow at {time}"
- **Priority:** `normal`

---

## ⏰ Scheduled Jobs

### Required Scheduled Jobs

| Job | Function | Frequency | Purpose |
|-----|----------|-----------|---------|
| Upcoming Appointments | `create_upcoming_appointment_notifications()` | Every hour | Create 24-hour reminders |
| Cleanup | `cleanup_expired_notifications()` | Daily at 2 AM | Remove old notifications |

### Optional Scheduled Job

| Job | Function | Frequency | Purpose |
|-----|----------|-----------|---------|
| Vaccination Check | `check_and_create_vaccination_reminders()` | Every 6 hours | Backup vaccination check |

### Scheduler Setup Options

#### Option 1: Python APScheduler (Recommended)

```python
# server/schedulers/notification_scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from utils.notification_utils import (
    create_upcoming_appointment_notifications,
    cleanup_expired_notifications
)

def start_notification_scheduler():
    scheduler = BackgroundScheduler()

    # Upcoming appointments - every hour
    scheduler.add_job(
        create_upcoming_appointment_notifications,
        'cron',
        hour='*',
        id='upcoming_appointments'
    )

    # Cleanup - daily at 2 AM
    scheduler.add_job(
        cleanup_expired_notifications,
        'cron',
        hour=2,
        minute=0,
        id='cleanup_notifications'
    )

    scheduler.start()
    print("✅ Notification scheduler started")

    return scheduler

# In main.py
from schedulers.notification_scheduler import start_notification_scheduler

if __name__ == '__main__':
    scheduler = start_notification_scheduler()
    app.run()
```

#### Option 2: pg_cron (PostgreSQL Extension)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule upcoming appointments (every hour)
SELECT cron.schedule(
    'upcoming-appointments',
    '0 * * * *',
    'SELECT create_upcoming_appointment_notifications()'
);

-- Schedule cleanup (daily at 2 AM)
SELECT cron.schedule(
    'cleanup-notifications',
    '0 2 * * *',
    'SELECT cleanup_expired_notifications()'
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

#### Option 3: System Cron

```bash
# Edit crontab
crontab -e

# Add these lines:
# Upcoming appointments every hour
0 * * * * cd /path/to/server && python -c "from utils.notification_utils import create_upcoming_appointment_notifications; create_upcoming_appointment_notifications()"

# Cleanup daily at 2 AM
0 2 * * * cd /path/to/server && python -c "from utils.notification_utils import cleanup_expired_notifications; cleanup_expired_notifications()"
```

---

## 🧪 Testing

### Test 1: Appointment Reminder

```python
# Create an appointment in the future
appointment = supabase_service_role_client().table('appointments').insert({
    'patient_id': 'test-patient-uuid',
    'appointment_date': (datetime.now() + timedelta(hours=2)).isoformat(),
    'status': 'confirmed',
    'facility_id': 'test-facility-uuid'
}).execute()

# Check if notification was created
notifications = supabase_service_role_client().table('notifications').select('*').eq(
    'notification_type', 'appointment_reminder'
).eq('related_appointment_id', appointment.data[0]['appointment_id']).execute()

print(f"✅ Notification created: {len(notifications.data) > 0}")
```

### Test 2: QR Access Alert

```python
# Log a QR access
access_log = supabase_service_role_client().table('qr_access_logs').insert({
    'qr_id': 'test-qr-uuid',
    'patient_id': 'test-patient-uuid',
    'accessed_by': 'test-user-uuid',
    'facility_id': 'test-facility-uuid'
}).execute()

# Check if notification was created
notifications = supabase_service_role_client().table('notifications').select('*').eq(
    'notification_type', 'qr_access_alert'
).eq('related_qr_id', access_log.data[0]['qr_id']).execute()

print(f"✅ QR alert created: {len(notifications.data) > 0}")
```

### Test 3: Vaccination Due

```python
# Create a vaccination due in 5 days
vaccination = supabase_service_role_client().table('vaccinations').insert({
    'patient_id': 'test-patient-uuid',
    'vaccine_name': 'MMR Vaccine',
    'due_date': (datetime.now() + timedelta(days=5)).date().isoformat(),
    'status': 'scheduled'
}).execute()

# Check if notification was created
notifications = supabase_service_role_client().table('notifications').select('*').eq(
    'notification_type', 'vaccination_due'
).eq('related_patient_id', vaccination.data[0]['patient_id']).execute()

print(f"✅ Vaccination reminder created: {len(notifications.data) > 0}")
```

### Test 4: Scheduled Jobs

```python
# Test upcoming appointments job
from utils.notification_utils import create_upcoming_appointment_notifications

result = create_upcoming_appointment_notifications()
print(f"✅ Upcoming appointments: {result}")

# Test cleanup job
from utils.notification_utils import cleanup_expired_notifications

result = cleanup_expired_notifications()
print(f"✅ Cleanup: {result}")
```

---

## 🔍 Troubleshooting

### Issue: Notifications Not Being Created

**Check 1: Verify triggers exist**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%notification%';
```

**Check 2: Check trigger function exists**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%notification%'
AND routine_type = 'FUNCTION';
```

**Check 3: Test trigger manually**
```sql
-- Test appointment reminder trigger
INSERT INTO appointments (patient_id, appointment_date, status, facility_id)
VALUES ('test-uuid', NOW() + INTERVAL '2 hours', 'confirmed', 'facility-uuid');

-- Check notifications table
SELECT * FROM notifications
WHERE notification_type = 'appointment_reminder'
ORDER BY created_at DESC
LIMIT 5;
```

### Issue: User Not Receiving Notifications

**Check 1: Verify user has preferences enabled**
```sql
SELECT *
FROM notification_preferences
WHERE user_id = 'user-uuid';
```

**Check 2: Check notification was created**
```sql
SELECT *
FROM notifications
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

**Check 3: Verify RLS policies**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';

-- Should show rowsecurity = true
```

### Issue: Scheduled Jobs Not Running

**Check 1: Verify scheduler is running**
```python
# Check if APScheduler is active
from apscheduler.schedulers.background import BackgroundScheduler

print(scheduler.running)  # Should be True
print(scheduler.get_jobs())  # Should list scheduled jobs
```

**Check 2: Check job logs**
```bash
# Check server logs for job execution
tail -f /var/log/keepsake/server.log | grep "notification"
```

**Check 3: Manually trigger job**
```python
from utils.notification_utils import create_upcoming_appointment_notifications

result = create_upcoming_appointment_notifications()
print(result)
```

### Issue: Database Functions Missing

**Re-apply migration:**
```bash
psql $DATABASE_URL -f server/migrations/create_automatic_notifications_system.sql
```

### Issue: Performance Concerns

**Check trigger performance:**
```sql
-- Check how long triggers take
EXPLAIN ANALYZE
INSERT INTO appointments (patient_id, appointment_date, status, facility_id)
VALUES ('test-uuid', NOW() + INTERVAL '2 hours', 'confirmed', 'facility-uuid');
```

**Optimize if needed:**
- Add indexes on frequently queried columns
- Consider async notification creation for high-volume systems
- Batch notification creation for bulk operations

---

## 📊 Monitoring

### Check Notification Stats

```sql
-- Notifications created today by type
SELECT
    notification_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_read THEN 1 END) as read_count,
    COUNT(CASE WHEN NOT is_read THEN 1 END) as unread_count
FROM notifications
WHERE created_at >= CURRENT_DATE
GROUP BY notification_type
ORDER BY count DESC;
```

### Check Trigger Activity

```sql
-- Recent notifications created by triggers
SELECT
    notification_type,
    title,
    user_id,
    created_at
FROM notifications
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Check Scheduled Job Activity

```python
from utils.notification_utils import get_user_notification_stats

# Get stats for a user
stats = get_user_notification_stats('user-uuid')
print(stats)
# Output:
# {
#     'total': 45,
#     'unread': 5,
#     'archived': 10,
#     'by_type': {
#         'appointment_reminder': 20,
#         'qr_access_alert': 15,
#         'vaccination_due': 10
#     }
# }
```

---

## 🎓 Best Practices

### 1. Don't Manually Create Notifications

❌ **Bad:**
```python
from utils.notification_utils import create_appointment_reminder

# Create appointment
appointment = create_appointment_in_db(data)

# Manual notification call
create_appointment_reminder(appointment.id)
```

✅ **Good:**
```python
# Just create the appointment
appointment = create_appointment_in_db(data)

# Database trigger automatically creates notification
```

### 2. Trust the Database Triggers

The database triggers are reliable and will always fire. Don't add "backup" manual notification calls - this will create duplicates.

### 3. Use Scheduled Jobs for Batch Operations

For operations that need to check multiple records (like 24-hour reminders), use scheduled jobs rather than triggers.

### 4. Monitor Notification Volume

Keep an eye on notification creation rates to ensure triggers aren't creating too many notifications.

### 5. Test Thoroughly

Always test notification creation in staging before deploying to production.

---

## 🚀 Next Steps

1. ✅ Apply migrations
2. ✅ Set up scheduled jobs
3. ✅ Remove manual notification calls from backend code
4. ✅ Test all notification types
5. ✅ Monitor production notifications
6. ✅ Update team documentation

---

## 📚 Related Documentation

- `NOTIFICATION_COMPLETE.md` - Complete notification system overview
- `NOTIFICATION_INTEGRATION.md` - Frontend integration guide
- `NOTIFICATION_REFACTOR.md` - Architecture refactoring details
- `server/migrations/create_automatic_notifications_system.sql` - Database functions and triggers
- `server/utils/notification_utils.py` - Scheduled job functions

---

**Implementation Date:** 2025-10-08
**Status:** ✅ Ready for Production
**Version:** 2.0.0 (Automatic)

**🎉 Automatic notifications are now live!**
