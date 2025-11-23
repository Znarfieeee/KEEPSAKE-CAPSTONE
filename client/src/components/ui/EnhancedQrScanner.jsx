import React, { useEffect, useRef, useState, useCallback } from "react"
import jsQR from "jsqr"
import { FiCamera, FiRefreshCw } from "react-icons/fi"
import { BiErrorCircle } from "react-icons/bi"
import { AiOutlineLoading3Quarters } from "react-icons/ai"

const EnhancedQrScanner = ({
    onScanSuccess,
    onScanError,
    width = "100%",
    height = "450px",
    debug = false
}) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const streamRef = useRef(null)

    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState(null)
    const [cameras, setCameras] = useState([])
    const [selectedCamera, setSelectedCamera] = useState(null)
    const [cameraReady, setCameraReady] = useState(false)

    // Detection feedback state
    const [detectionState, setDetectionState] = useState("searching") // searching | detecting | found
    const [qrLocation, setQrLocation] = useState(null)
    const [debugInfo, setDebugInfo] = useState({
        fps: 0,
        frames: 0,
        lastResult: null,
        status: "initializing",
        lastFrameTime: 0
    })

    // FPS counter
    const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() })

    // Debug logging
    const logDebug = useCallback((message, data = null) => {
        if (debug) {
            console.log(`[QR Scanner] ${message}`, data || "")
        }
        setDebugInfo(prev => ({ ...prev, status: message }))
    }, [debug])

    // Get available cameras
    useEffect(() => {
        const getCameras = async () => {
            try {
                logDebug("Requesting camera permission...")

                // Request permission first
                await navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        // Stop the temp stream immediately
                        stream.getTracks().forEach(track => track.stop())
                    })

                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter(device => device.kind === "videoinput")

                logDebug(`Found ${videoDevices.length} cameras`)
                setCameras(videoDevices)

                // Prefer back camera
                const backCamera = videoDevices.find(
                    device => device.label.toLowerCase().includes("back") ||
                             device.label.toLowerCase().includes("environment") ||
                             device.label.toLowerCase().includes("rear")
                )
                const cameraId = backCamera?.deviceId || videoDevices[0]?.deviceId
                setSelectedCamera(cameraId)
                logDebug("Selected camera:", cameraId)
            } catch (err) {
                logDebug("Camera error:", err.message)
                setError("Unable to access camera. Please check permissions.")
                if (onScanError) onScanError(err)
            }
        }
        getCameras()

        return () => {
            stopScanning()
        }
    }, [])

    // Start camera when selected
    useEffect(() => {
        if (selectedCamera) {
            startCamera()
        }
        return () => {
            stopScanning()
        }
    }, [selectedCamera])

    // Start camera stream
    const startCamera = async () => {
        if (!selectedCamera) return

        try {
            setError(null)
            setCameraReady(false)
            logDebug("Starting camera...")

            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }

            // Get new stream with high resolution for better QR detection
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: selectedCamera },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "environment"
                }
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play()
                        .then(() => {
                            logDebug("Camera started successfully")
                            setCameraReady(true)
                            setIsScanning(true)
                            startScanning()
                        })
                        .catch(err => {
                            logDebug("Play error:", err.message)
                            setError("Failed to start video playback")
                        })
                }
            }
        } catch (err) {
            logDebug("Failed to start camera:", err.message)
            setError(`Failed to start camera: ${err.message}`)
            setIsScanning(false)
        }
    }

    // Main scanning loop using jsQR
    const startScanning = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        logDebug("Starting scan loop...")

        const scanFrame = () => {
            if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
                animationRef.current = requestAnimationFrame(scanFrame)
                return
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Get image data for jsQR
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            // Process with jsQR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert"
            })

            // Update FPS counter
            fpsCounterRef.current.frames++
            const now = Date.now()
            if (now - fpsCounterRef.current.lastTime >= 1000) {
                setDebugInfo(prev => ({
                    ...prev,
                    fps: fpsCounterRef.current.frames,
                    frames: prev.frames + fpsCounterRef.current.frames,
                    lastFrameTime: now
                }))
                fpsCounterRef.current.frames = 0
                fpsCounterRef.current.lastTime = now
            }

            if (code) {
                logDebug("QR Code found!", code.data)

                // Store QR location for visual feedback
                setQrLocation({
                    topLeft: code.location.topLeftCorner,
                    topRight: code.location.topRightCorner,
                    bottomLeft: code.location.bottomLeftCorner,
                    bottomRight: code.location.bottomRightCorner
                })

                setDetectionState("found")
                setDebugInfo(prev => ({ ...prev, lastResult: code.data }))

                // Vibrate if supported
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100])
                }

                // Stop scanning and callback
                stopScanning()

                if (onScanSuccess) {
                    onScanSuccess(code.data, code)
                }
                return
            } else {
                // Check if we're detecting something (based on image analysis)
                setDetectionState("searching")
                setQrLocation(null)
            }

            // Continue scanning
            animationRef.current = requestAnimationFrame(scanFrame)
        }

        // Start the loop
        animationRef.current = requestAnimationFrame(scanFrame)
    }

    // Stop scanning
    const stopScanning = () => {
        logDebug("Stopping scanner...")

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        setIsScanning(false)
        setCameraReady(false)
    }

    // Handle camera change
    const handleCameraChange = (deviceId) => {
        stopScanning()
        setSelectedCamera(deviceId)
    }

    // Handle restart
    const handleRestart = () => {
        setDebugInfo({ fps: 0, frames: 0, lastResult: null, status: "restarting", lastFrameTime: 0 })
        setDetectionState("searching")
        setQrLocation(null)
        fpsCounterRef.current = { frames: 0, lastTime: Date.now() }
        stopScanning()
        setTimeout(() => {
            startCamera()
        }, 300)
    }

    // Get border style based on detection state
    const getBorderStyle = () => {
        switch (detectionState) {
            case "found":
                return "border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.9)]"
            case "detecting":
                return "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
            default:
                return "border-white/60"
        }
    }

    const getCornerColor = () => {
        switch (detectionState) {
            case "found":
                return "bg-green-500"
            case "detecting":
                return "bg-yellow-400"
            default:
                return "bg-white"
        }
    }

    const getScanLineColor = () => {
        switch (detectionState) {
            case "found":
                return "bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
            case "detecting":
                return "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]"
            default:
                return "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                {cameras.length > 1 && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FiCamera className="text-gray-500 flex-shrink-0" />
                        <select
                            value={selectedCamera || ""}
                            onChange={(e) => handleCameraChange(e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary truncate"
                        >
                            {cameras.map((camera, idx) => (
                                <option key={camera.deviceId} value={camera.deviceId}>
                                    {camera.label || `Camera ${idx + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    onClick={handleRestart}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                    title="Restart scanner"
                >
                    <FiRefreshCw size={20} />
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <BiErrorCircle className="text-2xl flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Scanner Container */}
            <div
                className="relative rounded-2xl overflow-hidden bg-black"
                style={{ width, height }}
            >
                {/* Video Element */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />

                {/* Hidden Canvas for processing */}
                <canvas
                    ref={canvasRef}
                    className="hidden"
                />

                {/* Scanning Overlay */}
                {cameraReady && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Vignette effect */}
                        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />

                        {/* Scanning Frame */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className={`relative w-64 h-64 sm:w-72 sm:h-72 border-2 rounded-2xl transition-all duration-300 ${getBorderStyle()}`}
                            >
                                {/* Animated corners */}
                                {/* Top Left */}
                                <div className="absolute -top-0.5 -left-0.5">
                                    <div className={`w-10 h-1 rounded-full transition-all duration-300 ${getCornerColor()}`} />
                                    <div className={`w-1 h-10 rounded-full transition-all duration-300 ${getCornerColor()}`} />
                                </div>
                                {/* Top Right */}
                                <div className="absolute -top-0.5 -right-0.5">
                                    <div className={`w-10 h-1 rounded-full ml-auto transition-all duration-300 ${getCornerColor()}`} />
                                    <div className={`w-1 h-10 rounded-full ml-auto transition-all duration-300 ${getCornerColor()}`} />
                                </div>
                                {/* Bottom Left */}
                                <div className="absolute -bottom-0.5 -left-0.5">
                                    <div className={`w-1 h-10 rounded-full transition-all duration-300 ${getCornerColor()}`} />
                                    <div className={`w-10 h-1 rounded-full transition-all duration-300 ${getCornerColor()}`} />
                                </div>
                                {/* Bottom Right */}
                                <div className="absolute -bottom-0.5 -right-0.5">
                                    <div className={`w-1 h-10 rounded-full ml-auto transition-all duration-300 ${getCornerColor()}`} />
                                    <div className={`w-10 h-1 rounded-full ml-auto transition-all duration-300 ${getCornerColor()}`} />
                                </div>

                                {/* Scanning line animation */}
                                <div
                                    className={`absolute left-2 right-2 h-0.5 rounded-full animate-scan-line ${getScanLineColor()}`}
                                />
                            </div>
                        </div>

                        {/* Status text */}
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <p className={`text-sm font-medium px-4 py-2 rounded-full inline-block backdrop-blur-sm transition-all duration-300 ${
                                detectionState === "found"
                                    ? "bg-green-500/90 text-white"
                                    : "bg-black/50 text-white"
                            }`}>
                                {detectionState === "found" ? "QR Code Found!" : "Point camera at QR code"}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 ${
                            detectionState === "found"
                                ? "bg-green-500/90 text-white"
                                : "bg-white/90 text-gray-700"
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                detectionState === "found" ? "bg-white" : "bg-green-500 animate-pulse"
                            }`} />
                            {detectionState === "found" ? "Found!" : "Scanning"}
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {!cameraReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="flex flex-col items-center gap-3 text-white">
                            <AiOutlineLoading3Quarters className="text-4xl animate-spin" />
                            <span className="text-sm">Starting camera...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Debug Panel */}
            {debug && (
                <div className="p-3 bg-gray-900 text-green-400 font-mono text-xs rounded-lg space-y-1">
                    <div className="flex justify-between">
                        <span>FPS:</span>
                        <span className={debugInfo.fps > 20 ? "text-green-400" : debugInfo.fps > 10 ? "text-yellow-400" : "text-red-400"}>
                            {debugInfo.fps}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total frames:</span>
                        <span>{debugInfo.frames}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>State:</span>
                        <span>{detectionState}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Camera ready:</span>
                        <span>{cameraReady ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="truncate ml-2">{debugInfo.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Last result:</span>
                        <span className="truncate ml-2 max-w-[200px]">{debugInfo.lastResult || "None"}</span>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <p className="text-sm text-gray-500 text-center">
                Hold steady - Ensure good lighting - Keep QR code flat
            </p>
        </div>
    )
}

export default EnhancedQrScanner
