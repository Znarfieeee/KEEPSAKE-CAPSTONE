import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get all doctor reports data (consolidated endpoint)
 * Returns: patient growth, immunizations, appointments, record updates, summary metrics
 *
 * @param {Object} params - Query parameters
 * @param {boolean} params.bust_cache - Force cache refresh (default: false)
 * @returns {Promise} Response with report data
 */
export const getDoctorReports = async (params = {}) => {
    const response = await axios.get(
        `${backendConnection()}/doctor/reports/all`,
        { ...axiosConfig, params }
    )
    return response.data
}
