import React, { useRef, useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"

/**
 * BrandedQRCode - QR Code with KEEPSAKE logo overlay
 * Creates a professional QR code with the actual KEEPSAKE logo in the center
 */
const BrandedQRCode = ({
    value,
    size = 256,
    level = "H", // High error correction for logo overlay
    logoSize = 60,
    logoBackgroundColor = "#ffffff",
    logoBorderRadius = 8,
    className = ""
}) => {
    const containerRef = useRef(null)
    const [logoLoaded, setLogoLoaded] = useState(false)

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            {/* QR Code */}
            <QRCodeSVG
                value={value}
                size={size}
                level={level}
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
            />

            {/* KEEPSAKE Logo Overlay */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{
                    width: `${logoSize}px`,
                    height: `${logoSize}px`,
                    backgroundColor: logoBackgroundColor,
                    borderRadius: `${logoBorderRadius}px`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    padding: "4px"
                }}
            >
                {/* Actual KEEPSAKE Logo */}
                <img
                    src="/keepsake-logo.svg"
                    alt="KEEPSAKE"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                    }}
                    onLoad={() => setLogoLoaded(true)}
                    onError={(e) => {
                        console.error("Failed to load KEEPSAKE logo, using fallback")
                        // Fallback to PNG if SVG fails
                        if (e.target.src.includes('.svg')) {
                            e.target.src = "/src/assets/KEEPSAKE.png"
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default BrandedQRCode
