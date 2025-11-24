import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import LoadingButton from '@/components/ui/LoadingButton'
import {
    Stepper,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTrigger,
} from '@/components/ui/stepper'
import { Checkbox } from '@/components/ui/Checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { showToast } from '@/util/alertHelper'

const initialForm = {
    firstname: '',
    lastname: '',
    email: '',
    phone_number: '',
    role: '',
    specialty: '',
    license_number: '',
    department: '',
    notes: '',
}

const steps = ['Basic Information', 'Professional Details', 'Review & Confirm']

const AddUserModal = ({ open, onClose, onSubmit, loading = false }) => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [errors, setErrors] = useState({})
    const contentRef = React.useRef(null)

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [step])

    const validateStep = useCallback(
        (stepIndex) => {
            const newErrors = {}

            if (stepIndex === 0) {
                if (!form.firstname.trim()) newErrors.firstname = 'First name is required'
                if (!form.lastname.trim()) newErrors.lastname = 'Last name is required'
                if (!form.email.trim()) newErrors.email = 'Email is required'
                if (form.email && !/\S+@\S+\.\S+/.test(form.email))
                    newErrors.email = 'Invalid email format'
                if (!form.phone_number.trim()) newErrors.phone_number = 'Phone number is required'
            }

            if (stepIndex === 1) {
                if (!form.role) newErrors.role = 'Role is required'
                if (!form.specialty.trim()) newErrors.specialty = 'Specialty is required'
                if (['doctor', 'nurse'].includes(form.role) && !form.license_number.trim()) {
                    newErrors.license_number =
                        'License number is required for medical professionals'
                }
            }

            setErrors(newErrors)
            return Object.keys(newErrors).length === 0
        },
        [form]
    )

    const goToStep = useCallback(
        (newStep) => {
            if (newStep > step) {
                if (!validateStep(step)) {
                    showToast('error', 'Please fill in all required fields')
                    return
                }
            }
            setStep(newStep)
        },
        [step, validateStep]
    )

    const next = useCallback(() => goToStep(Math.min(steps.length - 1, step + 1)), [goToStep, step])
    const prev = useCallback(() => goToStep(Math.max(0, step - 1)), [goToStep, step])

    const reset = useCallback(() => {
        setForm(initialForm)
        setStep(0)
        setIsConfirmed(false)
        setErrors({})
    }, [])

    const handleClose = useCallback(() => {
        reset()
        onClose()
    }, [reset, onClose])

    const handleFormSubmit = useCallback(async () => {
        if (!isConfirmed) {
            showToast('error', 'Please confirm that the information is correct')
            return
        }

        try {
            setIsSubmitting(true)

            // Transform form data to match API expectations
            const payload = {
                firstname: form.firstname,
                lastname: form.lastname,
                email: form.email,
                phone_number: form.phone_number,
                role: form.role,
                specialty: form.specialty,
                license_number: form.license_number,
                department: form.department,
                notes: form.notes,
            }

            await onSubmit(payload)
            reset()
        } catch {
            // Error handling is done by parent component
        } finally {
            setIsSubmitting(false)
        }
    }, [form, isConfirmed, onSubmit, reset])

    const requiresLicense = ['doctor', 'nurse'].includes(form.role)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            {/* modal */}
            <div className="relative bg-white text-black dark:bg-background rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 space-y-6 z-10">
                <h2 className="text-xl font-semibold mb-2">Add New User</h2>

                {/* Stepper */}
                <Stepper
                    value={step + 1}
                    onValueChange={(val) => goToStep(val - 1)}
                    className="mb-4 mx-auto w-full justify-center"
                    orientation="horizontal"
                >
                    {steps.map((title, idx) => (
                        <StepperItem
                            key={idx + 1}
                            step={idx + 1}
                            className="flex-1 text-white data-[state=checked]:text-white"
                        >
                            <StepperTrigger asChild>
                                <StepperIndicator />
                            </StepperTrigger>
                            {idx < steps.length - 1 && <StepperSeparator className="bg-white/20" />}
                        </StepperItem>
                    ))}
                </Stepper>

                {/* Step content with transition */}
                <div
                    ref={contentRef}
                    className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 transition-all duration-300"
                >
                    {step === 0 && (
                        // Basic Information step
                        <>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 form-control">
                                        <label
                                            htmlFor="firstname"
                                            className="block text-sm font-medium"
                                        >
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            value={form.firstname}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    firstname: e.target.value,
                                                })
                                            }
                                            placeholder="Juan"
                                            required
                                        />
                                        {errors.firstname && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.firstname}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-1 form-control">
                                        <label
                                            htmlFor="lastname"
                                            className="block text-sm font-medium"
                                        >
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            value={form.lastname}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    lastname: e.target.value,
                                                })
                                            }
                                            placeholder="De la Cruz"
                                            required
                                        />
                                        {errors.lastname && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.lastname}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="form-control">
                                    <label htmlFor="email" className="block text-sm font-medium">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                email: e.target.value,
                                            })
                                        }
                                        placeholder="juan@example.com"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label
                                        htmlFor="phone_number"
                                        className="block text-sm font-medium"
                                    >
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone_number"
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                phone_number: e.target.value,
                                            })
                                        }
                                        placeholder="09123456789"
                                        required
                                    />
                                    {errors.phone_number && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.phone_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {step === 1 && (
                        // Professional Details step
                        <div className="space-y-3">
                            <div className="form-control">
                                <label htmlFor="specialty" className="block text-sm font-medium">
                                    Specialty
                                </label>
                                <input
                                    type="text"
                                    id="specialty"
                                    name="specialty"
                                    value={form.specialty}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            specialty: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Pediatrician"
                                />
                                {errors.specialty && (
                                    <p className="text-sm text-red-600 mt-1">{errors.specialty}</p>
                                )}
                            </div>
                            <div className="form-control">
                                <label htmlFor="role" className="block text-sm font-medium">
                                    Role
                                </label>
                                <Select
                                    value={form.role}
                                    onValueChange={(value) =>
                                        setForm({
                                            ...form,
                                            role: value,
                                        })
                                    }
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="nurse">Nurse</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="facility_admin">
                                            Facility Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-sm text-red-600 mt-1">{errors.role}</p>
                                )}
                            </div>
                            {requiresLicense && (
                                <div className="form-control">
                                    <label
                                        htmlFor="license_number"
                                        className="block text-sm font-medium"
                                    >
                                        License Number
                                    </label>
                                    <input
                                        type="text"
                                        id="license_number"
                                        name="license_number"
                                        value={form.license_number}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                license_number: e.target.value,
                                            })
                                        }
                                        placeholder="Enter professional license number"
                                    />
                                    {errors.license_number && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.license_number}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Required for medical professionals
                                    </p>
                                </div>
                            )}
                            <div className="form-control">
                                <label htmlFor="department" className="block text-sm font-medium">
                                    Department
                                </label>
                                <Select
                                    value={form.department}
                                    onValueChange={(value) =>
                                        setForm({
                                            ...form,
                                            department: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                                        <SelectItem value="Emergency">Emergency</SelectItem>
                                        <SelectItem value="Surgery">Surgery</SelectItem>
                                        <SelectItem value="Administration">
                                            Administration
                                        </SelectItem>
                                        <SelectItem value="Radiology">Radiology</SelectItem>
                                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                                        <SelectItem value="Nursing">Nursing</SelectItem>
                                        <SelectItem value="IT">IT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        // Review & Confirm step
                        <div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">Full Name</span>
                                    <span>
                                        {form.firstname} {form.lastname}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Email</span>
                                    <span>{form.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Phone</span>
                                    <span>{form.phone_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Role</span>
                                    <span className="capitalize">{form.role}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Specialty</span>
                                    <span>{form.specialty || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">License Number</span>
                                    <span>{form.license_number || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Department</span>
                                    <span>{form.department || 'N/A'}</span>
                                </div>
                            </div>
                            {/* Confirm Button */}
                            <div className="flex items-center gap-2 mt-4">
                                <Checkbox
                                    name="isConfirmed"
                                    checked={isConfirmed}
                                    onChange={() => setIsConfirmed(!isConfirmed)}
                                    label="I confirm that the information is correct."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between gap-2">
                    <Button
                        className="bg-red-500 hover:bg-red-700 transition-all duration-300"
                        size="sm"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <div className="ml-auto flex gap-2">
                        {step > 0 && (
                            <Button variant="ghost" size="sm" onClick={prev}>
                                Back
                            </Button>
                        )}
                        {step < steps.length - 1 && (
                            <Button size="sm" onClick={next}>
                                Next
                            </Button>
                        )}
                        {step === steps.length - 1 && (
                            <LoadingButton
                                size="sm"
                                type="button"
                                className="bg-primary text-white hover:bg-primary/90 ease-in-out delay-30 transition-all duration-300"
                                onClick={handleFormSubmit}
                                disabled={!isConfirmed}
                                loading={loading || isSubmitting}
                            >
                                Create User
                            </LoadingButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddUserModal
