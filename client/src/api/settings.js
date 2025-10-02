import { showToast } from '../util/alertHelper'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Get current user's profile information
 */
export const getProfile = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/profile`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch profile')
        }

        return data
    } catch (error) {
        console.error('Get profile error:', error)
        throw error
    }
}

/**
 * Update user profile information
 */
export const updateProfile = async (profileData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile')
        }

        return data
    } catch (error) {
        console.error('Update profile error:', error)
        throw error
    }
}

/**
 * Change user password
 */
export const changePassword = async (passwordData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/change-password`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordData),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password')
        }

        return data
    } catch (error) {
        console.error('Change password error:', error)
        throw error
    }
}

/**
 * Update user email address
 */
export const updateEmail = async (emailData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/update-email`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update email')
        }

        return data
    } catch (error) {
        console.error('Update email error:', error)
        throw error
    }
}

/**
 * Update user phone number
 */
export const updatePhone = async (phoneData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/update-phone`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(phoneData),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update phone number')
        }

        return data
    } catch (error) {
        console.error('Update phone error:', error)
        throw error
    }
}

/**
 * Get 2FA status
 */
export const get2FAStatus = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/2fa/status`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch 2FA status')
        }

        return data
    } catch (error) {
        console.error('Get 2FA status error:', error)
        throw error
    }
}

/**
 * Enable 2FA
 */
export const enable2FA = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/2fa/enable`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to enable 2FA')
        }

        return data
    } catch (error) {
        console.error('Enable 2FA error:', error)
        throw error
    }
}

/**
 * Disable 2FA
 */
export const disable2FA = async (password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/2fa/disable`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to disable 2FA')
        }

        return data
    } catch (error) {
        console.error('Disable 2FA error:', error)
        throw error
    }
}

/**
 * Deactivate user account
 */
export const deactivateAccount = async (password, confirmation) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/deactivate-account`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password, confirmation }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to deactivate account')
        }

        return data
    } catch (error) {
        console.error('Deactivate account error:', error)
        throw error
    }
}
