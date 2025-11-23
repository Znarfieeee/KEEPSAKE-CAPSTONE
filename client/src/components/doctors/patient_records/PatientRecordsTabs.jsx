import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { getPatientById } from '@/api/doctors/patient'

// UI Components
import { FileText, Syringe, Pill, Stethoscope, TrendingUp, FolderOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

import PatientInformation from '@/components/doctors/patient_records/PatientInformation'
import PatientVitals from '@/components/doctors/patient_records/PatientVitals'
import PatientImmunization from '@/components/doctors/patient_records/PatientImmunization'
import PatientPrescription from '@/components/doctors/patient_records/PatientPrescriptions'
import PatientGrowthCharts from '@/components/doctors/patient_records/PatientGrowthCharts'
import { PatientDocuments } from '@/components/doctors/patient_records/PatientDocuments'

// Helpers
import { showToast } from '@/util/alertHelper'

const PatientRecordsTabs = ({ patient: initialPatient, readOnly = false }) => {
    const [patient, setPatient] = useState(initialPatient)
    const [prescriptions, setPrescriptions] = useState([])
    const [isLoading] = useState(false)
    const [search, setSearch] = useState('')

    const handlePrescriptionAdded = (newPrescription) => {
        setPrescriptions((prev) => [newPrescription, ...prev])
    }

    // Refresh patient data from the server
    const refreshPatientData = useCallback(async () => {
        try {
            const response = await getPatientById(patient.patient_id || patient.id)
            if (response.status === 'success') {
                setPatient(response.data)
            }
        } catch (error) {
            console.error('Error refreshing patient data:', error)
            showToast('error', 'Failed to refresh patient data')
        }
    }, [patient?.patient_id, patient?.id])

    // Handle patient updates from EditPatientModal
    const handlePatientUpdate = useCallback(
        (event) => {
            const { patient_data, patient_id } = event.detail

            // Only update if this is the same patient and we have valid data
            if (patient_id === patient?.patient_id && patient_data) {
                const updatedPatient = {
                    ...patient,
                    ...patient_data,
                    related_records: {
                        ...patient?.related_records,
                        ...patient_data.related_records,
                    },
                }
                setPatient(updatedPatient)
            }
        },
        [patient?.patient_id, patient]
    )

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
            label: 'Info',
            fullLabel: 'INFORMATION',
            icon: FileText,
            content: (
                <div>
                    <PatientInformation patient={patient} onUpdate={refreshPatientData} readOnly={readOnly} />
                </div>
            ),
        },
        {
            value: 'vitals',
            label: 'Vitals',
            fullLabel: 'VITALS',
            icon: Stethoscope,
            content: (
                <div>
                    <PatientVitals patient={patient} readOnly={readOnly} />
                </div>
            ),
        },
        {
            value: 'growth',
            label: 'Growth',
            fullLabel: 'GROWTH CHARTS',
            icon: TrendingUp,
            content: (
                <div>
                    <PatientGrowthCharts
                        patient={patient}
                        onMeasurementAdded={refreshPatientData}
                        readOnly={readOnly}
                    />
                </div>
            ),
        },
        {
            value: 'immunization',
            label: 'Vaccines',
            fullLabel: 'IMMUNIZATION',
            icon: Syringe,
            content: (
                <div>
                    <PatientImmunization patient={patient} readOnly={readOnly} />
                </div>
            ),
        },
        {
            value: 'prescription',
            label: 'Rx',
            fullLabel: 'PRESCRIPTION',
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
                        readOnly={readOnly}
                    />
                </div>
            ),
        },
        {
            value: 'documents',
            label: 'Docs',
            fullLabel: 'DOCUMENTS',
            icon: FolderOpen,
            content: (
                <PatientDocuments
                    patientId={patient?.patient_id || patient?.id}
                    canDelete={!readOnly}
                    readOnly={readOnly}
                />
            ),
        },
    ]

    return (
        <div className="w-full">
            <Tabs defaultValue="information" className="w-full">
                {/* Mobile: Bottom navigation style */}
                <div className="block sm:hidden">
                    <TabsList className="grid grid-cols-6 h-auto bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="flex flex-col items-center justify-center py-2.5 px-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all duration-200"
                                >
                                    <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
                                    <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>

                {/* Desktop: Traditional horizontal tabs */}
                <div className="hidden sm:block">
                    <ScrollArea>
                        <TabsList className="before:bg-border relative h-auto w-max gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="bg-muted overflow-hidden rounded-b-none border-x border-t border-gray-200 data-[state=active]:z-10 data-[state=active]:shadow-none px-4 py-2"
                                    >
                                        <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
                                        {tab.fullLabel}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>

                {/* Tab Contents */}
                <div className="mt-4 sm:mt-0">
                    {tabs.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value} className="focus-visible:outline-none focus-visible:ring-0">
                            {tab.content}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    )
}

export default PatientRecordsTabs
