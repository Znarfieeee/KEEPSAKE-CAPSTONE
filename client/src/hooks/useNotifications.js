import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/auth'
import { useNotificationsRealtime } from '../hook/useSupabaseRealtime'
import {
    getNotifications,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    archiveNotification as archiveNotificationAPI,
    deleteNotification as deleteNotificationAPI,
} from '../api/notifications'

/**
 * useNotifications Hook
 * Manages notifications with real-time updates from Supabase
 */
export const useNotifications = () => {
    const { user, isAuthenticated } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Get user ID from auth context
    const userId = user?.user_id || user?.id

    // Fetch notifications from API - Simple approach like Facebook
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Load 10 notifications initially
            const response = await getNotifications({ limit: 10 })

            if (response.status === 'success') {
                setNotifications(response.notifications || [])
                setUnreadCount(response.unread_count || 0)
            } else {
                throw new Error(response.message || 'Failed to fetch notifications')
            }
        } catch (err) {
            console.error('Error fetching notifications:', err)
            setError(err.message || 'An error occurred while fetching notifications')
            setNotifications([])
            setUnreadCount(0)
        } finally {
            setLoading(false)
        }
    }, [])

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        if (!notificationId) {
            console.error('Invalid notification ID')
            return
        }

        try {
            const response = await markNotificationAsRead(notificationId)

            if (response.status === 'success') {
                // Update local state
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.notification_id === notificationId
                            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                            : notif
                    )
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            } else {
                throw new Error(response.message || 'Failed to mark notification as read')
            }
        } catch (err) {
            console.error('Error marking notification as read:', err)
            // Optionally show user-friendly error notification
        }
    }, [])

    // Mark notification as unread
    const markAsUnread = useCallback(async (notificationId) => {
        if (!notificationId) {
            console.error('Invalid notification ID')
            return
        }

        try {
            const response = await markNotificationAsUnread(notificationId)

            if (response.status === 'success') {
                // Update local state
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.notification_id === notificationId
                            ? { ...notif, is_read: false, read_at: null }
                            : notif
                    )
                )
                setUnreadCount((prev) => prev + 1)
            } else {
                throw new Error(response.message || 'Failed to mark notification as unread')
            }
        } catch (err) {
            console.error('Error marking notification as unread:', err)
        }
    }, [])

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await markAllNotificationsAsRead()

            if (response.status === 'success') {
                // Update local state
                setNotifications((prev) =>
                    prev.map((notif) => ({
                        ...notif,
                        is_read: true,
                        read_at: new Date().toISOString(),
                    }))
                )
                setUnreadCount(0)
            }
        } catch (err) {
            console.error('Error marking all notifications as read:', err)
        }
    }, [])

    // Archive notification
    const archiveNotification = useCallback(
        async (notificationId) => {
            if (!notificationId) {
                console.error('Invalid notification ID')
                return
            }

            try {
                const response = await archiveNotificationAPI(notificationId)

                if (response.status === 'success') {
                    // Remove from local state
                    setNotifications((prev) =>
                        prev.filter((notif) => notif.notification_id !== notificationId)
                    )

                    // Update unread count if notification was unread
                    const notification = notifications.find(
                        (n) => n.notification_id === notificationId
                    )
                    if (notification && !notification.is_read) {
                        setUnreadCount((prev) => Math.max(0, prev - 1))
                    }
                } else {
                    throw new Error(response.message || 'Failed to archive notification')
                }
            } catch (err) {
                console.error('Error archiving notification:', err)
            }
        },
        [notifications]
    )

    // Delete notification
    const deleteNotification = useCallback(
        async (notificationId) => {
            if (!notificationId) {
                console.error('Invalid notification ID')
                return
            }

            try {
                const response = await deleteNotificationAPI(notificationId)

                if (response.status === 'success') {
                    // Remove from local state
                    setNotifications((prev) =>
                        prev.filter((notif) => notif.notification_id !== notificationId)
                    )

                    // Update unread count if notification was unread
                    const notification = notifications.find(
                        (n) => n.notification_id === notificationId
                    )
                    if (notification && !notification.is_read) {
                        setUnreadCount((prev) => Math.max(0, prev - 1))
                    }
                } else {
                    throw new Error(response.message || 'Failed to delete notification')
                }
            } catch (err) {
                console.error('Error deleting notification:', err)
            }
        },
        [notifications]
    )

    // Handle real-time notification changes
    const handleNotificationChange = useCallback(({ type, notification, oldNotification }) => {
        console.log('Real-time notification change:', type, notification)

        switch (type) {
            case 'INSERT':
                // Add new notification to the list
                setNotifications((prev) => [notification, ...prev])

                // Increment unread count if notification is unread
                if (!notification.is_read) {
                    setUnreadCount((prev) => prev + 1)
                }
                break

            case 'UPDATE':
                // Update notification in the list
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.notification_id === notification.notification_id
                            ? notification
                            : notif
                    )
                )

                break

            case 'DELETE':
                // Remove notification from the list
                setNotifications((prev) =>
                    prev.filter((notif) => notif.notification_id !== notification.notification_id)
                )

                break

            default:
                break
        }
    }, [])

    // Setup real-time subscription (always call hook, but conditionally enable)
    useNotificationsRealtime({
        userId: userId && isAuthenticated ? userId : null,
        onNotificationChange: handleNotificationChange,
    })

    // Initial fetch
    useEffect(() => {
        if (userId && isAuthenticated) {
            fetchNotifications()
        } else {
            setLoading(false)
        }
    }, [userId, isAuthenticated, fetchNotifications])

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        refreshNotifications: fetchNotifications,
    }
}
