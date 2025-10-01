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
    const response = await axios.delete(`${backendConnection()}/admin/users/${userId}`, axiosConfig)
    return response.data
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
    const response = await axios.patch(
        `${backendConnection()}/admin/users/${userId}/status`,
        { is_active: status === 'active' },
        axiosConfig
    )
    return response.data
}

export const assignUserToFacility = async (userId, facilityData) => {
    const response = await axios.post(
        `${backendConnection()}/admin/users/${userId}/assign-facility`,
        facilityData,
        axiosConfig
    )
    return response.data
}

export const removeUserFromFacility = async (userId, facilityId) => {
    const response = await axios.delete(
        `${backendConnection()}/admin/users/${userId}/facilities/${facilityId}`,
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
}
