import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get list of children for the parent
 * @returns {Promise} Response with children list
 */
export const getParentChildren = async () => {
    const response = await axios.get(
        `${backendConnection()}/parent/reports/children`,
        axiosConfig
    )
    return response.data
}

/**
 * Get comprehensive report data for a specific child
 * Includes: Growth data, vitals, immunizations
 *
 * @param {string} patientId - The child's patient ID
 * @param {Object} params - Query parameters
 * @param {boolean} params.bust_cache - Force cache refresh (default: false)
 * @returns {Promise} Response with child report data
 */
export const getChildReport = async (patientId, params = {}) => {
    const response = await axios.get(
        `${backendConnection()}/parent/reports/child/${patientId}`,
        { ...axiosConfig, params }
    )
    return response.data
}
