import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

export const getFacilityUsers = async () => {
    try {
        const response = await axios.get(`${backendConnection()}/facility_users`, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Error fetching facility users:', error)
        throw error
    }
}

export const getFacilityUserById = async (userId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/facility_users/${userId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching user:', error)
        throw error
    }
}

export const createFacilityUser = async (userData) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/facility_users`,
            userData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}

export const updateFacilityUser = async (userId, userData) => {
    try {
        const response = await axios.put(
            `${backendConnection()}/facility_users/${userId}`,
            userData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error updating user:', error)
        throw error
    }
}

export const deleteFacilityUser = async (userId) => {
    try {
        const response = await axios.delete(
            `${backendConnection()}/facility_users/${userId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error deleting user:', error)
        throw error
    }
}

export const activateFacilityUser = async (userId) => {
    try {
        const response = await axios.patch(
            `${backendConnection()}/facility_users/${userId}/activate`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error activating user:', error)
        throw error
    }
}

export const deactivateFacilityUser = async (userId) => {
    try {
        const response = await axios.patch(
            `${backendConnection()}/facility_users/${userId}/deactivate`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error deactivating user:', error)
        throw error
    }
}

export const resendUserInvitation = async (userId) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/facility_users/${userId}/resend-invitation`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error resending invitation:', error)
        throw error
    }
}

export const resetUserPassword = async (userId) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/facility_users/${userId}/reset-password`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error resetting password:', error)
        throw error
    }
}

export const exportFacilityUsers = async (filters = {}) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/facility_users/export`,
            { filters },
            {
                ...axiosConfig,
                responseType: 'blob',
            }
        )

        return response.data
    } catch (error) {
        console.error('Error exporting users:', error)
        throw error
    }
}

export default {
    getFacilityUsers,
    getFacilityUserById,
    createFacilityUser,
    updateFacilityUser,
    deleteFacilityUser,
    activateFacilityUser,
    deactivateFacilityUser,
    resendUserInvitation,
    resetUserPassword,
    exportFacilityUsers,
}
