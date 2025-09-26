import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// UI Components
import { IoMdArrowBack } from 'react-icons/io'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { TooltipHelper } from '@/util/TooltipHelper'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'

import PatientRecordsTabs from '@/components/doctors/patient_records/PatientRecordsTabs'
import { getPatientById, updatePatientRecord, deletePatientRecord } from '@/api/doctors/patient'
import LoadingSkeleton from '@/components/doctors/patient_records/LoadingSkeleton'

// Helper
import { showToast } from '@/util/alertHelper'

// Lazy load the edit modal
const EditPatientModal = lazy(() => import('@/components/doctors/patient_records/EditPatientModal'))

const DoctorPatientInfo = () => {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingPatient, setEditingPatient] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteLoading] = useState(false)

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true)
                const response = await getPatientById(patientId)
                if (response.status === 'success' && response.data) {
                    setPatient(response.data)
                } else {
                    throw new Error('Invalid response format')
                }
            } catch (err) {
                setError('Failed to fetch patient data')
                console.error('Error fetching patient data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchPatientData()
    }, [patientId])

    if (loading) {
        return <LoadingSkeleton />
    }

    if (error || !patient) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-red-500 mb-4">{error || 'Patient not found'}</p>
                <button
                    onClick={() => navigate('/pediapro/patient_records')}
                    className="text-blue-500 hover:underline"
                >
                    Return to Patient Records
                </button>
            </div>
        )
    }

    const handleEditPatient = async () => {
        setEditingPatient(patient)
        setShowEditModal(true)
    }

    const handleDeleteClick = () => {
        setShowDeleteDialog(true)
    }

    const handleUpdatePatient = async (patientData) => {
        try {
            const response = await updatePatientRecord(patientData)
            if (response.status === 'success') {
                showToast('success', 'Patient updated successfully')

                // Refresh patient data
                const updatedResponse = await getPatientById(patientId)
                if (updatedResponse.status === 'success') {
                    setPatient(updatedResponse.data)
                }

                setShowEditModal(false)
                setEditingPatient(null)

                // Dispatch custom event for real-time updates
                if (typeof window !== 'undefined') {
                    const eventDetail = {
                        ...patientData,
                        timestamp: new Date().toISOString(),
                    }
                    window.dispatchEvent(
                        new CustomEvent('patient-updated', { detail: eventDetail })
                    )
                }
            } else {
                showToast('error', response.message || 'Failed to update patient')
            }
        } catch (error) {
            console.error('Update patient error:', error)
            let errorMessage = 'Failed to update patient'
            if (error.message) {
                errorMessage = error.message
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }
            showToast('error', errorMessage)
        }
    }

    const handleDeletePatient = async (patientData) => {
        try {
            const response = await deletePatientRecord(patientData.patient_id || patientData.id)
            if (response.status === 'success') {
                showToast('success', response.message || 'Patient deleted successfully')

                // Navigate back to patient records after successful deletion
                navigate('/pediapro/patient_records')

                // Dispatch custom event for real-time updates
                if (typeof window !== 'undefined') {
                    const eventDetail = {
                        patient_id: patientData.patient_id || patientData.id,
                        firstname: patientData.firstname,
                        lastname: patientData.lastname,
                        timestamp: new Date().toISOString(),
                    }
                    window.dispatchEvent(
                        new CustomEvent('patient-deleted', { detail: eventDetail })
                    )
                }
            } else {
                showToast('error', response.message || 'Failed to delete patient')
            }
        } catch (error) {
            console.error('Delete patient error:', error)
            let errorMessage = 'Failed to delete patient'
            if (error.message) {
                errorMessage = error.message
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }
            showToast('error', errorMessage)
        }
    }

    const handleEditClick = () => {
        handleEditPatient(patient)
    }

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Patient Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-black ">
                    <Link
                        to="/pediapro/patient_records"
                        className="hover:text-primary transition duration-300 ease-in-out"
                    >
                        <IoMdArrowBack className="text-2xl" />
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                            {patient.firstname.toUpperCase()}{' '}
                            {patient.middlename ? patient.middlename.toUpperCase() : ''}{' '}
                            {patient.lastname.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <TooltipHelper content="Edit patient">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEditClick}
                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            >
                                <Edit size={16} />
                            </Button>
                        </TooltipHelper>
                        <TooltipHelper content="Delete patient">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteClick}
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </TooltipHelper>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <PatientRecordsTabs patient={patient} />
            </div>

            {/* Edit Patient Modal */}
            <Dialog
                open={showEditModal}
                onOpenChange={(open) => {
                    setShowEditModal(open)
                    if (!open) setEditingPatient(null)
                }}
            >
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-8">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                <span className="text-sm text-gray-600">Loading modal...</span>
                            </div>
                        </div>
                    }
                >
                    <EditPatientModal
                        patient={editingPatient}
                        onClose={() => {
                            setShowEditModal(false)
                            setEditingPatient(null)
                        }}
                        onSuccess={handleUpdatePatient}
                    />
                </Suspense>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={() => {
                    handleDeletePatient(patient)
                    setShowDeleteDialog(false)
                }}
                title="Delete Patient"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>
                            {patient.firstname} {patient.lastname}
                        </strong>
                        ?
                        <br />
                        <br />
                        This action will:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                            <li>Permanently delete the patient record</li>
                            <li>Remove all associated medical records</li>
                            <li>This action cannot be undone</li>
                        </ul>
                    </>
                }
                confirmText={`${patient.firstname} ${patient.lastname}`}
                requireTyping={true} // ✅ enforce typing patient name
                destructive={true}
                loading={deleteLoading}
            />
        </div>
    )
}

export default DoctorPatientInfo
