import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PatientHeader from '@/components/doctors/patient_records/PatientHeader'
import PatientInformation from '@/components/doctors/patient_records/PatientInformation'
import ScreeningTests from '@/components/doctors/patient_records/ScreeningTests'
import PatientRecordsTabs from '@/components/doctors/patient_records/PatientRecordsTabs'
import { getPatientById } from '@/api/doctors/patientApi' // You'll need to create this API function
import { patientData } from './patientData' // Temporary for mock data

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
        // TODO: Replace this with actual API call when backend is ready
        // const data = await getPatientById(patientId);
        const data = patientData // Using mock data for now
        setPatient(data)
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
    return <div className="flex justify-center items-center h-screen">Loading...</div>
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

  // Mock screening data - this should come from your backend
  const screeningTests = [
    {
      date: '09-19-2019',
      description: 'EXPANDED NEWBORN SCREENING',
      remarks: 'INITIAL',
    },
    {
      date: '9-19-2019',
      description: 'RED ORANGE REFLEX',
      remarks: '',
    },
    {
      date: '09-20-2023',
      description: 'NEWBORN HEARING SCREENING',
      right: 'PASSED',
      left: 'PASSED',
    },
    {
      date: '09-20-2019',
      description: 'PULSE OXIMETRY SCREENING FOR CCHD',
      right: 'POSITIVE',
      left: 'POSITIVE',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-6">
      <PatientHeader patient={patient} />

      <div className="space-y-6">
        <PatientInformation patient={patient} />
        <ScreeningTests screenings={screeningTests} />
        <PatientRecordsTabs />
      </div>
    </div>
  )
}

export default DoctorPatientInfo
