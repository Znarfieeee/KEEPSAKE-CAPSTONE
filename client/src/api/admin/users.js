import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

// USE SUPABASE REAL-TIME INSTEAD
export const getUsers = async () => {
    const response = await axios.get(`${backendConnection()}/admin/users`, axiosConfig)
    return response.data
}

export const getUserById = async (userId) => {
    const response = await axios.get(`${backendConnection()}/admin/users/${userId}`, axiosConfig)
    return response.data
}

export const createUser = async (userData) => {
    const response = await axios.post(
        `${backendConnection()}/admin/add_user`,
        userData,
        axiosConfig
    )
    return response.data
}

export const deleteUser = async (userId) => {
    try {
        const response = await axios.delete(`${backendConnection()}/admin/users/${userId}`, axiosConfig)
        return response.data
    } catch (error) {
        // Handle axios error responses (400, 500, etc.)
        if (error.response && error.response.data) {
            // Return the error response data so the caller can access the message
            return error.response.data
        }
        // If no response data, throw the error
        throw error
    }
}

export const updateUser = async (userId, userData) => {
    const response = await axios.put(
        `${backendConnection()}/admin/users/${userId}`,
        userData,
        axiosConfig
    )
    return response.data
}

export const updateUserStatus = async (userId, status) => {
    try {
        // Use the toggle-status endpoint which handles both activate and deactivate
        const response = await axios.patch(
            `${backendConnection()}/admin/users/${userId}/toggle-status`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        // Handle axios error responses (400, 500, etc.)
        if (error.response && error.response.data) {
            // Return the error response data so the caller can access the message
            return error.response.data
        }
        // If no response data, throw the error
        throw error
    }
}

export const assignUserToFacility = async (userId, facilityData) => {
    const response = await axios.post(
        `${backendConnection()}/admin/users/${userId}/assign-facility`,
        facilityData,
        axiosConfig
    )
    return response.data
}

export const removeUserFromFacility = async (facilityId, userId) => {
    const response = await axios.delete(
        `${backendConnection()}/admin/facilities/${facilityId}/users/${userId}`,
        axiosConfig
    )
    return response.data
}

export const updateFacilityUser = async (facilityId, userId, userData) => {
    const response = await axios.put(
        `${backendConnection()}/admin/facilities/${facilityId}/users/${userId}`,
        userData,
        axiosConfig
    )
    return response.data
}

export default {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    assignUserToFacility,
    removeUserFromFacility,
    updateFacilityUser,
}
