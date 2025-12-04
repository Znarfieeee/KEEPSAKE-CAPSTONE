/**
 * Calculate date range based on preset or custom dates
 * @param {string} preset - Date range preset ('last-7-days', 'last-30-days', 'last-90-days', 'year-to-date', 'custom')
 * @param {Object} customRange - Custom date range object
 * @param {string} customRange.startDate - Custom start date (YYYY-MM-DD)
 * @param {string} customRange.endDate - Custom end date (YYYY-MM-DD)
 * @returns {Object} Object with startDate and endDate in YYYY-MM-DD format
 */
export const calculateDateRange = (preset, customRange = {}) => {
    const now = new Date()
    let startDate, endDate

    switch (preset) {
        case 'last-7-days':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 7)
            endDate = new Date()
            break

        case 'last-30-days':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 30)
            endDate = new Date()
            break

        case 'last-90-days':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 90)
            endDate = new Date()
            break

        case 'year-to-date':
            startDate = new Date(now.getFullYear(), 0, 1) // January 1st
            endDate = new Date()
            break

        case 'custom':
            startDate = customRange.startDate ? new Date(customRange.startDate) : null
            endDate = customRange.endDate ? new Date(customRange.endDate) : null
            break

        default:
            // Default to last 30 days
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 30)
            endDate = new Date()
    }

    return {
        startDate: startDate ? formatDateToYYYYMMDD(startDate) : null,
        endDate: endDate ? formatDateToYYYYMMDD(endDate) : null,
    }
}

/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateToYYYYMMDD = (date) => {
    if (!date || !(date instanceof Date)) return null

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

/**
 * Get a human-readable label for a date preset
 * @param {string} preset - Date range preset
 * @returns {string} Human-readable label
 */
export const getPresetLabel = (preset) => {
    const labels = {
        'last-7-days': 'Last 7 Days',
        'last-30-days': 'Last 30 Days',
        'last-90-days': 'Last 90 Days',
        'year-to-date': 'Year to Date',
        'custom': 'Custom Range',
    }

    return labels[preset] || 'Last 30 Days'
}

/**
 * Validate that end date is after start date
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {boolean} True if valid, false otherwise
 */
export const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return true // Allow empty dates

    const start = new Date(startDate)
    const end = new Date(endDate)

    return end >= start
}

/**
 * Calculate the number of days between two dates
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} Number of days
 */
export const calculateDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)

    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
}
