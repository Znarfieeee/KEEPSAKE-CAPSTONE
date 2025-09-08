import React from 'react'

// UI Components (keep imports consistent with your project)
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import {
    Calendar,
    FileText,
    User,
    Pill,
    Clock,
    Activity,
    Printer,
    QrCode,
    MapPin,
    Stethoscope,
    AlertCircle,
    RefreshCw,
    Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TooltipHelper } from '@/util/TooltipHelper' // used for icon-only tooltips

// Helper to return Tailwind color for status dot (same palette as Facility)
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'bg-green-500'
        case 'completed':
            return 'bg-blue-500'
        case 'pending':
            return 'bg-yellow-500'
        case 'cancelled':
            return 'bg-red-500'
        default:
            return 'bg-gray-400'
    }
}

// Reusable Info Item Component
const InfoItem = ({ icon: Icon, label, value, className = '' }) => (
    <li className={cn('flex items-start gap-3 text-sm', className)}>
        {Icon && <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
            <span className="font-medium text-foreground block">{label}:</span>
            <span className="text-muted-foreground break-words">{value || '—'}</span>
        </div>
    </li>
)

// Medication Item Component
const MedicationItem = ({ medication, index }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between gap-2 mb-3">
            <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" />
                {medication.medication_name || 'Medication Name Not Specified'}
            </h4>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                #{index + 1}
            </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
                <span className="font-medium text-foreground">Dosage:</span>
                <span className="ml-2 text-muted-foreground">{medication.dosage || '—'}</span>
            </div>
            <div>
                <span className="font-medium text-foreground">Frequency:</span>
                <span className="ml-2 text-muted-foreground">{medication.frequency || '—'}</span>
            </div>
            <div>
                <span className="font-medium text-foreground">Duration:</span>
                <span className="ml-2 text-muted-foreground">{medication.duration || '—'}</span>
            </div>
            <div>
                <span className="font-medium text-foreground">Quantity:</span>
                <span className="ml-2 text-muted-foreground">{medication.quantity || '—'}</span>
            </div>
            {medication.refills_authorized && (
                <div>
                    <span className="font-medium text-foreground">Refills:</span>
                    <span className="ml-2 text-muted-foreground">
                        {medication.refills_authorized}
                    </span>
                </div>
            )}
        </div>

        {medication.special_instructions && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <span className="font-medium text-blue-800 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Special Instructions:
                </span>
                <p className="text-blue-700 text-sm mt-1">{medication.special_instructions}</p>
            </div>
        )}
    </div>
)

// Formatters
const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
        return '—'
    }
}
const formatDateTime = (dateString) => {
    if (!dateString) return '—'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return '—'
    }
}

const PatientPrescriptionDetailModal = ({ open, prescription, onClose }) => {
    if (!prescription) return null

    // ensures meds is always an array
    const medications = Array.isArray(prescription.medications) ? prescription.medications : []

    // Print only the modal content by injecting a temporary print style that hides other elements
    const handlePrint = () => {
        try {
            // Remove any existing temp print style first
            const existing = document.getElementById('prescription-print-style')
            if (existing) existing.remove()

            const style = document.createElement('style')
            style.type = 'text/css'
            style.id = 'prescription-print-style'
            style.innerHTML = `
        @media print {
          /* hide everything except printable area */
          body * { visibility: hidden !important; }
          .prescription-printable, .prescription-printable * { visibility: visible !important; }
          .prescription-printable { position: absolute !important; left: 0; top: 0; width: 100% !important; padding: 0.5rem; }
        }
      `
            document.head.appendChild(style)

            // trigger print dialog
            window.print()

            // cleanup after print (some browsers may block immediate removal, so use timeout)
            setTimeout(() => {
                const s = document.getElementById('prescription-print-style')
                if (s) s.remove()
            }, 1000)
        } catch (err) {
            console.error('Print failed:', err)
            // fallback
            window.print()
        }
    }

    // Quick QR generator: open a new tab showing a QR image (uses an external QR service).
    // This is a lightweight implementation — you can swap for a local QR generator library if preferred.
    const handleGenerateQR = () => {
        try {
            const payload = {
                rx_id: prescription.rx_id || '',
                patient: prescription.patient_name || '',
                created_at: prescription.created_at || '',
            }
            const data = encodeURIComponent(JSON.stringify(payload))
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${data}`
            // open QR in a new window/tab so user can save/scan it.
            window.open(qrUrl, '_blank', 'noopener,noreferrer')
        } catch (err) {
            console.error('QR generation failed', err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* Wider / responsive DialogContent — dialog width changed here */}
            <DialogContent
                className="max-w-7xl w-[95vw] sm:w-[90vw] lg:w-[75vw] xl:w-[65vw] max-h-[92vh] overflow-y-auto border-0 shadow-xl p-0 rounded-xl"
                showCloseButton={false}
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: status dot + title */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                {/* Status pulse indicator only (no text) */}
                                {prescription.status && (
                                    <span className="relative flex h-3 w-3">
                                        <span
                                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(
                                                prescription.status
                                            )}`}
                                        />
                                        <span
                                            className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor(
                                                prescription.status
                                            )}`}
                                        />
                                    </span>
                                )}

                                <Hash className="w-5 h-5 text-primary" />
                                <DialogTitle className="text-xl sm:text-2xl font-semibold truncate">
                                    Prescription Details
                                </DialogTitle>
                            </div>

                            {/* RX ID and patient quick info */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
                                {prescription.rx_id && (
                                    <p className="font-mono">
                                        RX:{' '}
                                        <span className="text-foreground">
                                            {prescription.rx_id}
                                        </span>
                                    </p>
                                )}
                                {prescription.patient_name && (
                                    <p className="truncate">
                                        Patient:{' '}
                                        <span className="text-foreground font-medium">
                                            {prescription.patient_name}
                                        </span>
                                    </p>
                                )}
                                {prescription.prescription_date && (
                                    <p className="truncate">
                                        Date:{' '}
                                        <span className="text-foreground">
                                            {formatDate(prescription.prescription_date)}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right: icon-only buttons with TooltipHelper */}
                        <div className="flex items-center gap-2">
                            <TooltipHelper content="Print prescription">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Print prescription"
                                    onClick={handlePrint}
                                    className="hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <Printer className="w-4 h-4" />
                                </Button>
                            </TooltipHelper>

                            <TooltipHelper content="Open QR code">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Show prescription QR"
                                    onClick={handleGenerateQR}
                                    className="hover:bg-green-50 hover:text-green-600"
                                >
                                    <QrCode className="w-4 h-4" />
                                </Button>
                            </TooltipHelper>
                        </div>
                    </div>
                </DialogHeader>

                {/* Printable area */}
                <div className="prescription-printable p-6 space-y-6">
                    {/* Top info grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left column */}
                        <div>
                            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Prescription Information
                            </h3>
                            <ul className="space-y-3">
                                <InfoItem
                                    icon={Calendar}
                                    label="Prescription Date"
                                    value={formatDate(prescription.prescription_date)}
                                />
                                <InfoItem
                                    icon={RefreshCw}
                                    label="Return Date"
                                    value={formatDate(prescription.return_date)}
                                />
                                <InfoItem
                                    icon={Activity}
                                    label="Consultation Type"
                                    value={
                                        prescription.consultation_type || 'Standard Consultation'
                                    }
                                />
                                <InfoItem
                                    icon={User}
                                    label="Patient Age at Time"
                                    value={
                                        prescription.patient_age_at_time
                                            ? `${prescription.patient_age_at_time} years`
                                            : '—'
                                    }
                                />
                            </ul>
                        </div>

                        {/* Right column */}
                        <div>
                            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-primary" />
                                Medical Details
                            </h3>
                            <ul className="space-y-3">
                                <InfoItem
                                    icon={FileText}
                                    label="Findings"
                                    value={prescription.findings}
                                    className="flex-col items-start"
                                />
                                <InfoItem
                                    icon={MapPin}
                                    label="Created"
                                    value={formatDateTime(prescription.created_at)}
                                />
                                {prescription.updated_at && (
                                    <InfoItem
                                        icon={Clock}
                                        label="Last Updated"
                                        value={formatDateTime(prescription.updated_at)}
                                    />
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Doctor Instructions */}
                    {prescription.doctor_instructions && (
                        <div>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" />
                                Doctor's Instructions
                            </h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 text-sm leading-relaxed">
                                    {prescription.doctor_instructions}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Consultation Notes */}
                    {prescription.consultation_notes && (
                        <div>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Consultation Notes
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {prescription.consultation_notes}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Medications */}
                    <div>
                        <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-primary" />
                            Prescribed Medications
                            {medications.length > 0 && (
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    {medications.length} medication
                                    {medications.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {medications.length > 0 ? (
                                medications.map((medication, index) => (
                                    <MedicationItem
                                        key={medication.id || index}
                                        medication={medication}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No medications prescribed</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Minimal footer */}
                <DialogFooter className="p-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end w-full">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                            >
                                Close
                            </Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default PatientPrescriptionDetailModal
