import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth'
import { usePatientsRealtime } from '@/hook/useSupabaseRealtime'
import { getPatientById, updatePatientRecord, deactivate_patient } from '@/api/doctors/patient'
import { supabase } from '@/lib/supabaseClient'

import { useNavigate } from 'react-router-dom'

// UI Components
import PatientRecordsHeader from '@/components/doctors/patient_records/PatientRecordsHeader'
import PatientRecordFilters from '@/components/doctors/patient_records/PatientRecordFilters'
import PatientRecordsTable from '@/components/doctors/patient_records/PatientRecordsTable'
import Unauthorized from '@/components/Unauthorized'
import { Button } from '@/components/ui/Button'

// Helper
import { showToast } from '@/util/alertHelper'

// Import modals
import AddPatientModal from '@/components/doctors/patient_records/AddPatientModal'
// const EditPatientModal = lazy(() => import('@/components/doctors/patient_records/EditPatientModal'))
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
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [editingPatient, setEditingPatient] = useState(null)

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

            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (patientError) {
                showToast('error', 'Failed to load patients')
                console.error('Patient fetch error: ', patientError)
                return
            }

            setPatients(patientData.map(formatPatient))
        } catch (error) {
            showToast('error', 'Failed to load patients')
            console.error('Error: ', error)
        } finally {
            setLoading(false)
        }
    }, [formatPatient])

    // Set up real-time subscription and fetch initial data
    useEffect(() => {
        fetchPatients()
    }, [fetchPatients])

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

    const navigate = useNavigate()

    const handleView = (record) => {
        // Navigate to the patient information page with the patient ID
        navigate(`/pediapro/patient_records/${record.id}`, {
            state: { patient: record },
        })
    }

    const handleEdit = async (record) => {
        try {
            // Fetch complete patient data for editing
            const response = await getPatientById(record.id)
            if (response.status === 'success') {
                setEditingPatient(response.data)
                setShowEditModal(true)
            } else {
                showToast('error', 'Failed to load patient details')
            }
        } catch (error) {
            console.error('Edit patient error:', error)
            // Fallback to basic data
            setEditingPatient(record)
            setShowEditModal(true)
        }
    }

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

    const handleDelete = (record) => {
        if (
            window.confirm(
                `Delete patient ${record.firstname} ${record.lastname}? This action cannot be undone.`
            )
        ) {
            // For now, just show a message - implement actual delete API if needed
            showToast('warning', 'Delete functionality not implemented yet')
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
    if (user?.role !== 'doctor') {
        return <Unauthorized />
    }

    return (
        <div className="p-6 px-20 space-y-6">
            <PatientRecordsHeader
                onNewRecord={handleAddPatient}
                onExportCSV={handleExportCSV}
                onOpenReports={handleOpenReports}
                onRefresh={fetchPatients}
            />

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
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
            />

            {/* Modals */}
            {showAddModal && (
                <AddPatientModal open={showAddModal} onClose={() => setShowAddModal(false)} />
            )}
        </div>
    )
}

export default DoctorPatientRecords
