import React, { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { FiDownload, FiCopy, FiCheck } from "react-icons/fi"
import { Button } from "./Button"
import { Card } from "./Card"

const QrCodeGenerator = ({
    patientId,
    patientName,
    facilityId,
    size = 256,
    level = "M", // L, M, Q, H
    includeMargin = true
}) => {
    const [copied, setCopied] = useState(false)

    // Generate QR code data in JSON format
    const qrData = JSON.stringify({
        patientId,
        patientName,
        facilityId,
        type: "patient",
        generatedAt: new Date().toISOString()
    })

    // Copy QR data to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(qrData)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    // Download QR code as image
    const handleDownload = () => {
        const svg = document.getElementById(`qr-code-${patientId}`)
        if (!svg) return

        // Create a canvas to convert SVG to PNG
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        canvas.width = size
        canvas.height = size

        img.onload = () => {
            ctx.drawImage(img, 0, 0)
            const pngUrl = canvas.toDataURL("image/png")

            // Create download link
            const downloadLink = document.createElement("a")
            downloadLink.href = pngUrl
            downloadLink.download = `patient-${patientId}-qr.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
        }

        img.src = "data:image/svg+xml;base64," + btoa(svgData)
    }

    return (
        <Card className="p-6 w-fit">
            <div className="flex flex-col items-center gap-4">
                {/* QR Code Display */}
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <QRCodeSVG
                        id={`qr-code-${patientId}`}
                        value={qrData}
                        size={size}
                        level={level}
                        includeMargin={includeMargin}
                    />
                </div>

                {/* Patient Info */}
                <div className="text-center">
                    <p className="font-semibold text-gray-800">{patientName}</p>
                    <p className="text-sm text-gray-600">Patient ID: {patientId}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full">
                    <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        <FiDownload />
                        Download
                    </Button>
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        {copied ? (
                            <>
                                <FiCheck className="text-green-600" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <FiCopy />
                                Copy Data
                            </>
                        )}
                    </Button>
                </div>

                {/* Debug Info (Development Only) */}
                {process.env.NODE_ENV === "development" && (
                    <details className="w-full">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                            QR Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {JSON.stringify(JSON.parse(qrData), null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </Card>
    )
}

export default QrCodeGenerator
