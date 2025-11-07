import React, { createContext, useContext, useState, useCallback } from "react"
import { useAuth } from "./auth"

const QrScannerContext = createContext()

export const useQrScanner = () => {
    const context = useContext(QrScannerContext)
    if (!context) {
        throw new Error("useQrScanner must be used within QrScannerProvider")
    }
    return context
}

export const QrScannerProvider = ({ children }) => {
    const { user } = useAuth()
    const [scanResult, setScanResult] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)

    /**
     * Process scanned QR code data based on user role
     * @param {string} data - The decoded QR code data
     * @returns {Object} Processed result with type and data
     */
    const processQrData = useCallback((data) => {
        try {
            setIsProcessing(true)
            setError(null)

            // Try to parse as JSON first
            let qrData
            try {
                qrData = JSON.parse(data)
            } catch {
                // If not JSON, treat as plain text (could be patient ID, etc.)
                qrData = { type: "text", value: data }
            }

            // Determine what to do based on QR code type and user role
            const result = {
                rawData: data,
                parsedData: qrData,
                scannedAt: new Date().toISOString(),
                scannedBy: user?.id,
                userRole: user?.role
            }

            setScanResult(result)
            setIsProcessing(false)
            return result
        } catch (err) {
            console.error("Error processing QR data:", err)
            setError("Failed to process QR code data")
            setIsProcessing(false)
            return null
        }
    }, [user])

    /**
     * Clear the current scan result
     */
    const clearScanResult = useCallback(() => {
        setScanResult(null)
        setError(null)
    }, [])

    /**
     * Get role-specific action for scanned data
     * @param {Object} scanData - The processed scan data
     * @returns {string} Action type
     */
    const getRoleAction = useCallback((scanData) => {
        if (!user || !scanData) return "view"

        const role = user.role

        switch (role) {
            case "pediapro": // Doctor
                return "patient_details" // View patient records, appointments, prescriptions
            case "vital_custodian": // Nurse/Staff
                return "vital_signs" // Record vital signs and measurements
            case "keepsaker": // Parent
                return "child_info" // View child information
            case "facility_admin":
                return "patient_management" // Manage patient, view all details
            case "system_admin":
                return "system_view" // System-level view
            default:
                return "view"
        }
    }, [user])

    /**
     * Get navigation path based on role and scan data
     * @param {Object} scanData - The processed scan data
     * @returns {string} Navigation path
     */
    const getNavigationPath = useCallback((scanData) => {
        if (!scanData || !scanData.parsedData) return null

        const action = getRoleAction(scanData)
        const qrData = scanData.parsedData

        // Extract patient ID from various formats
        let patientId = null
        if (qrData.patientId) {
            patientId = qrData.patientId
        } else if (qrData.patient_id) {
            patientId = qrData.patient_id
        } else if (qrData.id) {
            patientId = qrData.id
        } else if (qrData.type === "text") {
            // Assume the text value is the patient ID
            patientId = qrData.value
        }

        if (!patientId) return null

        // Role-specific navigation
        switch (action) {
            case "patient_details":
                return `/pediapro/patient_records/${patientId}`
            case "vital_signs":
                return `/vital_custodian/patient/${patientId}/vitals`
            case "child_info":
                return `/parent/child/${patientId}`
            case "patient_management":
                return `/facility_admin/patients/${patientId}`
            default:
                return null
        }
    }, [getRoleAction])

    const value = {
        scanResult,
        isProcessing,
        error,
        processQrData,
        clearScanResult,
        getRoleAction,
        getNavigationPath
    }

    return (
        <QrScannerContext.Provider value={value}>
            {children}
        </QrScannerContext.Provider>
    )
}

export default QrScannerContext
