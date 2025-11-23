# KEEPSAKE Notification System - Implementation Summary

## Overview
The KEEPSAKE healthcare system includes a comprehensive automatic notification system that alerts parents/guardians about important events related to their patients' healthcare. All notifications are generated automatically through PostgreSQL database triggers.

## System Architecture

### Components
1. **Database Triggers**: PostgreSQL triggers that fire on INSERT/UPDATE operations
2. **PL/pgSQL Functions**: Server-side functions that create notifications
3. **Notifications Table**: Central storage for all notification records
4. **Parent Access Table**: Links patients to their parent/guardian users
5. **Real-time Updates**: Supabase real-time subscriptions for instant notification delivery
6. **Frontend Hook**: `useNotifications()` React hook for consuming notifications

### Data Flow
```
Database Event (INSERT/UPDATE)
    ↓
Trigger Fires
    ↓
PL/pgSQL Function Executes
    ↓
Notification Created in Database
    ↓
Real-time Subscription Broadcasts
    ↓
Frontend Hook Receives Update
    ↓
UI Updates Instantly
```

---

## Implemented Notification Types

### 1. Appointment Reminders
**Trigger**: `trigger_appointment_reminder`
**Function**: `create_appointment_reminder_notification()`
**Fires On**: INSERT or UPDATE of `appointments` table
**Conditions**:
- Appointment status is 'confirmed'
- Appointment is in the future
- Within reminder window (default 60 minutes before appointment)

**Recipients**: Parent/guardian of the patient
**Priority**:
- `high` - If appointment is less than 2 hours away
- `normal` - Otherwise

**Notification Details**:
- **Type**: `appointment_reminder`
- **Title**: "Upcoming Appointment"
- **Message**: "[Patient Name] has an appointment at [Facility Name] on [Date] at [Time]"
- **Action URL**: `/appointments/[appointment_id]`
- **Metadata**: Includes patient info, facility, doctor, appointment time

**Use Cases**:
- New appointment scheduled
- Appointment time updated
- Approaching appointment time

---

### 2. Vaccination Due Notifications
**Trigger**: `trigger_vaccination_reminder`
**Function**: `create_vaccination_due_notification()`
**Fires On**: INSERT or UPDATE of `vaccinations` table
**Conditions**:
- Vaccination record is not deleted (`is_deleted = false`)
- `next_dose_due` date is within reminder window
- User notification preferences allow vaccination reminders

**Recipients**: Parent/guardian of the patient
**Priority**:
- `high` - If due date is within 3 days
- `normal` - Otherwise

**Notification Details**:
- **Type**: `vaccination_due`
- **Title**: "Vaccination Due"
- **Message**: "[Patient Name]'s [Vaccine Name] vaccination is due on [Date]"
- **Action URL**: `/patients/[patient_id]/vaccinations`
- **Metadata**: Includes patient info, vaccine details, dose number, due date

**Use Cases**:
- New vaccination schedule created
- Next dose due date approaching
- Reminder for upcoming immunization

---

### 3. Patient Record Updates
**Trigger**: `trigger_patient_record_update`
**Function**: `notify_patient_record_update()`
**Fires On**: UPDATE of `patients` table
**Conditions**:
- Record timestamp changed (`updated_at` is different)
- Update performed by a user (`updated_by` is not null)

**Recipients**: Parent/guardian of the patient
**Priority**: `normal`

**Notification Details**:
- **Type**: `record_update`
- **Title**: "Medical Record Updated"
- **Message**: "[Patient Name]'s medical record was updated by [Staff Name]"
- **Action URL**: `/patients/[patient_id]`
- **Metadata**: Includes patient info, updater info, timestamp

**Use Cases**:
- Demographics updated
- Medical history modified
- Contact information changed
- Emergency contacts updated

---

### 4. New Prescription Notifications
**Trigger**: `trigger_new_prescription`
**Function**: `notify_new_prescription()`
**Fires On**: INSERT of `prescriptions` table
**Conditions**:
- New prescription created

**Recipients**: Parent/guardian of the patient
**Priority**: `high` (medical urgency)

**Notification Details**:
- **Type**: `new_prescription`
- **Title**: "New Prescription"
- **Message**: "Dr. [Doctor Name] prescribed [Medication List] for [Patient Name]"
- **Action URL**: `/patients/[patient_id]/prescriptions`
- **Metadata**: Includes prescription ID, medications, dosages, doctor info

**Use Cases**:
- Doctor writes new prescription
- Medication prescribed during visit
- Prescription renewal

**Special Features**:
- Aggregates all medications in prescription
- Displays doctor's full name
- Links directly to prescription details

---

### 5. Appointment Status Changes
**Trigger**: `trigger_appointment_status_change`
**Function**: `notify_appointment_status_change()`
**Fires On**: UPDATE of `appointments` table
**Conditions**:
- Appointment status has changed

**Recipients**: Parent/guardian of the patient
**Priority**:
- `high` - For cancellations
- `normal` - For other status changes

**Notification Details**:
- **Type**: `appointment_status_change`
- **Title**: "Appointment [Status]" (e.g., "Appointment Confirmed", "Appointment Cancelled")
- **Message**: "[Patient Name]'s appointment on [Date] has been [status]"
- **Action URL**: `/appointments/[appointment_id]`
- **Metadata**: Includes old status, new status, appointment details

**Supported Status Changes**:
- `confirmed` - Appointment confirmed by facility
- `cancelled` - Appointment cancelled
- `completed` - Appointment completed
- `rescheduled` - Appointment time changed
- `no_show` - Patient did not attend

**Use Cases**:
- Facility confirms appointment
- Doctor cancels appointment
- Appointment marked complete
- Patient no-show recorded

---

### 6. Growth Measurement Notifications
**Trigger**: `trigger_new_measurement`
**Function**: `notify_new_measurement()`
**Fires On**: INSERT of `anthropometric_measurements` table
**Conditions**:
- New measurement recorded

**Recipients**: Parent/guardian of the patient
**Priority**: `normal`

**Notification Details**:
- **Type**: `system_announcement`
- **Title**: "Growth Measurement Recorded"
- **Message**: "New growth measurements recorded for [Patient Name]"
- **Action URL**: `/patients/[patient_id]/growth`
- **Metadata**: Includes weight, height, measurement date, recorder info

**Use Cases**:
- Well-child visit measurements
- Growth tracking updates
- Height and weight recorded
- Head circumference monitoring

**Special Features**:
- Links to growth charts
- Allows parent to view trends
- Part of developmental tracking

---

### 7. Medical Document Upload Notifications
**Trigger**: `trigger_document_upload`
**Function**: `notify_document_upload()`
**Fires On**: INSERT of `medical_documents` table
**Conditions**:
- Document is not deleted (`is_deleted = false`)

**Recipients**: Parent/guardian of the patient
**Priority**: `normal`

**Notification Details**:
- **Type**: `system_announcement`
- **Title**: "New Medical Document"
- **Message**: "New [document type] document uploaded for [Patient Name]"
- **Action URL**: `/patients/[patient_id]/documents`
- **Metadata**: Includes document ID, name, type, uploader info

**Document Types**:
- Lab results
- Imaging reports
- Referral letters
- Discharge summaries
- Consent forms
- Insurance documents

**Use Cases**:
- Lab results become available
- Doctor uploads report
- Administrative documents added
- Medical records shared

---

### 8. Allergy Alert Notifications
**Trigger**: `trigger_new_allergy`
**Function**: `notify_new_allergy()`
**Fires On**: INSERT of `allergies` table
**Conditions**:
- New allergy recorded

**Recipients**: Parent/guardian of the patient
**Priority**: `urgent` (highest priority - critical safety information)

**Notification Details**:
- **Type**: `system_announcement`
- **Title**: "New Allergy Recorded"
- **Message**: "ALERT: New allergy recorded for [Patient Name] - [Allergen]"
- **Action URL**: `/patients/[patient_id]/allergies`
- **Metadata**: Includes allergen name, severity, recorder info

**Allergy Severities**:
- Mild
- Moderate
- Severe
- Life-threatening

**Use Cases**:
- New allergy discovered during visit
- Parent reports new allergy
- Adverse drug reaction documented
- Food allergy identified

**Special Features**:
- URGENT priority ensures immediate attention
- Bold "ALERT" prefix in message
- Critical for patient safety

---

## Notification Priority Levels

### Priority Hierarchy
1. **urgent** - Immediate attention required (red flag)
   - Allergy alerts
   - Critical medical information

2. **high** - Important but not immediately critical (orange)
   - New prescriptions
   - Appointment cancellations
   - Upcoming appointments (<2 hours)
   - Vaccination due soon (<3 days)

3. **normal** - Standard information (blue)
   - Record updates
   - Document uploads
   - Growth measurements
   - General appointment reminders
   - Vaccination due (>3 days)

4. **low** - Informational only (gray)
   - System announcements
   - General updates

---

## User Notification Preferences

### Preference Table: `notification_preferences`
Each user can customize their notification settings:

```sql
CREATE TABLE notification_preferences (
    preference_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    appointment_reminders BOOLEAN DEFAULT true,
    vaccination_reminders BOOLEAN DEFAULT true,
    record_updates BOOLEAN DEFAULT true,
    prescription_notifications BOOLEAN DEFAULT true,
    document_notifications BOOLEAN DEFAULT true,
    measurement_notifications BOOLEAN DEFAULT true,
    allergy_notifications BOOLEAN DEFAULT true, -- Cannot be disabled
    reminder_minutes_before INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Preference Enforcement
- Allergy notifications **cannot be disabled** (safety requirement)
- Other notification types respect user preferences
- Default is all notifications enabled
- Users can adjust reminder timing (15, 30, 60, 120 minutes)

---

## Security and Access Control

### Row Level Security (RLS)
All notification queries enforce:
- Users can only see their own notifications
- Facility association is validated
- Parent-patient relationship verified through `parent_access` table

### Parent-Patient Relationship
```sql
SELECT user_id FROM parent_access
WHERE patient_id = [patient_id]
AND is_active = true
LIMIT 1;
```

**Requirements**:
- Active parent access record must exist
- Only active relationships receive notifications
- Supports multiple guardians per patient
- Handles custody arrangements

### HIPAA Compliance
- All notifications encrypted in transit
- Sensitive data only in metadata (not in title/message)
- Audit trail for notification delivery
- User-controlled notification preferences
- Secure deletion when patient relationship ends

---

## Frontend Integration

### React Hook: `useNotifications()`
Located at: `client/src/hooks/useNotifications.js`

**Features**:
- Real-time updates via Supabase subscriptions
- Automatic unread count tracking
- Mark as read functionality
- Archive and delete options
- Refresh on demand

**Usage Example**:
```javascript
import { useNotifications } from '../hooks/useNotifications'

function NotificationPanel() {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        refreshNotifications
    } = useNotifications()

    return (
        <div>
            <h2>Notifications ({unreadCount})</h2>
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.notification_id}
                    notification={notification}
                    onRead={() => markAsRead(notification.notification_id)}
                />
            ))}
        </div>
    )
}
```

### Real-time Subscription
Located at: `client/src/hook/useSupabaseRealtime.js`

**Subscription Setup**:
```javascript
useNotificationsRealtime({
    userId: user.user_id,
    onNotificationChange: ({ type, notification }) => {
        // type: 'INSERT', 'UPDATE', 'DELETE'
        // notification: notification object
    }
})
```

**Events Handled**:
- `INSERT`: New notification received
- `UPDATE`: Notification marked as read
- `DELETE`: Notification deleted

---

## API Endpoints

### Backend Routes: `server/routes/notification_routes.py`

#### GET `/notification`
Fetch user's notifications with pagination and filtering

**Query Parameters**:
- `limit` (default: 50) - Max notifications to return
- `offset` (default: 0) - Pagination offset
- `is_read` (optional) - Filter by read status
- `priority` (optional) - Filter by priority level
- `notification_type` (optional) - Filter by type

**Response**:
```json
{
    "status": "success",
    "notifications": [...],
    "unread_count": 5,
    "total_count": 23
}
```

#### PATCH `/notifications/:id/mark-read`
Mark a single notification as read

**Response**:
```json
{
    "status": "success",
    "notification": {...}
}
```

#### PATCH `/notifications/mark-all-read`
Mark all user notifications as read

**Response**:
```json
{
    "status": "success",
    "updated_count": 12
}
```

#### PATCH `/notifications/:id/archive`
Archive a notification (soft delete)

#### DELETE `/notifications/:id`
Permanently delete a notification

#### GET `/notifications/preferences`
Get user's notification preferences

#### PATCH `/notifications/preferences`
Update user's notification preferences

**Request Body**:
```json
{
    "appointment_reminders": true,
    "vaccination_reminders": true,
    "reminder_minutes_before": 60
}
```

---

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    facility_id UUID REFERENCES facilities(facility_id),
    related_appointment_id UUID,
    related_patient_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## Testing the Notification System

### Manual Testing Steps

#### 1. Test Appointment Notifications
```sql
-- Create a confirmed appointment
INSERT INTO appointments (patient_id, facility_id, doctor_id, appointment_date, appointment_time, status)
VALUES ([patient_id], [facility_id], [doctor_id], CURRENT_DATE + INTERVAL '2 hours', '10:00 AM', 'confirmed');

-- Check notification was created
SELECT * FROM notifications WHERE related_patient_id = [patient_id] ORDER BY created_at DESC LIMIT 1;
```

#### 2. Test Vaccination Reminders
```sql
-- Create vaccination record with upcoming due date
INSERT INTO vaccinations (patient_id, vaccine_name, next_dose_due, dose_number)
VALUES ([patient_id], 'MMR', CURRENT_DATE + INTERVAL '5 days', 2);

-- Check notification
SELECT * FROM notifications WHERE notification_type = 'vaccination_due' ORDER BY created_at DESC LIMIT 1;
```

#### 3. Test Prescription Notifications
```sql
-- Create prescription with medications
INSERT INTO prescriptions (patient_id, prescribed_by, prescription_date)
VALUES ([patient_id], [doctor_id], CURRENT_DATE);

INSERT INTO prescription_medications (prescription_id, medication_name, dosage)
VALUES ([prescription_id], 'Amoxicillin', '250mg twice daily');

-- Check notification
SELECT * FROM notifications WHERE notification_type = 'new_prescription' ORDER BY created_at DESC LIMIT 1;
```

#### 4. Test Allergy Alerts
```sql
-- Record new allergy
INSERT INTO allergies (patient_id, allergen, severity, recorded_by)
VALUES ([patient_id], 'Penicillin', 'severe', [user_id]);

-- Check URGENT notification
SELECT * FROM notifications WHERE priority = 'urgent' ORDER BY created_at DESC LIMIT 1;
```

### Automated Testing
- Frontend tests: `client/src/hooks/__tests__/useNotifications.test.js`
- Backend tests: `server/tests/test_notification_routes.py`

---

## Troubleshooting

### Issue: Notifications Not Appearing

**Check**:
1. Verify parent_access relationship exists and is active
2. Check user notification preferences
3. Verify trigger is enabled in database
4. Check browser console for real-time subscription errors
5. Confirm user is authenticated

**SQL Diagnostic Query**:
```sql
-- Check parent access
SELECT * FROM parent_access WHERE patient_id = [patient_id] AND is_active = true;

-- Check user preferences
SELECT * FROM notification_preferences WHERE user_id = [user_id];

-- Check recent notifications
SELECT * FROM notifications WHERE user_id = [user_id] ORDER BY created_at DESC LIMIT 10;

-- Check trigger status
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%notif%';
```

### Issue: Duplicate Notifications

**Check**:
- Ensure triggers use proper WHEN conditions
- Verify no duplicate trigger definitions
- Check for application-level notification creation

**Fix**:
```sql
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name ...
```

### Issue: Real-time Updates Not Working

**Check**:
1. Supabase real-time enabled for notifications table
2. RLS policies allow SELECT for authenticated users
3. Browser WebSocket connection active
4. User subscribed to correct channel

**Debug**:
```javascript
// Add logging to real-time handler
const handleNotificationChange = useCallback(({ type, notification }) => {
    console.log('Real-time event:', type, notification)
    // ... rest of handler
}, [])
```

---

## Maintenance

### Regular Tasks

#### Weekly
- Review notification delivery metrics
- Check for unread notification backlog
- Monitor notification volume per user

#### Monthly
- Archive old read notifications (>90 days)
- Review and update notification templates
- Analyze user preference trends

#### Quarterly
- Review notification types effectiveness
- Update reminder timing based on user feedback
- Optimize database indexes

### Archival Policy
```sql
-- Archive old read notifications
UPDATE notifications
SET is_archived = true
WHERE is_read = true
AND read_at < NOW() - INTERVAL '90 days';

-- Delete very old archived notifications
DELETE FROM notifications
WHERE is_archived = true
AND updated_at < NOW() - INTERVAL '2 years';
```

---

## Future Enhancements

### Planned Features
1. **SMS Notifications** - Text alerts for urgent notifications
2. **Email Digests** - Daily/weekly email summaries
3. **Push Notifications** - Mobile app notifications
4. **Notification Scheduling** - Schedule notifications for specific times
5. **Rich Media** - Attach images/documents to notifications
6. **Multi-language** - Translate notifications based on user preference
7. **Template Engine** - Customizable notification templates per facility

### Potential Notification Types
- Test result abnormalities
- Insurance verification needed
- Missed appointment follow-ups
- Medication refill reminders
- Wellness check reminders
- Birthday/milestone notifications
- Health education tips

---

## Performance Considerations

### Optimization Strategies
1. **Indexes**: All notification queries use indexed columns
2. **Pagination**: Default limit of 50 notifications per request
3. **Caching**: Unread count cached in Redis
4. **Batch Processing**: Vaccination reminders run as scheduled job
5. **Archival**: Old notifications archived automatically

### Monitoring Metrics
- Average notification creation time
- Real-time delivery latency
- Unread notification accumulation rate
- User engagement rate (read vs unread)
- Notification action click-through rate

---

## Summary

The KEEPSAKE notification system provides comprehensive, real-time alerts for all critical healthcare events. With 8 different notification types covering appointments, prescriptions, allergies, measurements, and more, parents/guardians stay informed about their patients' care.

**Key Features**:
- Automatic database triggers ensure no events are missed
- Priority levels ensure urgent information gets attention
- User preferences provide control over notification frequency
- Real-time updates deliver instant notifications
- HIPAA-compliant security protects sensitive data
- Parent-patient relationship verification ensures proper access

**Implementation Status**: ✅ Complete
- All database triggers applied
- Backend routes functional
- Frontend integration complete
- Real-time subscriptions active

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: KEEPSAKE Development Team
**Related Files**:
- `server/migrations/create_enhanced_notifications_system.sql`
- `server/routes/notification_routes.py`
- `client/src/hooks/useNotifications.js`
- `client/src/api/notifications.js`
