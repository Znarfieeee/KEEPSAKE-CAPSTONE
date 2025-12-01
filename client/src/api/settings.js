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
 * Complete first login by updating last_signed_in_at
 */
export const completeFirstLogin = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/complete-first-login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to complete first login')
        }

        return data
    } catch (error) {
        console.error('Complete first login error:', error)
        throw error
    }
}

/**
 * Request email change with verification code
 */
export const requestEmailChange = async (newEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/request-email-change`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ new_email: newEmail }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to request email change')
        }

        return data
    } catch (error) {
        console.error('Request email change error:', error)
        throw error
    }
}

/**
 * Verify email change code
 */
export const verifyEmailChange = async (code) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/verify-email-change`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to verify email change')
        }

        return data
    } catch (error) {
        console.error('Verify email change error:', error)
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
 * Verify 2FA code
 */
export const verify2FACode = async (code) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/2fa/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to verify 2FA code')
        }

        return data
    } catch (error) {
        console.error('Verify 2FA code error:', error)
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
