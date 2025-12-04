import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

export const getAdminDashboardMetrics = async (bustCache = false) => {
    try {
        const url = bustCache
            ? `${backendConnection()}/admin/dashboard?bust_cache=true`
            : `${backendConnection()}/admin/dashboard`

        const response = await axios.get(url, axiosConfig)
        return response.data
    } catch (error) {
        throw error
    }
}

export default {
    getAdminDashboardMetrics,
}
