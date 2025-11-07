import api from "./axios"

/**
 * Get patient information by QR code data
 * @param {string} qrData - The decoded QR code data (patient ID or JSON)
 * @returns {Promise} Patient information
 */
export const getPatientByQrCode = async (qrData) => {
    try {
        // Parse QR data to extract patient ID
        let patientId = null

        try {
            const parsed = JSON.parse(qrData)
            patientId = parsed.patientId || parsed.patient_id || parsed.id
        } catch {
            // If not JSON, assume it's the patient ID itself
            patientId = qrData
        }

        if (!patientId) {
            throw new Error("Invalid QR code format: No patient ID found")
        }

        const response = await api.get(`/api/patients/${patientId}/qr-lookup`)
        return response.data
    } catch (error) {
        console.error("Error fetching patient by QR code:", error)
        throw error
    }
}

/**
 * Verify QR code and get patient access permissions
 * @param {string} qrData - The decoded QR code data
 * @param {string} userId - The current user's ID
 * @returns {Promise} Access verification result
 */
export const verifyQrCodeAccess = async (qrData, userId) => {
    try {
        const response = await api.post("/api/qr-scanner/verify", {
            qrData,
            userId
        })
        return response.data
    } catch (error) {
        console.error("Error verifying QR code access:", error)
        throw error
    }
}

/**
 * Log QR code scan event for audit trail
 * @param {Object} scanData - The scan data to log
 * @returns {Promise} Log result
 */
export const logQrScanEvent = async (scanData) => {
    try {
        const response = await api.post("/api/qr-scanner/log", scanData)
        return response.data
    } catch (error) {
        console.error("Error logging QR scan event:", error)
        // Don't throw - logging failures shouldn't block functionality
        return null
    }
}

/**
 * Get patient details by ID for different roles
 * @param {string} patientId - The patient ID
 * @param {string} role - The user's role
 * @returns {Promise} Role-specific patient data
 */
export const getPatientDetailsByRole = async (patientId, role) => {
    try {
        const response = await api.get(`/api/patients/${patientId}/details`, {
            params: { role }
        })
        return response.data
    } catch (error) {
        console.error("Error fetching patient details:", error)
        throw error
    }
}

export default {
    getPatientByQrCode,
    verifyQrCodeAccess,
    logQrScanEvent,
    getPatientDetailsByRole
}
