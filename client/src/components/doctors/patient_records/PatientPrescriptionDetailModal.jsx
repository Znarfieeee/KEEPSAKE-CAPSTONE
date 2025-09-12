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
    <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-primary">Medical Prescription</h1>
                <p className="text-sm text-muted-foreground">Healthcare Center</p>
            </div>
        </div>

        {/* Doctor and clinic info */}
        <div className="flex justify-between items-center text-sm">
            <div className="text-left">
                <p className="font-semibold">
                    Dr. {prescription.doctor_name || 'Medical Professional'}
                </p>
                <p className="text-muted-foreground">Licensed Physician</p>
            </div>
            <div className="text-right">
                <p className="font-mono text-xs">
                    License: MD-{prescription.doctor_license || '123456'}
                </p>
                <p className="text-xs text-muted-foreground">
                    Date: {formatDate(prescription.prescription_date)}
                </p>
            </div>
        </div>
    </div>
)

// Patient Info Section
const PatientInfo = ({ prescription }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        <div>
            <h3 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Information
            </h3>
            <div className="space-y-1 text-sm">
                <p>
                    <span className="font-medium">Name:</span> {prescription.patient_name || '—'}
                </p>
                <p>
                    <span className="font-medium">Age:</span>{' '}
                    {prescription.patient_age_at_time
                        ? `${prescription.patient_age_at_time} years`
                        : '—'}
                </p>
                <p>
                    <span className="font-medium">Date:</span>{' '}
                    {formatDate(prescription.prescription_date)}
                </p>
            </div>
        </div>
        <div>
            <h3 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Consultation Details
            </h3>
            <div className="space-y-1 text-sm">
                <p>
                    <span className="font-medium">Type:</span>{' '}
                    {prescription.consultation_type || 'Standard Consultation'}
                </p>
                {prescription.return_date && (
                    <p>
                        <span className="font-medium">Return:</span>{' '}
                        {formatDate(prescription.return_date)}
                    </p>
                )}
                {prescription.status && (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <div className="flex items-center gap-1">
                            <span
                                className={`w-2 h-2 rounded-full ${getStatusColor(
                                    prescription.status
                                )}`}
                            />
                            <span className="capitalize">{prescription.status}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)

// Medical Findings Section
const MedicalFindings = ({ findings }) => {
    if (!findings) return null

    return (
        <div className="mb-6">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
                <FileText className="w-4 h-4" />
                Clinical Findings
            </h3>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-blue-800 leading-relaxed">{findings}</p>
            </div>
        </div>
    )
}

// Enhanced Medication Item Component
const MedicationItem = ({ medication, index }) => (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                </span>
                {medication.medication_name || 'Medication Name Not Specified'}
            </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
            <div className="flex flex-col">
                <span className="font-semibold text-gray-600">Dosage</span>
                <span className="font-mono text-base">{medication.dosage || '—'}</span>
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-gray-600">Frequency</span>
                <span className="font-mono text-base">{medication.frequency || '—'}</span>
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-gray-600">Duration</span>
                <span className="font-mono text-base">{medication.duration || '—'}</span>
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-gray-600">Quantity</span>
                <span className="font-mono text-base">{medication.quantity || '—'}</span>
            </div>
        </div>

        {medication.refills_authorized && (
            <div className="mb-3">
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    Refills: {medication.refills_authorized}
                </span>
            </div>
        )}

        {medication.special_instructions && (
            <div className="border-t pt-3">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-amber-800 text-xs block">
                            Special Instructions:
                        </span>
                        <p className="text-amber-700 text-sm mt-1">
                            {medication.special_instructions}
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
)

// Doctor Instructions Section
const DoctorInstructions = ({ instructions }) => {
    if (!instructions) return null

    return (
        <div className="mb-6">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
                <AlertCircle className="w-4 h-4" />
                Doctor's Instructions
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 leading-relaxed font-medium">{instructions}</p>
            </div>
        </div>
    )
}

// Prescription Footer
const PrescriptionFooter = ({ prescription }) => (
    <div className="border-t-2 border-gray-200 pt-4 mt-6">
        <div className="flex justify-between items-end">
            <div className="text-xs text-muted-foreground">
                {prescription.consultation_notes && (
                    <div className="mb-2">
                        <span className="font-medium">Notes:</span>
                        <p className="max-w-md">{prescription.consultation_notes}</p>
                    </div>
                )}
                <p>This prescription is valid for 30 days from the date of issue.</p>
                <p>Generated on: {formatDateTime(prescription.created_at)}</p>
            </div>
            <div className="text-right">
                <div className="border-t border-gray-400 w-48 mb-1"></div>
                <p className="text-sm font-semibold">
                    Dr. {prescription.doctor_name || 'Medical Professional'}
                </p>
                <p className="text-xs text-muted-foreground">Digital Signature</p>
            </div>
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
                        padding: 20px !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
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
                <div className="prescription-printable p-6 bg-white h-[calc(95vh-80px)] flex flex-col">
                    <PrescriptionHeader prescription={prescription} />

                    <PatientInfo prescription={prescription} />

                    <MedicalFindings findings={prescription.findings} />

                    <DoctorInstructions instructions={prescription.doctor_instructions} />

                    {/* Medications Section - flexible height */}
                    <div className="flex-1 min-h-0 mb-4">
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary border-b pb-2">
                            <Pill className="w-4 h-4" />
                            Prescribed Medications
                            {medications.length > 0 && (
                                <span className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                                    {medications.length} item{medications.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>

                        <div className="h-full overflow-y-auto space-y-3">
                            {medications.length > 0 ? (
                                medications.map((medication, index) => (
                                    <div key={medication.id || index} className="medication-item">
                                        <MedicationItem medication={medication} index={index} />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                                    <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">No medications prescribed</p>
                                    <p className="text-sm">
                                        This consultation did not require medication
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <PrescriptionFooter prescription={prescription} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PatientPrescriptionDetailModal
