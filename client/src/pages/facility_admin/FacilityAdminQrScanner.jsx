import React from "react"
import QrScannerBase from "../../components/qr/QrScannerBase"

/**
 * Facility Admin QR Scanner Page
 *
 * Role-specific QR scanner for facility administrators that allows them to:
 * - Scan patient QR codes via camera
 * - Upload QR code images
 * - Access and manage patient records
 */
const FacilityAdminQrScanner = () => {
    return (
        <QrScannerBase
            roleTitle="Facility Admin"
            roleColor="orange-600"
            customBackPath="/facility_admin"
        />
    )
}

export default FacilityAdminQrScanner
