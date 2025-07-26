import backendConnection from "./backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}

export const login = async (email, password) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/login`,
            { email, password },
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            // The server responded with a status code outside of 2xx
            const errorMessage =
                error.response.data?.message || "Authentication failed"

            if (error.response.status === 401) {
                throw new Error(
                    "Incorrect email or password. Please try again."
                )
            } else if (error.response.status === 400) {
                throw new Error(errorMessage)
            } else if (error.response.status === 503) {
                throw new Error(
                    "Service is temporarily unavailable. Please try again later."
                )
            }
            throw new Error(errorMessage)
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error(
                "Unable to reach the server. Please check your internet connection."
            )
        } else {
            // Something happened in setting up the request
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
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
