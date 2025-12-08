import React, { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { createPortal } from 'react-dom'

// UI Components
import { Button } from '@/components/ui/Button'
import {
    Printer,
    AlertCircle,
    X,
    Share2,
    FileText,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Stethoscope,
    User,
    Globe,
} from 'lucide-react'
import { TooltipHelper } from '@/util/TooltipHelper'
import PrescriptionQRDialog from '@/components/qr/PrescriptionQRDialog'

// KEEPSAKE Logo - use imported asset
import KeepsakeLogo from '@/assets/KEEPSAKE.png'

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

const formatShortDate = (dateString) => {
    if (!dateString) return '—'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
    } catch {
        return '—'
    }
}

const calculateAge = (dob) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

const formatFrequency = (frequency) => {
    const frequencyMap = {
        once_daily: 'Once daily',
        twice_daily: 'Twice daily (BID)',
        three_times_daily: 'Three times daily (TID)',
        four_times_daily: 'Four times daily (QID)',
        every_4_hours: 'Every 4 hours',
        every_6_hours: 'Every 6 hours',
        every_8_hours: 'Every 8 hours',
        every_12_hours: 'Every 12 hours',
        as_needed: 'As needed (PRN)',
        bedtime: 'At bedtime (HS)',
        with_meals: 'With meals',
        before_meals: 'Before meals',
    }
    return frequencyMap[frequency] || frequency || '—'
}

const formatDuration = (duration) => {
    const durationMap = {
        '3_days': '3 days',
        '5_days': '5 days',
        '7_days': '1 week',
        '10_days': '10 days',
        '14_days': '2 weeks',
        '30_days': '1 month',
        '60_days': '2 months',
        '90_days': '3 months',
        ongoing: 'Ongoing',
        until_finished: 'Until finished',
    }
    return durationMap[duration] || duration || '—'
}

// Professional Prescription Document
const PrescriptionDocument = React.forwardRef(
    (
        { prescription, patient, medications, onPrint, onShare, onClose, showActions = true },
        ref
    ) => {
        const patientName = patient
            ? `${patient.firstname || ''} ${patient.middlename || ''} ${
                  patient.lastname || ''
              }`.trim()
            : prescription?.patient_name || 'N/A'

        const patientAge =
            prescription?.patient_age_at_time ||
            (patient?.date_of_birth ? calculateAge(patient.date_of_birth) : null)

        // Extract doctor and facility info from prescription
        const doctor = prescription?.doctor || {}
        const facility = prescription?.facility || {}

        // Build doctor name with proper fallbacks
        const doctorFirstname = doctor?.firstname || ''
        const doctorMiddlename = doctor?.middlename || ''
        const doctorLastname = doctor?.lastname || ''

        const doctorName =
            doctorFirstname && doctorLastname
                ? `Dr. ${doctorFirstname}${
                      doctorMiddlename ? ` ${doctorMiddlename.charAt(0)}.` : ''
                  } ${doctorLastname}`
                : prescription?.doctor_name
                ? `Dr. ${prescription.doctor_name}`
                : 'Attending Physician'

        const doctorSpecialty = doctor?.specialty || 'Pediatrics'
        const doctorPhone = doctor?.phone_number || null
        const facilityName = facility?.facility_name || 'KEEPSAKE Medical Center'
        const facilityAddress = facility?.address || ''
        const facilityCity = facility?.city || ''
        const facilityZip = facility?.zip_code || ''
        const facilityPhone = facility?.contact_number || ''
        const facilityEmail = facility?.email || ''
        const facilityWebsite = facility?.website || ''
        const facilityLogo = facility?.logo_url || null

        // Format full address
        const fullAddress = [facilityAddress, facilityCity, facilityZip].filter(Boolean).join(', ')

        return (
            <div
                ref={ref}
                className="prescription-document bg-white"
                style={{
                    fontFamily: "'Georgia', 'Times New Roman', Times, serif",
                    width: '210mm',
                    minHeight: '297mm',
                    margin: '0 auto',
                    position: 'relative',
                }}
            >
                {/* Action Bar - Print hidden */}
                {showActions && (
                    <div className="print:hidden sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold">℞</span>
                            <div>
                                <p className="font-semibold">Medical Prescription</p>
                                <p className="text-xs text-blue-100">
                                    {patientName} • {formatDate(prescription?.prescription_date)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <TooltipHelper content="Print Prescription">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onPrint}
                                    className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </Button>
                            </TooltipHelper>
                            <TooltipHelper content="Share via QR">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onShare}
                                    className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                            </TooltipHelper>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="hover:bg-white/20 text-white ml-2"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Prescription Content */}
                <div className="p-8 print:p-6">
                    {/* ===== HEADER / LETTERHEAD SECTION ===== */}
                    <header className="mb-6">
                        <div className="flex justify-between items-start pb-4 border-b-4 border-double border-blue-800">
                            {/* Left: Logo and Facility Info */}
                            <div className="flex items-start gap-4">
                                {/* Facility Logo or KEEPSAKE Logo */}
                                <div className="flex-shrink-0">
                                    {facilityLogo ? (
                                        <img
                                            src={facilityLogo}
                                            alt={facilityName}
                                            className="w-20 h-20 object-contain rounded-lg border-2 border-blue-800 bg-white p-1 print:w-16 print:h-16"
                                        />
                                    ) : (
                                        <img
                                            src={KeepsakeLogo}
                                            alt="KEEPSAKE"
                                            className="w-20 h-20 object-contain print:w-16 print:h-16"
                                        />
                                    )}
                                </div>

                                {/* Facility Details */}
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-blue-900 tracking-wide print:text-xl uppercase">
                                        {facilityName}
                                    </h1>
                                    <p className="text-sm text-blue-600 italic font-medium">
                                        Excellence in Pediatric Healthcare
                                    </p>

                                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                                        {fullAddress && (
                                            <p className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                <span>{fullAddress}</span>
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            {facilityPhone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                                                    {facilityPhone}
                                                </span>
                                            )}
                                            {facilityEmail && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                                                    {facilityEmail}
                                                </span>
                                            )}
                                            {facilityWebsite && (
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                                                    {facilityWebsite}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Rx Symbol */}
                            <div className="flex-shrink-0 text-right">
                                <div className="w-20 h-20 print:w-16 print:h-16 border-2 border-blue-800 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                                    <span className="text-5xl print:text-4xl font-serif text-blue-800 font-bold">
                                        ℞
                                    </span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* ===== PRESCRIPTION TITLE & INFO ===== */}
                    <div className="text-center mb-5">
                        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-[0.2em] border-b-2 border-gray-300 pb-2 mb-3 inline-block px-8">
                            Medical Prescription
                        </h2>
                        <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Rx No:{' '}
                                <strong className="text-gray-800 font-mono">
                                    {prescription?.rx_id?.slice(0, 8).toUpperCase() || 'PENDING'}
                                </strong>
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Date:{' '}
                                <strong className="text-gray-800">
                                    {formatDate(prescription?.prescription_date)}
                                </strong>
                            </span>
                        </div>
                    </div>

                    {/* ===== PATIENT INFORMATION BOX ===== */}
                    <div className="border-2 border-gray-300 rounded-lg p-4 mb-5 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <User className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                                Patient Information
                            </h3>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-9">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold block">
                                    Patient Name
                                </label>
                                <p className="text-lg font-bold text-gray-900 border-b-2 border-gray-400 pb-1 mt-0.5">
                                    {patientName}
                                </p>
                            </div>
                            <div className="col-span-3">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold block">
                                    Age
                                </label>
                                <p className="text-lg font-bold text-gray-900 border-b-2 border-gray-400 pb-1 mt-0.5">
                                    {patientAge ? `${patientAge} yrs` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Follow-up Date in Patient Info Section */}
                        {prescription?.return_date && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">
                                            Follow-up Appointment:
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-900">
                                        {formatDate(prescription.return_date)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== DIAGNOSIS / CLINICAL FINDINGS ===== */}
                    {prescription?.findings && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                                    Diagnosis / Clinical Findings
                                </h3>
                            </div>
                            <div className="border-l-4 border-blue-600 bg-blue-50/70 py-3 px-4 rounded-r-lg">
                                <p className="text-gray-800 leading-relaxed text-[15px]">
                                    {prescription.findings}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ===== PRESCRIBED MEDICATIONS ===== */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-800">
                            <span className="text-2xl font-bold text-blue-800">℞</span>
                            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                                Prescribed Medications
                            </h3>
                            {medications.length > 0 && (
                                <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                    {medications.length} item{medications.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {medications.length > 0 ? (
                                medications.map((med, index) => (
                                    <div
                                        key={med.pm_id || med.id || index}
                                        className="medication-item bg-gray-50 border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-8 h-8 bg-blue-800 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 flex-wrap">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {med.medication_name ||
                                                            'Unnamed Medication'}
                                                    </p>
                                                    {med.dosage && (
                                                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded text-sm">
                                                            {med.dosage}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2 text-sm text-gray-700 space-y-1.5">
                                                    <p className="flex items-center gap-2">
                                                        <span className="font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-xs">
                                                            Sig:
                                                        </span>
                                                        <span>
                                                            {formatFrequency(med.frequency)} for{' '}
                                                            {formatDuration(med.duration)}
                                                        </span>
                                                    </p>
                                                    {med.quantity && (
                                                        <p className="flex items-center gap-2">
                                                            <span className="font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded text-xs">
                                                                Qty:
                                                            </span>
                                                            <span className="font-semibold">
                                                                {med.quantity}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {med.special_instructions && (
                                                        <p className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
                                                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-amber-800">
                                                                {med.special_instructions}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {med.refills_authorized > 0 && (
                                                        <p className="text-green-700 font-medium">
                                                            ✓ {med.refills_authorized} refill
                                                            {med.refills_authorized !== 1
                                                                ? 's'
                                                                : ''}{' '}
                                                            authorized
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    No medications prescribed for this consultation.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ===== SPECIAL INSTRUCTIONS ===== */}
                    {prescription?.doctor_instructions && (
                        <div className="mb-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                                    Doctor's Instructions
                                </h3>
                            </div>
                            <p className="text-amber-900 leading-relaxed text-[15px]">
                                {prescription.doctor_instructions}
                            </p>
                        </div>
                    )}

                    {/* ===== SIGNATURE SECTION (Bottom Right) ===== */}
                    <div className="mt-8 pt-6 border-t-2 border-gray-300">
                        <div className="flex justify-between items-end">
                            {/* Left: Important Notes */}
                            <div className="text-xs text-gray-600 max-w-xs space-y-2">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">
                                        Important Notes:
                                    </p>
                                    <ul className="space-y-1 text-gray-600">
                                        <li className="flex items-start gap-1.5">
                                            <span className="text-blue-600">•</span>
                                            <span>
                                                This prescription is valid for 30 days from the date
                                                issued
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-1.5">
                                            <span className="text-blue-600">•</span>
                                            <span>Present to a licensed pharmacy only</span>
                                        </li>
                                        <li className="flex items-start gap-1.5">
                                            <span className="text-blue-600">•</span>
                                            <span>Keep this document for your medical records</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right: Doctor Signature */}
                            <div className="text-center min-w-[300px]">
                                {/* Signature Line */}
                                <div className="border-b-2 border-gray-800 pb-2 mb-2 h-16 flex items-end justify-center">
                                    <p
                                        className="text-2xl text-blue-900"
                                        style={{
                                            fontFamily:
                                                "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive",
                                        }}
                                    >
                                        {doctorName}
                                    </p>
                                </div>

                                {/* Doctor Info */}
                                <p className="font-bold text-gray-900 text-lg">{doctorName}</p>
                                <p className="text-sm text-blue-700 font-medium">
                                    {doctorSpecialty}
                                </p>

                                <div className="mt-2 text-xs text-gray-600 space-y-0.5 bg-gray-50 rounded-lg py-2 px-4 inline-block">
                                    {doctor?.license_number && (
                                        <p className="flex items-center justify-center gap-1.5">
                                            <span className="font-semibold">License No:</span>
                                            <span className="font-mono bg-white px-1.5 py-0.5 rounded">
                                                {doctor.license_number}
                                            </span>
                                        </p>
                                    )}
                                    {doctor?.prc_number && (
                                        <p className="flex items-center justify-center gap-1.5">
                                            <span className="font-semibold">PRC No:</span>
                                            <span className="font-mono bg-white px-1.5 py-0.5 rounded">
                                                {doctor.prc_number}
                                            </span>
                                        </p>
                                    )}
                                    {doctorPhone && (
                                        <p className="flex items-center justify-center gap-1.5 mt-1">
                                            <Phone className="w-3 h-3 text-blue-600" />
                                            <span>{doctorPhone}</span>
                                        </p>
                                    )}
                                    {!doctor?.license_number && !doctor?.prc_number && (
                                        <>
                                            <p className="flex items-center justify-center gap-1.5">
                                                <span className="font-semibold">License No:</span>
                                                <span className="font-mono text-gray-400">
                                                    MD-XXXXXX
                                                </span>
                                            </p>
                                            <p className="flex items-center justify-center gap-1.5">
                                                <span className="font-semibold">PRC No:</span>
                                                <span className="font-mono text-gray-400">
                                                    XXXXXXX
                                                </span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== FOOTER ===== */}
                    <footer className="mt-8 pt-4 border-t border-gray-300">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <div className="flex items-center gap-2">
                                <img
                                    src={KeepsakeLogo}
                                    alt="KEEPSAKE"
                                    className="w-5 h-5 opacity-50"
                                />
                                <span>Powered by KEEPSAKE Healthcare System</span>
                            </div>
                            <div className="text-right">
                                <p>
                                    Document ID:{' '}
                                    <span className="font-mono">
                                        RX-
                                        {prescription?.rx_id?.slice(0, 8).toUpperCase() || 'XXXXXX'}
                                    </span>
                                </p>
                                <p>
                                    Generated:{' '}
                                    {formatShortDate(prescription?.created_at || new Date())}
                                </p>
                            </div>
                        </div>
                        <p className="text-center text-[9px] text-gray-400 mt-2 italic">
                            This is a computer-generated prescription from {facilityName}. No
                            signature required if digitally authenticated.
                        </p>
                    </footer>
                </div>
            </div>
        )
    }
)

PrescriptionDocument.displayName = 'PrescriptionDocument'

// Full-screen Prescription Modal
const PatientPrescriptionDetailModal = ({ open, prescription, patient, onClose }) => {
    const [showQRGenerator, setShowQRGenerator] = useState(false)
    const printRef = useRef(null)

    useEffect(() => {
        if (!open) {
            setShowQRGenerator(false)
        }
    }, [open])

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && open) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEsc)
        return () => document.removeEventListener('keydown', handleEsc)
    }, [open, onClose])

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Prescription_${prescription?.rx_id || 'document'}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 10mm;
            }
            @media print {
                html, body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    font-size: 12pt !important;
                }
                .prescription-document {
                    width: 100% !important;
                    min-height: auto !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                }
                .prescription-document > div {
                    padding: 15mm !important;
                }
                .medication-item {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
                /* Preserve backgrounds and borders */
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                /* Ensure borders print */
                .border-double {
                    border-style: double !important;
                }
                .border-b-4 {
                    border-bottom-width: 4px !important;
                }
                .border-l-4 {
                    border-left-width: 4px !important;
                }
                /* Hide scrollbars */
                ::-webkit-scrollbar {
                    display: none;
                }
                /* Ensure logo prints properly */
                svg {
                    print-color-adjust: exact !important;
                    -webkit-print-color-adjust: exact !important;
                }
                img {
                    max-width: 100% !important;
                    print-color-adjust: exact !important;
                }
                /* Footer stays at bottom */
                footer {
                    margin-top: auto !important;
                }
            }
        `,
    })

    if (!open || !prescription) return null

    const medications = Array.isArray(prescription.medications) ? prescription.medications : []

    const prescriptionReferenceData = {
        prescription_id: prescription.rx_id,
        prescription_date: prescription.prescription_date,
        doctor_name: prescription.doctor?.firstname
            ? `${prescription.doctor.firstname} ${prescription.doctor.lastname}`
            : 'Doctor',
        findings: prescription.findings,
        medications_count: medications.length,
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex flex-col bg-gray-900/90 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            {/* Prescription QR Dialog */}
            <PrescriptionQRDialog
                isOpen={showQRGenerator}
                onClose={() => setShowQRGenerator(false)}
                prescription={{
                    rx_id: prescription.rx_id,
                    patient_id: prescription.patient_id || patient?.patient_id,
                    patient_name:
                        patient?.name ||
                        `${patient?.firstname || ''} ${patient?.lastname || ''}`.trim() ||
                        prescription.patient_name,
                    prescription_date: prescription.prescription_date,
                    doctor_name: prescription.doctor_name,
                    medications: medications,
                }}
                onGenerate={(response) => {
                    console.log('Prescription QR generated:', response)
                    // Don't close dialog - let user see QR code and download/copy options
                }}
            />

            {/* Prescription Document */}
            <div className="flex-1 overflow-auto py-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
                        <PrescriptionDocument
                            ref={printRef}
                            prescription={prescription}
                            patient={patient}
                            medications={medications}
                            onPrint={handlePrint}
                            onShare={() => setShowQRGenerator(!showQRGenerator)}
                            onClose={onClose}
                            showActions={true}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom hint */}
            <div className="flex-shrink-0 text-center py-2 text-white/50 text-xs">
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 mx-1">ESC</kbd> or
                click outside to close
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

export default PatientPrescriptionDetailModal
