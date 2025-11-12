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
    const [activeTab, setActiveTab] = useState('all')

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
                return 'border-l-4 border-l-red-500 bg-red-50'
            case 'high':
                return 'border-l-4 border-l-orange-500 bg-orange-50'
            case 'normal':
                return 'border-l-4 border-l-blue-500'
            case 'low':
                return 'border-l-4 border-l-gray-500'
            default:
                return 'border-l-4 border-l-gray-300'
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
        <div className="absolute right-0 mt-2 w-[480px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onRefresh}
                            className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                            title="Refresh notifications"
                        >
                            <RefreshCw
                                className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`}
                            />
                        </button>
                        <button
                            onClick={() => navigate('/settings/notifications')}
                            className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                            title="Notification settings"
                        >
                            <Settings className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                        >
                            <X className="h-4 w-4 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'all'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                            activeTab === 'unread'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100 '
                        }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Mark all as read button */}
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notification List */}
            <ScrollArea
                className={`overflow-y-auto ${
                    filteredNotifications.length === 0 ? 'h-48' : 'max-h-[420px]'
                }`}
            >
                {loading ? (
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="flex gap-3">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 px-4">
                        <div className="relative">
                            <Bell className="h-16 w-16 mb-3 opacity-20 text-gray-400" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-8 w-8 border-4 border-gray-200 border-t-transparent rounded-full opacity-0"></div>
                            </div>
                        </div>
                        <p className="text-base font-medium text-gray-700 mb-1">
                            {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </p>
                        <p className="text-sm text-gray-500 text-center">
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
                                className={`p-3 hover:bg-gray-50 transition-colors ${
                                    !notification.is_read ? 'bg-blue-50' : ''
                                } ${getPriorityColor(notification.priority)} cursor-pointer`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex gap-2.5">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.notification_type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                            <h4
                                                className={`text-sm font-semibold leading-tight ${
                                                    !notification.is_read
                                                        ? 'text-gray-900'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {notification.title}
                                            </h4>

                                            {!notification.is_read && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-600 mb-1.5 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
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
                <div className="p-3 border-t border-gray-200 text-center">
                    <button
                        onClick={() => {
                            navigate('/notifications')
                            onClose()
                        }}
                        className="text-sm text-blue-600 hover:underline font-medium"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    )
}

export default NotificationDropdown
