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
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/useNotifications'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import NotificationMenu from '@/components/notifications/NotificationMenu'

/**
 * Notifications Page
 * Full-page view of all notifications with filtering and actions
 */
const NotificationsPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
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
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
                            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Button variant="outline" size="sm" onClick={refreshNotifications} disabled={loading} className="text-xs sm:text-sm">
                            <RefreshCw
                                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`}
                            />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => navigate(getSettingsPath())} className="text-xs sm:text-sm">
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Settings</span>
                        </Button>

                        {unreadCount > 0 && (
                            <Button onClick={markAllAsRead} size="sm" className="text-xs sm:text-sm">
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Mark all as read</span>
                                <span className="sm:hidden">Read all</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                                activeTab === 'all'
                                    ? 'text-primary border-b-2 border-primary bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <span className="hidden sm:inline">All Notifications</span>
                            <span className="sm:hidden">All</span>
                            <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-gray-100">
                                {notifications.filter((n) => !n.is_archived).length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                                activeTab === 'unread'
                                    ? 'text-primary border-b-2 border-primary bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-red-500 text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                                activeTab === 'archived'
                                    ? 'text-primary border-b-2 border-primary bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Archived
                            <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-gray-100">
                                {notifications.filter((n) => n.is_archived).length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full sm:w-56 text-xs sm:text-sm">
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

                        <div className="sm:ml-auto text-xs sm:text-sm text-gray-600">
                            Showing {filteredNotifications.length} of {notifications.length}{' '}
                            <span className="hidden sm:inline">notifications</span>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <ScrollArea>
                        <div className="space-y-2 sm:space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="bg-white rounded-lg shadow p-3 sm:p-5">
                                    <div className="flex gap-3 sm:gap-4">
                                        <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded" />
                                        <div className="flex-1 space-y-2 sm:space-y-3">
                                            <div className="flex items-start justify-between">
                                                <Skeleton className="h-5 sm:h-6 w-2/3" />
                                                <Skeleton className="h-4 sm:h-5 w-14 sm:w-16 rounded" />
                                            </div>
                                            <Skeleton className="h-3 sm:h-4 w-full" />
                                            <Skeleton className="h-3 sm:h-4 w-3/4" />
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-7 sm:h-8 w-7 sm:w-24" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-64 bg-white rounded-lg shadow p-4">
                        <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-3 sm:mb-4" />
                        <p className="text-base sm:text-lg text-gray-600 text-center">
                            {activeTab === 'archived'
                                ? 'No archived notifications'
                                : activeTab === 'unread'
                                ? 'No unread notifications'
                                : 'No notifications found'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
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
                    <ScrollArea>
                        <div className="space-y-2 sm:space-y-3">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden ${getPriorityColor(
                                        notification.priority
                                    )}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="p-3 sm:p-5">
                                        <div className="flex gap-3 sm:gap-4">
                                            <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                                                <div className="h-5 w-5 sm:h-6 sm:w-6">
                                                    {getNotificationIcon(
                                                        notification.notification_type
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1 sm:mb-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                                                        <h3
                                                            className={`text-sm sm:text-lg font-semibold truncate ${
                                                                !notification.is_read
                                                                    ? 'text-gray-900'
                                                                    : 'text-gray-700'
                                                            }`}
                                                        >
                                                            {notification.title}
                                                        </h3>
                                                        <div className="flex-shrink-0">
                                                            {getPriorityBadge(notification.priority)}
                                                        </div>
                                                    </div>

                                                    {!notification.is_read && (
                                                        <div
                                                            className={getPriorityIndicator(
                                                                notification.priority
                                                            )}
                                                        ></div>
                                                    )}
                                                </div>

                                                <p className="text-xs sm:text-base text-gray-700 mb-2 sm:mb-3 whitespace-pre-wrap line-clamp-3 sm:line-clamp-none">
                                                    {notification.message}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] sm:text-sm text-gray-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage
