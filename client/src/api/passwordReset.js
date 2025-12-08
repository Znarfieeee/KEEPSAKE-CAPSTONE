/**
 * Password Reset API Functions
 * Handles password reset requests for KEEPSAKE Healthcare System
 */
import axios from 'axios'

// Get backend connection from environment or default
const backendConnection = () => {
    return import.meta.env.VITE_BACKEND_CONNECTION || 'http://localhost:5000'
}

// Axios configuration
const axiosConfig = {
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
}

/**
 * Request a password reset link
 *
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
export const requestPasswordReset = async (email) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/password-reset/request`,
            { email },
            axiosConfig
        )

        return response.data
    } catch (error) {
        // Handle rate limiting (429)
        if (error.response?.status === 429) {
            throw new Error(error.response.data.message || 'Too many password reset attempts. Please try again later.')
        }

        // Handle validation errors (400)
        if (error.response?.status === 400) {
            throw new Error(error.response.data.message || 'Invalid email address')
        }

        // Handle server errors
        if (error.response?.status >= 500) {
            throw new Error('Server error. Please try again later.')
        }

        // Network or other errors
        throw new Error(error.response?.data?.message || 'Failed to request password reset. Please check your connection.')
    }
}

/**
 * Verify a password reset token
 *
 * @param {string} token - Reset token from URL
 * @returns {Promise<Object>} Response data with email and validity
 * @throws {Error} If token is invalid or expired
 */
export const verifyResetToken = async (token) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/password-reset/verify`,
            { token },
            axiosConfig
        )

        return response.data
    } catch (error) {
        // Handle invalid token (400)
        if (error.response?.status === 400) {
            throw new Error(error.response.data.message || 'Invalid or expired reset link')
        }

        // Handle server errors
        if (error.response?.status >= 500) {
            throw new Error('Server error. Please try again later.')
        }

        // Network or other errors
        throw new Error(error.response?.data?.message || 'Failed to verify reset link')
    }
}

/**
 * Reset password using a valid token
 *
 * @param {string} token - Reset token from URL
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Response data
 * @throws {Error} If reset fails
 */
export const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/password-reset/reset`,
            {
                token,
                new_password: newPassword,
                confirm_password: confirmPassword,
            },
            axiosConfig
        )

        return response.data
    } catch (error) {
        // Handle validation errors (400)
        if (error.response?.status === 400) {
            const message = error.response.data.message

            // Password validation errors
            if (message.includes('at least 8 characters')) {
                throw new Error('Password must be at least 8 characters long')
            }
            if (message.includes('uppercase')) {
                throw new Error('Password must contain at least one uppercase letter')
            }
            if (message.includes('lowercase')) {
                throw new Error('Password must contain at least one lowercase letter')
            }
            if (message.includes('number')) {
                throw new Error('Password must contain at least one number')
            }
            if (message.includes('special character')) {
                throw new Error('Password must contain at least one special character')
            }
            if (message.includes('do not match')) {
                throw new Error('Passwords do not match')
            }
            if (message.includes('expired') || message.includes('invalid')) {
                throw new Error('This reset link has expired or is invalid. Please request a new one.')
            }
            if (message.includes('already been used')) {
                throw new Error('This reset link has already been used. Please request a new one.')
            }

            // Generic validation error
            throw new Error(message || 'Password reset failed')
        }

        // Handle server errors
        if (error.response?.status >= 500) {
            throw new Error('Server error. Please try again later.')
        }

        // Network or other errors
        throw new Error(error.response?.data?.message || 'Failed to reset password. Please try again.')
    }
}

/**
 * Check password reset service health
 *
 * @returns {Promise<Object>} Service health status
 */
export const checkPasswordResetHealth = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/password-reset/health`,
            axiosConfig
        )

        return response.data
    } catch (error) {
        throw new Error('Failed to check service health')
    }
}

export default {
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
    checkPasswordResetHealth,
}
