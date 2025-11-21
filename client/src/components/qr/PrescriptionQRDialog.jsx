import React, { useState, useRef, useEffect } from "react"
import { generateQRCode } from "../../api/qrCode"
import BrandedQRCode from "./BrandedQRCode"
import PINInput from "./PINInput"
import {
    FiDownload,
    FiCopy,
    FiX,
    FiCheckCircle,
    FiAlertCircle,
    FiLock,
    FiUnlock,
    FiClock,
    FiFileText,
    FiPill,
    FiChevronDown,
    FiRefreshCw,
    FiShuffle,
    FiEye
} from "react-icons/fi"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { MdQrCode2 } from "react-icons/md"

const PrescriptionQRDialog = ({
    isOpen,
    onClose,
    prescription,
    onGenerate = null
}) => {
    const qrRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [generatedQR, setGeneratedQR] = useState(null)
    const [copied, setCopied] = useState(false)

    // Configuration state
    const [usePinProtection, setUsePinProtection] = useState(false)
    const [pinCode, setPinCode] = useState("")
    const [expiresInDays, setExpiresInDays] = useState(30)
    const [maxUses, setMaxUses] = useState(50)  // Lower default for prescriptions

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setGeneratedQR(null)
            setError(null)
            setUsePinProtection(false)
            setPinCode("")
            setExpiresInDays(30)
            setMaxUses(50)
            setCopied(false)
        }
    }, [isOpen])

    // Generate random 4-digit PIN
    const generateRandomPIN = () => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString()
        setPinCode(pin)
        setUsePinProtection(true)
    }

    const handleGenerate = async () => {
        setLoading(true)
        setError(null)

        try {
            // Validate PIN if enabled
            if (usePinProtection && (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode))) {
                setError("PIN must be exactly 4 digits")
                setLoading(false)
                return
            }

            const qrData = {
                patient_id: prescription.patient_id,
                share_type: "prescription",
                expires_in_days: expiresInDays,
                scope: ["prescriptions", "allergies", "view_only"],
                max_uses: maxUses,
                allow_emergency_access: false,
                metadata: {
                    shared_by: "doctor",
                    prescription_id: prescription.rx_id,
                    prescription_date: prescription.prescription_date,
                    doctor_name: prescription.doctor_name,
                    patient_name: prescription.patient_name,
                    medications_count: prescription.medications?.length || 0
                }
            }

            // Add PIN if enabled
            if (usePinProtection && pinCode) {
                qrData.pin_code = pinCode
            }

            const response = await generateQRCode(qrData)

            if (!response || !response.token || !response.access_url) {
                throw new Error("Invalid response from server. Please try again.")
            }

            setGeneratedQR({
                qrId: response.qr_id,
                token: response.token,
                accessUrl: response.access_url,
                expiresAt: response.expires_at,
                hasPinProtection: usePinProtection && !!pinCode,
                expiresInDays: expiresInDays,
                maxUses: maxUses
            })

            if (onGenerate) {
                onGenerate(response)
            }
        } catch (err) {
            console.error("Prescription QR Generation Error:", err)
            let errorMessage = "Failed to generate prescription QR code. Please try again."

            if (err.message) {
                if (err.message.includes("Patient not found")) {
                    errorMessage = "Prescription record not found. Please contact support."
                } else if (err.message.includes("permission")) {
                    errorMessage = "You don't have permission to generate QR codes for this prescription."
                } else if (err.message.includes("network") || err.message.includes("internet")) {
                    errorMessage = "Network error. Please check your connection and try again."
                } else {
                    errorMessage = err.message
                }
            }

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        if (!qrRef.current) return

        try {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            const size = 600
            canvas.width = size
            canvas.height = size + 200

            // Gradient background - KEEPSAKE medical blue
            const gradient = ctx.createLinearGradient(0, 0, size, size + 200)
            gradient.addColorStop(0, "rgb(59, 130, 246)") // Primary blue
            gradient.addColorStop(0.5, "rgb(96, 165, 250)") // Accent light blue
            gradient.addColorStop(1, "rgb(147, 197, 253)") // Light blue
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Semi-transparent overlay
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
            ctx.fillRect(20, 20, size - 40, size + 160)

            // Prescription header
            ctx.fillStyle = "#1f2937"
            ctx.font = "bold 28px Arial"
            ctx.textAlign = "center"
            ctx.fillText("PRESCRIPTION", size / 2, 70)

            // Patient name
            ctx.font = "bold 24px Arial"
            ctx.fillText(prescription.patient_name || "Patient", size / 2, 105)

            // KEEPSAKE branding
            ctx.font = "18px Arial"
            ctx.fillStyle = "#6b7280"
            ctx.fillText("KEEPSAKE Healthcare", size / 2, 135)

            // Capture QR code
            const svgElements = qrRef.current.querySelectorAll("svg")
            const imgElement = qrRef.current.querySelector("img")

            if (svgElements.length > 0) {
                const qrSvg = svgElements[0]
                const svgData = new XMLSerializer().serializeToString(qrSvg)
                const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
                const url = URL.createObjectURL(svgBlob)

                const qrImg = new Image()

                await new Promise((resolve, reject) => {
                    qrImg.onload = async () => {
                        // Draw QR code with white background
                        const qrSize = 380
                        const x = (size - qrSize) / 2
                        const y = 160

                        // White background for QR
                        ctx.fillStyle = "#ffffff"
                        ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
                        ctx.shadowBlur = 20
                        ctx.fillRect(x - 15, y - 15, qrSize + 30, qrSize + 30)
                        ctx.shadowBlur = 0

                        ctx.drawImage(qrImg, x, y, qrSize, qrSize)

                        // Overlay logo
                        if (imgElement && imgElement.complete) {
                            const logoSize = 85
                            const logoX = size / 2 - logoSize / 2
                            const logoY = y + qrSize / 2 - logoSize / 2

                            ctx.fillStyle = "#ffffff"
                            ctx.beginPath()
                            ctx.roundRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16, 12)
                            ctx.fill()

                            try {
                                ctx.drawImage(imgElement, logoX, logoY, logoSize, logoSize)
                            } catch (logoErr) {
                                console.warn("Could not draw logo:", logoErr)
                            }
                        }

                        // Footer info
                        ctx.fillStyle = "#4b5563"
                        ctx.font = "16px Arial"
                        const expiryDate = new Date(generatedQR.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        })
                        ctx.fillText(`Valid until ${expiryDate}`, size / 2, y + qrSize + 60)

                        ctx.font = "14px Arial"
                        ctx.fillStyle = "#9ca3af"
                        ctx.fillText("Scan to access prescription securely", size / 2, y + qrSize + 90)
                        ctx.fillText(`RX #${prescription.rx_id || 'N/A'}`, size / 2, y + qrSize + 110)

                        URL.revokeObjectURL(url)
                        resolve()
                    }
                    qrImg.onerror = reject
                    qrImg.src = url
                })

                const pngFile = canvas.toDataURL("image/png", 1.0)
                const downloadLink = document.createElement("a")
                downloadLink.download = `Prescription_${prescription.rx_id}_${prescription.patient_name?.replace(/\s+/g, "_")}_QR.png`
                downloadLink.href = pngFile
                downloadLink.click()
            }
        } catch (err) {
            console.error("Download failed:", err)
            alert("Failed to download prescription QR code. Please try again.")
        }
    }

    const handleCopyUrl = async () => {
        if (!generatedQR?.accessUrl) return

        try {
            await navigator.clipboard.writeText(generatedQR.accessUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
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

    if (!isOpen) return null

    const medicationCount = prescription?.medications?.length || 0

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative max-w-[550px] w-full max-h-[95vh] overflow-y-auto rounded-[28px] bg-gradient-to-br from-blue-600 to-blue-400 p-[3px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 zoom-in-95 duration-400"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 rounded-[28px] p-[3px] bg-gradient-to-br from-white/40 to-white/10 pointer-events-none [mask-composite:exclude] [-webkit-mask-composite:xor] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]" />

                {/* Close button */}
                <button
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 text-xl transition-all duration-200 hover:scale-110 hover:rotate-90 z-10 shadow-md"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <FiX />
                </button>

                {/* Header */}
                <div className="relative bg-white/98 pt-10 pb-6 px-8 text-center rounded-t-[26px] overflow-hidden">
                    {/* Animated shimmer bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 via-blue-300 to-blue-600 bg-[length:300%_100%] animate-[shimmer_3s_linear_infinite]" />

                    <div className="w-[72px] h-[72px] mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[20px] flex items-center justify-center text-white text-4xl shadow-[0_10px_25px_rgba(37,99,235,0.4)] animate-[float_3s_ease-in-out_infinite]">
                        <FiPill />
                    </div>
                    <h2 className="text-[28px] font-bold text-gray-900 mb-2 bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                        Prescription QR Code
                    </h2>
                    <p className="text-[15px] text-gray-500">
                        Rx #{prescription?.rx_id || 'N/A'} - {prescription?.patient_name}
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white/98 p-8 rounded-b-[26px] min-h-[200px]">
                    {!generatedQR && !loading ? (
                        /* Configuration Form */
                        <div className="space-y-6">
                            {/* PIN Protection Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        {usePinProtection ? <FiLock className="text-green-600" /> : <FiUnlock className="text-gray-400" />}
                                        PIN Protection {!usePinProtection && "(Optional)"}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="pin-toggle-rx"
                                            checked={usePinProtection}
                                            onChange={(e) => {
                                                setUsePinProtection(e.target.checked)
                                                if (!e.target.checked) setPinCode("")
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                                        />
                                        <label htmlFor="pin-toggle-rx" className="text-sm text-gray-600">
                                            {usePinProtection ? 'Enabled' : 'Disabled'}
                                        </label>
                                    </div>
                                </div>

                                {usePinProtection && (
                                    <div className="space-y-3">
                                        <div className="flex flex-col items-center gap-3">
                                            <PINInput
                                                value={pinCode}
                                                onChange={setPinCode}
                                                disabled={loading}
                                            />
                                            <button
                                                onClick={generateRandomPIN}
                                                type="button"
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <FiShuffle className="text-base" />
                                                Generate Random PIN
                                            </button>
                                        </div>
                                        <p className="text-xs text-center text-gray-500">
                                            Pharmacists will need this PIN to access prescription details
                                        </p>
                                    </div>
                                )}

                                {/* Recommendation Banner */}
                                {!usePinProtection && (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-amber-900">Consider adding PIN protection</p>
                                                <p className="text-xs text-amber-700 mt-0.5">
                                                    Recommended for sharing prescription information outside trusted pharmacies
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Expiration Period */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    <FiClock className="inline mr-2" />
                                    Expiration Period
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 3, 7, 14, 30, 90].map((days) => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => setExpiresInDays(days)}
                                            disabled={loading}
                                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                                                expiresInDays === days
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-600"
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {days} day{days !== 1 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Max Uses */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    <FiEye className="inline mr-2" />
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
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-500">
                                        times this QR code can be scanned
                                    </span>
                                </div>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <FiAlertCircle />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !prescription?.patient_id || (usePinProtection && pinCode.length !== 4)}
                                className="w-full bg-gradient-to-br from-blue-600 to-blue-400 text-white font-semibold py-4 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 text-base"
                            >
                                <FiPill className="text-xl" />
                                {usePinProtection && pinCode.length !== 4
                                    ? 'Enter 4-Digit PIN to Generate'
                                    : 'Generate Prescription QR Code'}
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <AiOutlineLoading3Quarters className="text-5xl text-blue-600 animate-spin" />
                            <span className="text-gray-500 text-[15px]">Generating prescription QR code...</span>
                        </div>
                    ) : error && !generatedQR ? (
                        <div className="text-center py-8">
                            <FiAlertCircle className="text-[56px] text-red-500 mb-4 mx-auto" />
                            <h3 className="text-xl text-gray-900 mb-2">Oops! Something went wrong</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">{error}</p>
                            <button
                                className="bg-gradient-to-br from-blue-600 to-blue-400 text-white border-none px-8 py-3 rounded-xl text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)]"
                                onClick={handleGenerate}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : generatedQR ? (
                        <>
                            {/* QR Code Display */}
                            <div className="flex flex-col items-center mb-6">
                                <div
                                    ref={qrRef}
                                    className="relative bg-white p-6 rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] mb-4 border-[3px] border-gray-100 overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <BrandedQRCode
                                        value={generatedQR.accessUrl}
                                        size={280}
                                        level="H"
                                        logoSize={65}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                                    <FiCheckCircle className="text-lg" />
                                    <span>Ready to share!</span>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl flex items-center gap-3 border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-blue-600">
                                    <FiLock className="text-xl text-blue-600 flex-shrink-0" />
                                    <div>
                                        <div className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Security</div>
                                        <div className="text-[13px] text-gray-900 font-semibold">Encrypted</div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl flex items-center gap-3 border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-blue-600">
                                    <FiClock className="text-xl text-blue-600 flex-shrink-0" />
                                    <div>
                                        <div className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Valid Until</div>
                                        <div className="text-[13px] text-gray-900 font-semibold">
                                            {new Date(generatedQR.expiresAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric"
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl flex items-center gap-3 border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-blue-600">
                                    <FiPill className="text-xl text-blue-600 flex-shrink-0" />
                                    <div>
                                        <div className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Medications</div>
                                        <div className="text-[13px] text-gray-900 font-semibold">{medicationCount}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Status Badge */}
                            {generatedQR.hasPinProtection ? (
                                <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg w-fit mx-auto">
                                    <FiLock className="text-green-600" />
                                    <span className="text-sm font-semibold text-green-700">PIN Protected</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg w-fit mx-auto">
                                    <FiUnlock className="text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-600">No PIN</span>
                                </div>
                            )}

                            {/* PIN Recommendation Banner */}
                            {!generatedQR.hasPinProtection && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 mb-4">
                                    <div className="flex items-start gap-2">
                                        <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-900 mb-1">Consider adding PIN protection</p>
                                            <p className="text-xs text-amber-700">
                                                Recommended for sharing prescription information outside trusted pharmacies
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Generate New QR Button */}
                            <button
                                onClick={() => setGeneratedQR(null)}
                                className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                            >
                                <FiRefreshCw />
                                Generate New QR Code
                            </button>

                            {/* Instructions */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl mb-6 border border-blue-200">
                                <p className="m-0 text-[13px] text-blue-900 leading-relaxed">
                                    <strong className="text-blue-950">How to use:</strong> Pharmacists and healthcare providers can scan this QR code
                                    to securely access the prescription details for {prescription?.patient_name}. This includes medications, dosages, and special instructions.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold border-none cursor-pointer transition-all duration-200 bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,99,235,0.4)]"
                                    onClick={handleDownload}
                                >
                                    <FiDownload className="text-lg" />
                                    <span>Download QR</span>
                                </button>
                                <button
                                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold border-2 border-blue-600 cursor-pointer transition-all duration-200 bg-white text-blue-600 hover:bg-blue-50 hover:-translate-y-0.5"
                                    onClick={handleCopyUrl}
                                >
                                    {copied ? (
                                        <>
                                            <FiCheckCircle className="text-lg" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiCopy className="text-lg" />
                                            <span>Copy Link</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default PrescriptionQRDialog
