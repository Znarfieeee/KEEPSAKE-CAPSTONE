import React from "react"
import QrScannerBase from "../../components/qr/QrScannerBase"

/**
 * Parent QR Scanner Page
 *
 * Role-specific QR scanner for parents (keepsaker) that allows them to:
 * - Scan shared QR codes via camera
 * - Upload QR code images
 * - Access child health information
 */
const ParentQrScanner = () => {
    return (
        <QrScannerBase
            roleTitle="Parent"
            roleColor="purple-600"
            customBackPath="/parent"
        />
    )
}

export default ParentQrScanner
