import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

// UI Components
import PatientHeader from '@/components/doctors/patient_records/PatientHeader'
import PatientRecordsTabs from '@/components/doctors/patient_records/PatientRecordsTabs'
import PatientInfoSkeleton from '@/components/doctors/patient_records/PatientInfoSkeleton'
import { usePatientContext } from '@/context/usePatientContext'
import { usePatientsRealtime } from '@/hook/useSupabaseRealtime'

const DoctorPatientInfo = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getPatient, updatePatient, loading: contextLoading } = usePatientContext()
  const [patient, setPatient] = useState(location.state?.patient || null)
  const [error, setError] = useState(null)

  // Handle real-time updates
  const handlePatientChange = ({ type, patient: updatedPatient }) => {
    if (updatedPatient.id === patientId) {
      switch (type) {
        case 'UPDATE':
        case 'PUT':
          setPatient(updatedPatient)
          updatePatient(patientId, updatedPatient)
          break
        case 'DELETE':
          navigate('/pediapro/patient_records')
          break
      }
    }
  }

  // Set up real-time subscription
  usePatientsRealtime({
    onPatientChange: handlePatientChange,
  })

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        // Use context to get patient data
        const data = await getPatient(patientId)
        setPatient(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch patient data')
        console.error('Error fetching patient data:', err)
      }
    }

    // Only fetch if we don't have the patient data already
    if (!patient) {
      fetchPatient()
    }
  }, [patientId, getPatient, patient])

  if (contextLoading || (!patient && !error)) {
    return <PatientInfoSkeleton />
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

  return (
    <div className="container mx-auto px-4 py-6">
      <PatientHeader patient={patient} />
      <div className="space-y-6">
        <PatientRecordsTabs patient={patient} screenings={patient?.screenings || []} />
      </div>
    </div>
  )
}

export default DoctorPatientInfo
