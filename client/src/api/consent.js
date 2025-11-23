import axios from 'axios'
import backendConnection from './backendApi'
import { axiosConfig } from './axiosConfig'

/**
 * Parent Consent Management API
 * Handles all consent-related operations for parent users
 */

// ============================================================================
// ACTIVE SHARES
// ============================================================================

/**
 * Get all active QR code shares for parent's children
 * @param {string} [patientId] - Optional patient ID to filter by
 * @returns {Promise<{shares: Array, children: Array, total_active: number}>}
 */
export const getActiveShares = async (patientId = null) => {
    try {
        const params = patientId ? { patient_id: patientId } : {}
        const response = await axios.get(`${backendConnection()}/consent/active`, {
            ...axiosConfig,
            params
        })
        return response.data
    } catch (error) {
        console.error('Failed to fetch active shares:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch active shares')
    }
}

// ============================================================================
// ACCESS HISTORY
// ============================================================================

/**
 * Get consent access history for parent's children
 * @param {Object} options - Query options
 * @param {string} [options.patientId] - Filter by patient ID
 * @param {number} [options.limit=50] - Number of records to fetch
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<{history: Array, total: number}>}
 */
export const getAccessHistory = async ({ patientId = null, limit = 50, offset = 0 } = {}) => {
    try {
        const params = { limit, offset }
        if (patientId) params.patient_id = patientId

        const response = await axios.get(`${backendConnection()}/consent/access-history`, {
            ...axiosConfig,
            params
        })
        return response.data
    } catch (error) {
        console.error('Failed to fetch access history:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch access history')
    }
}

/**
 * Get detailed QR code access logs
 * @param {Object} options - Query options
 * @param {string} [options.patientId] - Filter by patient ID
 * @param {number} [options.limit=50] - Number of records to fetch
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<{logs: Array, total: number}>}
 */
export const getAccessLogs = async ({ patientId = null, limit = 50, offset = 0 } = {}) => {
    try {
        const params = { limit, offset }
        if (patientId) params.patient_id = patientId

        const response = await axios.get(`${backendConnection()}/consent/access-logs`, {
            ...axiosConfig,
            params
        })
        return response.data
    } catch (error) {
        console.error('Failed to fetch access logs:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch access logs')
    }
}

// ============================================================================
// REVOKE OPERATIONS
// ============================================================================

/**
 * Revoke a specific QR code share
 * @param {string} qrId - The QR code ID to revoke
 * @param {string} [reason] - Optional reason for revocation
 * @returns {Promise<{message: string, qr_id: string}>}
 */
export const revokeShare = async (qrId, reason = 'Revoked by parent') => {
    try {
        const response = await axios.post(
            `${backendConnection()}/consent/revoke/${qrId}`,
            { reason },
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Failed to revoke share:', error)
        throw new Error(error.response?.data?.error || 'Failed to revoke share')
    }
}

/**
 * Emergency revoke all active shares for a patient
 * @param {string} patientId - The patient ID
 * @param {string} [reason] - Optional reason for revocation
 * @returns {Promise<{message: string, revoked_count: number}>}
 */
export const revokeAllShares = async (patientId, reason = 'Emergency revoke all by parent') => {
    try {
        const response = await axios.post(
            `${backendConnection()}/consent/revoke-all/${patientId}`,
            { reason },
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Failed to revoke all shares:', error)
        throw new Error(error.response?.data?.error || 'Failed to revoke all shares')
    }
}

// ============================================================================
// PREFERENCES
// ============================================================================

/**
 * Get parent's consent preferences
 * @returns {Promise<{preferences: Object}>}
 */
export const getConsentPreferences = async () => {
    try {
        const response = await axios.get(`${backendConnection()}/consent/preferences`, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Failed to fetch consent preferences:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch consent preferences')
    }
}

/**
 * Update parent's consent preferences
 * @param {Object} preferences - The preferences to update
 * @param {number} [preferences.default_expiry_days] - Default expiry in days (1-365)
 * @param {number} [preferences.default_max_uses] - Default max uses (1-100)
 * @param {string[]} [preferences.default_scope] - Default scope array
 * @param {boolean} [preferences.always_require_pin] - Always require PIN
 * @param {boolean} [preferences.notify_on_access] - Notify on access
 * @param {boolean} [preferences.notify_on_expiry] - Notify on expiry
 * @param {number} [preferences.notify_before_expiry_days] - Days before expiry to notify
 * @param {boolean} [preferences.allow_emergency_override] - Allow emergency override
 * @param {boolean} [preferences.emergency_contact_notified] - Notify emergency contact
 * @returns {Promise<{preferences: Object}>}
 */
export const updateConsentPreferences = async (preferences) => {
    try {
        const response = await axios.put(
            `${backendConnection()}/consent/preferences`,
            preferences,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Failed to update consent preferences:', error)
        throw new Error(error.response?.data?.error || 'Failed to update consent preferences')
    }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get consent statistics for parent's children
 * @returns {Promise<{stats: Object}>}
 */
export const getConsentStats = async () => {
    try {
        const response = await axios.get(`${backendConnection()}/consent/stats`, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Failed to fetch consent stats:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch consent stats')
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format scope array to human-readable labels
 * @param {string[]} scope - Array of scope strings
 * @returns {Object[]} Array of {value, label} objects
 */
export const formatScopeLabels = (scope) => {
    const scopeLabels = {
        view_only: 'View Only',
        allergies: 'Allergies',
        prescriptions: 'Prescriptions',
        vaccinations: 'Vaccinations',
        appointments: 'Appointments',
        vitals: 'Vitals & Measurements',
        full_access: 'Full Access',
    }

    return (scope || []).map((s) => ({
        value: s,
        label: scopeLabels[s] || s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }))
}

/**
 * Get share type label
 * @param {string} shareType - Share type string
 * @returns {string} Human-readable label
 */
export const getShareTypeLabel = (shareType) => {
    const labels = {
        prescription: 'Prescription',
        medical_record: 'Medical Record',
        referral: 'Referral',
        emergency_access: 'Emergency Access',
        parent_access: 'Parent/Guardian Access',
        vaccination: 'Vaccination Record',
        appointment: 'Appointment Info',
    }
    return (
        labels[shareType] ||
        shareType?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
        'Unknown'
    )
}

/**
 * Get status badge color class
 * @param {string} status - Status string
 * @returns {string} Tailwind CSS color classes
 */
export const getStatusColor = (status) => {
    const colors = {
        active: 'bg-green-100 text-green-800 border-green-200',
        expired: 'bg-gray-100 text-gray-800 border-gray-200',
        revoked: 'bg-red-100 text-red-800 border-red-200',
        limit_reached: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Format date to locale string
 * @param {string} dateString - ISO date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A'
    try {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options,
        }
        return new Date(dateString).toLocaleString('en-US', defaultOptions)
    } catch {
        return dateString
    }
}

/**
 * Calculate time remaining until expiry
 * @param {string} expiresAt - ISO date string of expiry
 * @returns {Object} {days, hours, isExpired, label}
 */
export const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return { days: 0, hours: 0, isExpired: true, label: 'Expired' }

    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now

    if (diff <= 0) {
        return { days: 0, hours: 0, isExpired: true, label: 'Expired' }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    let label = ''
    if (days > 0) {
        label = `${days} day${days !== 1 ? 's' : ''}`
        if (hours > 0) label += ` ${hours}h`
    } else if (hours > 0) {
        label = `${hours} hour${hours !== 1 ? 's' : ''}`
    } else {
        label = 'Less than 1 hour'
    }

    return { days, hours, isExpired: false, label }
}

export default {
    getActiveShares,
    getAccessHistory,
    getAccessLogs,
    revokeShare,
    revokeAllShares,
    getConsentPreferences,
    updateConsentPreferences,
    getConsentStats,
    formatScopeLabels,
    getShareTypeLabel,
    getStatusColor,
    formatDate,
    getTimeRemaining,
}
