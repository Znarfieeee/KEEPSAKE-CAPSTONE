import React, { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '../ui/badge'
import NotificationDropdown from './NotificationDropdown'
import { useNotifications } from '../../hooks/useNotifications'
import { useNotificationSound } from '../../hooks/useNotificationSound'

/**
 * NotificationBell Component
 * Displays a bell icon with unread count badge and notification dropdown
 */
const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        refreshNotifications,
    } = useNotifications()

    const { playSound } = useNotificationSound()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    // Play sound when new notification arrives
    useEffect(() => {
        if (unreadCount > 0) {
            playSound()
        }
    }, [unreadCount, playSound])

    const handleToggle = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Notifications"
            >
                <Bell className={`size-5 ${unreadCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />

                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold px-1.5 py-0 rounded-full border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    loading={loading}
                    onClose={() => setIsOpen(false)}
                    onMarkAsRead={markAsRead}
                    onMarkAsUnread={markAsUnread}
                    onMarkAllAsRead={markAllAsRead}
                    onArchive={archiveNotification}
                    onDelete={deleteNotification}
                    onRefresh={refreshNotifications}
                />
            )}
        </div>
    )
}

export default NotificationBell
