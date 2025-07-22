import backendConnection from "./backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}

export const login = async (email, password) => {
    const response = await axios.post(
        `${backendConnection()}/login`,
        { email, password },
        axiosConfig
    )
    return response.data
}

export const logout = async () => {
    const response = await axios.post(
        `${backendConnection()}/logout`,
        {},
        axiosConfig
    )
    return response.data
}

export const refreshSession = async () => {
    const response = await axios.post(
        `${backendConnection()}/token/refresh`,
        {},
        axiosConfig
    )
    return response.data
}

export const getSession = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/session`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        // Attempt silent refresh once on 401
        if (error.response?.status === 401) {
            try {
                await refreshSession()
                const retryResponse = await axios.get(
                    `${backendConnection()}/session`,
                    axiosConfig
                )
                return retryResponse.data
            } catch (refreshError) {
                console.error("Token refresh failed", refreshError)
                throw new Error("Session expired. Please login again.")
            }
        }
        throw error
    }
}

export const checkSession = async () => {
    const response = await axios.get(
        `${backendConnection()}/session`,
        axiosConfig
    )
    return response.data
}
