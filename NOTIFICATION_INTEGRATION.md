# Notification System Integration Guide

## Overview

The KEEPSAKE notification system provides real-time notifications for appointment reminders, vaccination dues, QR code access alerts, and system announcements.

## Features

- ✅ Real-time notifications with Supabase subscriptions
- ✅ Customizable notification sounds
- ✅ Appointment reminders
- ✅ Vaccination due date notifications
- ✅ QR code access alerts
- ✅ System announcements
- ✅ Notification preferences/settings
- ✅ Mark as read/unread
- ✅ Archive and delete notifications
- ✅ Priority levels (low, normal, high, urgent)

## Database Setup

The notification system uses three main tables:

1. **notifications** - Stores user notifications
2. **notification_preferences** - User notification settings
3. **system_announcements** - System-wide announcements

Migration has been applied: `create_notifications_system`

## Backend Integration

### 1. API Endpoints

The notification API is available at `/api/notifications`:

```python
GET    /api/notifications                  # Get user notifications
GET    /api/notifications/unread-count     # Get unread count
PATCH  /api/notifications/:id/mark-read    # Mark as read
PATCH  /api/notifications/mark-all-read    # Mark all as read
PATCH  /api/notifications/:id/archive      # Archive notification
DELETE /api/notifications/:id              # Delete notification

GET    /api/notifications/preferences      # Get preferences
PATCH  /api/notifications/preferences      # Update preferences

GET    /api/notifications/announcements    # Get system announcements
POST   /api/notifications/announcements    # Create announcement (admin only)
```

### 2. Notification Utilities

Import notification utilities in your routes:

```python
from utils.notification_utils import (
    create_appointment_reminder,
    create_upcoming_appointment_notification,
    create_vaccination_due_notification,
    create_qr_access_alert
)
```

### 3. QR Access Alert Integration

In your QR code access endpoint, add:

```python
from utils.notification_utils import create_qr_access_alert

# After successful QR code access
create_qr_access_alert(
    qr_id=qr_code_id,
    accessed_by_user_id=current_user_id,
    patient_id=patient_id
)
```

### 4. Appointment Notification Integration

When creating/updating appointments:

```python
from utils.notification_utils import create_appointment_reminder

# After creating appointment
create_appointment_reminder(
    appointment_id=new_appointment_id,
    minutes_before=60  # 1 hour before
)
```

### 5. Vaccination Notification Integration

When scheduling vaccinations:

```python
from utils.notification_utils import create_vaccination_due_notification

create_vaccination_due_notification(
    patient_id=patient_id,
    vaccine_name="MMR Vaccine",
    due_date="2025-11-15"
)
```

## Architecture

The notification system follows KEEPSAKE's established architectural patterns:

**API Layer:**
- `client/src/api/notifications.js` - All HTTP requests

**Real-time Layer:**
- `client/src/hook/useSupabaseRealtime.js` - `useNotificationsRealtime()` hook

**Hook Layer:**
- `client/src/hooks/useNotifications.js` - State management
- `client/src/hooks/useNotificationSound.js` - Sound & preferences

This pattern matches the existing architecture used for facilities, users, patients, and appointments.

See `NOTIFICATION_REFACTOR.md` for detailed architecture documentation.

## Frontend Integration

### 1. Add NotificationBell to Layout ✅

**Status:** Already integrated in all layouts!

The `NotificationBell` component has been added to:
- `client/src/layout/AdminLayout.jsx` (line 123)
- `client/src/layout/PediaproLayout.jsx` (line 107)
- `client/src/layout/FacilityAdminLayout.jsx` (line 165)

```jsx
import NotificationBell from '../components/notifications/NotificationBell';

// In your header:
<NotificationBell />
```

### 2. Add Notification Routes

In your `App.jsx` or router configuration:

```jsx
import NotificationsPage from './pages/Notifications';
import NotificationSettings from './components/notifications/NotificationSettings';

// Add routes:
<Route path="/notifications" element={<NotificationsPage />} />
<Route path="/settings/notifications" element={<NotificationSettings />} />
```

### 3. Add Supabase Client Configuration

Ensure your Supabase client is configured in `config/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. Install Required Dependencies

```bash
cd client
npm install date-fns react-hot-toast
```

## Running the Notification Scheduler

The notification scheduler checks for upcoming appointments and vaccinations:

### Option 1: Run as Standalone Process

```bash
cd server
python schedulers/notification_scheduler.py
```

### Option 2: Run with Supervisor (Production)

Create a supervisor config file:

```ini
[program:notification_scheduler]
directory=/path/to/keepsake/server
command=python schedulers/notification_scheduler.py
autostart=true
autorestart=true
stderr_logfile=/var/log/notification_scheduler.err.log
stdout_logfile=/var/log/notification_scheduler.out.log
```

### Option 3: Run with systemd (Linux)

Create `/etc/systemd/system/notification-scheduler.service`:

```ini
[Unit]
Description=KEEPSAKE Notification Scheduler
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/keepsake/server
ExecStart=/usr/bin/python3 schedulers/notification_scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable notification-scheduler
sudo systemctl start notification-scheduler
```

## Notification Sound Setup

### 1. Add Sound Files

Place notification sound files in `client/public/sounds/`:

- `notification-default.mp3`
- `notification-chime.mp3`
- `notification-bell.mp3`
- `notification-ding.mp3`
- `notification-ping.mp3`
- `notification-pop.mp3`

### 2. Free Sound Resources

- https://notificationsounds.com/
- https://freesound.org/
- https://mixkit.co/free-sound-effects/notification/

## Creating System Announcements

### Via API (Admin)

```bash
curl -X POST http://localhost:5000/api/notifications/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "message": "System will be under maintenance on Saturday from 2-4 AM.",
    "priority": "high",
    "target_roles": ["doctor", "facility_admin"],
    "expires_at": "2025-11-20T00:00:00Z"
  }'
```

### Programmatically

```python
from routes.notification_routes import create_announcement_notifications

announcement = {
    "announcement_id": "...",
    "title": "New Feature Released",
    "message": "Check out our new appointment scheduling feature!",
    "priority": "normal",
    "target_roles": ["doctor", "facility_admin"]
}

create_announcement_notifications(announcement)
```

## Notification Preferences

Users can customize:

- ✅ Enable/disable notification types
- ✅ Choose notification sound
- ✅ Set reminder timing (minutes before appointment)
- ✅ Set vaccination reminder days
- ✅ Enable desktop notifications
- ✅ Enable email notifications (future)

Access via: `/settings/notifications`

## Real-time Updates

Notifications use Supabase real-time subscriptions for instant updates:

- New notifications appear instantly
- Read status updates in real-time
- No page refresh required

## Testing

### Test Notification Creation

```python
from utils.notification_utils import create_appointment_reminder

# Create test appointment notification
create_appointment_reminder(
    appointment_id=1,
    minutes_before=60
)
```

### Test QR Access Alert

```python
from utils.notification_utils import create_qr_access_alert

create_qr_access_alert(
    qr_id="uuid-here",
    accessed_by_user_id="user-uuid",
    patient_id="patient-uuid"
)
```

## Troubleshooting

### Notifications Not Appearing

1. Check Supabase connection in browser console
2. Verify user is logged in and session is valid
3. Check notification preferences are enabled
4. Verify RLS policies in Supabase

### Sounds Not Playing

1. Check sound files exist in `public/sounds/`
2. Verify sound is enabled in preferences
3. Check browser audio permissions
4. Test with different browsers

### Real-time Not Working

1. Check Supabase real-time is enabled in project settings
2. Verify subscription in browser console
3. Check user_id is being passed correctly
4. Ensure RLS policies allow user to read their notifications

## Security Considerations

- RLS policies ensure users only see their own notifications
- Announcement creation requires admin role
- All API endpoints require authentication
- Sensitive data is not included in notifications

## Performance

- Notifications are paginated (50 per request)
- Old archived notifications are cleaned up automatically
- Real-time subscriptions are efficient and lightweight
- Sound playback is throttled to prevent spam

## Future Enhancements

- [ ] Email notification delivery
- [ ] SMS notifications (via Twilio)
- [ ] Push notifications (web push API)
- [ ] Notification categories/grouping
- [ ] Snooze functionality
- [ ] Notification forwarding
- [ ] Mobile app notifications

## Support

For issues or questions, check:
- Database schema: `server/supabase/migrations/`
- API routes: `server/routes/notification_routes.py`
- Frontend components: `client/src/components/notifications/`
- Hooks: `client/src/hooks/useNotifications.js`
