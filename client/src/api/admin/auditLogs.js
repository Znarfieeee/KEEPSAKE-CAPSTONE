import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get audit logs with pagination and filtering
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {AbortSignal} signal - Optional abort signal for request cancellation
 * @returns {Promise} Axios response with data
 */
export const getAuditLogs = async (params = {}, signal = null) => {
    const config = { ...axiosConfig, params }
    if (signal) {
        config.signal = signal
    }
    const response = await axios.get(`${backendConnection()}/admin/audit-logs`, config)
    return response
}

/**
 * Get audit log statistics
 * @param {AbortSignal} signal - Optional abort signal for request cancellation
 * @returns {Promise} Response data
 */
export const getAuditStats = async (signal = null) => {
    const config = { ...axiosConfig }
    if (signal) {
        config.signal = signal
    }
    const response = await axios.get(`${backendConnection()}/admin/audit-logs/stats`, config)
    return response.data
}

/**
 * Get detailed information for a specific audit log
 * @param {string} logId - The log ID to fetch
 * @returns {Promise} Response data
 */
export const getAuditDetails = async (logId) => {
    const response = await axios.get(
        `${backendConnection()}/admin/audit-logs/${logId}`,
        axiosConfig
    )
    return response.data
}

/**
 * Clear all audit logs (admin only)
 * @returns {Promise} Response data
 */
export const clearAuditLogs = async () => {
    const response = await axios.delete(`${backendConnection()}/admin/audit-logs/clear`, axiosConfig)
    return response.data
}

/**
 * Get list of tables that have audit logs
 * @returns {Promise} Response data with table names array
 */
export const getAuditedTables = async () => {
    const response = await axios.get(`${backendConnection()}/admin/audit-logs/tables`, axiosConfig)
    return response.data
}

/**
 * Export audit logs to CSV
 * @param {Object} params - Query parameters for filtering
 * @param {AbortSignal} signal - Optional abort signal for request cancellation
 * @returns {Promise} Axios response with blob data
 */
export const exportAuditLogs = async (params = {}, signal = null) => {
    const config = {
        ...axiosConfig,
        params,
        responseType: 'blob',
    }
    if (signal) {
        config.signal = signal
    }
    const response = await axios.get(`${backendConnection()}/admin/audit-logs/export`, config)
    return response
}
