import React, { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Context
import { useAuth } from "../context/auth"
import { useQrScanner } from "../context/QrScannerContext"

// UI Components
import { IoMdArrowBack } from "react-icons/io"
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import { BiUser, BiCalendar, BiIdCard } from "react-icons/bi"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import QrCodeScanner from "../components/ui/QrCodeScanner"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"

const QrScanner = () => {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuth()
    const { processQrData, clearScanResult, getRoleAction, getNavigationPath } = useQrScanner()

    const [scannedData, setScannedData] = useState(null)
    const [patientInfo, setPatientInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [scanSuccess, setScanSuccess] = useState(false)

    // Get user role display name
    const getRoleDisplayName = (role) => {
        const roleNames = {
            pediapro: "Doctor",
            vital_custodian: "Nurse/Staff",
            keepsaker: "Parent",
            facility_admin: "Facility Admin",
            system_admin: "System Admin"
        }
        return roleNames[role] || "User"
    }

    // Get action display name
    const getActionDisplayName = (action) => {
        const actionNames = {
            patient_details: "View Patient Details",
            vital_signs: "Record Vital Signs",
            child_info: "View Child Information",
            patient_management: "Manage Patient",
            system_view: "System View"
        }
        return actionNames[action] || "View"
    }

    // Handle successful QR code scan
    const handleScanSuccess = useCallback(async (decodedText, decodedResult) => {
        try {
            setScanSuccess(true)
            setError(null)
            setLoading(true)

            // Process the scanned data
            const result = processQrData(decodedText)
            setScannedData(result)

            // Simulate patient lookup (replace with actual API call)
            await fetchPatientInfo(result)

            setLoading(false)
        } catch (err) {
            console.error("Error handling scan:", err)
            setError("Failed to process scanned QR code")
            setLoading(false)
            setScanSuccess(false)
        }
    }, [processQrData])

    // Fetch patient information based on scanned data
    const fetchPatientInfo = async (scanResult) => {
        // This is a placeholder - implement actual API call
        // For now, extract patient ID and simulate response
        const qrData = scanResult.parsedData
        let patientId = null

        if (qrData.patientId || qrData.patient_id) {
            patientId = qrData.patientId || qrData.patient_id
        } else if (qrData.id) {
            patientId = qrData.id
        } else if (qrData.type === "text") {
            patientId = qrData.value
        }

        if (patientId) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Mock patient data - replace with actual API call
            setPatientInfo({
                id: patientId,
                name: "Patient Name",
                dateOfBirth: "2020-01-15",
                guardianName: "Guardian Name",
                facilityId: user?.facility_id
            })
        }
    }

    // Handle navigation to patient details
    const handleViewDetails = () => {
        if (scannedData) {
            const path = getNavigationPath(scannedData)
            if (path) {
                navigate(path)
            } else {
                setError("Unable to determine navigation path for this QR code")
            }
        }
    }

    // Reset scanner for new scan
    const handleScanAnother = () => {
        setScannedData(null)
        setPatientInfo(null)
        setError(null)
        setScanSuccess(false)
        clearScanResult()
    }

    // Auto-redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login")
        }
    }, [isAuthenticated, navigate])

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Back Button */}
            <div className="absolute top-8 left-8 z-10">
                <div
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary transition duration-300 ease-in-out cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md">
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm font-medium">Go back</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">QR Code Scanner</h1>
                        {user && (
                            <p className="text-gray-600">
                                Scanning as <span className="font-semibold text-primary">{getRoleDisplayName(user.role)}</span>
                            </p>
                        )}
                    </div>

                    {/* Main Content */}
                    {!scannedData ? (
                        <Card className="p-8 shadow-xl">
                            <QrCodeScanner
                                onScanSuccess={handleScanSuccess}
                                width="100%"
                                height="450px"
                                fps={10}
                                qrbox={280}
                            />
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Success Banner */}
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <FiCheckCircle className="text-3xl text-green-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-green-900">QR Code Scanned Successfully!</h3>
                                    <p className="text-sm text-green-700">Patient information retrieved</p>
                                </div>
                            </div>

                            {/* Patient Information */}
                            {loading ? (
                                <Card className="p-8 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <AiOutlineLoading3Quarters className="text-4xl text-primary animate-spin" />
                                        <span className="text-gray-600">Loading patient information...</span>
                                    </div>
                                </Card>
                            ) : patientInfo ? (
                                <Card className="p-6 shadow-lg">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Patient Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <BiIdCard className="text-2xl text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Patient ID</p>
                                                <p className="font-medium text-gray-800">{patientInfo.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <BiUser className="text-2xl text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Patient Name</p>
                                                <p className="font-medium text-gray-800">{patientInfo.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <BiCalendar className="text-2xl text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Date of Birth</p>
                                                <p className="font-medium text-gray-800">{patientInfo.dateOfBirth}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <BiUser className="text-2xl text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Guardian Name</p>
                                                <p className="font-medium text-gray-800">{patientInfo.guardianName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ) : null}

                            {/* Error Display */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <FiAlertCircle className="text-2xl text-red-600 flex-shrink-0" />
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleViewDetails}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition duration-200"
                                    disabled={loading || !patientInfo}
                                >
                                    {getActionDisplayName(getRoleAction(scannedData))}
                                </Button>
                                <Button
                                    onClick={handleScanAnother}
                                    variant="outline"
                                    className="flex-1 border-2 border-gray-300 hover:border-primary hover:text-primary font-medium py-3 rounded-lg transition duration-200"
                                >
                                    Scan Another
                                </Button>
                            </div>

                            {/* Raw Data Display (for debugging) */}
                            {process.env.NODE_ENV === "development" && scannedData && (
                                <Card className="p-4 bg-gray-50">
                                    <details>
                                        <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                                            Debug: Scan Data
                                        </summary>
                                        <pre className="text-xs text-gray-600 overflow-auto">
                                            {JSON.stringify(scannedData, null, 2)}
                                        </pre>
                                    </details>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default QrScanner
