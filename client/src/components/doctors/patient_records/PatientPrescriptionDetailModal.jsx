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
    Phone,
    Mail,
    Building2,
    Shield,
} from 'lucide-react'
import { TooltipHelper } from '@/util/TooltipHelper'

// Helper to return Tailwind color for status dot
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

// Prescription Header Component
const PrescriptionHeader = ({ prescription }) => (
    <div className="mb-6">
        {/* Medical Facility Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b-4 border-blue-600">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center">
                        <Shield className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">KEEPSAKE MEDICAL CENTER</h1>
                        <p className="text-blue-700 font-medium">Excellence in Healthcare</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-blue-600">
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                +1 (555) 123-4567
                            </span>
                            <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                info@keepsake.health
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-white px-3 py-1 rounded-full shadow-sm mb-2">
                        <span className="text-xs font-bold text-blue-600">RX #{prescription.rx_id || 'PENDING'}</span>
                    </div>
                    <p className="text-xs text-blue-700">
                        {formatDate(prescription.prescription_date)}
                    </p>
                </div>
            </div>
        </div>

        {/* Doctor Information Bar */}
        <div className="bg-white border-x border-gray-200 px-6 py-3">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="font-bold text-gray-900">
                            Dr. {prescription.doctor_name || 'Medical Professional'}, MD
                        </p>
                        <p className="text-xs text-gray-600">
                            License #: {prescription.doctor_license || 'MD-789456'} | DEA #: {prescription.dea_number || 'BM1234567'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-gray-700">Valid for 30 days</p>
                    <p className="text-xs text-gray-500">From date of issue</p>
                </div>
            </div>
        </div>
    </div>
)

// Patient Info Section
const PatientInfo = ({ prescription }) => (
    <div className="bg-white border-x border-gray-200 px-6 py-4 mb-1">
        <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Patient Name</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                        {prescription.patient_name || 'Not Specified'}
                    </p>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Age / DOB</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                        {prescription.patient_age_at_time ? `${prescription.patient_age_at_time} years` : 'Not Specified'}
                    </p>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Patient ID</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                        #{prescription.patient_id || 'N/A'}
                    </p>
                </div>
            </div>
            {prescription.patient_address && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Address</label>
                    <p className="text-sm text-gray-700 mt-1">{prescription.patient_address}</p>
                </div>
            )}
        </div>
    </div>
)

// Medical Findings Section
const MedicalFindings = ({ findings }) => {
    if (!findings) return null

    return (
        <div className="bg-white border-x border-gray-200 px-6 py-3">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Diagnosis / Clinical Findings
                </h3>
                <p className="text-gray-800 leading-relaxed font-medium">{findings}</p>
            </div>
        </div>
    )
}

// Enhanced Medication Item Component
const MedicationItem = ({ medication, index }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                </div>
            </div>
            <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">
                        {medication.medication_name || 'Medication Name Not Specified'}
                    </h4>
                    {medication.refills_authorized > 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                            {medication.refills_authorized} Refills
                        </span>
                    )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Dosage</p>
                            <p className="font-bold text-gray-900">{medication.dosage || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Frequency</p>
                            <p className="font-bold text-gray-900">{medication.frequency || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Duration</p>
                            <p className="font-bold text-gray-900">{medication.duration || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Quantity</p>
                            <p className="font-bold text-gray-900">{medication.quantity || '—'}</p>
                        </div>
                    </div>
                </div>

                {medication.special_instructions && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-amber-700 uppercase">Special Instructions</p>
                                <p className="text-sm text-amber-800 mt-1">
                                    {medication.special_instructions}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)

// Doctor Instructions Section
const DoctorInstructions = ({ instructions }) => {
    if (!instructions) return null

    return (
        <div className="bg-white border-x border-gray-200 px-6 py-3">
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                    Doctor's Instructions / Notes
                </h3>
                <p className="text-gray-800 leading-relaxed font-medium">{instructions}</p>
            </div>
        </div>
    )
}

// Prescription Footer
const PrescriptionFooter = ({ prescription }) => (
    <div className="bg-white border-x border-b border-gray-200 px-6 py-4 rounded-b-lg">
        <div className="border-t-2 border-gray-200 pt-4">
            {prescription.consultation_notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Additional Notes</p>
                    <p className="text-sm text-gray-700">{prescription.consultation_notes}</p>
                </div>
            )}

            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                        <p className="font-bold text-gray-600">Important Information:</p>
                        <ul className="mt-1 space-y-0.5">
                            <li>• This prescription is valid for 30 days from the date of issue</li>
                            <li>• Keep this document for your records</li>
                            <li>• Present to licensed pharmacy only</li>
                        </ul>
                    </div>
                    <div className="text-xs text-gray-400">
                        <p>Generated: {formatDateTime(prescription.created_at)}</p>
                        <p>Document ID: RX-{prescription.rx_id || 'PENDING'}</p>
                    </div>
                </div>

                <div className="text-center">
                    <div className="border-2 border-gray-300 border-dashed rounded-lg p-4 min-w-[200px]">
                        <p className="text-xs text-gray-500 mb-2">Physician Signature</p>
                        <div className="h-12 flex items-center justify-center">
                            <p className="font-signature text-2xl text-blue-800">
                                Dr. {prescription.doctor_name || 'Medical Professional'}
                            </p>
                        </div>
                        <div className="border-t border-gray-400 mt-2 pt-2">
                            <p className="text-xs font-bold text-gray-700">
                                {prescription.doctor_name || 'Medical Professional'}, MD
                            </p>
                            <p className="text-xs text-gray-500">Licensed Physician</p>
                        </div>
                    </div>
                </div>
            </div>

            {prescription.return_date && (
                <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                    <p className="text-sm font-bold text-blue-800">
                        Follow-up Appointment: {formatDate(prescription.return_date)}
                    </p>
                </div>
            )}
        </div>
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

    // Ensure meds is always an array
    const medications = Array.isArray(prescription.medications) ? prescription.medications : []

    // Enhanced print functionality with exact visual replication
    const handlePrint = () => {
        try {
            // Remove any existing temp print style first
            const existing = document.getElementById('prescription-print-style')
            if (existing) existing.remove()

            const style = document.createElement('style')
            style.type = 'text/css'
            style.id = 'prescription-print-style'
            style.innerHTML = `
                @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&display=swap');

                .font-signature {
                    font-family: 'Kalam', cursive;
                }

                @media print {
                    /* Hide everything except printable area */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Show only prescription content */
                    .prescription-printable,
                    .prescription-printable * {
                        visibility: visible !important;
                    }

                    /* Position prescription content */
                    .prescription-printable {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                    }

                    /* Ensure proper spacing and layout */
                    .prescription-printable * {
                        box-shadow: none !important;
                    }

                    /* Page break settings */
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }

                    /* Avoid breaking inside medication items */
                    .medication-item {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    /* Ensure colors print properly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Maintain layout structure */
                    .max-w-4xl {
                        max-width: 100% !important;
                    }
                }
            `
            document.head.appendChild(style)

            // Trigger print dialog
            window.print()

            // Cleanup after print
            setTimeout(() => {
                const s = document.getElementById('prescription-print-style')
                if (s) s.remove()
            }, 1000)
        } catch (err) {
            console.error('Print failed:', err)
            // Fallback
            window.print()
        }
    }

    // QR generator functionality
    const handleGenerateQR = () => {
        try {
            const payload = {
                patient: prescription.patient_name || '',
                doctor: prescription.doctor_name || '',
                date: prescription.prescription_date || '',
                medications: medications.length,
                findings: prescription.findings || '',
            }
            const data = encodeURIComponent(JSON.stringify(payload))
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}`
            window.open(qrUrl, '_blank', 'noopener,noreferrer')
        } catch (err) {
            console.error('QR generation failed', err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="w-[95vw] lg:w-[80vw] max-h-[95vh] overflow-hidden border-0 shadow-2xl py-2 rounded-xl"
                showCloseButton={false}
            >
                {/* Action buttons header - not part of printable area */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
                    <div className="flex items-center gap-2">
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
                        <DialogTitle className="text-lg font-semibold">
                            Medical Prescription
                        </DialogTitle>
                    </div>

                    {/* Action buttons */}
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

                        <TooltipHelper content="Generate QR code">
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

                {/* Printable prescription content */}
                <div className="prescription-printable bg-gray-100 h-[calc(95vh-80px)] overflow-y-auto">
                    <div className="max-w-4xl mx-auto my-4">
                        <div className="bg-white shadow-xl rounded-lg">
                            <PrescriptionHeader prescription={prescription} />

                            <PatientInfo prescription={prescription} />

                            <MedicalFindings findings={prescription.findings} />

                            <DoctorInstructions instructions={prescription.doctor_instructions} />

                            {/* Medications Section */}
                            <div className="bg-white border-x border-gray-200 px-6 py-4">
                                <div className="bg-white rounded-lg">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-600">
                                        <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            PRESCRIBED MEDICATIONS
                                        </h3>
                                        {medications.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-bold">
                                                {medications.length} Item{medications.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {medications.length > 0 ? (
                                            medications.map((medication, index) => (
                                                <MedicationItem
                                                    key={medication.id || index}
                                                    medication={medication}
                                                    index={index}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <Pill className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <p className="font-bold text-gray-600">No Medications Prescribed</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    This consultation did not require medication
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <PrescriptionFooter prescription={prescription} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PatientPrescriptionDetailModal
