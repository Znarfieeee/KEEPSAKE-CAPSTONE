import React, { useState, useCallback } from 'react'
import { useAuth } from '@/context/auth'

// UI Components
import PatientRecordsHeader from '@/components/doctors/patient_records/PatientRecordsHeader'
import PatientRecordFilters from '@/components/doctors/patient_records/PatientRecordFilters'
import PatientRecordsTable from '@/components/doctors/patient_records/PatientRecordsTable'
import { showToast } from '@/util/alertHelper'

function DoctorPatientRecords() {
  const user = useAuth()
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
      id: raw.user_id,
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
    }
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (patientError) {
        showToast('error', 'Failed to load patients')
        console.error('Patient fetch error: ', patientError)
        return
      }

      setPatients()
    } catch (error) {
      showToast('error', 'Failed to load patients')
      console.error('Error: ', error)
    } finally {
      setLoading(false)
    }
  }, [formatPatient])

  // Event handlers
  const handleNewRecord = () => {
    showToast('info', 'Creating new record...')
  }

  const handleExportCSV = () => {
    showToast('info', 'Exporting records...')
  }

  const handleOpenReports = () => {
    showToast('info', 'Opening reports...')
  }

  const handleView = (record) => {
    showToast('info', 'Viewing record: ' + record.firstname + ' ' + record.lastname)
  }

  const handleEdit = (record) => {
    showToast('info', 'Editing record: ' + record.firstname + ' ' + record.lastname)
  }

  const handleArchive = (record) => {
    showToast('info', 'Archiving record: ' + record.firstname + ' ' + record.lastname)
  }

  const handleDelete = (record) => {
    showToast('info', 'Deleting record: ' + record.firstname + ' ' + record.lastname)
  }

  // Filter records
  const filteredRecords = patients.filter((record) => {
    const matchesSearch = (record.firstname + ' ' + record.lastname)
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    const matchesSex = sexFilter === 'all' || record.sex === sexFilter
    const matchesAge = !ageFilter || record.age === ageFilter.toString()
    const matchesDate =
      !dateRange?.from ||
      !dateRange?.to ||
      (new Date(record.birthdate) >= new Date(dateRange.from) &&
        new Date(record.birthdate) <= new Date(dateRange.to))

    return matchesSearch && matchesStatus && matchesSex && matchesAge && matchesDate
  })

  return (
    <div className="p-6 px-20 space-y-6">
      <PatientRecordsHeader
        onNewRecord={handleNewRecord}
        onExportCSV={handleExportCSV}
        onOpenReports={handleOpenReports}
      />

      <PatientRecordFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sexFilter={sexFilter}
        onSexChange={setSexFilter}
        ageFilter={ageFilter}
        onAgeChange={setAgeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
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
    </div>
  )
}

export default DoctorPatientRecords
