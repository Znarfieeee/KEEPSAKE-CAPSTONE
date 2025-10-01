import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * @param {...string} inputs - Class strings to merge
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return ''
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Format time to readable string
 * @param {string} time - Time string (HH:MM format)
 * @returns {string} - Formatted time string
 */
export const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${period}`
}

/**
 * Check if a date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
    const today = new Date()
    const checkDate = new Date(date)

    return (
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
    )
}

/**
 * Get appointments for a specific date
 * @param {Array} appointments - Array of appointments
 * @param {string|Date} date - Target date
 * @returns {Array} - Filtered appointments
 */
export const getAppointmentsByDate = (appointments, date) => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointment_date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate.getTime() === targetDate.getTime()
    })
}

/**
 * Get status badge color based on appointment status
 * @param {string} status - Appointment status
 * @returns {string} - CSS classes for status badge
 */
export const getStatusBadgeColor = (status) => {
    const statusColors = {
        scheduled: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-red-100 text-white',
        'no-show': 'bg-yellow-100 text-yellow-800',
        checked_in: 'bg-purple-100 text-purple-800',
    }

    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

/**
 * Get user status badge color based on user status
 * @param {string} status - User status
 * @returns {string} - CSS classes for status badge
 */
export const getUserStatusBadgeColor = (status) => {
    const statusColors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        suspended: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800',
    }

    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

/**
 * Get facility status badge styles
 * @param {string} status - Facility status
 * @returns {object} - Object containing background, text, and dot colors
 */
export const getFacilityStatusStyles = (status) => {
    const statusStyles = {
        active: {
            background: 'bg-green-50',
            text: 'text-green-700',
            dot: 'bg-green-500',
            border: 'border-green-100',
        },
        inactive: {
            background: 'bg-gray-50',
            text: 'text-gray-600',
            dot: 'bg-gray-400',
            border: 'border-gray-100',
        },
        suspended: {
            background: 'bg-red-50',
            text: 'text-red-700',
            dot: 'bg-red-500',
            border: 'border-red-100',
        },
        pending: {
            background: 'bg-yellow-50',
            text: 'text-yellow-700',
            dot: 'bg-yellow-500',
            border: 'border-yellow-100',
        },
        expired: {
            background: 'bg-orange-50',
            text: 'text-orange-700',
            dot: 'bg-orange-500',
            border: 'border-orange-100',
        },
    }

    return statusStyles[status?.toLowerCase()] || statusStyles.inactive
}

/**
 * Format user status for display
 * @param {string} status - User status
 * @returns {string} - Formatted status string
 */
export const formatUserStatus = (status) => {
    const statusMap = {
        active: 'Active',
        inactive: 'Inactive',
        suspended: 'Suspended',
        pending: 'Pending',
    }

    return statusMap[status?.toLowerCase()] || status || 'Unknown'
}
