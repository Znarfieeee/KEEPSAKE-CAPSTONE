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
        if (error.response?.status === 401) {
            try {
                // Try to refresh the token
                await refreshSession()
                // If refresh succeeds, retry the session request
                const retryResponse = await axios.get(
                    `${backendConnection()}/session`,
                    axiosConfig
                )
                return retryResponse.data
            } catch (refreshError) {
                console.error("Token refresh failed", refreshError)
                // If refresh fails, throw a specific error
                throw new Error("Session expired. Please login again.")
            }
        }
        throw error
    }
}
