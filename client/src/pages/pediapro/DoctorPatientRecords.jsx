import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
import { useAuth } from '@/context/auth'
import {
    getPatients,
    getPatientById,
    updatePatientRecord,
    deactivate_patient,
    deletePatientRecord,
} from '@/api/doctors/patient'

import { useNavigate } from 'react-router-dom'

// UI Components
import PatientRecordsHeader from '@/components/doctors/patient_records/PatientRecordsHeader'
import PatientRecordFilters from '@/components/doctors/patient_records/PatientRecordFilters'
import PatientRecordsTable from '@/components/doctors/patient_records/PatientRecordsTable'
import Unauthorized from '@/components/Unauthorized'
import { Dialog } from '@/components/ui/dialog'

// Helper
import { showToast } from '@/util/alertHelper'
import { usePatientsRealtime } from '@/hook/useSupabaseRealtime'

// Import modals - Lazy loaded with preloading
const StepperAddPatientModal = lazy(() =>
    import('@/components/doctors/patient_records/StepperAddPatientModal')
)
const EditPatientModal = lazy(() => import('@/components/doctors/patient_records/EditPatientModal'))
const InviteParentWithPatientSelectionModal = lazy(() =>
    import('@/components/doctors/patient_records/InviteParentWithPatientSelectionModal')
)

// Preload the EditPatientModal when component mounts or when user interacts
const preloadEditModal = () => {
    const componentImport = () => import('@/components/doctors/patient_records/EditPatientModal')
    return componentImport
}
// const PatientDetailModal = lazy(() => import('@/components/doctors/patient_records/PatientDetailModal'))

function DoctorPatientRecords() {
    const { user } = useAuth()
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)

    // State for filters
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sexFilter, setSexFilter] = useState('all')
    const [ageFilter, setAgeFilter] = useState(null)
    const [dateRange, setDateRange] = useState(null)

    // Pagination state
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showInviteParentModal, setShowInviteParentModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [editingPatient, setEditingPatient] = useState(null)
    const [editModalPreloaded, setEditModalPreloaded] = useState(false)

    // Helper to format patient data
    const formatPatient = useCallback((raw) => {
        const birthDate = new Date(raw.date_of_birth)
        const now = new Date()
        let age, ageUnit

        const years = now.getFullYear() - birthDate.getFullYear()
        const months = now.getMonth() - birthDate.getMonth() + years * 12
        const isLessThanOneYear =
            years < 1 ||
            (years === 1 && now < new Date(birthDate.setFullYear(birthDate.getFullYear() + 1)))

        if (isLessThanOneYear) {
            age = months
            ageUnit = 'months'
        } else {
            age = years
            ageUnit = 'years'
        }

        return {
            id: raw.patient_id || raw.user_id,
            firstname: raw.firstname,
            lastname: raw.lastname,
            age: age,
            ageUnit: ageUnit,
            sex: raw.sex,
            birth_weight: raw.birth_weight,
            birth_height: raw.birth_height,
            bloodtype: raw.bloodtype,
            gestation_weeks: raw.gestation_weeks,
            is_active: raw.is_active,
            birthdate: raw.date_of_birth,
            created_by: raw.created_by,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
        }
    }, [])

    const handlePatientChange = useCallback(
        ({ type, patient }) => {
            console.log(`Real-time patient ${type} received:`, patient)

            switch (type) {
                case 'INSERT':
                    setPatients((prev) => {
                        const exists = prev.some((p) => p.id === patient.id)
                        if (exists) return prev

                        showToast(
                            'success',
                            `New patient "${patient.firstname} ${patient.lastname}" added`
                        )
                        return [...prev, patient]
                    })
                    break

                case 'UPDATE':
                case 'PUT':
                    setPatients((prev) =>
                        prev.map((p) => (p.id === patient.id ? { ...patient } : p))
                    )
                    showToast('info', `Patient "${patient.firstname} ${patient.lastname}" updated`)

                    // Update modal data if currently viewing/editing this patient
                    if (showDetailModal && selectedPatient?.id === patient.id) {
                        setSelectedPatient(patient)
                    }
                    if (showEditModal && editingPatient?.id === patient.id) {
                        setEditingPatient(patient)
                    }
                    break

                case 'DELETE':
                    setPatients((prev) => prev.filter((p) => p.id !== patient.id))
                    showToast(
                        'warning',
                        `Patient "${patient.firstname} ${patient.lastname}" removed`
                    )

                    // Close modals if viewing/editing deleted patient
                    if (showDetailModal && selectedPatient?.id === patient.id) {
                        setShowDetailModal(false)
                        setSelectedPatient(null)
                    }
                    if (showEditModal && editingPatient?.id === patient.id) {
                        setShowEditModal(false)
                        setEditingPatient(null)
                    }
                    break

                default:
                    console.warn('Unknown real-time event type: ', type)
            }
        },
        [showDetailModal, selectedPatient, showEditModal, editingPatient]
    )

    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true)

            // Use backend API which enforces facility isolation via RLS
            const response = await getPatients()

            if (response.status === 'success') {
                // Backend returns formatted data from facility_patients junction
                const formattedPatients = response.data.map((item) => {
                    // Extract patient data from nested structure
                    const patient = item.patients || item
                    return formatPatient(patient)
                })
                setPatients(formattedPatients)
            } else {
                showToast('error', response.message || 'Failed to load patients')
            }
        } catch (error) {
            showToast('error', 'Failed to load patients')
            console.error('Error fetching patients:', error)
        } finally {
            setLoading(false)
        }
    }, [formatPatient])

    // Set up real-time subscription and fetch initial data
    useEffect(() => {
        fetchPatients()
    }, [fetchPatients])

    // Preload EditPatientModal after initial load to improve UX
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!editModalPreloaded) {
                preloadEditModal()()
                    .then(() => {
                        setEditModalPreloaded(true)
                    })
                    .catch(() => {
                        // Silently fail, component will still load when needed
                    })
            }
        }, 2000) // Preload after 2 seconds

        return () => clearTimeout(timer)
    }, [editModalPreloaded])

    usePatientsRealtime({
        onPatientChange: handlePatientChange,
    })

    // Event handlers
    const handleAddPatient = () => {
        setShowAddModal(true)
    }

    const handleExportCSV = () => {
        try {
            const headers = [
                'First Name',
                'Last Name',
                'Age',
                'Sex',
                'Birth Weight',
                'Birth Height',
                'Blood Type',
                'Gestation Weeks',
                'Birth Date',
                'Status',
            ]

            const rows = filteredRecords.map((p) => [
                p.firstname,
                p.lastname,
                `${p.age} ${p.ageUnit}`,
                p.sex,
                p.birth_weight || '—',
                p.birth_height || '—',
                p.bloodtype || '—',
                p.gestation_weeks || '—',
                new Date(p.birthdate).toLocaleDateString(),
                p.is_active ? 'Active' : 'Inactive',
            ])

            const csvContent = [headers, ...rows]
                .map((row) => row.map((field) => `"${field}"`).join(','))
                .join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'patient_records.csv'
            link.click()
            URL.revokeObjectURL(url)

            showToast('success', 'Patient records exported successfully')
        } catch (error) {
            showToast('error', 'Failed to export records')
            console.error('Export error:', error)
        }
    }

    const handleOpenReports = () => {
        showToast('info', 'Opening reports...')
    }

    const handleInviteParent = () => {
        setShowInviteParentModal(true)
    }

    const handleInviteParentSuccess = () => {
        // Refresh patient list to show updated parent access
        fetchPatients()
        setShowInviteParentModal(false)
    }

    const navigate = useNavigate()

    const handleView = (record) => {
        // Navigate to the patient information page with the patient ID
        if (user?.role == 'doctor') {
            navigate(`/pediapro/patient_records/${record.id}`, {
                state: { patient: record },
            })
        } else {
            navigate(`/nurse/patient_records/${record.id}`, {
                state: { patient: record },
            })
        }
    }

    const handleEdit = async (record) => {
        console.log('Opening edit modal for patient:', record.id)

        try {
            // Fetch complete patient data with related records before opening modal
            const response = await getPatientById(record.id)
            if (response.status === 'success') {
                console.log('Fetched complete patient data:', response.data)
                setEditingPatient(response.data)
                setShowEditModal(true)
            } else {
                showToast('error', response.message || 'Failed to load patient details')
                console.error('Failed to fetch patient data:', response)
            }
        } catch (error) {
            console.error('Edit patient error:', error)
            let errorMessage = 'Failed to load patient details'
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error.message) {
                errorMessage = error.message
            }
            showToast('error', errorMessage)
        }
    }

    // Handle preloading on hover for better UX
    const handleEditHover = useCallback(() => {
        if (!editModalPreloaded) {
            preloadEditModal()()
                .then(() => {
                    setEditModalPreloaded(true)
                })
                .catch(() => {
                    // Silently fail
                })
        }
    }, [editModalPreloaded])

    const handleUpdatePatient = async (patientData) => {
        try {
            const response = await updatePatientRecord(patientData)
            if (response.status === 'success') {
                showToast('success', 'Patient updated successfully')
                setShowEditModal(false)
                setEditingPatient(null)
                // Real-time will handle the state update
            } else {
                showToast('error', 'Failed to update patient')
            }
        } catch (error) {
            showToast('error', 'Failed to update patient')
            console.error('Update patient error:', error)
        }
    }

    const handleArchive = async (record) => {
        if (window.confirm(`Archive patient ${record.firstname} ${record.lastname}?`)) {
            try {
                const response = await deactivate_patient(record.id)
                if (response.status === 'success') {
                    showToast('success', 'Patient archived successfully')
                    // Real-time will handle the state update
                } else {
                    showToast('error', 'Failed to archive patient')
                }
            } catch (error) {
                showToast('error', 'Failed to archive patient')
                console.error('Archive patient error:', error)
            }
        }
    }

    const handleDelete = async (record) => {
        console.log('Delete requested for patient:', record)

        try {
            const response = await deletePatientRecord(record.id)
            if (response.status === 'success') {
                showToast('success', response.message || 'Patient record deleted successfully')

                // Dispatch custom event for real-time updates
                if (typeof window !== 'undefined') {
                    const eventDetail = {
                        patient_id: record.id,
                        firstname: record.firstname,
                        lastname: record.lastname,
                        timestamp: new Date().toISOString(),
                    }
                    console.log('Dispatching patient-deleted event:', eventDetail)
                    window.dispatchEvent(
                        new CustomEvent('patient-deleted', { detail: eventDetail })
                    )
                }

                // Real-time will handle the state update, but we can also manually remove it
                setPatients((prevPatients) =>
                    prevPatients.filter((patient) => patient.id !== record.id)
                )
            } else {
                showToast('error', response.message || 'Failed to delete patient record')
            }
        } catch (error) {
            console.error('Delete patient error:', error)

            let errorMessage = 'Failed to delete patient record'
            if (error.message) {
                errorMessage = error.message
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            showToast('error', errorMessage)
        }
    }

    // Filter records
    const filteredRecords = useMemo(() => {
        return patients.filter((record) => {
            const matchesSearch = (record.firstname + ' ' + record.lastname)
                .toLowerCase()
                .includes(search.toLowerCase())

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && record.is_active) ||
                (statusFilter === 'inactive' && !record.is_active)

            const matchesSex = sexFilter === 'all' || record.sex === sexFilter

            const matchesAge = !ageFilter || record.age.toString() === ageFilter.toString()

            const matchesDate =
                !dateRange?.from ||
                !dateRange?.to ||
                (new Date(record.birthdate) >= new Date(dateRange.from) &&
                    new Date(record.birthdate) <= new Date(dateRange.to))

            return matchesSearch && matchesStatus && matchesSex && matchesAge && matchesDate
        })
    }, [patients, search, statusFilter, sexFilter, ageFilter, dateRange])

    // Check if user is authorized
    if (user?.role !== 'doctor' && user?.role !== 'nurse') {
        return <Unauthorized />
    }

    return (
        <div className="p-6 px-20 space-y-6">
            {/* Add Patient Modal with Dialog/Trigger */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <PatientRecordsHeader
                    onNewRecord={handleAddPatient}
                    onExportCSV={handleExportCSV}
                    onOpenReports={handleOpenReports}
                    onInviteParent={handleInviteParent}
                    onRefresh={fetchPatients}
                />
                <Suspense fallback={null}>
                    <StepperAddPatientModal
                        open={showAddModal}
                        onClose={() => setShowAddModal(false)}
                    />
                </Suspense>
            </Dialog>

            <PatientRecordFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                }}
                sexFilter={sexFilter}
                onSexChange={(val) => {
                    setSexFilter(val)
                    setPage(1)
                }}
                ageFilter={ageFilter}
                onAgeChange={(val) => {
                    setAgeFilter(val)
                    setPage(1)
                }}
                dateRange={dateRange}
                onDateRangeChange={(val) => {
                    setDateRange(val)
                    setPage(1)
                }}
            />

            <PatientRecordsTable
                records={filteredRecords}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                user={user}
                onEdit={handleEdit}
                onEditHover={handleEditHover}
                onArchive={handleArchive}
                onDelete={handleDelete}
            />

            {/* Edit Patient Modal */}
            <Dialog
                open={showEditModal}
                onOpenChange={(open) => {
                    setShowEditModal(open)
                    if (!open) setEditingPatient(null)
                }}
            >
                <Suspense fallback={null}>
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

            {/* Invite Parent with Patient Selection Modal */}
            <Suspense fallback={null}>
                <InviteParentWithPatientSelectionModal
                    open={showInviteParentModal}
                    onClose={() => setShowInviteParentModal(false)}
                    patients={filteredRecords}
                    onSuccess={handleInviteParentSuccess}
                />
            </Suspense>
        </div>
    )
}

export default DoctorPatientRecords
