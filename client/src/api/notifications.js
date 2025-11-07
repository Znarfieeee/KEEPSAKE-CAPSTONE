import backendConnection from './backendApi'
import axios from 'axios'
import { axiosConfig } from './axiosConfig'

export const getNotifications = async (params = {}) => {
    const response = await axios.get(`${backendConnection()}/notification`, {
        axiosConfig,
        params: {
            limit: 50,
            ...params,
        },
    })
    return response.data
}

export const markNotificationAsRead = async (notificationId) => {
    const response = await axios.patch(
        `${backendConnection()}/notifications/${notificationId}/mark-read`,
        {},
        axiosConfig
    )
    return response.data
}

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
    const response = await axios.patch(
        `${backendConnection()}/notifications/mark-all-read`,
        {},
        axiosConfig
    )
    return response.data
}

/**
 * Archive a notification
 * @param {string} notificationId - Notification UUID
 */
export const archiveNotification = async (notificationId) => {
    const response = await axios.patch(
        `${backendConnection()}/notifications/${notificationId}/archive`,
        {},
        axiosConfig
    )
    return response.data
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification UUID
 */
export const deleteNotification = async (notificationId) => {
    const response = await axios.delete(
        `${backendConnection()}/notifications/${notificationId}`,
        axiosConfig
    )
    return response.data
}

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
    const response = await axios.get(`${backendConnection()}/notifications/preferences`, {
        withCredentials: true,
    })
    return response.data
}

/**
 * Update notification preferences
 * @param {Object} preferences - Preference updates
 */
export const updateNotificationPreferences = async (preferences) => {
    const response = await axios.patch(
        `${backendConnection()}/notifications/preferences`,
        preferences,
        axiosConfig
    )
    return response.data
}

/**
 * Get system announcements
 */
export const getSystemAnnouncements = async () => {
    const response = await axios.get(`${backendConnection()}/notifications/announcements`, {
        withCredentials: true,
    })
    return response.data
}

/**
 * Create system announcement (admin only)
 * @param {Object} announcement - Announcement data
 */
export const createSystemAnnouncement = async (announcement) => {
    const response = await axios.post(
        `${backendConnection()}/api/notifications/announcements`,
        announcement,
        axiosConfig
    )
    return response.data
}
