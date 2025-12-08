import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { showToast } from '@/util/alertHelper'
import { cn } from '@/lib/utils'
import {
    User,
    Stethoscope,
    Activity,
    AlertCircle,
    Ruler,
    Check,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'

// Import sections
import BasicInfoSection from './sections/BasicInfoSection'
import DeliverySection from './sections/DeliverySection'
import ScreeningSection from './sections/ScreeningSection'
import AllergySection from './sections/AllergySection'
import AnthropometricSection from './sections/AnthropometricSection'

// Import API functions
import {
    addPatientRecord,
    addDeliveryRecord,
    addScreeningRecord,
    addAnthropometricRecord,
    addAllergyRecord,
} from '@/api/doctors/patient'

// Import utilities
import { sanitizeObject } from '@/util/sanitize'

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
    ens_remarks: false,
    nhs_date: '',
    nhs_right_ear: false,
    nhs_left_ear: false,
    pos_date: '',
    pos_for_cchd_right: false,
    pos_for_cchd_left: false,
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
 * StepSelector Component
 * Allows users to choose which optional steps to include
 */
const StepSelector = ({ includedSteps, onToggleStep, onNext }) => {
    const optionalSteps = STEPS.filter((step) => !step.required && step.id !== 'review')

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Choose Additional Information</h3>
                <p className="text-muted-foreground">
                    Select which additional sections you'd like to include for this patient record.
                    You can always add this information later if needed.
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
                                'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md transform hover:scale-[1.02]',
                                isIncluded
                                    ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                            )}
                            onClick={() => onToggleStep(step.id)}
                        >
                            <div className="flex items-start space-x-3">
                                <div
                                    className={cn(
                                        'p-2 rounded-lg transition-colors',
                                        isIncluded
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600'
                                    )}
                                >
                                    <StepIcon size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">
                                            {step.title}
                                        </h4>
                                        <div
                                            className={cn(
                                                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                                                isIncluded
                                                    ? 'border-primary bg-primary'
                                                    : 'border-gray-300'
                                            )}
                                        >
                                            {isIncluded && (
                                                <Check size={14} className="text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={onNext} className="px-6">
                    Skip All
                </Button>
                <Button onClick={onNext} className="px-8">
                    {includedSteps.length > 0
                        ? `Continue with ${includedSteps.length} section${
                              includedSteps.length > 1 ? 's' : ''
                          }`
                        : 'Proceed to Review'}
                    <ChevronRight size={16} className="ml-2" />
                </Button>
            </div>
        </div>
    )
}

/**
 * StepIndicator Component
 * Shows the current step and progress through the form
 */
const StepIndicator = ({ currentStep, completedSteps, includedSteps }) => {
    // Calculate active steps for proper progress calculation
    const getActiveSteps = () => {
        const baseSteps = ['basic']
        if (includedSteps.length > 0) {
            baseSteps.push(...includedSteps)
        }
        baseSteps.push('review')
        return baseSteps
    }

    const activeSteps = getActiveSteps()
    const currentStepIndex =
        currentStep === 'step-selector' ? 1 : activeSteps.findIndex((step) => step === currentStep)
    const totalSteps = currentStep === 'step-selector' ? 2 : activeSteps.length
    const progress = ((currentStepIndex + 1) / totalSteps) * 100

    // Don't show step indicator during step selection
    if (currentStep === 'step-selector') {
        return (
            <div className="mb-8">
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                        Step 2: Choose Additional Sections
                    </h3>
                    <p className="text-muted-foreground">
                        Basic information completed. Select optional sections to include.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-8">
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>
                        Step {currentStepIndex + 1} of {totalSteps}
                    </span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
                {STEPS.filter((step) => step.required || includedSteps.includes(step.id)).map(
                    (step) => {
                        const StepIcon = step.icon
                        const isActive = step.id === currentStep
                        const isCompleted = completedSteps.includes(step.id)

                        return (
                            <div key={step.id} className="flex flex-col items-center space-y-2">
                                <div
                                    className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                                        isActive &&
                                            'border-primary bg-primary text-primary-foreground',
                                        isCompleted &&
                                            !isActive &&
                                            'border-green-500 bg-green-500 text-white',
                                        !isActive &&
                                            !isCompleted &&
                                            'border-muted-foreground bg-background'
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
                                            isCompleted && !isActive && 'text-green-600'
                                        )}
                                    >
                                        {step.title}
                                    </div>
                                    {step.required && (
                                        <div className="text-xs text-muted-foreground">
                                            (Required)
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                )}
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
                {Icon && <Icon size={18} className="text-primary" />}
                <h4 className="font-medium">{title}</h4>
                {isEmpty && (
                    <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                        No data entered
                    </span>
                )}
            </div>
            <div className="text-sm space-y-1">
                {isEmpty ? (
                    <p className="text-muted-foreground italic">
                        This section was included but no information was provided.
                    </p>
                ) : (
                    children
                )}
            </div>
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
                            label="Measurement Date"
                            value={anthroForm.measurement_date}
                        />
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
                return false
            }

            // Validate date of birth
            if (patientForm.date_of_birth) {
                const birthDate = new Date(patientForm.date_of_birth)
                const today = new Date()
                if (birthDate > today) {
                    showToast('error', 'Date of birth cannot be in the future')
                    return false
                }
                // Check if birth date is too far in the past (more than 150 years)
                const maxAge = new Date()
                maxAge.setFullYear(maxAge.getFullYear() - 150)
                if (birthDate < maxAge) {
                    showToast('error', 'Please enter a valid date of birth')
                    return false
                }
            }

            // Validate gestation weeks if provided
            if (patientForm.gestation_weeks) {
                const weeks = parseFloat(patientForm.gestation_weeks)
                if (isNaN(weeks) || weeks < 20 || weeks > 44) {
                    showToast('error', 'Gestation weeks must be between 20 and 44')
                    return false
                }
            }

            // Validate birth weight if provided
            if (patientForm.birth_weight) {
                const weight = parseFloat(patientForm.birth_weight)
                if (isNaN(weight) || weight < 0.3 || weight > 10) {
                    showToast('error', 'Birth weight must be between 0.3 and 10 kg')
                    return false
                }
            }

            // Validate birth height if provided
            // if (patientForm.birth_height) {
            //     const height = parseFloat(patientForm.birth_height)
            //     if (isNaN(height) || height < 20 || height > 70) {
            //         showToast('error', 'Birth height must be between 20 and 70 cm')
            //         return false
            //     }
            // }

            // Validate sex field
            if (!['male', 'female'].includes(patientForm.sex)) {
                showToast('error', 'Please select a valid sex option')
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
            setCurrentStep('step-selector')
        } else if (currentStep === 'step-selector') {
            // After step selector, go to first included step or review
            if (includedSteps.length === 0) {
                setCurrentStep('review')
            } else {
                setCurrentStep(includedSteps[0])
            }
        } else {
            // Find next step from included steps
            const currentIncludedIndex = includedSteps.findIndex((step) => step === currentStep)
            if (currentIncludedIndex >= 0 && currentIncludedIndex < includedSteps.length - 1) {
                // Go to next included step
                setCurrentStep(includedSteps[currentIncludedIndex + 1])
            } else {
                // Go to review step
                setCurrentStep('review')
            }
        }
    }

    // Navigate to previous step
    const handlePrevious = () => {
        if (currentStep === 'step-selector') {
            setCurrentStep('basic')
        } else if (currentStep === 'review') {
            if (includedSteps.length === 0) {
                setCurrentStep('step-selector')
            } else {
                setCurrentStep(includedSteps[includedSteps.length - 1])
            }
        } else {
            // Find previous step from included steps
            const currentIncludedIndex = includedSteps.findIndex((step) => step === currentStep)
            if (currentIncludedIndex > 0) {
                // Go to previous included step
                setCurrentStep(includedSteps[currentIncludedIndex - 1])
            } else if (currentIncludedIndex === 0) {
                // Go back to step selector
                setCurrentStep('step-selector')
            }
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
            const patientPayload = sanitizeObject(patientForm)

            const patientResponse = await addPatientRecord(patientPayload)

            // Check if response indicates success
            if (patientResponse?.status !== 'success') {
                const errorMsg = patientResponse?.message || 'Failed to create patient record'
                console.error('Patient creation failed:', errorMsg)
                throw new Error(errorMsg)
            }

            // Get patient ID from response
            const patientId = patientResponse?.data?.patient_id || patientResponse?.patient_id
            if (!patientId) {
                console.error('No patient ID in response:', patientResponse)
                throw new Error('Patient created but ID not returned from server')
            }

            const promises = []
            const failedSections = []

            // Add optional sections based on inclusion
            if (includedSteps.includes('delivery')) {
                const deliveryPayload = sanitizeObject(deliveryForm)

                // Check if there's meaningful data (not just empty/null values)
                const hasData = Object.entries(deliveryPayload).some(([key, val]) => {
                    // Allow boolean false values and meaningful strings/numbers
                    return (
                        val !== null &&
                        val !== '' &&
                        val !== undefined &&
                        (typeof val === 'boolean' ||
                            (typeof val === 'string' && val.trim().length > 0) ||
                            typeof val === 'number')
                    )
                })

                if (hasData) {
                    promises.push(
                        addDeliveryRecord(patientId, deliveryPayload)
                            .then((result) => ({ section: 'delivery', result }))
                            .catch((error) => {
                                console.error('Delivery record failed:', error)
                                failedSections.push('delivery')
                                return Promise.reject({ section: 'delivery', error })
                            })
                    )
                }
            }
            if (includedSteps.includes('screening')) {
                const screeningPayload = sanitizeObject(screeningForm)

                // Check if there's meaningful data (allowing boolean values)
                const hasData = Object.entries(screeningPayload).some(([key, val]) => {
                    return (
                        val !== null &&
                        val !== '' &&
                        val !== undefined &&
                        (typeof val === 'boolean' ||
                            (typeof val === 'string' && val.trim().length > 0) ||
                            typeof val === 'number')
                    )
                })

                if (hasData) {
                    promises.push(
                        addScreeningRecord(patientId, screeningPayload)
                            .then((result) => ({ section: 'screening', result }))
                            .catch((error) => {
                                console.error('Screening record failed:', error)
                                failedSections.push('screening')
                                return Promise.reject({ section: 'screening', error })
                            })
                    )
                }
            }
            if (includedSteps.includes('anthropometric')) {
                const anthroPayload = sanitizeObject(anthroForm)

                // Check if there's meaningful data
                const hasData = Object.entries(anthroPayload).some(([key, val]) => {
                    return (
                        val !== null &&
                        val !== '' &&
                        val !== undefined &&
                        (typeof val === 'boolean' ||
                            (typeof val === 'string' && val.trim().length > 0) ||
                            typeof val === 'number')
                    )
                })

                if (hasData) {
                    promises.push(
                        addAnthropometricRecord(patientId, anthroPayload)
                            .then((result) => ({ section: 'anthropometric', result }))
                            .catch((error) => {
                                console.error('Anthropometric record failed (add):', error)
                                console.error(
                                    'Anthropometric error details (add):',
                                    error.response?.data
                                )
                                failedSections.push('anthropometric')
                                return Promise.reject({ section: 'anthropometric', error })
                            })
                    )
                }
            }
            if (includedSteps.includes('allergies')) {
                const allergyPayload = sanitizeObject(allergiesForm)

                // Check if there's meaningful data
                const hasData = Object.entries(allergyPayload).some(([key, val]) => {
                    return (
                        val !== null &&
                        val !== '' &&
                        val !== undefined &&
                        (typeof val === 'boolean' ||
                            (typeof val === 'string' && val.trim().length > 0) ||
                            typeof val === 'number')
                    )
                })

                if (hasData) {
                    promises.push(
                        addAllergyRecord(patientId, allergyPayload)
                            .then((result) => ({ section: 'allergies', result }))
                            .catch((error) => {
                                console.error('Allergy record failed:', error)
                                failedSections.push('allergies')
                                return Promise.reject({ section: 'allergies', error })
                            })
                    )
                }
            }

            // Execute all promises with detailed error handling
            if (promises.length > 0) {
                const results = await Promise.allSettled(promises)
                const failedResults = results.filter((result) => result.status === 'rejected')

                if (failedResults.length > 0) {
                    const failedSectionNames = failedResults
                        .map((result) => result.reason?.section || 'unknown')
                        .join(', ')
                    showToast(
                        'warning',
                        `Patient created successfully, but failed to save: ${failedSectionNames}`
                    )
                } else {
                    showToast('success', 'Patient record created successfully with all data')
                }
            } else {
                showToast('success', 'Patient record created successfully')
            }

            // Dispatch custom event for real-time updates with detailed patient data
            if (typeof window !== 'undefined') {
                const eventDetail = {
                    ...patientResponse.data,
                    patient_id: patientId,
                    sections_added: includedSteps,
                    timestamp: new Date().toISOString(),
                }
                window.dispatchEvent(new CustomEvent('patient-created', { detail: eventDetail }))
            }

            resetForm()
            onClose()
        } catch (error) {
            console.error('Error in patient creation process:', error)

            // Detailed error handling with user-friendly messages
            let errorMessage = 'Failed to create patient record'
            let details = ''

            if (error.fieldErrors) {
                // Handle field validation errors
                const fieldErrors = Object.entries(error.fieldErrors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ')
                errorMessage = `Validation errors: ${fieldErrors}`
            } else if (error.message) {
                errorMessage = error.message
                if (error.details) {
                    details = error.details
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
                if (error.response.data.details) {
                    details = error.response.data.details
                }
            }

            // Show appropriate error message
            if (details) {
                showToast('error', `${errorMessage}. ${details}`)
            } else {
                showToast('error', errorMessage)
            }
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
    const getActiveSteps = () => {
        const steps = ['basic', 'step-selector']
        if (includedSteps.length > 0) {
            steps.push(...includedSteps)
        }
        steps.push('review')
        return steps
    }
    const isActiveFirstStep = currentStep === 'basic'

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
                        onNext={handleNext}
                        completedSteps={completedSteps}
                    />
                )

            case 'delivery':
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
            <DialogContent className="max-w-2xl max-h-[98vh]" showCloseButton={false}>
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

                <DialogFooter className="flex justify-between mt-8 ">
                    <div className="flex space-x-3">
                        <Button variant="destructive" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        {!isActiveFirstStep && (
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
                        ) : currentStep === 'step-selector' ? null : ( // Step selector has its own button
                            <Button
                                onClick={handleStepComplete}
                                disabled={loading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {includedSteps.length > 0 &&
                                includedSteps[includedSteps.length - 1] === currentStep
                                    ? 'Review'
                                    : 'Next'}
                                {!(
                                    includedSteps.length > 0 &&
                                    includedSteps[includedSteps.length - 1] === currentStep
                                ) && <ChevronRight size={16} className="ml-2" />}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default StepperAddPatientModal
