import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// UI Components
import { IoMdArrowBack } from 'react-icons/io'

import PatientRecordsTabs from '@/components/doctors/patient_records/PatientRecordsTabs'
import { getPatientById } from '@/api/doctors/patient'
import LoadingSkeleton from '@/components/doctors/patient_records/LoadingSkeleton'

const DoctorPatientInfo = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Patient Header */}
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/pediapro/patient_records"
          className="flex items-center gap-2 text-black hover:text-primary transition duration-300 ease-in-out"
        >
          <IoMdArrowBack className="text-2xl" />
          <span className="text-2xl font-bold">
            {patient.firstname} {patient.lastname}
          </span>
        </Link>
      </div>

      <div className="space-y-6">
        <PatientRecordsTabs patient={patient} />
      </div>
    </div>
  )
}

export default DoctorPatientInfo
