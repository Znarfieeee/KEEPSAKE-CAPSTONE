# Notification System Refactoring

## Overview

The notification system has been refactored to follow KEEPSAKE's established architectural patterns by separating concerns into distinct layers:

1. **API Layer** (`client/src/api/notifications.js`) - HTTP requests
2. **Real-time Layer** (`client/src/hook/useSupabaseRealtime.js`) - Supabase subscriptions
3. **Hook Layer** (`client/src/hooks/`) - React hooks combining API + real-time

## Architecture Changes

### Before Refactoring ❌

**Old Structure:**
```
client/src/hooks/useNotifications.js
├── API calls (inline axios)
├── Real-time subscription (inline Supabase)
└── State management

client/src/hooks/useNotificationSound.js
├── API calls (inline axios)
└── Sound management
```

**Problems:**
- Mixed concerns (API, real-time, state in one file)
- Duplicate axios configuration
- Didn't follow project patterns
- Hard to test and maintain

### After Refactoring ✅

**New Structure:**
```
client/src/api/notifications.js
├── getNotifications()
├── getUnreadCount()
├── markNotificationAsRead()
├── markAllNotificationsAsRead()
├── archiveNotification()
├── deleteNotification()
├── getNotificationPreferences()
├── updateNotificationPreferences()
├── getSystemAnnouncements()
└── createSystemAnnouncement()

client/src/hook/useSupabaseRealtime.js
└── useNotificationsRealtime()
    ├── Handles INSERT events
    ├── Handles UPDATE events
    └── Handles DELETE events

client/src/hooks/useNotifications.js
├── Uses API from notifications.js
├── Uses useNotificationsRealtime()
└── Manages notification state

client/src/hooks/useNotificationSound.js
├── Uses API from notifications.js
└── Manages sound playback
```

**Benefits:**
✅ Separation of concerns
✅ Follows KEEPSAKE patterns (same as facilities, users, patients)
✅ Reusable API functions
✅ Centralized real-time logic
✅ Easier to test
✅ Consistent with existing codebase

## File Changes

### 1. New: `client/src/api/notifications.js` ✅

**Purpose:** Centralized notification API calls

**Exports:**
```javascript
// Notification operations
getNotifications(params)
getUnreadCount()
markNotificationAsRead(notificationId)
markAllNotificationsAsRead()
archiveNotification(notificationId)
deleteNotification(notificationId)

// Preference operations
getNotificationPreferences()
updateNotificationPreferences(preferences)

// Announcement operations
getSystemAnnouncements()
createSystemAnnouncement(announcement)
```

**Usage Example:**
```javascript
import { getNotifications, markNotificationAsRead } from '../api/notifications';

// Fetch notifications
const response = await getNotifications({ limit: 50 });

// Mark as read
await markNotificationAsRead('notification-uuid');
```

### 2. Updated: `client/src/hook/useSupabaseRealtime.js` ✅

**Added Hook:** `useNotificationsRealtime()`

**Purpose:** Handle real-time notification updates from Supabase

**Usage Example:**
```javascript
import { useNotificationsRealtime } from '../hook/useSupabaseRealtime';

useNotificationsRealtime({
    userId: currentUserId,
    onNotificationChange: ({ type, notification }) => {
        switch (type) {
            case 'INSERT': // New notification
            case 'UPDATE': // Notification updated
            case 'DELETE': // Notification deleted
        }
    }
});
```

**Features:**
- Filters by user_id automatically
- Handles INSERT/UPDATE/DELETE events
- Follows same pattern as other real-time hooks
- Integrates with existing useSupabaseRealtime() base hook

### 3. Refactored: `client/src/hooks/useNotifications.js` ✅

**Changes:**
- ❌ Removed inline axios calls
- ✅ Now uses API functions from `api/notifications.js`
- ❌ Removed inline Supabase subscription
- ✅ Now uses `useNotificationsRealtime()` hook
- ✅ Cleaner, more focused on state management

**Before:**
```javascript
const response = await axios.get(`${API_URL}/api/notifications`, {
    withCredentials: true,
    params: { limit: 50 }
});
```

**After:**
```javascript
const response = await getNotifications({ limit: 50 });
```

### 4. Refactored: `client/src/hooks/useNotificationSound.js` ✅

**Changes:**
- ❌ Removed inline axios calls
- ✅ Now uses API functions from `api/notifications.js`
- ✅ Simplified and cleaner

**Before:**
```javascript
const response = await axios.get(`${API_URL}/api/notifications/preferences`, {
    withCredentials: true
});
```

**After:**
```javascript
const response = await getNotificationPreferences();
```

## Pattern Consistency

The refactored notification system now matches the existing KEEPSAKE patterns:

### Facilities Pattern
```
api/facilities.js → API calls
useSupabaseRealtime.js → useFacilitiesRealtime()
hooks/useFacilities.js → Combines both
```

### Users Pattern
```
api/users.js → API calls
useSupabaseRealtime.js → useUsersRealtime()
hooks/useUsers.js → Combines both
```

### Notifications Pattern (NEW)
```
api/notifications.js → API calls
useSupabaseRealtime.js → useNotificationsRealtime()
hooks/useNotifications.js → Combines both
```

## Migration Guide

### For Existing Code

**No changes needed!** The hook interfaces remain the same:

```javascript
// This still works exactly the same
const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
} = useNotifications();
```

**Internal implementation is better, external API is unchanged.**

### For New Features

Use the new API functions directly when needed:

```javascript
import { getNotifications, markNotificationAsRead } from '../api/notifications';

// In a component or utility
const notifications = await getNotifications({
    notification_type: 'appointment_reminder'
});

await markNotificationAsRead(notificationId);
```

## Testing Benefits

### API Layer (Testable)
```javascript
// Easy to mock and test
jest.mock('../api/notifications');
```

### Real-time Layer (Testable)
```javascript
// Easy to test real-time logic in isolation
const mockOnChange = jest.fn();
useNotificationsRealtime({ userId: 'test', onNotificationChange: mockOnChange });
```

### Hook Layer (Testable)
```javascript
// Test hooks with mocked dependencies
import { renderHook } from '@testing-library/react-hooks';
```

## Performance Benefits

✅ **Better Code Splitting** - API functions can be tree-shaken
✅ **Reduced Bundle Size** - Shared API layer across multiple hooks
✅ **Cached Imports** - Single import point for API functions
✅ **Optimized Re-renders** - Better separation allows React.memo optimization

## Developer Experience

✅ **Easier to Find** - "Where's the API call?" → `api/notifications.js`
✅ **Easier to Update** - Change one place, all hooks benefit
✅ **Easier to Debug** - Clear separation of concerns
✅ **Easier to Extend** - Add new API calls without touching hooks
✅ **Consistent Patterns** - Same as facilities, users, appointments, etc.

## Backwards Compatibility

✅ **100% Compatible** - No breaking changes
✅ **Same Hook Interface** - Components don't need updates
✅ **Same Behavior** - Functionality unchanged
✅ **Same Performance** - No performance regression

## Next Steps

Consider applying this pattern to other areas if they haven't been refactored yet:

1. **Appointments** - Already follows pattern ✅
2. **Patients** - Already follows pattern ✅
3. **Facilities** - Already follows pattern ✅
4. **Users** - Already follows pattern ✅
5. **Notifications** - Now follows pattern ✅

## Summary

The notification system has been successfully refactored to:

✅ Follow KEEPSAKE's established architectural patterns
✅ Separate API, real-time, and state management concerns
✅ Improve testability and maintainability
✅ Maintain 100% backwards compatibility
✅ Match existing patterns in facilities, users, and patients modules

**Result:** Cleaner, more maintainable, and consistent codebase.

---

**Refactoring Date:** 2025-10-08
**Status:** ✅ Complete
**Breaking Changes:** None
**Migration Required:** No
