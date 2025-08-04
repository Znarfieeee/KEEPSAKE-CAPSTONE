import backendConnection from "../backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}

export const getUsers = async () => {
    const response = await axios.get(
        `${backendConnection()}/admin/users`,
        axiosConfig
    )
    return response.data
}

export const getUserById = async userId => {
    const response = await axios.get(
        `${backendConnection()}/admin/users/${userId}`,
        axiosConfig
    )
    return response.data
}

export const createUser = async userData => {
    const response = await axios.post(
        `${backendConnection()}/admin/add_user`,
        userData,
        axiosConfig
    )
    return response.data
}

export default {
    getUsers,
    getUserById,
    createUser,
}
