import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

export const getAuditLogs = async (params = {}) => {
    const response = await axios.get(`${backendConnection()}/admin/audit-logs`, {
        ...axiosConfig,
        params,
    })
    return response
}

export const getAuditStats = async () => {
    const response = await axios.get(`${backendConnection()}/admin/audit-logs/stats`, axiosConfig)
    return response.data
}

export const getAuditDetails = async (logId) => {
    const response = await axios.get(
        `${backendConnection()}/admin/audit-logs/${logId}`,
        axiosConfig
    )
    return response.data
}

export const clearAuditLogs = async () => {
    const response = await axios.delete(`${backendConnection()}/admin/audit-logs/clear`, axiosConfig)
    return response.data
}

export const exportAuditLogs = async (params = {}) => {
    const response = await axios.get(`${backendConnection()}/admin/audit-logs/export`, {
        ...axiosConfig,
        params,
        responseType: 'blob',
    })
    return response
}
