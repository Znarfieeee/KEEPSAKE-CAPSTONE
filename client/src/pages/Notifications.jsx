import React, { useState } from 'react'
import {
    Bell,
    Calendar,
    Syringe,
    QrCode,
    Megaphone,
    Check,
    Archive,
    Trash2,
    RefreshCw,
    Settings,
    Filter,
    Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ScrollArea } from '../components/ui/scroll-area'
import { Skeleton } from '../components/ui/skeleton'
import { useNotifications } from '../hooks/useNotifications'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select'
import NotificationMenu from '../components/notifications/NotificationMenu'

/**
 * Notifications Page
 * Full-page view of all notifications with filtering and actions
 */
const NotificationsPage = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('all') // all, unread, archived
    const [filterType, setFilterType] = useState('all')

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

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment_reminder':
                return <Bell />
            case 'upcoming_appointment':
                return <Calendar />
            case 'vaccination_due':
                return <Syringe />
            case 'qr_access_alert':
                return <QrCode />
            case 'system_announcement':
                return <Megaphone />
            default:
                return <Bell />
        }
    }

    const getPriorityBadge = (priority) => {
        const classes = {
            urgent: 'bg-red-100 text-red-800',
            high: 'bg-orange-100 text-orange-800',
            normal: 'bg-blue-100 text-blue-800',
            low: 'bg-gray-100 text-gray-800',
        }

        return (
            <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                    classes[priority] || classes.normal
                }`}
            >
                {priority.toUpperCase()}
            </span>
        )
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 '
            case 'high':
                return 'bg-orange-50 '
            case 'normal':
                return 'bg-blue-50'
            case 'low':
                return 'bg-gray-50'
            default:
                return 'bg-gray-50 '
        }
    }

    const getPriorityIndicator = (priority) => {
        const baseClasses = 'w-3 h-3 rounded-full flex-shrink-0 mt-2 animate-pulse'
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
        if (!notification.is_read) {
            markAsRead(notification.notification_id)
        }

        if (notification.action_url) {
            navigate(notification.action_url)
        }
    }

    // Filter notifications based on active tab and filters
    const filteredNotifications = notifications.filter((notif) => {
        // Tab filtering
        if (activeTab === 'unread' && notif.is_read) {
            return false
        }
        if (activeTab === 'archived' && !notif.is_archived) {
            return false
        }
        if (activeTab === 'all' && notif.is_archived) {
            return false
        }

        // Type filtering
        if (filterType !== 'all' && notif.notification_type !== filterType) {
            return false
        }

        return true
    })

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Bell className="h-8 w-8 text-blue-600" />
                            Notifications
                        </h1>
                        <p className="text-gray-600">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={refreshNotifications} disabled={loading}>
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate('/settings/notifications')}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>

                        {unreadCount > 0 && (
                            <Button onClick={markAllAsRead}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'all'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            All Notifications
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                                {notifications.filter((n) => !n.is_archived).length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'unread'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'archived'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Archived
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                                {notifications.filter((n) => n.is_archived).length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="appointment_reminder">
                                    Appointment Reminders
                                </SelectItem>
                                <SelectItem value="upcoming_appointment">
                                    Upcoming Appointments
                                </SelectItem>
                                <SelectItem value="vaccination_due">Vaccination Dues</SelectItem>
                                <SelectItem value="qr_access_alert">QR Access Alerts</SelectItem>
                                <SelectItem value="system_announcement">
                                    System Announcements
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="ml-auto text-sm text-gray-600">
                            Showing {filteredNotifications.length} of {notifications.length}{' '}
                            notifications
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow p-5"
                            >
                                <div className="flex gap-4">
                                    <Skeleton className="h-6 w-6 rounded" />
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <Skeleton className="h-6 w-2/3" />
                                            <Skeleton className="h-5 w-16 rounded" />
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-4 w-32" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-8 w-24" />
                                                <Skeleton className="h-8 w-20" />
                                                <Skeleton className="h-8 w-20" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                        <Bell className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-lg text-gray-600">
                            {activeTab === 'archived' ? 'No archived notifications' :
                             activeTab === 'unread' ? 'No unread notifications' :
                             'No notifications found'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {filterType !== 'all'
                                ? 'Try adjusting your filters'
                                : activeTab === 'unread'
                                    ? "You're all caught up!"
                                    : activeTab === 'archived'
                                        ? 'Archived notifications will appear here'
                                        : "You're all caught up!"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.notification_id}
                                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden ${getPriorityColor(
                                    notification.priority
                                )}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="p-5">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.notification_type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <h3
                                                        className={`text-lg font-semibold ${
                                                            !notification.is_read
                                                                ? 'text-gray-900'
                                                                : 'text-gray-700'
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </h3>
                                                    {getPriorityBadge(notification.priority)}
                                                </div>

                                                {!notification.is_read && (
                                                    <div className={getPriorityIndicator(notification.priority)}></div>
                                                )}
                                            </div>

                                            <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDistanceToNow(
                                                        new Date(notification.created_at),
                                                        { addSuffix: true }
                                                    )}
                                                </span>

                                                <div
                                                    className="flex items-center gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <NotificationMenu
                                                        notification={notification}
                                                        onMarkAsRead={markAsRead}
                                                        onMarkAsUnread={markAsUnread}
                                                        onArchive={archiveNotification}
                                                        onDelete={deleteNotification}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage
