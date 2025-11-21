import backendConnection from "./backendApi"
import axios from "axios"
import { axiosConfig } from "./axiosConfig"

/**
 * Generate a new QR code for patient access
 * @param {Object} qrData - QR code configuration
 * @param {string} qrData.patient_id - Patient UUID
 * @param {string} qrData.share_type - Type of share (referral, emergency_access, parent_access, etc.)
 * @param {number} qrData.expires_in_days - Number of days until expiration
 * @param {Array<string>} qrData.scope - Access scope (view_only, allergies, prescriptions, etc.)
 * @param {Array<string>} qrData.target_facilities - Optional: UUIDs of facilities allowed to access
 * @param {string} qrData.pin_code - Optional: PIN for additional security
 * @param {number} qrData.max_uses - Optional: Maximum number of times QR can be used
 * @param {boolean} qrData.allow_emergency_access - Optional: Allow emergency access with PIN
 * @returns {Promise<Object>} QR code data including token and access URL
 */
export const generateQRCode = async (qrData) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/qr/generate`,
            qrData,
            axiosConfig
        )

        // Backend returns status: "success" instead of status: 200
        if (response.data && response.data.status === "success") {
            return response.data
        }

        return response.data
    } catch (error) {
        if (error.response) {
            const errorData = error.response.data
            const errorMessage = errorData?.error || "Failed to generate QR code"
            const details = errorData?.details || ""

            if (error.response.status === 400) {
                throw new Error(errorMessage)
            } else if (error.response.status === 404) {
                throw new Error("Patient not found")
            } else if (error.response.status === 403) {
                throw new Error(
                    "You don't have permission to generate QR codes for this patient"
                )
            } else if (error.response.status === 500) {
                // Show more detailed error for debugging
                const detailMsg = details ? `\n\nDetails: ${details}` : ""
                throw new Error(
                    `Server error while generating QR code. Please try again.${detailMsg}`
                )
            }

            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}

/**
 * Validate and access patient data via QR code token
 * @param {string} token - QR code token
 * @param {string} pin - Optional: PIN code for secured QR codes
 * @returns {Promise<Object>} Patient data and access metadata
 */
export const accessQRCode = async (token, pin = null) => {
    try {
        const params = new URLSearchParams({ token })
        if (pin) {
            params.append("pin", pin)
        }

        const response = await axios.get(
            `${backendConnection()}/qr/access?${params.toString()}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorData = error.response.data
            const errorMessage = errorData?.error || "Failed to access QR code"

            if (error.response.status === 400) {
                throw new Error("Invalid QR code token")
            } else if (error.response.status === 403) {
                // Check if PIN is required (new explicit flag from backend)
                if (errorData?.requires_pin) {
                    const pinError = new Error("PIN required")
                    pinError.requiresPin = true
                    throw pinError
                }
                // Specific error messages for different denial reasons
                if (errorMessage.includes("PIN required")) {
                    const pinError = new Error("PIN required")
                    pinError.requiresPin = true
                    throw pinError
                } else if (errorMessage.includes("Invalid PIN")) {
                    throw new Error("Invalid PIN code")
                } else if (errorMessage.includes("expired")) {
                    throw new Error("This QR code has expired")
                } else if (errorMessage.includes("usage limit")) {
                    throw new Error("This QR code has reached its usage limit")
                } else if (errorMessage.includes("not authorized")) {
                    throw new Error(
                        "Your facility is not authorized to access this patient record"
                    )
                }
                throw new Error(errorMessage)
            } else if (error.response.status === 404) {
                throw new Error(
                    "QR code not found or has been deactivated"
                )
            }

            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}

/**
 * List QR codes for the current facility
 * @param {string} patientId - Optional: Filter by patient ID
 * @returns {Promise<Object>} List of QR codes
 */
export const listQRCodes = async (patientId = null) => {
    try {
        const params = patientId
            ? new URLSearchParams({ patient_id: patientId })
            : ""
        const url = params
            ? `${backendConnection()}/qr/list?${params.toString()}`
            : `${backendConnection()}/qr/list`

        const response = await axios.get(url, axiosConfig)
        return response.data
    } catch (error) {
        if (error.response) {
            const errorMessage =
                error.response.data?.error || "Failed to fetch QR codes"
            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}

/**
 * Revoke a QR code (deactivate it)
 * @param {string} qrId - QR code UUID
 * @returns {Promise<Object>} Success message
 */
export const revokeQRCode = async (qrId) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/qr/revoke/${qrId}`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorMessage =
                error.response.data?.error || "Failed to revoke QR code"

            if (error.response.status === 403) {
                throw new Error(
                    "You don't have permission to revoke this QR code"
                )
            } else if (error.response.status === 404) {
                throw new Error("QR code not found")
            }

            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}

/**
 * Get audit history for a specific QR code
 * @param {string} qrId - QR code UUID
 * @returns {Promise<Object>} QR code details and audit logs
 */
export const getQRAuditHistory = async (qrId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/qr/audit/${qrId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorMessage =
                error.response.data?.error ||
                "Failed to fetch audit history"

            if (error.response.status === 403) {
                throw new Error(
                    "You don't have permission to view audit history for this QR code"
                )
            } else if (error.response.status === 404) {
                throw new Error("QR code not found")
            }

            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}

/**
 * Get details of a specific QR code
 * @param {string} qrId - QR code UUID
 * @returns {Promise<Object>} QR code details and patient info
 */
export const getQRCodeDetails = async (qrId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/qr/details/${qrId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorMessage =
                error.response.data?.error ||
                "Failed to fetch QR code details"

            if (error.response.status === 403) {
                throw new Error(
                    "You don't have permission to view this QR code"
                )
            } else if (error.response.status === 404) {
                throw new Error("QR code not found")
            }

            throw new Error(errorMessage)
        } else if (error.request) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            )
        } else {
            throw new Error("An unexpected error occurred. Please try again.")
        }
    }
}
