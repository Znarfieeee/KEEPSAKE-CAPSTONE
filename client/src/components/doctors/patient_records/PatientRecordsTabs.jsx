import React, { useEffect, useState, useMemo, useCallback } from 'react'

// UI Components
import { FileText, Syringe, Pill, Stethoscope } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

import PatientInformation from '@/components/doctors/patient_records/PatientInformation'
import PatientVitals from '@/components/doctors/patient_records/PatientVitals'
import PatientImmunization from '@/components/doctors/patient_records/PatientImmunization'
import PatientPrescription from '@/components/doctors/patient_records/PatientPrescriptions'

const TabItem = ({ value, icon: Icon, children }) => (
    <TabsTrigger
        value={value}
        className="bg-muted overflow-hidden rounded-b-none border-x border-t border-gray-200 data-[state=active]:z-10 data-[state=active]:shadow-none"
    >
        {Icon && <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />}
        {children}
    </TabsTrigger>
)

const PatientRecordsTabs = ({ patient: initialPatient }) => {
    const [patient, setPatient] = useState(initialPatient)
    const [prescriptions, setPrescriptions] = useState([])
    const [isLoading] = useState(false)
    const [search, setSearch] = useState('')

    const handlePrescriptionAdded = (newPrescription) => {
        setPrescriptions((prev) => [newPrescription, ...prev])
    }

    // Handle patient updates from EditPatientModal
    const handlePatientUpdate = useCallback((event) => {
        const { patient_data, patient_id } = event.detail

        // Only update if this is the same patient and we have valid data
        if (patient_id === patient?.patient_id && patient_data) {
            console.log('Updating patient data in tabs:', patient_data)
            // Ensure the patient data has the required structure
            const updatedPatient = {
                ...patient,
                ...patient_data,
                related_records: {
                    ...patient?.related_records,
                    ...patient_data.related_records
                }
            }
            setPatient(updatedPatient)
        }
    }, [patient?.patient_id, patient])

    // Listen for patient update events
    useEffect(() => {
        window.addEventListener('patient-updated', handlePatientUpdate)
        window.addEventListener('patient-created', handlePatientUpdate)

        return () => {
            window.removeEventListener('patient-updated', handlePatientUpdate)
            window.removeEventListener('patient-created', handlePatientUpdate)
        }
    }, [handlePatientUpdate])

    // Update patient state when initial patient prop changes
    useEffect(() => {
        setPatient(initialPatient)
    }, [initialPatient])

    useEffect(() => {
        if (patient?.related_records?.prescriptions) {
            // Ensure we're working with an array and format the data
            const prescriptionData = Array.isArray(patient.related_records.prescriptions)
                ? patient.related_records.prescriptions
                : [patient.related_records.prescriptions].filter(Boolean)
            setPrescriptions(prescriptionData)
        } else {
            setPrescriptions([])
        }
    }, [patient?.related_records?.prescriptions])

    // Debug log to check if all related data is being received
    useEffect(() => {
        if (patient?.related_records) {
            console.log('Patient related records:', {
                delivery: patient.related_records.delivery,
                anthropometric_measurements: patient.related_records.anthropometric_measurements,
                screening: patient.related_records.screening,
                allergies: patient.related_records.allergies,
                prescriptions: patient.related_records.prescriptions,
                vaccinations: patient.related_records.vaccinations,
                parent_access: patient.related_records.parent_access
            })
        }
    }, [patient?.related_records])

    // Early return if patient data is not available
    if (!patient) {
        return (
            <div className="w-full p-8 text-center">
                <p className="text-muted-foreground">Loading patient data...</p>
            </div>
        )
    }

    // Filter prescriptions based on search query with improved error handling
    const filteredPrescriptions = useMemo(() => {
        if (!Array.isArray(prescriptions)) {
            console.warn('Prescriptions is not an array:', prescriptions)
            return []
        }

        return prescriptions.filter((rx) => {
            if (!rx) return false
            const searchLower = search.toLowerCase()

            // Create an array of searchable fields
            const searchableFields = [
                rx.findings,
                rx.prescription_date,
                rx.status,
                rx.return_date,
                rx.consultation_notes,
                rx.medications?.map((med) => med.medication_name)?.join(' '), // Include medication names in search
            ].filter(Boolean) // Remove any undefined/null values

            // Return true if any field includes the search term
            return (
                searchLower === '' ||
                searchableFields.some((field) => String(field).toLowerCase().includes(searchLower))
            )
        })
    }, [prescriptions, search])

    const tabs = [
        {
            value: 'information',
            label: 'INFORMATION',
            icon: FileText,
            content: (
                <div>
                    <PatientInformation patient={patient} />
                </div>
            ),
        },
        {
            value: 'vitals',
            label: 'Vitals',
            icon: Stethoscope,
            content: (
                <div>
                    <PatientVitals patient={patient} />
                </div>
            ),
        },
        {
            value: 'immunization',
            label: 'IMMUNIZATION',
            icon: Syringe,
            content: (
                <div>
                    <PatientImmunization patient={patient} />
                </div>
            ),
        },
        {
            value: 'prescription',
            label: 'PRESCRIPTION',
            icon: Pill,
            content: (
                <div>
                    <PatientPrescription
                        prescription={filteredPrescriptions}
                        isLoading={isLoading}
                        search={search}
                        onSearchChange={(value) => setSearch(value)}
                        patient={patient}
                        onPrescriptionAdded={handlePrescriptionAdded}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <Tabs defaultValue="information" className="w-full">
                <ScrollArea>
                    <TabsList className="before:bg-border ml-8 relative h-auto w-max gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px">
                        {tabs.map((tab) => (
                            <TabItem key={tab.value} value={tab.value} icon={tab.icon}>
                                {tab.label}
                            </TabItem>
                        ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {tabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        </>
    )
}

export default PatientRecordsTabs
