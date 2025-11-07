import React, { useState } from 'react';
import { Bell, Calendar, Syringe, QrCode, Megaphone, Check, Archive, Trash2, RefreshCw, Settings, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { useNotifications } from '../hooks/useNotifications';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

/**
 * Notifications Page
 * Full-page view of all notifications with filtering and actions
 */
const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_reminder':
        return <Bell className="h-6 w-6 text-blue-500" />;
      case 'upcoming_appointment':
        return <Calendar className="h-6 w-6 text-purple-500" />;
      case 'vaccination_due':
        return <Syringe className="h-6 w-6 text-green-500" />;
      case 'qr_access_alert':
        return <QrCode className="h-6 w-6 text-orange-500" />;
      case 'system_announcement':
        return <Megaphone className="h-6 w-6 text-red-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const classes = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${classes[priority] || classes.normal}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== 'all' && notif.notification_type !== filterType) {
      return false;
    }

    if (filterRead === 'unread' && notif.is_read) {
      return false;
    }

    if (filterRead === 'read' && !notif.is_read) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={refreshNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="appointment_reminder">Appointment Reminders</SelectItem>
                <SelectItem value="upcoming_appointment">Upcoming Appointments</SelectItem>
                <SelectItem value="vaccination_due">Vaccination Dues</SelectItem>
                <SelectItem value="qr_access_alert">QR Access Alerts</SelectItem>
                <SelectItem value="system_announcement">System Announcements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg shadow p-5 border-l-4 border-l-gray-300">
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
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg shadow">
            <Bell className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">No notifications found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {filterType !== 'all' || filterRead !== 'all'
                ? 'Try adjusting your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border-l-4 ${
                  notification.priority === 'urgent' ? 'border-l-red-500' :
                  notification.priority === 'high' ? 'border-l-orange-500' :
                  notification.priority === 'normal' ? 'border-l-blue-500' :
                  'border-l-gray-500'
                } ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
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
                          <h3 className={`text-lg font-semibold ${
                            !notification.is_read
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {getPriorityBadge(notification.priority)}
                        </div>

                        {!notification.is_read && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.notification_id);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as read
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveNotification(notification.notification_id);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.notification_id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
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
  );
};

export default NotificationsPage;
