import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import { User, Stethoscope, Activity, AlertCircle, Ruler, Save } from 'lucide-react'

// Import sections (reuse from creation modal)
import BasicInfoSection from './sections/BasicInfoSection'
import DeliverySection from './sections/DeliverySection'
import ScreeningSection from './sections/ScreeningSection'
import AllergySection from './sections/AllergySection'
import AnthropometricSection from './sections/AnthropometricSection'

// Import API functions
import {
    updateDeliveryRecord,
    updateScreeningRecord,
    updateAnthropometricRecord,
    updateAllergyRecord,
} from '@/api/doctors/patient'

// Import utilities
import { sanitizeObject } from '@/util/sanitize'

// Tab Item Component
const TabItem = ({ value, icon: Icon, children, hasData = false, isDirty = false, className }) => (
    <TabsTrigger
        value={value}
        className={cn(
            'bg-muted overflow-hidden rounded-b-none border-x border-t border-gray-200 data-[state=active]:z-10 data-[state=active]:shadow-none relative',
            hasData &&
                'after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-blue-500 after:rounded-full',
            isDirty &&
                'after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-orange-500 after:rounded-full',
            className
        )}
    >
        {Icon && <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />}
        {children}
    </TabsTrigger>
)

const EditPatientModal = ({ onClose, patient, onSuccess }) => {
    // Form states
    const [patientForm, setPatientForm] = useState({})
    const [deliveryForm, setDeliveryForm] = useState({})
    const [screeningForm, setScreeningForm] = useState({})
    const [allergiesForm, setAllergiesForm] = useState({})
    const [anthroForm, setAnthroForm] = useState({})

    // Track which sections have been modified (dirty tracking)
    const [dirtyFields, setDirtyFields] = useState({
        basic: false,
        delivery: false,
        screening: false,
        allergies: false,
        anthropometric: false,
    })

    // Store original data for comparison
    const originalData = useRef({
        patient: {},
        delivery: {},
        screening: {},
        allergies: {},
        anthro: {},
    })

    // Modal states
    const [activeTab, setActiveTab] = useState('basic')
    const [loading, setLoading] = useState(false)

    // Helper function to check if form has any meaningful data
    const hasFormData = (formData) => {
        if (!formData) return false
        return Object.entries(formData).some(([key, val]) => {
            // Skip ID fields when checking for data
            if (key.endsWith('_id')) return false
            return val !== null && val !== '' && val !== false && val !== undefined
        })
    }

    // Helper function to deep compare objects
    const hasFormChanged = (currentForm, originalForm) => {
        if (!currentForm || !originalForm) return hasFormData(currentForm)

        const currentKeys = Object.keys(currentForm).filter(k => !k.endsWith('_id'))

        for (const key of currentKeys) {
            const currentVal = currentForm[key]
            const originalVal = originalForm[key]

            // Normalize values for comparison
            const normalizedCurrent = currentVal === '' || currentVal === null || currentVal === undefined ? '' : String(currentVal)
            const normalizedOriginal = originalVal === '' || originalVal === null || originalVal === undefined ? '' : String(originalVal)

            if (normalizedCurrent !== normalizedOriginal) {
                return true
            }
        }
        return false
    }

    // Create update functions with dirty tracking
    const createUpdateForm = useCallback((setFormFn, sectionName) => {
        return (field, value) => {
            setFormFn((prev) => ({ ...prev, [field]: value }))
            setDirtyFields((prev) => ({ ...prev, [sectionName]: true }))
        }
    }, [])

    // Initialize form data when patient changes
    useEffect(() => {
        if (patient) {
            const related = patient.related_records || {}

            // Basic patient information
            const patientData = {
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
            }
            setPatientForm(patientData)
            originalData.current.patient = { ...patientData }

            // Delivery data
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
            originalData.current.delivery = { ...deliveryData }

            // Screening data
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
            originalData.current.screening = { ...screeningData }

            // Allergy data - handle array properly
            const allergiesArray = related.allergies || []
            const firstAllergy = Array.isArray(allergiesArray) && allergiesArray.length > 0
                ? allergiesArray[0]
                : {}

            const allergyData = {
                allergy_id: firstAllergy.allergy_id || '',
                allergen: firstAllergy.allergen || '',
                reaction_type: firstAllergy.reaction_type || '',
                severity: firstAllergy.severity || '',
                date_identified: firstAllergy.date_identified || '',
                notes: firstAllergy.notes || '',
            }
            setAllergiesForm(allergyData)
            originalData.current.allergies = { ...allergyData }

            // Anthropometric data - handle both key names and array
            const anthroArray = related.anthropometric_measurements || related.anthropometric || []
            const latestMeasurement = Array.isArray(anthroArray) && anthroArray.length > 0
                ? anthroArray[anthroArray.length - 1]
                : (typeof anthroArray === 'object' ? anthroArray : {})

            const anthroData = {
                am_id: latestMeasurement.am_id || '',
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
            originalData.current.anthro = { ...anthroData }

            // Reset dirty flags
            setDirtyFields({
                basic: false,
                delivery: false,
                screening: false,
                allergies: false,
                anthropometric: false,
            })
        }
    }, [patient])

    // Validate basic information
    const validateBasicInfo = () => {
        const required = ['firstname', 'lastname', 'date_of_birth', 'sex']
        const missing = required.filter((field) => !patientForm[field])

        if (missing.length > 0) {
            const fieldNames = missing.map((field) => {
                switch (field) {
                    case 'firstname': return 'First Name'
                    case 'lastname': return 'Last Name'
                    case 'date_of_birth': return 'Date of Birth'
                    case 'sex': return 'Sex'
                    default: return field
                }
            })
            showToast('error', `Please fill in required fields: ${fieldNames.join(', ')}`)
            setActiveTab('basic')
            return false
        }

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
        if (!validateBasicInfo()) return

        try {
            setLoading(true)

            const patientId = patient.patient_id || patient.id

            // Check which sections actually changed
            const basicChanged = hasFormChanged(patientForm, originalData.current.patient)
            const deliveryChanged = dirtyFields.delivery && hasFormChanged(deliveryForm, originalData.current.delivery)
            const screeningChanged = dirtyFields.screening && hasFormChanged(screeningForm, originalData.current.screening)
            const allergiesChanged = dirtyFields.allergies && hasFormChanged(allergiesForm, originalData.current.allergies)
            const anthroChanged = dirtyFields.anthropometric && hasFormChanged(anthroForm, originalData.current.anthro)

            // Update main patient record if changed
            if (basicChanged) {
                const patientPayload = sanitizeObject({
                    ...patientForm,
                    id: patientId,
                    patient_id: patientId,
                })
                await onSuccess(patientPayload)
            }

            // Update only the sections that actually changed
            const promises = []
            const updatedSections = []
            const failedSections = []

            if (deliveryChanged && hasFormData(deliveryForm)) {
                promises.push(
                    updateDeliveryRecord(patientId, sanitizeObject(deliveryForm))
                        .then(() => { updatedSections.push('delivery'); return { section: 'delivery', success: true } })
                        .catch((error) => { failedSections.push('delivery'); console.error('Delivery update failed:', error); return { section: 'delivery', error } })
                )
            }

            if (screeningChanged && hasFormData(screeningForm)) {
                promises.push(
                    updateScreeningRecord(patientId, sanitizeObject(screeningForm))
                        .then(() => { updatedSections.push('screening'); return { section: 'screening', success: true } })
                        .catch((error) => { failedSections.push('screening'); console.error('Screening update failed:', error); return { section: 'screening', error } })
                )
            }

            if (anthroChanged && hasFormData(anthroForm)) {
                const sanitizedAnthro = sanitizeObject(anthroForm)
                promises.push(
                    updateAnthropometricRecord(patientId, sanitizedAnthro)
                        .then(() => { updatedSections.push('anthropometric'); return { section: 'anthropometric', success: true } })
                        .catch((error) => { failedSections.push('anthropometric'); console.error('Anthropometric update failed:', error); return { section: 'anthropometric', error } })
                )
            }

            if (allergiesChanged && hasFormData(allergiesForm)) {
                const sanitizedAllergy = sanitizeObject(allergiesForm)
                promises.push(
                    updateAllergyRecord(patientId, sanitizedAllergy)
                        .then(() => { updatedSections.push('allergies'); return { section: 'allergies', success: true } })
                        .catch((error) => { failedSections.push('allergies'); console.error('Allergy update failed:', error); return { section: 'allergies', error } })
                )
            }

            // Execute all updates
            if (promises.length > 0) {
                await Promise.allSettled(promises)

                if (failedSections.length > 0) {
                    showToast('warning', `Patient updated, but failed to update: ${failedSections.join(', ')}`)
                } else {
                    showToast('success', 'Patient and related data updated successfully')
                }
            } else if (basicChanged) {
                showToast('success', 'Patient updated successfully')
            } else {
                showToast('info', 'No changes detected')
                onClose()
                return
            }

            // Dispatch event for real-time updates - ONLY include sections that changed
            if (typeof window !== 'undefined' && patient) {
                // Start with a complete copy of existing related_records
                const updatedRelatedRecords = { ...patient.related_records }

                // Only update sections that actually changed and succeeded
                if (deliveryChanged && updatedSections.includes('delivery')) {
                    updatedRelatedRecords.delivery = sanitizeObject(deliveryForm)
                }

                if (screeningChanged && updatedSections.includes('screening')) {
                    updatedRelatedRecords.screening = sanitizeObject(screeningForm)
                }

                if (anthroChanged && updatedSections.includes('anthropometric')) {
                    const newMeasurement = {
                        ...sanitizeObject(anthroForm),
                        am_id: anthroForm.am_id || `temp_${Date.now()}`,
                    }

                    // Get existing measurements (handle both key names)
                    const existingMeasurements = patient.related_records?.anthropometric_measurements
                        || patient.related_records?.anthropometric
                        || []

                    // Update the measurement array
                    if (Array.isArray(existingMeasurements) && existingMeasurements.length > 0) {
                        // Update the last measurement
                        updatedRelatedRecords.anthropometric_measurements = [
                            ...existingMeasurements.slice(0, -1),
                            newMeasurement
                        ]
                    } else {
                        updatedRelatedRecords.anthropometric_measurements = [newMeasurement]
                    }
                }

                if (allergiesChanged && updatedSections.includes('allergies')) {
                    const sanitizedAllergy = sanitizeObject(allergiesForm)
                    const existingAllergies = patient.related_records?.allergies || []

                    if (allergiesForm.allergy_id && Array.isArray(existingAllergies)) {
                        // Update existing allergy
                        updatedRelatedRecords.allergies = existingAllergies.map(allergy =>
                            allergy.allergy_id === allergiesForm.allergy_id
                                ? { ...allergy, ...sanitizedAllergy }
                                : allergy
                        )
                    } else if (Array.isArray(existingAllergies)) {
                        // Add new allergy
                        updatedRelatedRecords.allergies = [...existingAllergies, sanitizedAllergy]
                    } else {
                        updatedRelatedRecords.allergies = [sanitizedAllergy]
                    }
                }

                const updatedPatientData = {
                    ...patient,
                    ...(basicChanged ? sanitizeObject(patientForm) : {}),
                    related_records: updatedRelatedRecords,
                }

                const eventDetail = {
                    patient_id: patientId,
                    updated_sections: updatedSections,
                    failed_sections: failedSections,
                    timestamp: new Date().toISOString(),
                    patient_data: updatedPatientData,
                    original_patient: patient,
                }

                window.dispatchEvent(new CustomEvent('patient-updated', { detail: eventDetail }))
            }

            // Close modal after brief delay
            setTimeout(() => {
                onClose()
            }, 500)

        } catch (error) {
            console.error('Error in patient update process:', error)
            const errorMessage = error.message || error.response?.data?.message || 'Failed to update patient record'
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

    // Define tabs with data and dirty indicators
    const tabs = [
        {
            value: 'basic',
            label: 'BASIC INFO',
            icon: User,
            hasData: true,
            isDirty: dirtyFields.basic,
            content: (
                <BasicInfoSection
                    form={patientForm}
                    updateForm={createUpdateForm(setPatientForm, 'basic')}
                />
            ),
        },
        {
            value: 'delivery',
            label: 'DELIVERY',
            icon: Stethoscope,
            hasData: hasFormData(deliveryForm),
            isDirty: dirtyFields.delivery,
            content: (
                <DeliverySection
                    form={deliveryForm}
                    updateForm={createUpdateForm(setDeliveryForm, 'delivery')}
                />
            ),
        },
        {
            value: 'screening',
            label: 'SCREENING',
            icon: Activity,
            hasData: hasFormData(screeningForm),
            isDirty: dirtyFields.screening,
            content: (
                <ScreeningSection
                    form={screeningForm}
                    updateForm={createUpdateForm(setScreeningForm, 'screening')}
                />
            ),
        },
        {
            value: 'allergies',
            label: 'ALLERGIES',
            icon: AlertCircle,
            hasData: hasFormData(allergiesForm),
            isDirty: dirtyFields.allergies,
            content: (
                <AllergySection
                    form={allergiesForm}
                    updateForm={createUpdateForm(setAllergiesForm, 'allergies')}
                />
            ),
        },
        {
            value: 'anthropometric',
            label: 'MEASUREMENTS',
            icon: Ruler,
            hasData: hasFormData(anthroForm),
            isDirty: dirtyFields.anthropometric,
            content: (
                <AnthropometricSection
                    form={anthroForm}
                    updateForm={createUpdateForm(setAnthroForm, 'anthropometric')}
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
                        Update patient information using the tabs below. Blue dots indicate sections with data.
                        Orange dots indicate unsaved changes.
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
                                        hasData={tab.hasData && !tab.isDirty}
                                        isDirty={tab.isDirty}
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
