import React, { useState } from "react"
import { Button } from "../ui/Button"
import { FiUsers } from "react-icons/fi"
import { MdQrCode2 } from "react-icons/md"
import DoctorParentQRShareDialog from "./DoctorParentQRShareDialog"

/**
 * DoctorParentQRShareButton - Button component for doctors to share QR code access with parents
 *
 * This button can be placed in:
 * - Patient detail view (DoctorPatientInfo.jsx)
 * - Patient list actions (PatientRecordsTable.jsx)
 *
 * Props:
 * - patient: Patient object with patient_id (or id) and name info
 * - variant: Button variant (default: "outline")
 * - size: Button size (default: "sm")
 * - showText: Whether to show button text (default: true)
 * - className: Additional CSS classes
 */
const DoctorParentQRShareButton = ({
    patient,
    variant = "outline",
    size = "sm",
    showText = true,
    className = "",
    iconOnly = false
}) => {
    const [showDialog, setShowDialog] = useState(false)

    // Extract patient info
    const patientId = patient?.patient_id || patient?.id
    const patientName = patient?.firstname && patient?.lastname
        ? `${patient.firstname} ${patient.lastname}`
        : patient?.name || "Patient"

    if (!patientId) {
        console.warn("DoctorParentQRShareButton: No patient ID provided")
        return null
    }

    const handleOpenDialog = (e) => {
        e?.stopPropagation?.()
        setShowDialog(true)
    }

    const handleCloseDialog = () => {
        setShowDialog(false)
    }

    // Icon-only button for table actions
    if (iconOnly) {
        return (
            <>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenDialog}
                    className={`hover:text-emerald-600 hover:bg-emerald-100 ${className}`}
                    title="Share with Parent"
                >
                    <FiUsers className="size-4" />
                </Button>

                <DoctorParentQRShareDialog
                    isOpen={showDialog}
                    onClose={handleCloseDialog}
                    patientId={patientId}
                    patientName={patientName}
                />
            </>
        )
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleOpenDialog}
                className={`flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 ${className}`}
            >
                <MdQrCode2 className="text-lg" />
                {showText && <span>Share with Parent</span>}
            </Button>

            <DoctorParentQRShareDialog
                isOpen={showDialog}
                onClose={handleCloseDialog}
                patientId={patientId}
                patientName={patientName}
            />
        </>
    )
}

export default DoctorParentQRShareButton
