import React, { useState, useCallback, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import jsQR from "jsqr"

// Context
import { useAuth } from "../../context/auth"
import { useQrScanner } from "../../context/QrScannerContext"

// API
import { accessQRCode } from "../../api/qrCode"

// UI Components
import { IoMdArrowBack } from "react-icons/io"
import { FiCheckCircle, FiAlertCircle, FiLock, FiClock, FiHash, FiShield, FiCamera, FiUpload, FiImage, FiX } from "react-icons/fi"
import { BiUser, BiCalendar, BiIdCard } from "react-icons/bi"
import { MdMedicalServices, MdVaccines } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import EnhancedQrScanner from "../ui/EnhancedQrScanner"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import QRPinInputModal from "./QRPinInputModal"

// Role-specific dashboard routes for navigation
const DASHBOARD_ROUTES = {
    pediapro: "/pediapro",
    doctor: "/pediapro",
    vital_custodian: "/vital_custodian",
    nurse: "/vital_custodian",
    keepsaker: "/parent",
    parent: "/parent",
    facility_admin: "/facility_admin",
    admin: "/admin",
    system_admin: "/admin"
}

// Role display names
const ROLE_NAMES = {
    pediapro: "Doctor",
    doctor: "Doctor",
    vital_custodian: "Nurse/Staff",
    nurse: "Nurse/Staff",
    keepsaker: "Parent",
    parent: "Parent",
    guardian: "Parent/Guardian",
    facility_admin: "Facility Admin",
    system_admin: "System Admin"
}

// Action display names
const ACTION_NAMES = {
    patient_details: "View Patient Details",
    vital_signs: "Record Vital Signs",
    child_info: "View Child Information",
    patient_management: "Manage Patient",
    system_view: "System View"
}

// Scan mode enum
const SCAN_MODES = {
    CAMERA: "camera",
    UPLOAD: "upload"
}

const QrScannerBase = ({
    roleTitle = "User",
    roleColor = "primary",
    customBackPath = null
}) => {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuth()
    const { processQrData, clearScanResult, getRoleAction, getNavigationPath } = useQrScanner()

    // Scan mode state
    const [scanMode, setScanMode] = useState(SCAN_MODES.CAMERA)

    // Scanner state
    const [scannedData, setScannedData] = useState(null)
    const [patientInfo, setPatientInfo] = useState(null)
    const [qrMetadata, setQrMetadata] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [scanSuccess, setScanSuccess] = useState(false)

    // Upload state
    const [uploadedImage, setUploadedImage] = useState(null)
    const [uploadPreview, setUploadPreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [processingUpload, setProcessingUpload] = useState(false)
    const fileInputRef = useRef(null)
    const canvasRef = useRef(null)

    // PIN Modal state
    const [showPinModal, setShowPinModal] = useState(false)
    const [pendingToken, setPendingToken] = useState(null)
    const [pinError, setPinError] = useState(null)
    const [pinLoading, setPinLoading] = useState(false)

    // Get role display name
    const getRoleDisplayName = (role) => {
        return ROLE_NAMES[role] || role || "User"
    }

    // Get action display name
    const getActionDisplayName = (action) => {
        return ACTION_NAMES[action] || "View"
    }

    // Handle role-aware back navigation
    const handleGoBack = () => {
        if (customBackPath) {
            navigate(customBackPath)
            return
        }
        const dashboardPath = DASHBOARD_ROUTES[user?.role] || "/"
        navigate(dashboardPath)
    }

    // Extract token from QR code data (could be URL or direct token)
    const extractToken = (data) => {
        // Check if it's a URL with token parameter
        try {
            const url = new URL(data)
            const token = url.searchParams.get("token")
            if (token) {
                // Check if it's a prescription URL - should redirect to prescription view
                if (url.pathname.includes("/prescription/view")) {
                    return { type: "prescription", value: token, fullUrl: data }
                }
                return { type: "token", value: token }
            }
        } catch {
            // Not a URL, continue checking
        }

        // Check if it's JSON with token field
        try {
            const jsonData = JSON.parse(data)
            if (jsonData.token) return { type: "token", value: jsonData.token }
            if (jsonData.access_url) {
                const url = new URL(jsonData.access_url)
                const token = url.searchParams.get("token")
                if (token) {
                    // Check if it's a prescription URL
                    if (url.pathname.includes("/prescription/view")) {
                        return { type: "prescription", value: token, fullUrl: jsonData.access_url }
                    }
                    return { type: "token", value: token }
                }
            }
            // Legacy direct patient data
            if (jsonData.patientId || jsonData.patient_id) {
                return { type: "legacy", value: jsonData }
            }
        } catch {
            // Not valid JSON
        }

        // Check if it looks like a token string (base64url format)
        if (/^[A-Za-z0-9_-]{30,}$/.test(data)) {
            return { type: "token", value: data }
        }

        // Default: treat as legacy data
        return { type: "legacy", value: data }
    }

    // Validate token with backend API
    const validateToken = async (token, pin = null) => {
        try {
            const response = await accessQRCode(token, pin)

            // Set patient info from response
            const patientData = response.patient_data || {}
            setPatientInfo({
                id: patientData.patient_id || patientData.id,
                name: `${patientData.firstname || ""} ${patientData.middlename || ""} ${patientData.lastname || ""}`.trim() || "Unknown Patient",
                dateOfBirth: patientData.date_of_birth || patientData.dateOfBirth,
                sex: patientData.sex,
                bloodType: patientData.bloodtype,
                allergies: patientData.allergies || [],
                prescriptions: patientData.prescriptions || [],
                vaccinations: patientData.vaccinations || [],
                appointments: patientData.appointments || [],
                vitals: patientData.vitals || [],
                facilityId: patientData.facility_id || user?.facility_id
            })

            // Set QR metadata
            setQrMetadata({
                accessType: response.access_type,
                scope: response.qr_metadata?.scope || [],
                expiresAt: response.qr_metadata?.expires_at,
                usesRemaining: response.qr_metadata?.max_uses
                    ? response.qr_metadata.max_uses - (response.qr_metadata.use_count || 0)
                    : null,
                shareType: response.qr_metadata?.share_type,
                generatedBy: response.qr_metadata?.generated_by_name
            })

            return true
        } catch (err) {
            throw err
        }
    }

    // Process QR code data (shared by both camera and upload)
    const processScannedData = async (decodedText) => {
        try {
            setScanSuccess(true)
            setError(null)
            setLoading(true)

            // Process the scanned data
            const result = processQrData(decodedText)
            setScannedData(result)

            // Extract token or legacy data
            const extracted = extractToken(decodedText)

            // Handle prescription QR codes - redirect to dedicated prescription view page
            if (extracted.type === "prescription") {
                console.log("Prescription QR detected, redirecting to prescription view...")
                navigate(`/prescription/view?token=${extracted.value}`)
                return
            }

            if (extracted.type === "token") {
                // Token-based QR code - validate with backend
                try {
                    await validateToken(extracted.value)
                    setLoading(false)
                } catch (err) {
                    // Check if PIN is required (using explicit flag or message)
                    if (err.requiresPin || err.message.includes("PIN required") || err.message.includes("pin required")) {
                        setPendingToken(extracted.value)
                        setShowPinModal(true)
                        setLoading(false)
                    } else {
                        throw err
                    }
                }
            } else {
                // Legacy direct data - use old flow
                await fetchPatientInfoLegacy(result)
                setLoading(false)
            }
        } catch (err) {
            console.error("Error handling scan:", err)
            setError(err.message || "Failed to process scanned QR code")
            setLoading(false)
            setScanSuccess(false)
        }
    }

    // Handle successful QR code scan from camera
    const handleScanSuccess = useCallback(async (decodedText, decodedResult) => {
        await processScannedData(decodedText)
    }, [processQrData, navigate])

    // Handle QR code upload and decode
    const handleUploadDecode = useCallback(async (file) => {
        if (!file) return

        // Validate file type
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
        if (!validTypes.includes(file.type)) {
            setError("Invalid file type. Please upload PNG, JPG, GIF, or WebP images.")
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("File too large. Maximum size is 5MB.")
            return
        }

        setProcessingUpload(true)
        setError(null)

        try {
            // Create image from file
            const imageUrl = URL.createObjectURL(file)
            setUploadPreview(imageUrl)
            setUploadedImage(file)

            const img = new Image()
            img.onload = async () => {
                try {
                    // Create canvas and draw image
                    const canvas = canvasRef.current || document.createElement("canvas")
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext("2d", { willReadFrequently: true })
                    ctx.drawImage(img, 0, 0)

                    // Get image data for jsQR
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                    // Try to decode QR code
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "attemptBoth"
                    })

                    if (code) {
                        console.log("QR Code found in uploaded image:", code.data)
                        setProcessingUpload(false)
                        await processScannedData(code.data)
                    } else {
                        setProcessingUpload(false)
                        setError("No QR code found in the uploaded image. Please try another image or use camera scan.")
                    }
                } catch (err) {
                    console.error("Error decoding QR:", err)
                    setProcessingUpload(false)
                    setError("Failed to decode QR code from image.")
                }
            }

            img.onerror = () => {
                setProcessingUpload(false)
                setError("Failed to load image. Please try another file.")
            }

            img.src = imageUrl
        } catch (err) {
            console.error("Error processing upload:", err)
            setProcessingUpload(false)
            setError("Failed to process uploaded image.")
        }
    }, [processScannedData])

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            handleUploadDecode(file)
        }
    }

    // Handle drag events
    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleUploadDecode(file)
        }
    }

    // Clear upload preview
    const clearUpload = () => {
        setUploadedImage(null)
        setUploadPreview(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Handle PIN submission
    const handlePinSubmit = async (pin) => {
        if (!pendingToken) return

        setPinLoading(true)
        setPinError(null)

        try {
            await validateToken(pendingToken, pin)
            setShowPinModal(false)
            setPendingToken(null)
            setPinLoading(false)
        } catch (err) {
            setPinError(err.message || "Invalid PIN")
            setPinLoading(false)
        }
    }

    // Handle PIN modal close
    const handlePinModalClose = () => {
        setShowPinModal(false)
        setPendingToken(null)
        setPinError(null)
        setScanSuccess(false)
        setScannedData(null)
    }

    // Fetch patient information (legacy flow for non-token QR codes)
    const fetchPatientInfoLegacy = async (scanResult) => {
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

            // Mock patient data for legacy QR codes
            setPatientInfo({
                id: patientId,
                name: qrData.patientName || "Unknown Patient",
                dateOfBirth: qrData.dateOfBirth || "N/A",
                facilityId: qrData.facilityId || user?.facility_id
            })

            // No metadata for legacy codes
            setQrMetadata(null)
        }
    }

    // Handle navigation to patient details
    const handleViewDetails = () => {
        if (patientInfo?.id) {
            const role = user?.role
            let path = null

            switch (role) {
                case "pediapro":
                case "doctor":
                    path = `/pediapro/patient_records/${patientInfo.id}`
                    break
                case "vital_custodian":
                    path = `/vital_custodian/patient/${patientInfo.id}/vitals`
                    break
                case "keepsaker":
                case "parent":
                    path = `/parent/child/${patientInfo.id}`
                    break
                case "facility_admin":
                    path = `/facility_admin/patients/${patientInfo.id}`
                    break
                default:
                    path = `/pediapro/patient_records/${patientInfo.id}`
            }

            if (path) {
                navigate(path)
                return
            }
        }

        // Fallback to legacy navigation
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
        setQrMetadata(null)
        setError(null)
        setScanSuccess(false)
        setPendingToken(null)
        setPinError(null)
        setUploadedImage(null)
        setUploadPreview(null)
        clearScanResult()
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Format scope for display
    const formatScope = (scope) => {
        const scopeLabels = {
            view_only: "Basic Info",
            allergies: "Allergies",
            prescriptions: "Prescriptions",
            vaccinations: "Vaccinations",
            appointments: "Appointments",
            vitals: "Vital Signs",
            full_access: "Full Access"
        }
        if (!Array.isArray(scope)) return "View Only"
        return scope.map(s => scopeLabels[s] || s).join(", ")
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A"
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })
        } catch {
            return dateString
        }
    }

    // Format datetime for display
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A"
        try {
            return new Date(dateString).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        } catch {
            return dateString
        }
    }

    // Auto-redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login")
        }
    }, [isAuthenticated, navigate])

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Back Button */}
            <div className="absolute top-8 left-8 z-10">
                <div
                    onClick={handleGoBack}
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
                                Scanning as <span className={`font-semibold text-${roleColor}`}>{roleTitle || getRoleDisplayName(user.role)}</span>
                            </p>
                        )}
                    </div>

                    {/* Main Content */}
                    {!scannedData ? (
                        <Card className="p-6 shadow-xl">
                            {/* Scan Mode Toggle */}
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => {
                                            setScanMode(SCAN_MODES.CAMERA)
                                            clearUpload()
                                            setError(null)
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            scanMode === SCAN_MODES.CAMERA
                                                ? "bg-white text-primary shadow-sm"
                                                : "text-gray-600 hover:text-gray-800"
                                        }`}
                                    >
                                        <FiCamera className="text-lg" />
                                        Camera Scan
                                    </button>
                                    <button
                                        onClick={() => {
                                            setScanMode(SCAN_MODES.UPLOAD)
                                            setError(null)
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            scanMode === SCAN_MODES.UPLOAD
                                                ? "bg-white text-primary shadow-sm"
                                                : "text-gray-600 hover:text-gray-800"
                                        }`}
                                    >
                                        <FiUpload className="text-lg" />
                                        Upload Image
                                    </button>
                                </div>
                            </div>

                            {/* Camera Scanner */}
                            {scanMode === SCAN_MODES.CAMERA && (
                                <EnhancedQrScanner
                                    onScanSuccess={handleScanSuccess}
                                    width="100%"
                                    height="500px"
                                />
                            )}

                            {/* Upload Scanner */}
                            {scanMode === SCAN_MODES.UPLOAD && (
                                <div className="space-y-4">
                                    {/* Upload Zone */}
                                    {!uploadPreview ? (
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
                                                relative flex flex-col items-center justify-center
                                                w-full h-[400px] border-2 border-dashed rounded-2xl
                                                cursor-pointer transition-all duration-300
                                                ${isDragging
                                                    ? "border-primary bg-primary/5 scale-[1.02]"
                                                    : "border-gray-300 hover:border-primary hover:bg-gray-50"
                                                }
                                            `}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />

                                            <div className={`p-4 rounded-full mb-4 transition-all ${
                                                isDragging ? "bg-primary/10" : "bg-gray-100"
                                            }`}>
                                                <FiImage className={`text-4xl ${isDragging ? "text-primary" : "text-gray-400"}`} />
                                            </div>

                                            <p className="text-lg font-medium text-gray-700 mb-2">
                                                {isDragging ? "Drop image here" : "Upload QR Code Image"}
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Drag and drop or click to browse
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Supports PNG, JPG, GIF, WebP (Max 5MB)
                                            </p>
                                        </div>
                                    ) : (
                                        /* Upload Preview */
                                        <div className="relative">
                                            <div className="relative w-full h-[400px] bg-gray-900 rounded-2xl overflow-hidden">
                                                <img
                                                    src={uploadPreview}
                                                    alt="Uploaded QR Code"
                                                    className="w-full h-full object-contain"
                                                />

                                                {/* Processing Overlay */}
                                                {processingUpload && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                        <div className="flex flex-col items-center gap-3 text-white">
                                                            <AiOutlineLoading3Quarters className="text-4xl animate-spin" />
                                                            <span className="text-sm">Scanning QR code...</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Clear Button */}
                                                {!processingUpload && (
                                                    <button
                                                        onClick={clearUpload}
                                                        className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                                    >
                                                        <FiX className="text-xl" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Retry Button */}
                                            {!processingUpload && (
                                                <div className="mt-4 flex justify-center gap-3">
                                                    <Button
                                                        onClick={clearUpload}
                                                        variant="outline"
                                                        className="px-6"
                                                    >
                                                        Try Another Image
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Error Display */}
                                    {error && (
                                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <FiAlertCircle className="text-2xl text-red-600 flex-shrink-0" />
                                            <span className="text-sm text-red-700">{error}</span>
                                        </div>
                                    )}

                                    {/* Instructions */}
                                    <p className="text-sm text-gray-500 text-center">
                                        Upload a clear image of a QR code - Ensure the QR code is fully visible
                                    </p>
                                </div>
                            )}
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

                            {/* QR Code Metadata (if token-based) */}
                            {qrMetadata && (
                                <Card className="p-4 bg-blue-50 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiShield className="text-blue-600" />
                                        <h4 className="font-semibold text-blue-900">Secure Access Information</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FiHash className="text-blue-500" />
                                            <div>
                                                <p className="text-xs text-blue-600">Access Type</p>
                                                <p className="font-medium text-blue-900 capitalize">{qrMetadata.accessType?.replace("_", " ")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiLock className="text-blue-500" />
                                            <div>
                                                <p className="text-xs text-blue-600">Data Scope</p>
                                                <p className="font-medium text-blue-900">{formatScope(qrMetadata.scope)}</p>
                                            </div>
                                        </div>
                                        {qrMetadata.expiresAt && (
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-blue-500" />
                                                <div>
                                                    <p className="text-xs text-blue-600">Expires</p>
                                                    <p className="font-medium text-blue-900">{formatDateTime(qrMetadata.expiresAt)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {qrMetadata.usesRemaining !== null && (
                                            <div className="flex items-center gap-2">
                                                <FiHash className="text-blue-500" />
                                                <div>
                                                    <p className="text-xs text-blue-600">Uses Remaining</p>
                                                    <p className="font-medium text-blue-900">{qrMetadata.usesRemaining}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Patient Information */}
                            {loading ? (
                                <Card className="p-8 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <AiOutlineLoading3Quarters className="text-4xl text-primary animate-spin" />
                                        <span className="text-gray-600">Validating QR code and loading patient information...</span>
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
                                                <p className="font-medium text-gray-800 font-mono text-sm">{patientInfo.id}</p>
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
                                                <p className="font-medium text-gray-800">{formatDate(patientInfo.dateOfBirth)}</p>
                                            </div>
                                        </div>
                                        {patientInfo.sex && (
                                            <div className="flex items-center gap-3">
                                                <BiUser className="text-2xl text-gray-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Sex</p>
                                                    <p className="font-medium text-gray-800 capitalize">{patientInfo.sex}</p>
                                                </div>
                                            </div>
                                        )}
                                        {patientInfo.bloodType && (
                                            <div className="flex items-center gap-3">
                                                <MdMedicalServices className="text-2xl text-gray-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Blood Type</p>
                                                    <p className="font-medium text-gray-800">{patientInfo.bloodType}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Scoped Data Sections */}
                                        {patientInfo.allergies?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FiAlertCircle className="text-red-500" />
                                                    <p className="text-sm font-semibold text-red-700">Allergies ({patientInfo.allergies.length})</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {patientInfo.allergies.slice(0, 3).map((allergy, idx) => (
                                                        <p key={idx} className="text-sm text-gray-700 pl-6">
                                                            • {allergy.allergen} - <span className="capitalize">{allergy.severity}</span>
                                                        </p>
                                                    ))}
                                                    {patientInfo.allergies.length > 3 && (
                                                        <p className="text-xs text-gray-500 pl-6">
                                                            +{patientInfo.allergies.length - 3} more
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {patientInfo.prescriptions?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MdMedicalServices className="text-blue-500" />
                                                    <p className="text-sm font-semibold text-blue-700">Recent Prescriptions ({patientInfo.prescriptions.length})</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {patientInfo.prescriptions.slice(0, 2).map((rx, idx) => (
                                                        <p key={idx} className="text-sm text-gray-700 pl-6">
                                                            • {rx.findings || "Prescription"} - {formatDate(rx.prescription_date)}
                                                        </p>
                                                    ))}
                                                    {patientInfo.prescriptions.length > 2 && (
                                                        <p className="text-xs text-gray-500 pl-6">
                                                            +{patientInfo.prescriptions.length - 2} more
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {patientInfo.vaccinations?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MdVaccines className="text-green-500" />
                                                    <p className="text-sm font-semibold text-green-700">Vaccinations ({patientInfo.vaccinations.length})</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {patientInfo.vaccinations.slice(0, 3).map((vax, idx) => (
                                                        <p key={idx} className="text-sm text-gray-700 pl-6">
                                                            • {vax.vaccine_name} - Dose {vax.dose_number}
                                                        </p>
                                                    ))}
                                                    {patientInfo.vaccinations.length > 3 && (
                                                        <p className="text-xs text-gray-500 pl-6">
                                                            +{patientInfo.vaccinations.length - 3} more
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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

                        </div>
                    )}
                </div>
            </div>

            {/* PIN Input Modal */}
            <QRPinInputModal
                isOpen={showPinModal}
                onClose={handlePinModalClose}
                onSubmit={handlePinSubmit}
                error={pinError}
                loading={pinLoading}
            />
        </div>
    )
}

export default QrScannerBase
