import React, { useState, useRef } from "react"
import { generateQRCode } from "../../api/qrCode"
import BrandedQRCode from "./BrandedQRCode"
import QRScopeSelector from "./QRScopeSelector"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import {
    FiDownload,
    FiCopy,
    FiLock,
    FiUnlock,
    FiClock,
    FiHash,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw
} from "react-icons/fi"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { MdQrCode2 } from "react-icons/md"

const EXPIRY_OPTIONS = [
    { value: 1, label: "1 Day" },
    { value: 3, label: "3 Days" },
    { value: 7, label: "7 Days" },
    { value: 14, label: "14 Days" },
    { value: 30, label: "30 Days" },
    { value: 90, label: "90 Days" }
]

const SHARE_TYPES = {
    prescription: "Prescription",
    medical_record: "Medical Record",
    referral: "Referral",
    emergency_access: "Emergency Access",
    parent_access: "Parent/Guardian Access",
    vaccination: "Vaccination Record",
    appointment: "Appointment Info"
}

const SecureQRGenerator = ({
    patientId,
    shareType = "medical_record",
    defaultScope = ["view_only"],
    referenceData = null,
    onGenerate = null,
    onError = null,
    compact = false,
    allowFullAccess = false,
    className = ""
}) => {
    const qrRef = useRef(null)

    // Form state
    const [scope, setScope] = useState(defaultScope)
    const [expiresInDays, setExpiresInDays] = useState(7)
    const [maxUses, setMaxUses] = useState(10)
    const [usePinProtection, setUsePinProtection] = useState(false)
    const [pinCode, setPinCode] = useState("")
    const [allowEmergencyAccess, setAllowEmergencyAccess] = useState(false)

    // Generation state
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [generatedQR, setGeneratedQR] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        setError(null)

        try {
            // Validate PIN if enabled
            if (usePinProtection && (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode))) {
                throw new Error("PIN must be exactly 4 digits")
            }

            const qrData = {
                patient_id: patientId,
                share_type: shareType,
                expires_in_days: expiresInDays,
                scope: scope,
                max_uses: maxUses,
                allow_emergency_access: allowEmergencyAccess
            }

            // Add PIN if enabled
            if (usePinProtection && pinCode) {
                qrData.pin_code = pinCode
            }

            // Add reference metadata if provided
            if (referenceData) {
                qrData.metadata = referenceData
            }

            const response = await generateQRCode(qrData)

            setGeneratedQR({
                qrId: response.qr_id,
                token: response.token,
                accessUrl: response.access_url,
                expiresAt: response.expires_at,
                maxUses: maxUses,
                scope: scope,
                hasPinProtection: usePinProtection && !!pinCode
            })

            if (onGenerate) {
                onGenerate(response)
            }
        } catch (err) {
            const errorMessage = err.message || "Failed to generate QR code"
            setError(errorMessage)
            if (onError) {
                onError(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector("svg")
        if (!svg) return

        // Create canvas to convert SVG to PNG
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const svgData = new XMLSerializer().serializeToString(svg)
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)

            const pngFile = canvas.toDataURL("image/png")
            const downloadLink = document.createElement("a")
            downloadLink.download = `qr_${shareType}_${Date.now()}.png`
            downloadLink.href = pngFile
            downloadLink.click()
        }

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    }

    const handleCopyUrl = async () => {
        if (!generatedQR?.accessUrl) return

        try {
            await navigator.clipboard.writeText(generatedQR.accessUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement("textarea")
            textArea.value = generatedQR.accessUrl
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleReset = () => {
        setGeneratedQR(null)
        setError(null)
        setPinCode("")
        setCopied(false)
    }

    const formatExpiryDate = (dateString) => {
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

    // Render QR Code Display (after generation)
    if (generatedQR) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-center gap-2 mb-4">
                    <FiCheckCircle className="text-green-600 text-xl" />
                    <h3 className="text-lg font-semibold text-green-900">QR Code Generated Successfully</h3>
                </div>

                {/* QR Code Display */}
                <div className="flex flex-col items-center">
                    <div
                        ref={qrRef}
                        className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200"
                    >
                        <BrandedQRCode
                            value={generatedQR.accessUrl}
                            size={compact ? 180 : 220}
                            level="H"
                            logoSize={compact ? 40 : 50}
                        />
                    </div>

                    {/* QR Info */}
                    <div className="mt-4 w-full max-w-sm space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                                <FiClock className="text-blue-500" />
                                Expires:
                            </span>
                            <span className="font-medium">
                                {formatExpiryDate(generatedQR.expiresAt)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                                <FiHash className="text-purple-500" />
                                Max Uses:
                            </span>
                            <span className="font-medium">{generatedQR.maxUses}</span>
                        </div>
                        {generatedQR.hasPinProtection && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <FiLock className="text-orange-500" />
                                    PIN Protected:
                                </span>
                                <span className="font-medium text-orange-600">Yes</span>
                            </div>
                        )}
                    </div>

                    {/* PIN Display Warning */}
                    {generatedQR.hasPinProtection && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md max-w-sm">
                            <div className="flex items-start gap-2">
                                <FiAlertCircle className="text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-orange-900">PIN Required</p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        Share the PIN <strong className="font-mono">{pinCode}</strong> separately with the recipient. They will need it to access the data.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <FiDownload />
                        Download QR
                    </Button>
                    <Button
                        onClick={handleCopyUrl}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        {copied ? <FiCheckCircle className="text-green-600" /> : <FiCopy />}
                        {copied ? "Copied!" : "Copy URL"}
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <FiRefreshCw />
                        Generate New
                    </Button>
                </div>
            </div>
        )
    }

    // Render Generation Form
    return (
        <div className={`space-y-5 ${className}`}>
            <div className="flex items-center gap-2 mb-2">
                <MdQrCode2 className="text-primary text-2xl" />
                <h3 className="text-lg font-semibold text-gray-900">
                    Generate Secure QR Code
                </h3>
            </div>

            {!compact && (
                <p className="text-sm text-gray-600">
                    Create a secure, token-based QR code for sharing {SHARE_TYPES[shareType] || shareType} data.
                </p>
            )}

            {/* Scope Selection */}
            <QRScopeSelector
                selectedScopes={scope}
                onChange={setScope}
                disabled={loading}
                allowFullAccess={allowFullAccess}
            />

            {/* Expiry Duration */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Expiration Period
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {EXPIRY_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setExpiresInDays(option.value)}
                            disabled={loading}
                            className={`
                                px-3 py-2 text-sm rounded-md border transition-colors
                                ${expiresInDays === option.value
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                                }
                                ${loading ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Maximum Uses
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={maxUses}
                        onChange={(e) => setMaxUses(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        disabled={loading}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <span className="text-sm text-gray-500">
                        times this QR code can be scanned
                    </span>
                </div>
            </div>

            {/* PIN Protection */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="pin-protection"
                        checked={usePinProtection}
                        onChange={(e) => {
                            setUsePinProtection(e.target.checked)
                            if (!e.target.checked) setPinCode("")
                        }}
                        disabled={loading}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="pin-protection" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        {usePinProtection ? <FiLock className="text-orange-500" /> : <FiUnlock className="text-gray-400" />}
                        PIN Protection
                    </label>
                </div>

                {usePinProtection && (
                    <div className="ml-7">
                        <input
                            type="text"
                            maxLength={4}
                            value={pinCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "")
                                setPinCode(value)
                            }}
                            placeholder="Enter 4-digit PIN"
                            disabled={loading}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Recipients will need this PIN to access the data
                        </p>
                    </div>
                )}
            </div>

            {/* Emergency Access Option */}
            {shareType === "medical_record" && (
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="emergency-access"
                        checked={allowEmergencyAccess}
                        onChange={(e) => setAllowEmergencyAccess(e.target.checked)}
                        disabled={loading}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="emergency-access" className="text-sm font-medium text-gray-700">
                        Allow Emergency Access (with PIN override)
                    </label>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-700">
                        <FiAlertCircle />
                        <span className="text-sm">{error}</span>
                    </div>
                </div>
            )}

            {/* Generate Button */}
            <Button
                onClick={handleGenerate}
                disabled={loading || !patientId}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <AiOutlineLoading3Quarters className="animate-spin" />
                        Generating Secure QR Code...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <MdQrCode2 />
                        Generate QR Code
                    </span>
                )}
            </Button>

            {!patientId && (
                <p className="text-xs text-red-600 text-center">
                    Patient ID is required to generate QR code
                </p>
            )}
        </div>
    )
}

export default SecureQRGenerator
