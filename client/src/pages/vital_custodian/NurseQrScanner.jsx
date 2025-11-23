import React from "react"
import QrScannerBase from "../../components/qr/QrScannerBase"

/**
 * Nurse/Staff QR Scanner Page
 *
 * Role-specific QR scanner for nurses/staff (vital_custodian) that allows them to:
 * - Scan patient QR codes via camera
 * - Upload QR code images
 * - Access patient vitals and record new measurements
 */
const NurseQrScanner = () => {
    return (
        <QrScannerBase
            roleTitle="Nurse/Staff"
            roleColor="teal-600"
            customBackPath="/vital_custodian"
        />
    )
}

export default NurseQrScanner
