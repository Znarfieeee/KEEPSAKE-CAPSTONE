import React, { useEffect, useState } from 'react'

// UI Components
import { FileText, Syringe, Pill, Stethoscope } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

import PatientInformation from '@/components/doctors/patient_records/PatientInformation'
import PatientVitals from '@/components/doctors/patient_records/PatientVitals'
import PatientImmunization from '@/components/doctors/patient_records/PatientImmunization'
import PatientPrescription from '@/components/doctors/patient_records/PatientPrescriptions'

import {
    getAllPrescriptions,
    addPrescription,
    updatePrescription,
} from '@/api/doctors/prescription'

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
    const [prescriptions, setPrescriptions] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchPrescriptions = async () => {
            if (!patient?.patient_id) return

            setIsLoading(true)
            try {
                const response = await getAllPrescriptions(patient.patient_id)
                setPrescriptions(response.data || [])
            } catch (error) {
                console.error('Error fetching prescriptions:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPrescriptions()
    }, [patient?.patient_id])

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
                    <PatientPrescription onView={viewPrescription} prescription={prescriptions} />
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
