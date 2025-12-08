import { useState, useCallback, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { PhoneNumberInput } from '@/components/ui/phone-number'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { showToast } from '@/util/alertHelper'
import { cn } from '@/lib/utils'
import { User, Briefcase, Building2, Check, ChevronLeft, ChevronRight } from 'lucide-react'

// Import API functions
import { createUser, assignUserToFacility } from '@/api/admin/users'
import { getFacilities } from '@/api/admin/facility'

// Initial form states
const basicInfoInitForm = {
    email: '',
    password: 'keepsake123',
    firstname: '',
    middlename: '',
    lastname: '',
    phone_number: '',
    role: '',
}

const professionalInitForm = {
    employee_id_number: '',
    specialty: '',
    license_number: '',
    years_of_experience: '',
    education: '',
    certifications: '',
    job_title: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    relationship_to_patient: '',
    address: '',
}

const facilityInitForm = {
    facility_id: '',
    facility_role: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0],
    subscription_expires: '',
}

// Step configuration
const STEPS = [
    {
        id: 'basic',
        title: 'Basic Information',
        description: 'User contact and identification details',
        icon: User,
        required: true,
    },
    {
        id: 'professional',
        title: 'Professional Details',
        description: 'Role, specialty, and license information',
        icon: Briefcase,
        required: false,
    },
    {
        id: 'facility',
        title: 'Facility Assignment',
        description: 'Assign user to healthcare facility',
        icon: Building2,
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
 */
const StepSelector = ({ includedSteps, onToggleStep, onNext }) => {
    const optionalSteps = STEPS.filter((step) => !step.required && step.id !== 'review')

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Choose Additional Information</h3>
                <p className="text-muted-foreground">
                    Select which additional sections you'd like to include for this user account.
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
 */
const StepIndicator = ({ currentStep, completedSteps, includedSteps }) => {
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
            <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>
                        Step {currentStepIndex + 1} of {totalSteps}
                    </span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

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
 * BasicInfoSection Component
 */
const BasicInfoSection = ({ form, updateForm }) => (
    <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
            <User className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="firstname">
                        First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="firstname"
                        value={form.firstname}
                        onChange={(e) => updateForm('firstname', e.target.value)}
                        placeholder="Juan"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="lastname">
                        Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="lastname"
                        value={form.lastname}
                        onChange={(e) => updateForm('lastname', e.target.value)}
                        placeholder="De la Cruz"
                        required
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="middlename">Middle Name</Label>
                <Input
                    id="middlename"
                    value={form.middlename}
                    onChange={(e) => updateForm('middlename', e.target.value)}
                    placeholder="Santos (Optional)"
                />
            </div>

            <div>
                <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="juan@example.com"
                    required
                />
            </div>

            <div>
                <Label htmlFor="phone_number">
                    Phone Number <span className="text-red-500">*</span>
                </Label>
                <PhoneNumberInput
                    value={form.phone_number}
                    onChange={(value) => updateForm('phone_number', value || '')}
                    placeholder="Enter phone number"
                    required
                />
            </div>

            <div>
                <Label htmlFor="role">
                    Role <span className="text-red-500">*</span>
                </Label>
                <Select value={form.role} onValueChange={(value) => updateForm('role', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="facility_admin">Facility Admin</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>
)

/**
 * ProfessionalSection Component
 */
const ProfessionalSection = ({ form, updateForm, basicRole }) => (
    <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
            <Briefcase className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-foreground">Professional Details</h3>
        </div>

        <div className="space-y-4">
            {basicRole === 'parent' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                        <strong>Parent/Guardian Account:</strong> Please fill in emergency contact
                        and relationship information.
                    </p>
                </div>
            )}

            {/* Fields for Medical Staff (Doctor, Nurse) */}
            {(basicRole === 'doctor' ||
                basicRole === 'nurse' ||
                basicRole === 'staff' ||
                basicRole === 'facility_admin' ||
                basicRole === 'admin') && (
                <>
                    <div>
                        <Label htmlFor="employee_id_number">Employee ID Number</Label>
                        <Input
                            id="employee_id_number"
                            value={form.employee_id_number}
                            onChange={(e) => updateForm('employee_id_number', e.target.value)}
                            placeholder="e.g., EMP-2024-001"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Unique identifier for employee records
                        </p>
                    </div>

                    {basicRole === 'staff' && (
                        <div>
                            <Label htmlFor="job_title">Job Title</Label>
                            <Input
                                id="job_title"
                                value={form.job_title}
                                onChange={(e) => updateForm('job_title', e.target.value)}
                                placeholder="e.g., Medical Secretary, Lab Technician"
                            />
                        </div>
                    )}
                </>
            )}

            {/* Specialty for Medical Professionals */}
            {(basicRole === 'doctor' || basicRole === 'nurse') && (
                <div>
                    <Label htmlFor="specialty">
                        Specialty <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="specialty"
                        value={form.specialty}
                        onChange={(e) => updateForm('specialty', e.target.value)}
                        placeholder={
                            basicRole === 'doctor'
                                ? 'e.g., Pediatrician, Cardiologist'
                                : 'e.g., Pediatric Nurse, ICU Nurse'
                        }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Required for medical professionals
                    </p>
                </div>
            )}

            {/* License Number for Medical Professionals */}
            {(basicRole === 'doctor' || basicRole === 'nurse') && (
                <div>
                    <Label htmlFor="license_number">
                        License Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="license_number"
                        value={form.license_number}
                        onChange={(e) => updateForm('license_number', e.target.value)}
                        placeholder="Enter professional license number"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Professional license/registration number
                    </p>
                </div>
            )}

            {/* Years of Experience for Medical Professionals */}
            {(basicRole === 'doctor' || basicRole === 'nurse') && (
                <div>
                    <Label htmlFor="years_of_experience">Years of Experience</Label>
                    <Input
                        id="years_of_experience"
                        type="number"
                        min="0"
                        max="60"
                        value={form.years_of_experience}
                        onChange={(e) => updateForm('years_of_experience', e.target.value)}
                        placeholder="e.g., 5"
                    />
                </div>
            )}

            {/* Education for Doctors */}
            {basicRole === 'doctor' && (
                <div>
                    <Label htmlFor="education">Medical School / Education</Label>
                    <Input
                        id="education"
                        value={form.education}
                        onChange={(e) => updateForm('education', e.target.value)}
                        placeholder="e.g., University of the Philippines College of Medicine"
                    />
                </div>
            )}

            {/* Board Certifications for Doctors */}
            {basicRole === 'doctor' && (
                <div>
                    <Label htmlFor="certifications">Board Certifications</Label>
                    <Input
                        id="certifications"
                        value={form.certifications}
                        onChange={(e) => updateForm('certifications', e.target.value)}
                        placeholder="e.g., Philippine Board of Pediatrics"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Additional certifications or specializations
                    </p>
                </div>
            )}

            {/* Nursing Degree for Nurses */}
            {basicRole === 'nurse' && (
                <div>
                    <Label htmlFor="education">Nursing Degree / Education</Label>
                    <Input
                        id="education"
                        value={form.education}
                        onChange={(e) => updateForm('education', e.target.value)}
                        placeholder="e.g., BSN - University of Santo Tomas"
                    />
                </div>
            )}

            {/* Parent-specific fields */}
            {basicRole === 'parent' && (
                <>
                    <div>
                        <Label htmlFor="relationship_to_patient">
                            Relationship to Patient <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={form.relationship_to_patient}
                            onValueChange={(value) => updateForm('relationship_to_patient', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mother">Mother</SelectItem>
                                <SelectItem value="father">Father</SelectItem>
                                <SelectItem value="legal_guardian">Legal Guardian</SelectItem>
                                <SelectItem value="grandparent">Grandparent</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="address">Home Address</Label>
                        <Input
                            id="address"
                            value={form.address}
                            onChange={(e) => updateForm('address', e.target.value)}
                            placeholder="e.g., 123 Main St, Manila, Philippines"
                        />
                    </div>

                    <div>
                        <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                        <Input
                            id="emergency_contact_name"
                            value={form.emergency_contact_name}
                            onChange={(e) => updateForm('emergency_contact_name', e.target.value)}
                            placeholder="Full name of emergency contact"
                        />
                    </div>

                    <div>
                        <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                        <PhoneNumberInput
                            value={form.emergency_contact_phone}
                            onChange={(value) => updateForm('emergency_contact_phone', value || '')}
                            placeholder="Emergency contact phone number"
                        />
                    </div>
                </>
            )}
        </div>
    </div>
)

/**
 * FacilitySection Component
 */
const FacilitySection = ({ form, updateForm, facilities, facilitiesLoading, professionalRole }) => (
    <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
            <Building2 className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-foreground">Facility Assignment</h3>
        </div>

        <div className="space-y-4">
            {professionalRole === 'parent' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                        <strong>Optional for Parents:</strong> Facility assignment is optional for
                        parent users. You can skip this step if not needed.
                    </p>
                </div>
            )}

            <div>
                <Label htmlFor="facility_id">
                    Healthcare Facility{' '}
                    {professionalRole !== 'parent' && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={form.facility_id}
                    onValueChange={(value) => updateForm('facility_id', value)}
                    disabled={facilitiesLoading}
                >
                    <SelectTrigger>
                        <SelectValue
                            placeholder={
                                facilitiesLoading ? 'Loading facilities...' : 'Select a facility'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {facilities.map((facility) => (
                            <SelectItem key={facility.facility_id} value={facility.facility_id}>
                                {facility.facility_name} - {facility.city}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                    {professionalRole === 'parent'
                        ? 'Optional - Select the primary facility where this parent will have access'
                        : 'Select the primary facility where this user will work'}
                </p>
            </div>

            <div>
                <Label htmlFor="facility_role">
                    Facility Role{' '}
                    {professionalRole !== 'parent' && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={form.facility_role}
                    onValueChange={(value) => updateForm('facility_role', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select facility role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="facility_admin">Facility Admin</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                    {professionalRole === 'parent'
                        ? 'Optional - Role within the selected facility'
                        : 'Role within the selected facility'}
                </p>
            </div>

            <div>
                <Label htmlFor="department">Department (Optional)</Label>
                <Select
                    value={form.department}
                    onValueChange={(value) => updateForm('department', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">No specific department</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="Nursing">Nursing</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                        id="start_date"
                        type="date"
                        value={form.start_date}
                        onChange={(e) => updateForm('start_date', e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="subscription_expires">Personal Subscription Expires</Label>
                    <Input
                        id="subscription_expires"
                        type="date"
                        value={form.subscription_expires}
                        onChange={(e) => updateForm('subscription_expires', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Optional individual subscription
                    </p>
                </div>
            </div>
        </div>
    </div>
)

/**
 * ReviewStep Component
 */
const ReviewStep = ({ basicForm, professionalForm, facilityForm, includedSteps, facilities }) => {
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
                <span className="font-medium">{value}</span>
            </div>
        ) : null

    const selectedFacilityName =
        facilities.find((f) => f.facility_id === facilityForm.facility_id)?.facility_name || 'N/A'

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Review User Information</h3>
                <p className="text-muted-foreground">
                    Please review all the information before creating the user account
                </p>
            </div>

            <div className="space-y-4">
                <ReviewSection title="Basic Information" icon={User}>
                    <FieldDisplay label="First Name" value={basicForm.firstname} />
                    <FieldDisplay label="Middle Name" value={basicForm.middlename} />
                    <FieldDisplay label="Last Name" value={basicForm.lastname} />
                    <FieldDisplay label="Email" value={basicForm.email} />
                    <FieldDisplay label="Phone Number" value={basicForm.phone_number} />
                    <FieldDisplay
                        label="Role"
                        value={
                            basicForm.role
                                ? basicForm.role.charAt(0).toUpperCase() + basicForm.role.slice(1)
                                : ''
                        }
                    />
                </ReviewSection>

                {includedSteps.includes('professional') && (
                    <ReviewSection
                        title="Professional Details"
                        icon={Briefcase}
                        isEmpty={
                            !professionalForm.employee_id_number &&
                            !professionalForm.specialty &&
                            !professionalForm.license_number &&
                            !professionalForm.years_of_experience &&
                            !professionalForm.education &&
                            !professionalForm.certifications &&
                            !professionalForm.job_title &&
                            !professionalForm.relationship_to_patient &&
                            !professionalForm.address &&
                            !professionalForm.emergency_contact_name &&
                            !professionalForm.emergency_contact_phone
                        }
                    >
                        {/* Common fields for employees */}
                        <FieldDisplay
                            label="Employee ID"
                            value={professionalForm.employee_id_number}
                        />

                        {/* Medical professional fields */}
                        {(basicForm.role === 'doctor' || basicForm.role === 'nurse') && (
                            <>
                                <FieldDisplay
                                    label="Specialty"
                                    value={professionalForm.specialty}
                                />
                                <FieldDisplay
                                    label="License Number"
                                    value={professionalForm.license_number}
                                />
                                <FieldDisplay
                                    label="Years of Experience"
                                    value={professionalForm.years_of_experience}
                                />
                                <FieldDisplay
                                    label="Education"
                                    value={professionalForm.education}
                                />
                            </>
                        )}

                        {/* Doctor-specific fields */}
                        {basicForm.role === 'doctor' && (
                            <FieldDisplay
                                label="Board Certifications"
                                value={professionalForm.certifications}
                            />
                        )}

                        {/* Staff-specific fields */}
                        {basicForm.role === 'staff' && (
                            <FieldDisplay label="Job Title" value={professionalForm.job_title} />
                        )}

                        {/* Parent-specific fields */}
                        {basicForm.role === 'parent' && (
                            <>
                                <FieldDisplay
                                    label="Relationship to Patient"
                                    value={
                                        professionalForm.relationship_to_patient
                                            ? professionalForm.relationship_to_patient
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              professionalForm.relationship_to_patient.slice(1)
                                            : ''
                                    }
                                />
                                <FieldDisplay label="Address" value={professionalForm.address} />
                                <FieldDisplay
                                    label="Emergency Contact Name"
                                    value={professionalForm.emergency_contact_name}
                                />
                                <FieldDisplay
                                    label="Emergency Contact Phone"
                                    value={professionalForm.emergency_contact_phone}
                                />
                            </>
                        )}
                    </ReviewSection>
                )}

                {includedSteps.includes('facility') && (
                    <ReviewSection
                        title="Facility Assignment"
                        icon={Building2}
                        isEmpty={
                            !facilityForm.facility_id &&
                            !facilityForm.facility_role &&
                            !facilityForm.department
                        }
                    >
                        <FieldDisplay label="Facility" value={selectedFacilityName} />
                        <FieldDisplay
                            label="Facility Role"
                            value={
                                facilityForm.facility_role
                                    ? facilityForm.facility_role.charAt(0).toUpperCase() +
                                      facilityForm.facility_role.slice(1)
                                    : ''
                            }
                        />
                        <FieldDisplay label="Department" value={facilityForm.department} />
                        <FieldDisplay label="Start Date" value={facilityForm.start_date} />
                        <FieldDisplay
                            label="Subscription Expires"
                            value={facilityForm.subscription_expires || 'No expiration'}
                        />
                    </ReviewSection>
                )}
            </div>
        </div>
    )
}

/**
 * Main RegisterUserModal Component
 */
const RegisterUserModal = ({ open, onClose }) => {
    // Form states
    const [basicForm, setBasicForm] = useState(basicInfoInitForm)
    const [professionalForm, setProfessionalForm] = useState(professionalInitForm)
    const [facilityForm, setFacilityForm] = useState(facilityInitForm)

    // Stepper states
    const [currentStep, setCurrentStep] = useState('basic')
    const [completedSteps, setCompletedSteps] = useState([])
    const [includedSteps, setIncludedSteps] = useState([])
    const [loading, setLoading] = useState(false)

    // Facilities state
    const [facilities, setFacilities] = useState([])
    const [facilitiesLoading, setFacilitiesLoading] = useState(false)

    // Fetch facilities
    const fetchFacilities = useCallback(async () => {
        try {
            setFacilitiesLoading(true)
            const response = await getFacilities()
            if (response.status === 'success') {
                setFacilities(response.data || [])
            } else {
                showToast('error', 'Failed to load facilities')
            }
        } catch (error) {
            showToast('error', 'Failed to load facilities')
            console.error('Error fetching facilities:', error)
        } finally {
            setFacilitiesLoading(false)
        }
    }, [])

    useEffect(() => {
        if (open) {
            fetchFacilities()
        }
    }, [open, fetchFacilities])

    // Helper functions to update forms
    const updateBasicForm = useCallback((field, value) => {
        setBasicForm((prev) => ({ ...prev, [field]: value }))
    }, [])

    const updateProfessionalForm = useCallback((field, value) => {
        setProfessionalForm((prev) => ({ ...prev, [field]: value }))
    }, [])

    const updateFacilityForm = useCallback((field, value) => {
        setFacilityForm((prev) => ({ ...prev, [field]: value }))
    }, [])

    // Reset all forms and stepper state
    const resetForm = useCallback(() => {
        setBasicForm(basicInfoInitForm)
        setProfessionalForm(professionalInitForm)
        setFacilityForm(facilityInitForm)
        setCurrentStep('basic')
        setCompletedSteps([])
        setIncludedSteps([])
    }, [])

    // Validate current step
    const validateCurrentStep = () => {
        if (currentStep === 'basic') {
            const required = ['firstname', 'lastname', 'email', 'phone_number', 'role']
            const missing = required.filter((field) => !basicForm[field])

            if (missing.length > 0) {
                const fieldNames = missing.map((field) => {
                    switch (field) {
                        case 'firstname':
                            return 'First Name'
                        case 'lastname':
                            return 'Last Name'
                        case 'email':
                            return 'Email'
                        case 'phone_number':
                            return 'Phone Number'
                        case 'role':
                            return 'Role'
                        default:
                            return field
                    }
                })
                showToast('error', `Please fill in required fields: ${fieldNames.join(', ')}`)
                return false
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(basicForm.email)) {
                showToast('error', 'Please enter a valid email address')
                return false
            }
        }

        if (currentStep === 'professional') {
            // Validate based on role
            if (basicForm.role === 'doctor' || basicForm.role === 'nurse') {
                if (!professionalForm.specialty) {
                    showToast('error', 'Please fill in specialty for medical professionals')
                    return false
                }
                if (!professionalForm.license_number) {
                    showToast('error', 'License number is required for medical professionals')
                    return false
                }
            }

            if (basicForm.role === 'parent') {
                if (!professionalForm.relationship_to_patient) {
                    showToast('error', 'Please select relationship to patient')
                    return false
                }
            }
        }

        if (currentStep === 'facility') {
            if (basicForm.role !== 'parent') {
                if (!facilityForm.facility_id || !facilityForm.facility_role) {
                    showToast('error', 'Please select a facility and role')
                    return false
                }
            }
        }

        return true
    }

    // Handle step completion and navigation
    const handleStepComplete = () => {
        if (!validateCurrentStep()) return

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps((prev) => [...prev, currentStep])
        }

        handleNext()
    }

    // Navigate to next step
    const handleNext = () => {
        if (currentStep === 'basic') {
            setCurrentStep('step-selector')
        } else if (currentStep === 'step-selector') {
            if (includedSteps.length === 0) {
                setCurrentStep('review')
            } else {
                setCurrentStep(includedSteps[0])
            }
        } else {
            const currentIncludedIndex = includedSteps.findIndex((step) => step === currentStep)
            if (currentIncludedIndex >= 0 && currentIncludedIndex < includedSteps.length - 1) {
                setCurrentStep(includedSteps[currentIncludedIndex + 1])
            } else {
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
            const currentIncludedIndex = includedSteps.findIndex((step) => step === currentStep)
            if (currentIncludedIndex > 0) {
                setCurrentStep(includedSteps[currentIncludedIndex - 1])
            } else if (currentIncludedIndex === 0) {
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

            const userPayload = {
                email: basicForm.email.trim(),
                password: basicForm.password,
                firstname: basicForm.firstname.trim(),
                middlename: basicForm.middlename?.trim(),
                lastname: basicForm.lastname.trim(),
                phone_number: basicForm.phone_number.trim(),
                role: basicForm.role?.trim() || 'staff',

                // Professional Details
                employee_id_number: professionalForm.employee_id_number?.trim(),
                specialty: professionalForm.specialty?.trim(),
                license_number: professionalForm.license_number?.trim(),
                years_of_experience: professionalForm.years_of_experience?.trim(),
                education: professionalForm.education?.trim(),
                certifications: professionalForm.certifications?.trim(),
                job_title: professionalForm.job_title?.trim(),

                // Parent-specific fields
                relationship_to_patient: professionalForm.relationship_to_patient?.trim(),
                address: professionalForm.address?.trim(),
                emergency_contact_name: professionalForm.emergency_contact_name?.trim(),
                emergency_contact_phone: professionalForm.emergency_contact_phone?.trim(),

                // Subscription
                subscription_expires: facilityForm.subscription_expires || null,
                is_subscribed: !!facilityForm.subscription_expires,
                status: 'active',
            }

            const userRes = await createUser(userPayload)

            if (userRes.status !== 'success') {
                throw new Error(userRes.message || 'Failed to create user')
            }

            const userId = userRes.user.id

            if (facilityForm.facility_id && facilityForm.facility_role) {
                const facilityPayload = {
                    facility_id: facilityForm.facility_id,
                    facility_role: facilityForm.facility_role,
                    department: facilityForm.department || null,
                    start_date: facilityForm.start_date,
                }

                const facilityRes = await assignUserToFacility(userId, facilityPayload)

                if (facilityRes.status !== 'success') {
                    console.warn(
                        'User created but facility assignment failed:',
                        facilityRes.message
                    )
                    showToast(
                        'warning',
                        'User created successfully, but facility assignment failed. Please assign manually.'
                    )
                } else {
                    showToast('success', 'User registered and assigned to facility successfully')
                }
            } else {
                showToast('success', 'User registered successfully')
            }

            window.dispatchEvent(new CustomEvent('user-created', { detail: userRes.user }))
            resetForm()
            onClose()
        } catch (error) {
            console.error('Registration error:', error)
            showToast('error', error.message || 'Failed to register user')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const isActiveFirstStep = currentStep === 'basic'

    // Render current step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'basic':
                return <BasicInfoSection form={basicForm} updateForm={updateBasicForm} />

            case 'step-selector':
                return (
                    <StepSelector
                        includedSteps={includedSteps}
                        onToggleStep={handleToggleStep}
                        onNext={handleNext}
                    />
                )

            case 'professional':
                return (
                    <ProfessionalSection
                        form={professionalForm}
                        updateForm={updateProfessionalForm}
                        basicRole={basicForm.role}
                    />
                )

            case 'facility':
                return (
                    <FacilitySection
                        form={facilityForm}
                        updateForm={updateFacilityForm}
                        facilities={facilities}
                        facilitiesLoading={facilitiesLoading}
                        professionalRole={basicForm.role}
                    />
                )

            case 'review':
                return (
                    <ReviewStep
                        basicForm={basicForm}
                        professionalForm={professionalForm}
                        facilityForm={facilityForm}
                        includedSteps={includedSteps}
                        facilities={facilities}
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
                    <DialogTitle className="text-xl font-semibold">Register New User</DialogTitle>
                    <DialogDescription>
                        Follow the steps to create a new user account. Required fields are marked
                        with an asterisk (*).
                    </DialogDescription>
                </DialogHeader>

                <div className="my-6">
                    <StepIndicator
                        currentStep={currentStep}
                        completedSteps={completedSteps}
                        includedSteps={includedSteps}
                    />
                    <div className="min-h-[400px]">{renderStepContent()}</div>
                </div>

                <DialogFooter className="flex justify-between mt-8">
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
                                {loading ? 'Creating...' : 'Create User Account'}
                            </Button>
                        ) : currentStep === 'step-selector' ? null : (
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

export default RegisterUserModal
