/**
 * Public Facilities API Client
 * No authentication required - for public-facing pages
 */

import backendConnection from '../backendApi'
import axios from 'axios'

/**
 * Get all active facilities with valid subscriptions for public display
 * @param {boolean} bustCache - Whether to bypass cache
 * @returns {Promise<Object>} List of active facilities with public information
 */
export const getPublicFacilities = async () => {
    try {
        const response = await axios.get(`${backendConnection()}/public/facilities`)
        return response.data
    } catch (error) {
        console.error('Error fetching public facilities:', error)
        throw error
    }
}

export default {
    getPublicFacilities,
}
