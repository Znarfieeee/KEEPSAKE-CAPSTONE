import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get ALL report data in a single optimized request
 * This replaces 5 separate API calls with 1 consolidated call for better performance
 *
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Start date (YYYY-MM-DD)
 * @param {string} params.end_date - End date (YYYY-MM-DD)
 * @param {string} params.role - Optional role filter
 * @param {boolean} params.bust_cache - Force refresh cache
 * @param {string} params.selected_month - Selected month for MAU (YYYY-MM format)
 * @returns {Promise} API response with all report data
 */
export const getAllReports = async (params = {}) => {
    const response = await axios.get(
        `${backendConnection()}/admin/reports/all`,
        { ...axiosConfig, params }
    )
    return response.data
}
