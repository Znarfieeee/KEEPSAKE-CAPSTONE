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
 * Access prescription data via QR code token (PUBLIC - No authentication required)
 * This works with any QR scanner (iPhone, Android, web browsers, etc.)
 * @param {string} token - QR code token
 * @param {string} pin - Optional: PIN code for secured QR codes
 * @returns {Promise<Object>} Prescription data and metadata
 */
export const accessPrescriptionPublic = async (token, pin = null) => {
    try {
        const params = new URLSearchParams({ token })
        if (pin) {
            params.append("pin", pin)
        }

        // Public endpoint - no credentials needed
        const response = await axios.get(
            `${backendConnection()}/qr/prescription/public?${params.toString()}`,
            {
                headers: {
                    "Content-Type": "application/json",
                }
                // Note: No withCredentials - this is a public endpoint
            }
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorData = error.response.data
            const status = errorData?.status || ""
            const errorMessage = errorData?.error || "Failed to access prescription"

            // Handle specific status codes
            if (status === "pin_required" || errorData?.requires_pin) {
                const pinError = new Error("PIN required")
                pinError.requiresPin = true
                throw pinError
            } else if (status === "invalid_pin") {
                throw new Error("Invalid PIN code")
            } else if (status === "expired") {
                throw new Error("This prescription QR code has expired")
            } else if (status === "limit_reached") {
                throw new Error("This QR code has reached its usage limit")
            } else if (error.response.status === 404) {
                throw new Error("Invalid or expired QR code")
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

/**
 * Grant parent access to a patient via QR code token
 * This is called when a parent scans a QR code generated by a doctor
 * @param {string} token - QR code token
 * @returns {Promise<Object>} Access grant result with patient info
 */
export const grantParentAccess = async (token) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/qr/grant-parent-access`,
            { token },
            axiosConfig
        )

        if (response.data && response.data.status === "success") {
            return response.data
        }

        return response.data
    } catch (error) {
        if (error.response) {
            const errorData = error.response.data
            const errorCode = errorData?.code || ""
            const errorMessage = errorData?.error || "Failed to grant parent access"

            // Handle specific error codes
            if (errorCode === "invalid_role") {
                throw new Error("Only parents can claim parent access. Please log in with a parent account.")
            } else if (errorCode === "invalid_token" || error.response.status === 404) {
                throw new Error("Invalid or expired QR code. Please request a new one.")
            } else if (errorCode === "invalid_share_type") {
                throw new Error("This QR code is not for parent access.")
            } else if (errorCode === "expired") {
                throw new Error("This QR code has expired. Please request a new one from the doctor.")
            } else if (errorCode === "limit_reached") {
                throw new Error("This QR code has already been used.")
            } else if (errorCode === "already_exists") {
                throw new Error("You already have access to this child's records.")
            } else if (error.response.status === 403) {
                throw new Error(errorMessage)
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
 * Check if a QR code token is for parent access grant
 * @param {string} token - QR code token
 * @returns {Promise<Object>} QR code info including share_type
 */
export const checkQRCodeType = async (token) => {
    try {
        const params = new URLSearchParams({ token })
        const response = await axios.get(
            `${backendConnection()}/qr/check-type?${params.toString()}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        if (error.response) {
            const errorMessage =
                error.response.data?.error || "Failed to check QR code type"
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
