import React, { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { FiCamera } from "react-icons/fi"
import { BiErrorCircle } from "react-icons/bi"
import { AiOutlineLoading3Quarters } from "react-icons/ai"

const QrCodeScanner = ({
    onScanSuccess,
    onScanError,
    width = "100%",
    height = "400px",
    fps = 15, // Balanced FPS for reliability
    qrbox = 250,
    aspectRatio = 1.0,
    disableFlip = false
}) => {
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState(null)
    const [cameras, setCameras] = useState([])
    const [selectedCamera, setSelectedCamera] = useState(null)
    const scannerRef = useRef(null)
    const html5QrCodeRef = useRef(null)
    const qrCodeRegionId = useRef(`qr-reader-${Date.now()}`)

    // Get available cameras
    useEffect(() => {
        Html5Qrcode.getCameras()
            .then((devices) => {
                if (devices && devices.length > 0) {
                    setCameras(devices)
                    // Prefer back camera (environment)
                    const backCamera = devices.find(
                        (device) => device.label.toLowerCase().includes("back") ||
                                   device.label.toLowerCase().includes("environment")
                    )
                    setSelectedCamera(backCamera?.id || devices[0].id)
                } else {
                    setError("No cameras found on this device")
                }
            })
            .catch((err) => {
                console.error("Error getting cameras:", err)
                setError("Unable to access camera. Please check permissions.")
            })
    }, [])

    // Start scanning when camera is selected
    useEffect(() => {
        if (selectedCamera && !isScanning) {
            startScanning()
        }

        return () => {
            stopScanning()
        }
    }, [selectedCamera])

    const startScanning = async () => {
        try {
            setError(null)
            setIsScanning(true)

            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId.current, {
                    verbose: false,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                })
            }

            // Configuration optimized for reliable scanning
            const config = {
                fps: fps,
                qrbox: typeof qrbox === 'number' ? { width: qrbox, height: qrbox } : qrbox,
                aspectRatio,
                disableFlip
            }

            await html5QrCodeRef.current.start(
                selectedCamera,
                config,
                (decodedText, decodedResult) => {
                    // Successfully scanned - stop scanning to prevent multiple reads
                    stopScanning()
                    if (onScanSuccess) {
                        onScanSuccess(decodedText, decodedResult)
                    }
                },
                (errorMessage) => {
                    // Scanning error (this fires frequently, so we don't show it)
                    // Only pass to handler if provided
                }
            )
        } catch (err) {
            console.error("Error starting scanner:", err)
            setError(`Failed to start camera: ${err.message || "Unknown error"}`)
            setIsScanning(false)
        }
    }

    const stopScanning = async () => {
        if (html5QrCodeRef.current) {
            try {
                const state = html5QrCodeRef.current.getState()
                if (state === 2) { // SCANNING state
                    await html5QrCodeRef.current.stop()
                }
                setIsScanning(false)
            } catch (err) {
                console.error("Error stopping scanner:", err)
            }
        }
    }

    const handleCameraChange = async (cameraId) => {
        await stopScanning()
        setSelectedCamera(cameraId)
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Camera Selection */}
            {cameras.length > 1 && (
                <div className="flex items-center gap-2">
                    <label htmlFor="camera-select" className="text-sm font-medium text-gray-700">
                        <FiCamera className="inline mr-2" />
                        Select Camera:
                    </label>
                    <select
                        id="camera-select"
                        value={selectedCamera || ""}
                        onChange={(e) => handleCameraChange(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        {cameras.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                                {camera.label || `Camera ${camera.id}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <BiErrorCircle className="text-2xl flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Scanner Container */}
            <div
                className="relative rounded-xl overflow-hidden border-2 border-gray-300 bg-gray-900"
                style={{ width, height }}
            >
                {/* Actual Scanner Element */}
                <div
                    id={qrCodeRegionId.current}
                    ref={scannerRef}
                    className="w-full h-full [&>video]:object-cover"
                />

                {/* Simple corner markers - no overlay to interfere with scanning */}
                {isScanning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div
                            className="relative"
                            style={{
                                width: typeof qrbox === 'number' ? qrbox + 20 : 270,
                                height: typeof qrbox === 'number' ? qrbox + 20 : 270,
                            }}
                        >
                            {/* Corner markers */}
                            {/* Top Left */}
                            <div className="absolute top-0 left-0 w-10 h-10">
                                <div className="absolute top-0 left-0 w-full h-1 bg-green-500 rounded-full shadow-lg" />
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-full shadow-lg" />
                            </div>
                            {/* Top Right */}
                            <div className="absolute top-0 right-0 w-10 h-10">
                                <div className="absolute top-0 right-0 w-full h-1 bg-green-500 rounded-full shadow-lg" />
                                <div className="absolute top-0 right-0 w-1 h-full bg-green-500 rounded-full shadow-lg" />
                            </div>
                            {/* Bottom Left */}
                            <div className="absolute bottom-0 left-0 w-10 h-10">
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-full shadow-lg" />
                                <div className="absolute bottom-0 left-0 w-1 h-full bg-green-500 rounded-full shadow-lg" />
                            </div>
                            {/* Bottom Right */}
                            <div className="absolute bottom-0 right-0 w-10 h-10">
                                <div className="absolute bottom-0 right-0 w-full h-1 bg-green-500 rounded-full shadow-lg" />
                                <div className="absolute bottom-0 right-0 w-1 h-full bg-green-500 rounded-full shadow-lg" />
                            </div>

                            {/* Animated scanning line */}
                            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line shadow-lg" />
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {!isScanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="flex flex-col items-center gap-3 text-white">
                            <AiOutlineLoading3Quarters className="text-4xl animate-spin" />
                            <span className="text-sm">Initializing camera...</span>
                        </div>
                    </div>
                )}

                {/* Scanning Status Badge */}
                {isScanning && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg z-10">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Ready to scan
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-500 text-center">
                <p>Hold your device steady for best results</p>
            </div>
        </div>
    )
}

export default QrCodeScanner
