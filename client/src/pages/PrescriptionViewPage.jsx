import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'

// API
import { accessPrescriptionPublic } from '../api/qrCode'

// Components
import QRPinInputModal from '../components/qr/QRPinInputModal'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/Button'

// Icons
import {
    FiPrinter,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiShield,
    FiUser,
    FiCalendar,
    FiArrowLeft,
    FiLock,
    FiHash,
    FiFileText,
} from 'react-icons/fi'
import { FaPills, FaNotesMedical } from 'react-icons/fa'
import { MdMedicalServices } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

// KEEPSAKE Logo
import KeepsakeLogo from '@/assets/KEEPSAKE.png'

const PrescriptionViewPage = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const printRef = useRef(null)

    // State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [prescriptionData, setPrescriptionData] = useState(null)
    const [patientInfo, setPatientInfo] = useState(null)
    const [qrMetadata, setQrMetadata] = useState(null)

    // PIN Modal state
    const [showPinModal, setShowPinModal] = useState(false)
    const [pinError, setPinError] = useState(null)
    const [pinLoading, setPinLoading] = useState(false)

    const token = searchParams.get('token')

    // Print handler
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Prescription_${prescriptionData?.rx_id || 'Document'}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 15mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
        `,
    })

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        } catch {
            return dateString
        }
    }

    // Access prescription data via token (PUBLIC - No login required)
    const fetchPrescriptionData = async (pin = null) => {
        if (!token) {
            setError('No access token provided')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await accessPrescriptionPublic(token, pin)

            // Check if PIN is required
            if (response.requires_pin) {
                setShowPinModal(true)
                setLoading(false)
                return
            }

            // Extract data from response
            const { patient_data, qr_metadata } = response

            if (!patient_data) {
                throw new Error('No patient data received')
            }

            // Set patient info
            setPatientInfo({
                id: patient_data.patient_id,
                name: `${patient_data.firstname || ''} ${patient_data.lastname || ''}`.trim(),
                dateOfBirth: patient_data.date_of_birth,
                sex: patient_data.sex,
                bloodType: patient_data.bloodtype,
            })

            // Get prescription data from metadata or prescriptions array
            const metadata = qr_metadata?.metadata || {}
            const prescriptions = patient_data.prescriptions || []

            // Find the specific prescription if prescription_id is in metadata
            let prescription = null
            if (metadata.prescription_id && prescriptions.length > 0) {
                prescription = prescriptions.find((p) => p.rx_id === metadata.prescription_id)
            }

            // If not found, use the first prescription or create from metadata
            if (!prescription && prescriptions.length > 0) {
                prescription = prescriptions[0]
            }

            if (prescription) {
                setPrescriptionData({
                    rx_id: prescription.rx_id,
                    prescription_date: prescription.prescription_date,
                    doctor_name: prescription.doctor_name || metadata.doctor_name,
                    medications: prescription.medications || [],
                    consultation_type: prescription.consultation_type,
                    instructions: prescription.instructions,
                    return_date: prescription.return_date,
                    facility_name: prescription.facility_name,
                    facility_address: prescription.facility_address,
                    allergies: patient_data.allergies || [],
                })
            } else {
                // Fallback to metadata
                setPrescriptionData({
                    rx_id: metadata.prescription_id,
                    prescription_date: metadata.prescription_date,
                    doctor_name: metadata.doctor_name,
                    medications: [],
                    allergies: patient_data.allergies || [],
                })
            }

            setQrMetadata(qr_metadata)
            setLoading(false)
        } catch (err) {
            console.error('Failed to fetch prescription:', err)

            // Check for PIN required (using requiresPin property or message)
            if (err.requiresPin || err.message?.includes('PIN required')) {
                setShowPinModal(true)
                setLoading(false)
                return
            }

            // Check for invalid PIN
            if (err.message?.includes('Invalid PIN')) {
                setPinError('Invalid PIN. Please try again.')
                setShowPinModal(true)
                setLoading(false)
                return
            }

            setError(err.message || 'Failed to access prescription data')
            setLoading(false)
        }
    }

    // Handle PIN submission
    const handlePinSubmit = async (pin) => {
        setPinLoading(true)
        setPinError(null)

        try {
            setLoading(true)
            const response = await accessPrescriptionPublic(token, pin)

            // Success - process the data
            const { patient_data, qr_metadata } = response

            if (patient_data) {
                setPatientInfo({
                    id: patient_data.patient_id,
                    name: `${patient_data.firstname || ''} ${patient_data.lastname || ''}`.trim(),
                    dateOfBirth: patient_data.date_of_birth,
                    sex: patient_data.sex,
                    bloodType: patient_data.bloodtype,
                })

                const metadata = qr_metadata?.metadata || {}
                const prescriptions = patient_data.prescriptions || []
                let prescription =
                    prescriptions.find((p) => p.rx_id === metadata.prescription_id) ||
                    prescriptions[0]

                if (prescription) {
                    setPrescriptionData({
                        rx_id: prescription.rx_id,
                        prescription_date: prescription.prescription_date,
                        doctor_name: prescription.doctor_name || metadata.doctor_name,
                        medications: prescription.medications || [],
                        consultation_type: prescription.consultation_type,
                        instructions: prescription.instructions,
                        return_date: prescription.return_date,
                        facility_name: prescription.facility_name,
                        allergies: patient_data.allergies || [],
                    })
                }

                setQrMetadata(qr_metadata)
            }

            setShowPinModal(false)
            setLoading(false)
        } catch (err) {
            if (err.message?.includes('Invalid PIN')) {
                setPinError('Invalid PIN. Please try again.')
            } else {
                setPinError(err.message || 'Failed to verify PIN')
            }
            setLoading(false)
        } finally {
            setPinLoading(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchPrescriptionData()
    }, [token])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <AiOutlineLoading3Quarters className="text-6xl text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Loading prescription...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <FiAlertCircle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="flex items-center gap-2 mx-auto"
                    >
                        <FiArrowLeft />
                        Go Back
                    </Button>
                </Card>
            </div>
        )
    }

    // No prescription data
    if (!prescriptionData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <FiFileText className="text-6xl text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Prescription Found</h2>
                    <p className="text-gray-600 mb-6">
                        The requested prescription could not be found or has expired.
                    </p>
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="flex items-center gap-2 mx-auto"
                    >
                        <FiArrowLeft />
                        Go Back
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* PIN Modal */}
            <QRPinInputModal
                isOpen={showPinModal}
                onClose={() => {
                    setShowPinModal(false)
                    if (!prescriptionData) {
                        navigate(-1)
                    }
                }}
                onSubmit={handlePinSubmit}
                loading={pinLoading}
                error={pinError}
            />

            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={KeepsakeLogo} alt="KEEPSAKE" className="h-8 w-8" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                Prescription Details
                            </h1>
                            <p className="text-xs text-gray-500">Secure Medical Document</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <FiPrinter />
                            Print
                        </Button>
                    </div>
                </div>
            </div>

            {/* QR Metadata Banner */}
            {qrMetadata && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3">
                    <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <FiShield className="text-blue-200" />
                            <span>Verified Access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiClock className="text-blue-200" />
                            <span>Expires: {formatDate(qrMetadata.expires_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiHash className="text-blue-200" />
                            <span>
                                Uses: {qrMetadata.use_count}/{qrMetadata.max_uses}
                            </span>
                        </div>
                        {qrMetadata.generated_by_name && (
                            <div className="flex items-center gap-2">
                                <FiUser className="text-blue-200" />
                                <span>Shared by: {qrMetadata.generated_by_name}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Prescription Document */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div
                    ref={printRef}
                    className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none"
                >
                    {/* Document Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 print:bg-blue-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src={KeepsakeLogo}
                                    alt="KEEPSAKE"
                                    className="h-16 w-16 bg-white rounded-lg p-2"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold">PRESCRIPTION</h2>
                                    <p className="text-blue-100">KEEPSAKE Healthcare System</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-blue-200">Rx Number</p>
                                <p className="text-xl font-mono font-bold">
                                    {prescriptionData.rx_id || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Patient & Doctor Info */}
                    <div className="p-6 border-b bg-gray-50">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Patient Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FiUser className="text-blue-500" />
                                    Patient Information
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-gray-900">
                                        {patientInfo?.name || 'Unknown'}
                                    </p>
                                    {patientInfo?.dateOfBirth && (
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <FiCalendar className="text-gray-400" />
                                            DOB: {formatDate(patientInfo.dateOfBirth)}
                                        </p>
                                    )}
                                    {patientInfo?.sex && (
                                        <p className="text-gray-600">Sex: {patientInfo.sex}</p>
                                    )}
                                    {patientInfo?.bloodType && (
                                        <p className="text-gray-600">
                                            Blood Type: {patientInfo.bloodType}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Doctor Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MdMedicalServices className="text-blue-500" />
                                    Prescribing Physician
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-gray-900">
                                        {prescriptionData.doctor_name || 'N/A'}
                                    </p>
                                    <p className="text-gray-600 flex items-center gap-2">
                                        <FiCalendar className="text-gray-400" />
                                        Date: {formatDate(prescriptionData.prescription_date)}
                                    </p>
                                    {prescriptionData.facility_name && (
                                        <p className="text-gray-600">
                                            {prescriptionData.facility_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allergies Warning */}
                    {prescriptionData.allergies && prescriptionData.allergies.length > 0 && (
                        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-800">Known Allergies</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {prescriptionData.allergies.map((allergy, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium"
                                            >
                                                {allergy.allergen || allergy.name || allergy}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Medications */}
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FaPills className="text-blue-500" />
                            Prescribed Medications
                        </h3>

                        {prescriptionData.medications && prescriptionData.medications.length > 0 ? (
                            <div className="space-y-4">
                                {prescriptionData.medications.map((med, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-lg font-bold text-gray-900">
                                                        {med.medication_name || med.name}
                                                    </h4>
                                                </div>
                                                <div className="ml-11 mt-2 grid sm:grid-cols-3 gap-3 text-sm">
                                                    {med.dosage && (
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Dosage:
                                                            </span>
                                                            <span className="ml-2 font-medium text-gray-900">
                                                                {med.dosage}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {med.frequency && (
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Frequency:
                                                            </span>
                                                            <span className="ml-2 font-medium text-gray-900">
                                                                {med.frequency}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {med.duration && (
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Duration:
                                                            </span>
                                                            <span className="ml-2 font-medium text-gray-900">
                                                                {med.duration}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {med.special_instructions && (
                                                    <div className="ml-11 mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                                                        <span className="text-amber-800 font-medium">
                                                            Instructions:{' '}
                                                        </span>
                                                        <span className="text-amber-700">
                                                            {med.special_instructions}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <FaNotesMedical className="text-4xl mx-auto mb-2 text-gray-300" />
                                <p>No medications listed</p>
                            </div>
                        )}
                    </div>

                    {/* Instructions & Notes */}
                    {prescriptionData.instructions && (
                        <div className="px-6 pb-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">
                                    Doctor's Instructions
                                </h4>
                                <p className="text-blue-700">{prescriptionData.instructions}</p>
                            </div>
                        </div>
                    )}

                    {/* Return Date */}
                    {prescriptionData.return_date && (
                        <div className="px-6 pb-6">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                <FiCalendar className="text-green-600 text-xl" />
                                <div>
                                    <span className="text-green-700 font-medium">
                                        Follow-up Date:{' '}
                                    </span>
                                    <span className="text-green-900 font-bold">
                                        {formatDate(prescriptionData.return_date)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="bg-gray-100 p-4 text-center border-t">
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                            <FiShield className="text-green-500" />
                            <span>
                                This prescription was shared securely via KEEPSAKE Healthcare System
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Document generated on {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="max-w-4xl mx-auto px-4 pb-8 flex justify-center gap-4">
                <Button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <FiPrinter />
                    Print Prescription
                </Button>
                <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <FiArrowLeft />
                    Go Back
                </Button>
            </div>
        </div>
    )
}

export default PrescriptionViewPage
