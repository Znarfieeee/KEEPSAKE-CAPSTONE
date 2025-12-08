import backendConnection from "./backendApi"
import axios from "axios"
import { axiosConfig } from "./axiosConfig"

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

            // Preserve the specific error message from the backend for better UX
            if (error.response.status === 401) {
                // Use backend message for 401 errors, fallback to generic message
                throw new Error(errorMessage.includes('Authentication failed')
                    ? "The email or password you entered is incorrect. Please check your credentials and try again."
                    : errorMessage
                )
            } else if (error.response.status === 400) {
                // For 400 errors, use the backend message directly
                throw new Error(errorMessage)
            } else if (error.response.status === 503) {
                throw new Error(
                    "The authentication service is temporarily unavailable. Please try again in a few minutes."
                )
            } else if (error.response.status === 404) {
                throw new Error(
                    "No account found with this email address. Please contact your administrator if you believe this is an error."
                )
            } else if (error.response.status === 403) {
                throw new Error(
                    "Your account has been deactivated. Please contact your administrator for assistance."
                )
            }

            // For any other server errors, use the backend message directly
            throw new Error(errorMessage)
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error(
                "Unable to connect to the server. Please check your internet connection and try again."
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

/**
 * Verify 2FA login code
 */
export const verify2FALogin = async (userId, code) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/verify-2fa-login`,
            { user_id: userId, code },
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorMessage =
                error.response.data?.message || "Failed to verify 2FA code"

            if (error.response.status === 400) {
                throw new Error(errorMessage)
            } else if (error.response.status === 404) {
                throw new Error("User not found. Please login again.")
            } else if (error.response.status === 500) {
                throw new Error("Verification failed. Please try again.")
            }

            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection and try again."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}
