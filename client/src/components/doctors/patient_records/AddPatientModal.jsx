import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Stethoscope, Activity, AlertCircle, Ruler } from 'lucide-react'

// API functions
import {
    addPatientRecord,
    addDeliveryRecord,
    addAnthropometricRecord,
    addScreeningRecord,
    addAllergyRecord,
} from '@/api/doctors/patient'

// Utilities
import { sanitizeObject } from '@/util/sanitize'
import { showToast } from '@/util/alertHelper'
import { cn } from '@/lib/utils' // Class name utility function

// Import sections
import BasicInfoSection from './sections/BasicInfoSection'
import AccordionSection from './sections/AccordionSection'
import DeliverySection from './sections/DeliverySection'
import ScreeningSection from './sections/ScreeningSection'
import AllergySection from './sections/AllergySection'
import AnthropometricSection from './sections/AnthropometricSection'

// Initial form states
const patientInitForm = {
    firstname: '',
    lastname: '',
    date_of_birth: '',
    sex: '',
    birth_weight: '',
    birth_height: '',
    bloodtype: '',
    gestation_weeks: '',
}

const deliveryInitForm = {
    type_of_delivery: '',
    apgar_score: '',
    mother_blood_type: '',
    father_blood_type: '',
    distinguishable_marks: '',
    vitamin_k_date: '',
    vitamin_k_location: '',
    hepatitis_b_date: '',
    hepatitis_b_location: '',
    bcg_vaccination_date: '',
    bcg_vaccination_location: '',
    other_medications: '',
    discharge_diagnosis: '',
    follow_up_visit_date: '',
    follow_up_visit_site: '',
    obstetrician: '',
    pediatrician: '',
}

const screeningInitForm = {
    ens_date: '',
    ens_remarks: '',
    nhs_date: '',
    nhs_right_ear: '',
    nhs_left_ear: '',
    pos_date: '',
    pos_for_cchd_right: '',
    pos_for_cchd_left: '',
    ror_date: '',
    ror_remarks: '',
}

const allergiesInitForm = {
    allergen: '',
    reaction_type: '',
    severity: '',
    date_identified: '',
    notes: '',
}

const anthroInitForm = {
    weight: '',
    height: '',
    head_circumference: '',
    chest_circumference: '',
    abdominal_circumference: '',
    measurement_date: '',
}

const AddPatientModal = ({ open, onClose }) => {
    // Form states
    const [patientForm, setPatientForm] = useState(patientInitForm)
    const [deliveryForm, setDeliveryForm] = useState(deliveryInitForm)
    const [screeningForm, setScreeningForm] = useState(screeningInitForm)
    const [allergiesForm, setAllergiesForm] = useState(allergiesInitForm)
    const [anthroForm, setAnthroForm] = useState(anthroInitForm)

    // UI states
    const [loading, setLoading] = useState(false)
    const [openSections, setOpenSections] = useState({})
    const [includedSections, setIncludedSections] = useState({
        delivery: false,
        screening: false,
        allergies: false,
        anthropometric: false,
    })

    // Handlers
    const toggleSection = (section) =>
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))

    const toggleIncluded = (section) =>
        setIncludedSections((prev) => ({ ...prev, [section]: !prev[section] }))

    const updateForm = (setFormFn, field, value) =>
        setFormFn((prev) => ({ ...prev, [field]: value }))

    // Reset all forms to initial state
    const resetForm = () => {
        setPatientForm(patientInitForm)
        setDeliveryForm(deliveryInitForm)
        setScreeningForm(screeningInitForm)
        setAllergiesForm(allergiesInitForm)
        setAnthroForm(anthroInitForm)
        setOpenSections({})
        setIncludedSections({
            delivery: false,
            screening: false,
            allergies: false,
            anthropometric: false,
        })
    }

    // Validate required patient information fields
    const validateRequiredFields = () => {
        const required = ['firstname', 'lastname', 'date_of_birth', 'sex']
        const missing = required.filter((field) => !patientForm[field])

        if (missing.length > 0) {
            showToast('error', `Please fill in required fields: ${missing.join(', ')}`)
            return false
        }
        return true
    }

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateRequiredFields()) return

        try {
            setLoading(true)

            // Create patient record first
            const patientPayload = sanitizeObject(patientForm)
            const patientResponse = await addPatientRecord(patientPayload)

            if (patientResponse.status !== 'success') {
                throw new Error(patientResponse.message)
            }

            const patientId = patientResponse.data.id
            const promises = []

            // Add optional sections based on inclusion flags
            if (includedSections.delivery) {
                promises.push(addDeliveryRecord(patientId, sanitizeObject(deliveryForm)))
            }
            if (includedSections.screening) {
                promises.push(addScreeningRecord(patientId, sanitizeObject(screeningForm)))
            }
            if (includedSections.anthropometric) {
                promises.push(addAnthropometricRecord(patientId, sanitizeObject(anthroForm)))
            }
            if (includedSections.allergies) {
                promises.push(addAllergyRecord(patientId, sanitizeObject(allergiesForm)))
            }

            // Execute all additional record creation promises
            if (promises.length > 0) {
                await Promise.all(promises)
            }

            // Show success message and trigger refresh
            showToast('success', 'Patient record created successfully')
            window.dispatchEvent(
                new CustomEvent('patient-created', { detail: patientResponse.data })
            )

            resetForm()
            onClose()
        } catch (error) {
            console.error('Error creating patient record:', error)
            showToast('error', error.message || 'Failed to create patient record')
        } finally {
            setLoading(false)
        }
    }

    // Handle modal close with cleanup
    const handleClose = () => {
        resetForm()
        onClose()
    }

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={handleClose} modal>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add New Patient</DialogTitle>
                    <DialogDescription>
                        Complete the patient information below. Required fields are marked with an
                        asterisk (*).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 my-4">
                    {/* Basic Patient Information - Always Required */}
                    <BasicInfoSection
                        form={patientForm}
                        updateForm={(field, value) => updateForm(setPatientForm, field, value)}
                    />

                    {/* Delivery Information - Optional */}
                    <AccordionSection
                        title="Delivery Information"
                        icon={Stethoscope}
                        isOpen={openSections.delivery}
                        onToggle={() => toggleSection('delivery')}
                        info="Details about birth and delivery process"
                        isIncluded={includedSections.delivery}
                        onIncludeToggle={() => toggleIncluded('delivery')}
                    >
                        <DeliverySection
                            form={deliveryForm}
                            updateForm={(field, value) => updateForm(setDeliveryForm, field, value)}
                        />
                    </AccordionSection>

                    {/* Screening Information - Optional */}
                    <AccordionSection
                        title="Screening Information"
                        icon={Activity}
                        isOpen={openSections.screening}
                        onToggle={() => toggleSection('screening')}
                        info="Newborn screening test results and dates"
                        isIncluded={includedSections.screening}
                        onIncludeToggle={() => toggleIncluded('screening')}
                    >
                        <ScreeningSection
                            form={screeningForm}
                            updateForm={(field, value) =>
                                updateForm(setScreeningForm, field, value)
                            }
                        />
                    </AccordionSection>

                    {/* Allergy Information - Optional */}
                    <AccordionSection
                        title="Allergy Information"
                        icon={AlertCircle}
                        isOpen={openSections.allergies}
                        onToggle={() => toggleSection('allergies')}
                        info="Known allergies and adverse reactions"
                        isIncluded={includedSections.allergies}
                        onIncludeToggle={() => toggleIncluded('allergies')}
                    >
                        <AllergySection
                            form={allergiesForm}
                            updateForm={(field, value) =>
                                updateForm(setAllergiesForm, field, value)
                            }
                        />
                    </AccordionSection>

                    {/* Anthropometric Information - Optional */}
                    <AccordionSection
                        title="Anthropometric Information"
                        icon={Ruler}
                        isOpen={openSections.anthropometric}
                        onToggle={() => toggleSection('anthropometric')}
                        info="Physical measurements and growth data"
                        isIncluded={includedSections.anthropometric}
                        onIncludeToggle={() => toggleIncluded('anthropometric')}
                    >
                        <AnthropometricSection
                            form={anthroForm}
                            updateForm={(field, value) => updateForm(setAnthroForm, field, value)}
                        />
                    </AccordionSection>
                </div>

                <DialogFooter className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
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
                        {loading ? 'Creating...' : 'Create Patient Record'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddPatientModal
