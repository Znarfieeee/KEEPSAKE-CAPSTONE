import React, { useState } from 'react'
import {
    X,
    Check,
    CheckCheck,
    Archive,
    Trash2,
    Clock,
    Bell,
    Calendar,
    Syringe,
    QrCode,
    Megaphone,
    RefreshCw,
    Settings,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '../ui/Button'
import { ScrollArea } from '../ui/scroll-area'
import { Skeleton } from '../ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import NotificationMenu from './NotificationMenu'

/**
 * NotificationDropdown Component
 * Displays a dropdown list of notifications with actions
 */
const NotificationDropdown = ({
    notifications,
    unreadCount,
    loading,
    onClose,
    onMarkAsRead,
    onMarkAsUnread,
    onMarkAllAsRead,
    onArchive,
    onDelete,
    onRefresh,
}) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('all')

    // Get settings path based on user role
    const getSettingsPath = () => {
        const role = user?.role
        switch (role) {
            case 'system_admin':
            case 'admin':
                return '/admin/settings?tab=notifications'
            case 'parent':
                return '/parent/settings?tab=notifications'
            case 'doctor':
            case 'pediapro':
                return '/pediapro/settings?tab=notifications'
            case 'facility_admin':
                return '/facility_admin/settings?tab=notifications'
            default:
                return '/settings?tab=notifications'
        }
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment_reminder':
                return <Bell className="h-5 w-5 text-blue-500" />
            case 'upcoming_appointment':
                return <Calendar className="h-5 w-5 text-purple-500" />
            case 'vaccination_due':
                return <Syringe className="h-5 w-5 text-green-500" />
            case 'qr_access_alert':
                return <QrCode className="h-5 w-5 text-orange-500" />
            case 'system_announcement':
                return <Megaphone className="h-5 w-5 text-red-500" />
            default:
                return <Bell className="h-5 w-5 text-gray-500" />
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50'
            case 'high':
                return 'bg-orange-50'
            case 'normal':
                return 'bg-blue-50'
            case 'low':
                return 'bg-gray-50'
            default:
                return 'bg-gray-50'
        }
    }

    const getPriorityIndicator = (priority) => {
        const baseClasses = 'w-2 h-2 rounded-full flex-shrink-0 mt-1 animate-pulse'
        switch (priority) {
            case 'urgent':
                return `${baseClasses} bg-red-500`
            case 'high':
                return `${baseClasses} bg-orange-500`
            case 'normal':
                return `${baseClasses} bg-blue-500`
            case 'low':
                return `${baseClasses} bg-gray-400`
            default:
                return `${baseClasses} bg-blue-500`
        }
    }

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.is_read) {
            onMarkAsRead(notification.notification_id)
        }

        // Navigate to action URL if available
        if (notification.action_url) {
            navigate(notification.action_url)
            onClose()
        }
    }

    const filteredNotifications = notifications.filter((notif) => {
        if (activeTab === 'unread') {
            return !notif.is_read
        }
        return true
    })

    return (
        <div className="fixed sm:absolute inset-x-0 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-full sm:w-[420px] bg-white sm:rounded-lg shadow-2xl border-t sm:border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                            onClick={onRefresh}
                            className="p-1 sm:p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                            title="Refresh notifications"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 ${
                                    loading ? 'animate-spin' : ''
                                }`}
                            />
                        </button>
                        <button
                            onClick={() => {
                                onClose()
                                navigate(getSettingsPath())
                            }}
                            className="p-1 sm:p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                            title="Notification settings"
                        >
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 sm:p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                        >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 sm:gap-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'all'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                            activeTab === 'unread'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100 '
                        }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Mark all as read button */}
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="mt-2 sm:mt-3 text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notification List */}
            <ScrollArea
                className={`overflow-y-auto ${
                    filteredNotifications.length === 0
                        ? 'h-40 sm:h-48'
                        : 'max-h-[320px] sm:max-h-[420px]'
                }`}
            >
                {loading ? (
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3 sm:p-4 animate-pulse">
                                <div className="flex gap-2 sm:gap-3">
                                    <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
                                    <div className="flex-1 space-y-1.5 sm:space-y-2">
                                        <Skeleton className="h-3 sm:h-4 w-3/4" />
                                        <Skeleton className="h-2.5 sm:h-3 w-full" />
                                        <Skeleton className="h-2.5 sm:h-3 w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 sm:h-48 text-gray-500 px-4">
                        <div className="relative">
                            <Bell className="h-12 w-12 sm:h-16 sm:w-16 mb-2 sm:mb-3 opacity-20 text-gray-400" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-6 w-6 sm:h-8 sm:w-8 border-4 border-gray-200 border-t-transparent rounded-full opacity-0"></div>
                            </div>
                        </div>
                        <p className="text-sm sm:text-base font-medium text-gray-700 mb-1">
                            {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 text-center">
                            {activeTab === 'unread'
                                ? 'You have no unread notifications'
                                : 'New notifications will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.notification_id}
                                className={`p-2.5 sm:p-3 hover:bg-gray-100 transition-colors ${getPriorityColor(
                                    notification.priority
                                )} cursor-pointer`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex gap-2 sm:gap-2.5">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-4 w-4 sm:h-5 sm:w-5">
                                            {getNotificationIcon(notification.notification_type)}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-0.5">
                                            <h4
                                                className={`text-xs sm:text-sm font-semibold leading-tight truncate ${
                                                    !notification.is_read
                                                        ? 'text-gray-900'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {notification.title}
                                            </h4>

                                            {!notification.is_read && (
                                                <div
                                                    className={getPriorityIndicator(
                                                        notification.priority
                                                    )}
                                                ></div>
                                            )}
                                        </div>

                                        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-1.5 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
                                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                {formatDistanceToNow(
                                                    new Date(notification.created_at),
                                                    { addSuffix: true }
                                                )}
                                            </span>

                                            <div
                                                className="flex items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <NotificationMenu
                                                    notification={notification}
                                                    onMarkAsRead={onMarkAsRead}
                                                    onMarkAsUnread={onMarkAsUnread}
                                                    onArchive={onArchive}
                                                    onDelete={onDelete}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
                <div className="p-2.5 sm:p-3 border-t border-gray-200 text-center">
                    <button
                        onClick={() => {
                            navigate('/notifications')
                            onClose()
                        }}
                        className="text-xs sm:text-sm text-blue-600 hover:underline font-medium"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    )
}

export default NotificationDropdown
