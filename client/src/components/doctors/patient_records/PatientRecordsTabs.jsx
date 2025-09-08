import React, { useEffect, useState, useMemo } from 'react'

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

const PatientRecordsTabs = ({ patient, viewPrescription }) => {
    const [prescriptions, setPrescriptions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [search, setSearch] = useState('')

    const handlePrescriptionAdded = (newPrescription) => {
        setPrescriptions((prev) => [newPrescription, ...prev])
    }

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
                        onView={viewPrescription}
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
    )
}

export default PatientRecordsTabs
