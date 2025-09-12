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
import { Progress } from '@/components/ui/progress'
import {
    Stethoscope,
    Activity,
    AlertCircle,
    Ruler,
    ChevronLeft,
    ChevronRight,
    Check,
    User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import your existing sections
import BasicInfoSection from './sections/BasicInfoSection'
import DeliverySection from './sections/DeliverySection'
import ScreeningSection from './sections/ScreeningSection'
import AllergySection from './sections/AllergySection'
import AnthropometricSection from './sections/AnthropometricSection'

// Import API functions (assuming these exist)
import {
    addPatientRecord,
    addDeliveryRecord,
    addAnthropometricRecord,
    addScreeningRecord,
    addAllergyRecord,
} from '@/api/doctors/patient'

// Import utilities (assuming these exist)
import { sanitizeObject } from '@/util/sanitize'
import { showToast } from '@/util/alertHelper'

// Initial form states
const patientInitForm = {
    firstname: '',
    middlename: '',
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

// Step configuration
const STEPS = [
    {
        id: 'basic',
        title: 'Basic Information',
        description: 'Patient demographics and birth details',
        icon: User,
        required: true,
    },
    {
        id: 'delivery',
        title: 'Delivery Information',
        description: 'Birth and delivery process details',
        icon: Stethoscope,
        required: false,
    },
    {
        id: 'screening',
        title: 'Screening Tests',
        description: 'Newborn screening test results',
        icon: Activity,
        required: false,
    },
    {
        id: 'allergies',
        title: 'Allergy Information',
        description: 'Known allergies and reactions',
        icon: AlertCircle,
        required: false,
    },
    {
        id: 'anthropometric',
        title: 'Measurements',
        description: 'Physical measurements and growth data',
        icon: Ruler,
        required: false,
    },
    {
        id: 'review',
        title: 'Review & Submit',
        description: 'Review all information before creating',
        icon: Check,
        required: true,
    },
]

/**
 * StepIndicator Component
 * Shows the current step and progress through the form
 */
const StepIndicator = ({ currentStep, completedSteps, includedSteps }) => {
    const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep)
    const progress = ((currentStepIndex + 1) / STEPS.length) * 100

    return (
        <div className="mb-8">
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>
                        Step {currentStepIndex + 1} of {STEPS.length}
                    </span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = step.id === currentStep
                    const isCompleted = completedSteps.includes(step.id)
                    const isIncluded = step.required || includedSteps.includes(step.id)
                    const isSkipped = !step.required && !includedSteps.includes(step.id)

                    return (
                        <div key={step.id} className="flex flex-col items-center space-y-2">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                                    isActive && 'border-primary bg-primary text-primary-foreground',
                                    isCompleted &&
                                        !isActive &&
                                        'border-green-500 bg-green-500 text-white',
                                    !isActive &&
                                        !isCompleted &&
                                        isIncluded &&
                                        'border-muted-foreground bg-background',
                                    isSkipped &&
                                        'border-muted bg-muted text-muted-foreground opacity-50'
                                )}
                            >
                                {isCompleted && !isActive ? (
                                    <Check size={16} />
                                ) : (
                                    <StepIcon size={16} />
                                )}
                            </div>
                            <div className="text-center">
                                <div
                                    className={cn(
                                        'text-xs font-medium',
                                        isActive && 'text-primary',
                                        isCompleted && !isActive && 'text-green-600',
                                        isSkipped && 'text-muted-foreground opacity-50'
                                    )}
                                >
                                    {step.title}
                                </div>
                                {isSkipped && (
                                    <div className="text-xs text-muted-foreground opacity-50">
                                        (Skipped)
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * StepSelector Component
 * Allows users to choose which optional sections to include
 */
const StepSelector = ({ includedSteps, onToggleStep, onNext }) => {
    const optionalSteps = STEPS.filter((step) => !step.required && step.id !== 'review')

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Additional Information</h3>
                <p className="text-muted-foreground">
                    Choose which optional sections you'd like to include in the patient record
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionalSteps.map((step) => {
                    const StepIcon = step.icon
                    const isIncluded = includedSteps.includes(step.id)

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                                isIncluded
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-primary/50'
                            )}
                            onClick={() => onToggleStep(step.id)}
                        >
                            <div className="flex items-start space-x-3">
                                <div
                                    className={cn(
                                        'p-2 rounded-md',
                                        isIncluded ? 'bg-primary/10' : 'bg-muted'
                                    )}
                                >
                                    <StepIcon
                                        size={20}
                                        className={
                                            isIncluded ? 'text-primary' : 'text-muted-foreground'
                                        }
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{step.title}</h4>
                                        <input
                                            type="checkbox"
                                            checked={isIncluded}
                                            onChange={() => onToggleStep(step.id)}
                                            className="h-4 w-4 text-primary focus:ring-primary/20 border-input rounded"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-center pt-4">
                <Button onClick={onNext} className="px-8">
                    Continue <ChevronRight size={16} className="ml-2" />
                </Button>
            </div>
        </div>
    )
}

/**
 * ReviewStep Component
 * Shows a summary of all entered information
 */
const ReviewStep = ({
    patientForm,
    deliveryForm,
    screeningForm,
    allergiesForm,
    anthroForm,
    includedSteps,
}) => {
    const ReviewSection = ({ title, icon: Icon, children, isEmpty = false }) => (
        <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
                <Icon size={18} className="text-primary" />
                <h4 className="font-medium">{title}</h4>
                {isEmpty && (
                    <span className="text-sm text-muted-foreground">(No data entered)</span>
                )}
            </div>
            <div className="text-sm space-y-1">{children}</div>
        </div>
    )

    const FieldDisplay = ({ label, value }) =>
        value ? (
            <div className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span>{value}</span>
            </div>
        ) : null

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Review Patient Information</h3>
                <p className="text-muted-foreground">
                    Please review all the information before creating the patient record
                </p>
            </div>

            <div className="space-y-4">
                {/* Basic Information - Always shown */}
                <ReviewSection title="Basic Information" icon={User}>
                    <FieldDisplay label="First Name" value={patientForm.firstname} />
                    <FieldDisplay label="Middle Name" value={patientForm.middlename} />
                    <FieldDisplay label="Last Name" value={patientForm.lastname} />
                    <FieldDisplay label="Date of Birth" value={patientForm.date_of_birth} />
                    <FieldDisplay label="Sex" value={patientForm.sex} />
                    <FieldDisplay
                        label="Birth Weight"
                        value={patientForm.birth_weight && `${patientForm.birth_weight} kg`}
                    />
                    <FieldDisplay
                        label="Birth Height"
                        value={patientForm.birth_height && `${patientForm.birth_height} cm`}
                    />
                    <FieldDisplay label="Blood Type" value={patientForm.bloodtype} />
                    <FieldDisplay label="Gestation Weeks" value={patientForm.gestation_weeks} />
                </ReviewSection>

                {/* Delivery Information */}
                {includedSteps.includes('delivery') && (
                    <ReviewSection
                        title="Delivery Information"
                        icon={Stethoscope}
                        isEmpty={!Object.values(deliveryForm).some(Boolean)}
                    >
                        <FieldDisplay
                            label="Type of Delivery"
                            value={deliveryForm.type_of_delivery}
                        />
                        <FieldDisplay label="Apgar Score" value={deliveryForm.apgar_score} />
                        <FieldDisplay
                            label="Mother's Blood Type"
                            value={deliveryForm.mother_blood_type}
                        />
                        <FieldDisplay
                            label="Father's Blood Type"
                            value={deliveryForm.father_blood_type}
                        />
                        <FieldDisplay
                            label="Distinguishable Marks"
                            value={deliveryForm.distinguishable_marks}
                        />
                    </ReviewSection>
                )}

                {/* Screening Information */}
                {includedSteps.includes('screening') && (
                    <ReviewSection
                        title="Screening Information"
                        icon={Activity}
                        isEmpty={!Object.values(screeningForm).some(Boolean)}
                    >
                        <FieldDisplay label="ENS Date" value={screeningForm.ens_date} />
                        <FieldDisplay label="ENS Remarks" value={screeningForm.ens_remarks} />
                        <FieldDisplay label="NHS Date" value={screeningForm.nhs_date} />
                        <FieldDisplay label="NHS Right Ear" value={screeningForm.nhs_right_ear} />
                        <FieldDisplay label="NHS Left Ear" value={screeningForm.nhs_left_ear} />
                    </ReviewSection>
                )}

                {/* Allergy Information */}
                {includedSteps.includes('allergies') && (
                    <ReviewSection
                        title="Allergy Information"
                        icon={AlertCircle}
                        isEmpty={!Object.values(allergiesForm).some(Boolean)}
                    >
                        <FieldDisplay label="Allergen" value={allergiesForm.allergen} />
                        <FieldDisplay label="Reaction Type" value={allergiesForm.reaction_type} />
                        <FieldDisplay label="Severity" value={allergiesForm.severity} />
                        <FieldDisplay
                            label="Date Identified"
                            value={allergiesForm.date_identified}
                        />
                        <FieldDisplay label="Notes" value={allergiesForm.notes} />
                    </ReviewSection>
                )}

                {/* Anthropometric Information */}
                {includedSteps.includes('anthropometric') && (
                    <ReviewSection
                        title="Measurements"
                        icon={Ruler}
                        isEmpty={!Object.values(anthroForm).some(Boolean)}
                    >
                        <FieldDisplay
                            label="Weight"
                            value={anthroForm.weight && `${anthroForm.weight} kg`}
                        />
                        <FieldDisplay
                            label="Height"
                            value={anthroForm.height && `${anthroForm.height} cm`}
                        />
                        <FieldDisplay
                            label="Head Circumference"
                            value={
                                anthroForm.head_circumference &&
                                `${anthroForm.head_circumference} cm`
                            }
                        />
                        <FieldDisplay
                            label="Chest Circumference"
                            value={
                                anthroForm.chest_circumference &&
                                `${anthroForm.chest_circumference} cm`
                            }
                        />
                        <FieldDisplay
                            label="Abdominal Circumference"
                            value={
                                anthroForm.abdominal_circumference &&
                                `${anthroForm.abdominal_circumference} cm`
                            }
                        />
                        <FieldDisplay
                            label="Measurement Date"
                            value={anthroForm.measurement_date}
                        />
                    </ReviewSection>
                )}
            </div>
        </div>
    )
}

/**
 * Main StepperAddPatientModal Component
 */
const StepperAddPatientModal = ({ open, onClose }) => {
    // Form states - using your existing form structures
    const [patientForm, setPatientForm] = useState(patientInitForm)
    const [deliveryForm, setDeliveryForm] = useState(deliveryInitForm)
    const [screeningForm, setScreeningForm] = useState(screeningInitForm)
    const [allergiesForm, setAllergiesForm] = useState(allergiesInitForm)
    const [anthroForm, setAnthroForm] = useState(anthroInitForm)

    // Stepper states
    const [currentStep, setCurrentStep] = useState('basic')
    const [completedSteps, setCompletedSteps] = useState([])
    const [includedSteps, setIncludedSteps] = useState([])
    const [loading, setLoading] = useState(false)

    // Step navigation
    const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep)
    const isFirstStep = currentStepIndex === 0
    const isLastStep = currentStepIndex === STEPS.length - 1

    // Helper function to update forms
    const updateForm = (setFormFn, field, value) =>
        setFormFn((prev) => ({ ...prev, [field]: value }))

    // Reset all forms and stepper state
    const resetForm = () => {
        setPatientForm(patientInitForm)
        setDeliveryForm(deliveryInitForm)
        setScreeningForm(screeningInitForm)
        setAllergiesForm(allergiesInitForm)
        setAnthroForm(anthroInitForm)
        setCurrentStep('basic')
        setCompletedSteps([])
        setIncludedSteps([])
    }

    // Validate current step
    const validateCurrentStep = () => {
        if (currentStep === 'basic') {
            const required = ['firstname', 'lastname', 'date_of_birth', 'sex']
            const missing = required.filter((field) => !patientForm[field])

            if (missing.length > 0) {
                showToast?.('error', `Please fill in required fields: ${missing.join(', ')}`)
                return false
            }
        }
        return true
    }

    // Handle step completion and navigation
    const handleStepComplete = () => {
        if (!validateCurrentStep()) return

        // Mark current step as completed
        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps((prev) => [...prev, currentStep])
        }

        // Navigate to next step
        handleNext()
    }

    // Navigate to next step
    const handleNext = () => {
        if (currentStep === 'basic') {
            // After basic info, show step selector
            setCurrentStep('delivery')
        } else {
            const activeSteps = ['basic', ...includedSteps, 'review']
            const currentIndex = activeSteps.findIndex((step) => step === currentStep)
            if (currentIndex < activeSteps.length - 1) {
                setCurrentStep(activeSteps[currentIndex + 1])
            }
        }
    }

    // Navigate to previous step
    const handlePrevious = () => {
        const activeSteps = ['basic', ...includedSteps, 'review']
        const currentIndex = activeSteps.findIndex((step) => step === currentStep)
        if (currentIndex > 0) {
            setCurrentStep(activeSteps[currentIndex - 1])
        }
    }

    // Toggle optional step inclusion
    const handleToggleStep = (stepId) => {
        setIncludedSteps((prev) =>
            prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
        )
    }

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true)

            // Create patient record first
            const patientPayload = sanitizeObject ? sanitizeObject(patientForm) : patientForm
            const patientResponse = await addPatientRecord?.(patientPayload)

            if (patientResponse?.status !== 'success') {
                throw new Error(patientResponse?.message || 'Failed to create patient')
            }

            const patientId = patientResponse.data.id
            const promises = []

            // Add optional sections based on inclusion
            if (includedSteps.includes('delivery') && addDeliveryRecord) {
                promises.push(
                    addDeliveryRecord(
                        patientId,
                        sanitizeObject ? sanitizeObject(deliveryForm) : deliveryForm
                    )
                )
            }
            if (includedSteps.includes('screening') && addScreeningRecord) {
                promises.push(
                    addScreeningRecord(
                        patientId,
                        sanitizeObject ? sanitizeObject(screeningForm) : screeningForm
                    )
                )
            }
            if (includedSteps.includes('anthropometric') && addAnthropometricRecord) {
                promises.push(
                    addAnthropometricRecord(
                        patientId,
                        sanitizeObject ? sanitizeObject(anthroForm) : anthroForm
                    )
                )
            }
            if (includedSteps.includes('allergies') && addAllergyRecord) {
                promises.push(
                    addAllergyRecord(
                        patientId,
                        sanitizeObject ? sanitizeObject(allergiesForm) : allergiesForm
                    )
                )
            }

            // Execute all promises
            if (promises.length > 0) {
                await Promise.all(promises)
            }

            // Success handling
            showToast?.('success', 'Patient record created successfully')

            // Dispatch custom event if available
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('patient-created', { detail: patientResponse.data })
                )
            }

            resetForm()
            onClose()
        } catch (error) {
            console.error('Error creating patient record:', error)
            showToast?.('error', error.message || 'Failed to create patient record')
        } finally {
            setLoading(false)
        }
    }

    // Handle modal close
    const handleClose = () => {
        resetForm()
        onClose()
    }

    // Get the current step's active steps for navigation
    const getActiveSteps = () => ['basic', ...includedSteps, 'review']
    const activeSteps = getActiveSteps()
    const activeStepIndex = activeSteps.findIndex((step) => step === currentStep)
    const isActiveFirstStep = activeStepIndex === 0
    const isActiveLastStep = activeStepIndex === activeSteps.length - 1

    // Render current step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'basic':
                return (
                    <BasicInfoSection
                        form={patientForm}
                        updateForm={(field, value) => updateForm(setPatientForm, field, value)}
                    />
                )

            case 'step-selector':
                return (
                    <StepSelector
                        includedSteps={includedSteps}
                        onToggleStep={handleToggleStep}
                        onNext={handleStepSelectorNext}
                        completedSteps={completedSteps}
                    />
                )

            case 'delivery':
                if (!includedSteps.includes('delivery')) {
                    return (
                        <StepSelector
                            includedSteps={includedSteps}
                            onToggleStep={handleToggleStep}
                            onNext={handleNext}
                        />
                    )
                }
                return (
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Stethoscope className="text-primary" size={20} />
                            <h3 className="text-lg font-semibold text-foreground">
                                Delivery Information
                            </h3>
                        </div>
                        <DeliverySection
                            form={deliveryForm}
                            updateForm={(field, value) => updateForm(setDeliveryForm, field, value)}
                        />
                    </div>
                )

            case 'screening':
                return (
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Activity className="text-primary" size={20} />
                            <h3 className="text-lg font-semibold text-foreground">
                                Screening Information
                            </h3>
                        </div>
                        <ScreeningSection
                            form={screeningForm}
                            updateForm={(field, value) =>
                                updateForm(setScreeningForm, field, value)
                            }
                        />
                    </div>
                )

            case 'allergies':
                return (
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <AlertCircle className="text-primary" size={20} />
                            <h3 className="text-lg font-semibold text-foreground">
                                Allergy Information
                            </h3>
                        </div>
                        <AllergySection
                            form={allergiesForm}
                            updateForm={(field, value) =>
                                updateForm(setAllergiesForm, field, value)
                            }
                        />
                    </div>
                )

            case 'anthropometric':
                return (
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Ruler className="text-primary" size={20} />
                            <h3 className="text-lg font-semibold text-foreground">
                                Anthropometric Information
                            </h3>
                        </div>
                        <AnthropometricSection
                            form={anthroForm}
                            updateForm={(field, value) => updateForm(setAnthroForm, field, value)}
                        />
                    </div>
                )

            case 'review':
                return (
                    <ReviewStep
                        patientForm={patientForm}
                        deliveryForm={deliveryForm}
                        screeningForm={screeningForm}
                        allergiesForm={allergiesForm}
                        anthroForm={anthroForm}
                        includedSteps={includedSteps}
                    />
                )

            default:
                return (
                    <StepSelector
                        includedSteps={includedSteps}
                        onToggleStep={handleToggleStep}
                        onNext={handleNext}
                    />
                )
        }
    }

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={handleClose} modal>
            <DialogContent className="max-w-[1200px] max-h-[95vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add New Patient</DialogTitle>
                    <DialogDescription>
                        Follow the steps to create a comprehensive patient record. Required fields
                        are marked with an asterisk (*).
                    </DialogDescription>
                </DialogHeader>

                <div className="my-6">
                    {/* Step Indicator */}
                    <StepIndicator
                        currentStep={currentStep}
                        completedSteps={completedSteps}
                        includedSteps={includedSteps}
                    />

                    {/* Step Content */}
                    <div className="min-h-[400px]">{renderStepContent()}</div>
                </div>

                <DialogFooter className="flex justify-between pt-4 border-t">
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        {!isActiveFirstStep && currentStep !== 'delivery' && (
                            <Button variant="outline" onClick={handlePrevious} disabled={loading}>
                                <ChevronLeft size={16} className="mr-2" />
                                Previous
                            </Button>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        {currentStep === 'review' ? (
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
                        ) : currentStep === 'delivery' && !includedSteps.length ? null : ( // Special case for step selector - button is handled within StepSelector component
                            <Button
                                onClick={handleStepComplete}
                                disabled={loading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isActiveLastStep ? 'Review' : 'Next'}
                                {!isActiveLastStep && <ChevronRight size={16} className="ml-2" />}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default StepperAddPatientModal
