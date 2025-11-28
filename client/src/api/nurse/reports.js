import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get all nurse/clinic reports data (consolidated endpoint)
 * Returns: appointments, record updates, summary metrics
 *
 * @param {Object} params - Query parameters
 * @param {boolean} params.bust_cache - Force cache refresh (default: false)
 * @returns {Promise} Response with report data
 */
export const getNurseReports = async (params = {}) => {
    const response = await axios.get(
        `${backendConnection()}/nurse/reports/all`,
        { ...axiosConfig, params }
    )
    return response.data
}
