/* eslint-disable no-unused-vars */
import backendConnection from "./backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    // Silence Axios error logging
    silent: true,
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

export const logout = async (silent = false) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/logout`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (!silent) {
            throw error // Propagate error for non-silent logout
        }
        // Return a default response for silent logout
        return { status: "success", message: "Logged out" }
    }
}

export const refreshSession = async () => {
    try {
        const response = await axios.post(
            `${backendConnection()}/token/refresh`,
            {},
            axiosConfig
        )
        return response.data
    } catch {
        // Silent failure for token refresh
        return { status: "error", message: "Session expired" }
    }
}

export const getSession = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/session`,
            axiosConfig
        )
        return response.data
    } catch {
        // Handle all session check failures silently
        return { status: "error", message: "No active session" }
    }
}

export const checkSession = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/session`,
            axiosConfig
        )
        return response.data
    } catch {
        return { status: "error", message: "No active session" }
    }
}
