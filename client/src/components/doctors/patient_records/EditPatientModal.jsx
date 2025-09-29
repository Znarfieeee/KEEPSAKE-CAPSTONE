import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { showToast } from '@/util/alertHelper'
import { cn } from '@/lib/utils'
import { User, Stethoscope, Activity, AlertCircle, Ruler, Save, X } from 'lucide-react'

// Import sections (reuse from creation modal)
import BasicInfoSection from './sections/BasicInfoSection'
import DeliverySection from './sections/DeliverySection'
import ScreeningSection from './sections/ScreeningSection'
import AllergySection from './sections/AllergySection'
import AnthropometricSection from './sections/AnthropometricSection'

// Import API functions
import {
    updatePatientRecord,
    updateDeliveryRecord,
    updateScreeningRecord,
    updateAnthropometricRecord,
    updateAllergyRecord,
} from '@/api/doctors/patient'

// Import utilities
import { sanitizeObject } from '@/util/sanitize'

// Tab Item Component (similar to PatientRecordsTabs)
const TabItem = ({ value, icon: Icon, children, hasData = false, className }) => (
    <TabsTrigger
        value={value}
        className={cn(
            'bg-muted overflow-hidden rounded-b-none border-x border-t border-gray-200 data-[state=active]:z-10 data-[state=active]:shadow-none relative',
            hasData &&
                'after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-blue-500 after:rounded-full',
            className
        )}
    >
        {Icon && <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />}
        {children}
    </TabsTrigger>
)

const EditPatientModal = ({ onClose, patient, onSuccess }) => {
    // Form states - initialize with patient data immediately
    const [patientForm, setPatientForm] = useState({})
    const [deliveryForm, setDeliveryForm] = useState({})
    const [screeningForm, setScreeningForm] = useState({})
    const [allergiesForm, setAllergiesForm] = useState({})
    const [anthroForm, setAnthroForm] = useState({})

    // Modal states
    const [activeTab, setActiveTab] = useState('basic')
    const [loading, setLoading] = useState(false)
    const [availableTabs, setAvailableTabs] = useState(['basic']) // Track which tabs have data

    // Helper function to update forms
    const updateForm = (setFormFn, field, value) =>
        setFormFn((prev) => ({ ...prev, [field]: value }))

    // Helper function to check if form has any data
    const hasFormData = (formData) => {
        return Object.values(formData).some((val) => val !== null && val !== '' && val !== false)
    }

    // Initialize form data when patient changes
    useEffect(() => {
        if (patient) {
            console.log('Initializing edit modal with patient data:', patient)

            // Basic patient information (always available)
            setPatientForm({
                firstname: patient.firstname || '',
                middlename: patient.middlename || '',
                lastname: patient.lastname || '',
                date_of_birth: patient.date_of_birth
                    ? patient.date_of_birth.split('T')[0]
                    : patient.birthdate || '',
                sex: patient.sex || '',
                birth_weight: patient.birth_weight || '',
                birth_height: patient.birth_height || '',
                bloodtype: patient.bloodtype || '',
                gestation_weeks: patient.gestation_weeks || '',
            })

            const related = patient.related_records || {}
            const tabs = ['basic'] // Always include basic

            // Initialize delivery data and check if it should be available
            const deliveryData = {
                type_of_delivery: related.delivery?.type_of_delivery || '',
                apgar_score: related.delivery?.apgar_score || '',
                mother_blood_type: related.delivery?.mother_blood_type || '',
                father_blood_type: related.delivery?.father_blood_type || '',
                distinguishable_marks: related.delivery?.distinguishable_marks || '',
                vitamin_k_date: related.delivery?.vitamin_k_date || '',
                vitamin_k_location: related.delivery?.vitamin_k_location || '',
                hepatitis_b_date: related.delivery?.hepatitis_b_date || '',
                hepatitis_b_location: related.delivery?.hepatitis_b_location || '',
                bcg_vaccination_date: related.delivery?.bcg_vaccination_date || '',
                bcg_vaccination_location: related.delivery?.bcg_vaccination_location || '',
                other_medications: related.delivery?.other_medications || '',
                discharge_diagnosis: related.delivery?.discharge_diagnosis || '',
                follow_up_visit_date: related.delivery?.follow_up_visit_date || '',
                follow_up_visit_site: related.delivery?.follow_up_visit_site || '',
                obstetrician: related.delivery?.obstetrician || '',
                pediatrician: related.delivery?.pediatrician || '',
            }
            setDeliveryForm(deliveryData)
            tabs.push('delivery') // Always show delivery tab (user can add data)

            // Initialize screening data
            const screeningData = {
                ens_date: related.screening?.ens_date || '',
                ens_remarks: related.screening?.ens_remarks || false,
                nhs_date: related.screening?.nhs_date || '',
                nhs_right_ear: related.screening?.nhs_right_ear || false,
                nhs_left_ear: related.screening?.nhs_left_ear || false,
                pos_date: related.screening?.pos_date || '',
                pos_for_cchd_right: related.screening?.pos_for_cchd_right || false,
                pos_for_cchd_left: related.screening?.pos_for_cchd_left || false,
                ror_date: related.screening?.ror_date || '',
                ror_remarks: related.screening?.ror_remarks || '',
            }
            setScreeningForm(screeningData)
            tabs.push('screening') // Always show screening tab

            // Initialize allergy data
            const allergyData = {
                allergen: related.allergies?.allergen || '',
                reaction_type: related.allergies?.reaction_type || '',
                severity: related.allergies?.severity || '',
                date_identified: related.allergies?.date_identified || '',
                notes: related.allergies?.notes || '',
            }
            setAllergiesForm(allergyData)
            tabs.push('allergies') // Always show allergies tab

            // Initialize anthropometric data (use latest measurement)
            const latestMeasurement =
                Array.isArray(related.anthropometric) && related.anthropometric.length > 0
                    ? related.anthropometric[related.anthropometric.length - 1]
                    : related.anthropometric || {}

            const anthroData = {
                weight: latestMeasurement.weight || '',
                height: latestMeasurement.height || '',
                head_circumference: latestMeasurement.head_circumference || '',
                chest_circumference: latestMeasurement.chest_circumference || '',
                abdominal_circumference: latestMeasurement.abdominal_circumference || '',
                measurement_date: latestMeasurement.measurement_date
                    ? latestMeasurement.measurement_date.split('T')[0]
                    : '',
            }
            setAnthroForm(anthroData)
            tabs.push('anthropometric') // Always show measurements tab

            setAvailableTabs(tabs)
            console.log('Available tabs for editing:', tabs)
        }
    }, [patient])

    // Validate basic information (required fields)
    const validateBasicInfo = () => {
        const required = ['firstname', 'lastname', 'date_of_birth', 'sex']
        const missing = required.filter((field) => !patientForm[field])

        if (missing.length > 0) {
            const fieldNames = missing.map((field) => {
                switch (field) {
                    case 'firstname':
                        return 'First Name'
                    case 'lastname':
                        return 'Last Name'
                    case 'date_of_birth':
                        return 'Date of Birth'
                    case 'sex':
                        return 'Sex'
                    default:
                        return field
                }
            })
            showToast('error', `Please fill in required fields: ${fieldNames.join(', ')}`)
            setActiveTab('basic') // Switch to basic tab to show the errors
            return false
        }

        // Additional validations for basic info
        if (patientForm.date_of_birth) {
            const birthDate = new Date(patientForm.date_of_birth)
            const today = new Date()
            if (birthDate > today) {
                showToast('error', 'Date of birth cannot be in the future')
                setActiveTab('basic')
                return false
            }
        }

        if (!['male', 'female'].includes(patientForm.sex)) {
            showToast('error', 'Please select a valid sex option')
            setActiveTab('basic')
            return false
        }

        return true
    }

    // Handle form submission
    const handleSubmit = async () => {
        console.log('Starting patient update process...')
        if (!validateBasicInfo()) return

        try {
            setLoading(true)

            const patientId = patient.patient_id || patient.id
            console.log('Updating patient ID:', patientId)

            // Update main patient record
            const patientPayload = sanitizeObject({
                ...patientForm,
                id: patientId,
                patient_id: patientId,
            })

            console.log('Updating patient with payload:', patientPayload)
            await onSuccess(patientPayload)

            // Update related records
            const promises = []
            const failedSections = []

            // Update delivery record if has data
            if (hasFormData(deliveryForm)) {
                promises.push(
                    updateDeliveryRecord(patientId, sanitizeObject(deliveryForm))
                        .then(() => ({ section: 'delivery', success: true }))
                        .catch((error) => {
                            console.error('Delivery update failed:', error)
                            failedSections.push('delivery')
                            return { section: 'delivery', error }
                        })
                )
            }

            // Update screening record if has data
            if (hasFormData(screeningForm)) {
                promises.push(
                    updateScreeningRecord(patientId, sanitizeObject(screeningForm))
                        .then(() => ({ section: 'screening', success: true }))
                        .catch((error) => {
                            console.error('Screening update failed:', error)
                            failedSections.push('screening')
                            return { section: 'screening', error }
                        })
                )
            }

            // Update anthropometric record if has data
            if (hasFormData(anthroForm)) {
                const sanitizedAnthro = sanitizeObject(anthroForm)
                console.log('DEBUG: Anthropometric form data:', anthroForm)
                console.log('DEBUG: Sanitized anthropometric data:', sanitizedAnthro)
                promises.push(
                    updateAnthropometricRecord(patientId, sanitizedAnthro)
                        .then(() => ({ section: 'anthropometric', success: true }))
                        .catch((error) => {
                            console.error('Anthropometric update failed:', error)
                            console.error('Anthropometric error details:', error.response?.data)
                            failedSections.push('anthropometric')
                            return { section: 'anthropometric', error }
                        })
                )
            }

            // Update allergy record if has data
            if (hasFormData(allergiesForm)) {
                promises.push(
                    updateAllergyRecord(patientId, sanitizeObject(allergiesForm))
                        .then(() => ({ section: 'allergies', success: true }))
                        .catch((error) => {
                            console.error('Allergy update failed:', error)
                            failedSections.push('allergies')
                            return { section: 'allergies', error }
                        })
                )
            }

            // Execute all related record updates
            if (promises.length > 0) {
                console.log(`Processing ${promises.length} related record updates...`)
                const results = await Promise.allSettled(promises)
                const failures = results.filter((result) => result.status === 'rejected')

                if (failures.length > 0) {
                    console.warn('Some related records failed to update:', failures)
                    const failedNames = failedSections.join(', ')
                    showToast('warning', `Patient updated, but failed to update: ${failedNames}`)
                } else {
                    console.log('All updates completed successfully')
                    showToast('success', 'Patient and all related data updated successfully')
                }
            } else {
                console.log('Patient updated with no additional sections')
                showToast('success', 'Patient updated successfully')
            }

            // Dispatch custom event for real-time updates
            if (typeof window !== 'undefined') {
                const eventDetail = {
                    ...patientPayload,
                    patient_id: patientId,
                    timestamp: new Date().toISOString(),
                }
                console.log('Dispatching patient-updated event:', eventDetail)
                window.dispatchEvent(new CustomEvent('patient-updated', { detail: eventDetail }))
            }

            console.log('Patient update process completed successfully')
            onClose()
        } catch (error) {
            console.error('Error in patient update process:', error)

            let errorMessage = 'Failed to update patient record'
            if (error.message) {
                errorMessage = error.message
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            showToast('error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Handle modal close
    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    if (!patient) {
        return null
    }

    // Define tabs with data indicators
    const tabs = [
        {
            value: 'basic',
            label: 'BASIC INFO',
            icon: User,
            hasData: true, // Always has data
            content: (
                <BasicInfoSection
                    form={patientForm}
                    updateForm={(field, value) => updateForm(setPatientForm, field, value)}
                />
            ),
        },
        {
            value: 'delivery',
            label: 'DELIVERY',
            icon: Stethoscope,
            hasData: hasFormData(deliveryForm),
            content: (
                <DeliverySection
                    form={deliveryForm}
                    updateForm={(field, value) => updateForm(setDeliveryForm, field, value)}
                />
            ),
        },
        {
            value: 'screening',
            label: 'SCREENING',
            icon: Activity,
            hasData: hasFormData(screeningForm),
            content: (
                <ScreeningSection
                    form={screeningForm}
                    updateForm={(field, value) => updateForm(setScreeningForm, field, value)}
                />
            ),
        },
        {
            value: 'allergies',
            label: 'ALLERGIES',
            icon: AlertCircle,
            hasData: hasFormData(allergiesForm),
            content: (
                <AllergySection
                    form={allergiesForm}
                    updateForm={(field, value) => updateForm(setAllergiesForm, field, value)}
                />
            ),
        },
        {
            value: 'anthropometric',
            label: 'MEASUREMENTS',
            icon: Ruler,
            hasData: hasFormData(anthroForm),
            content: (
                <AnthropometricSection
                    form={anthroForm}
                    updateForm={(field, value) => updateForm(setAnthroForm, field, value)}
                />
            ),
        },
    ]

    return (
        <Dialog open={true} onOpenChange={handleClose} modal>
            <DialogContent className="max-w-4xl max-h-[95vh]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Edit Patient: {patient.firstname} {patient.lastname}
                    </DialogTitle>
                    <DialogDescription>
                        Update patient information using the tabs below. Navigate between sections
                        freely. Blue dots indicate sections with existing data.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full h-full flex flex-col"
                    >
                        <ScrollArea className="w-full">
                            <TabsList className="before:bg-border relative h-auto w-max gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px">
                                {tabs.map((tab) => (
                                    <TabItem
                                        key={tab.value}
                                        value={tab.value}
                                        icon={tab.icon}
                                        hasData={tab.hasData}
                                    >
                                        {tab.label}
                                    </TabItem>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        <div className="flex-1 overflow-y-auto">
                            {tabs.map((tab) => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                                    <div className="space-y-4">{tab.content}</div>
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="flex justify-between mt-8">
                    <Button variant="destructive" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={cn(
                            'bg-primary text-primary-foreground hover:bg-primary/90',
                            loading && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <Save size={16} className="mr-2" />
                        {loading ? 'Updating...' : 'Update Patient'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EditPatientModal
