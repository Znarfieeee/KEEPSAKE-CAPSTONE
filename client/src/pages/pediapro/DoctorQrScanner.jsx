import React from "react"
import QrScannerBase from "../../components/qr/QrScannerBase"

/**
 * Doctor QR Scanner Page
 *
 * Role-specific QR scanner for doctors (pediapro) that allows them to:
 * - Scan patient QR codes via camera
 * - Upload QR code images
 * - Access patient records and details
 */
const DoctorQrScanner = () => {
    return (
        <QrScannerBase
            roleTitle="Doctor"
            roleColor="primary"
            customBackPath="/pediapro"
        />
    )
}

export default DoctorQrScanner
