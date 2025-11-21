import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'

// UI Components
import { IoMdArrowBack } from 'react-icons/io'
import { AlertCircle, RefreshCw, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

import PatientRecordsTabs from '@/components/doctors/patient_records/PatientRecordsTabs'
import { getChildDetails } from '@/api/parent/children'
import LoadingSkeleton from '@/components/doctors/patient_records/LoadingSkeleton'
import BeautifulQRDialog from '@/components/qr/BeautifulQRDialog'

// Helper
import { showToast } from '@/util/alertHelper'

const ParentChildInfo = () => {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showQRDialog, setShowQRDialog] = useState(false)

    const fetchChildData = useCallback(
        async (showRefreshToast = false) => {
            try {
                if (!showRefreshToast) {
                    setLoading(true)
                }

                const response = await getChildDetails(patientId)
                if (response.status === 'success' && response.data) {
                    setPatient(response.data)

                    // Update location state with patient data for breadcrumb display
                    if (!location.state?.patient) {
                        navigate(location.pathname, {
                            replace: true,
                            state: { patient: response.data },
                        })
                    }

                    if (showRefreshToast) {
                        showToast('success', 'Data refreshed successfully')
                    }
                } else {
                    throw new Error('Invalid response format')
                }
            } catch (err) {
                const errorMessage = err.message || 'Failed to fetch child data'
                setError(errorMessage)
                console.error('Error fetching child data:', err)
                if (!showRefreshToast) {
                    showToast('error', errorMessage)
                } else {
                    showToast('error', 'Failed to refresh data')
                }
            } finally {
                setLoading(false)
            }
        },
        [patientId, location.pathname, location.state?.patient, navigate]
    )

    useEffect(() => {
        fetchChildData()
    }, [fetchChildData])

    if (loading) {
        return (
            <div className="min-h-screen p-4 sm:p-6">
                <LoadingSkeleton />
            </div>
        )
    }

    if (error || !patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Unable to Load Data
                    </h2>
                    <p className="text-red-500 mb-6">{error || 'Child not found'}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            onClick={() => fetchChildData()}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Button
                            onClick={() => navigate('/parent/children')}
                            className="w-full sm:w-auto"
                        >
                            Return to My Children
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                {/* Read-Only Notice */}
                <div className="flex items-start sm:items-center gap-2 text-blue-600 text-xs sm:text-sm mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="leading-tight">
                        Read-only access. Contact your healthcare provider for updates.
                    </span>
                </div>

                {/* Patient Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div className="flex items-start sm:items-center gap-3">
                        <Link
                            to="/parent/children"
                            className="hover:text-primary transition duration-300 ease-in-out p-1 -ml-1 rounded-md hover:bg-gray-100"
                            aria-label="Go back to children list"
                        >
                            <IoMdArrowBack className="text-xl sm:text-2xl" />
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                                {patient.firstname?.toUpperCase() || ''}{' '}
                                {patient.middlename ? `${patient.middlename.toUpperCase()} ` : ''}
                                {patient.lastname?.toUpperCase() || ''}
                            </h1>

                            {/* Badges - Stack on mobile, inline on desktop */}
                            {/* <div className="flex flex-wrap items-center gap-2">
                                {patient.sex && (
                                    <Badge
                                        variant={patient.sex === 'male' ? 'default' : 'secondary'}
                                        className="text-xs"
                                    >
                                        {patient.sex === 'male' ? 'Male' : 'Female'}
                                    </Badge>
                                )}
                                {patient.age && (
                                    <Badge variant="outline" className="text-xs">
                                        {patient.age}
                                    </Badge>
                                )}
                                {patient.bloodtype && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs bg-red-50 text-red-700 border-red-200"
                                    >
                                        {patient.bloodtype}
                                    </Badge>
                                )}
                            </div> */}
                        </div>
                    </div>

                    {/* Share QR Code Button */}
                    <div className="flex justify-end sm:justify-start">
                        <Button
                            size="sm"
                            onClick={() => setShowQRDialog(true)}
                            className="w-full sm:w-auto text-white"
                        >
                            <QrCode className="size-5" />
                            Share QR Code
                        </Button>
                    </div>
                </div>

                {/* Patient Records Tabs */}
                <div className="space-y-6 -mx-3 sm:mx-0">
                    <PatientRecordsTabs patient={patient} readOnly={true} />
                </div>

                {/* Bottom Spacing for Mobile */}
                <div className="h-16 sm:h-8" />
            </div>

            {/* QR Share Dialog */}
            <BeautifulQRDialog
                isOpen={showQRDialog}
                onClose={() => setShowQRDialog(false)}
                patientId={patient.patient_id}
                patientName={`${patient.firstname || ''} ${patient.middlename || ''} ${
                    patient.lastname || ''
                }`.trim()}
                onGenerate={(response) => {
                    console.log('QR Code generated:', response)
                    showToast('success', 'QR code generated successfully')
                }}
            />
        </div>
    )
}

export default ParentChildInfo
