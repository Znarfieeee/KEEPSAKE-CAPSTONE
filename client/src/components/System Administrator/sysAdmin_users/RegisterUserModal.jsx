import React, { useState, useEffect } from 'react'
import { createUser, assignUserToFacility } from '@/api/admin/users'
import { getFacilities } from '@/api/admin/facility'
import { sanitizeObject } from '@/util/sanitize'

// UI Components
import { showToast } from '@/util/alertHelper'
import { Button } from '@/components/ui/Button'
import LoadingButton from '@/components/ui/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneNumberInput } from '@/components/ui/phone-number'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from '@/components/ui/stepper'
import Checkbox from '@/components/ui/Checkbox'

const initialForm = {
    email: '',
    password: 'keepsake123',
    firstname: '',
    middlename: '',
    lastname: '',
    specialty: '',
    role: '',
    license_number: '',
    phone_number: '',
    facility_id: '',
    facility_role: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0], // Today's date
    subscription_expires: '',
    is_subscribed: false,
    status: 'active',
}

const steps = [
    'Basic Information',
    'Professional Details',
    'Facility Assignment',
    'Review & Confirm',
]

const RegisterUserModal = ({ open, onClose }) => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [facilities, setFacilities] = useState([])
    const [facilitiesLoading, setFacilitiesLoading] = useState(false)
    // Ref for scroll animation when changing steps
    const contentRef = React.useRef(null)

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [step])

    // Fetch facilities when modal opens
    useEffect(() => {
        if (open && facilities.length === 0) {
            fetchFacilities()
        }
    }, [open])

    const fetchFacilities = async () => {
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
    }

    // Transition effect when changing steps
    const goToStep = (newStep) => {
        if (newStep > step) {
            if (step === 0 && (!form.email || !form.firstname || !form.lastname)) {
                showToast('error', 'Please fill in all required fields')
                return
            }
            if (step === 1 && (!form.role || !form.specialty)) {
                showToast('error', 'Please fill in all required fields')
                return
            }
            if (step === 2 && (!form.facility_id || !form.facility_role)) {
                showToast('error', 'Please select a facility and role')
                return
            }
        }
        setStep(newStep)
    }

    const next = () => goToStep(Math.min(steps.length - 1, step + 1))
    const prev = () => goToStep(Math.max(0, step - 1))

    const reset = () => {
        setForm(initialForm)
        setStep(0)
        setIsConfirmed(false)
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)

            // Step 1: Create the user
            const userPayload = sanitizeObject({
                email: form.email,
                password: form.password,
                firstname: form.firstname,
                middlename: form.middlename,
                lastname: form.lastname,
                specialty: form.specialty,
                role: form.role,
                license_number: form.license_number,
                phone_number: form.phone_number,
                subscription_expires: form.subscription_expires,
                is_subscribed: !!form.subscription_expires,
                status: form.status,
            })

            const userRes = await createUser(userPayload)

            if (userRes.status !== 'success') {
                throw new Error(userRes.message || 'Failed to create user')
            }

            const userId = userRes.user.id

            // Step 2: Assign user to facility if facility data is provided
            if (form.facility_id && form.facility_role) {
                const facilityPayload = {
                    facility_id: form.facility_id,
                    facility_role: form.facility_role,
                    department: form.department || null,
                    start_date: form.start_date,
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

            // Notify other components to update user list
            window.dispatchEvent(new CustomEvent('user-created', { detail: userRes.user }))
            reset()
            onClose()
        } catch (error) {
            console.error('Registration error:', error)
            showToast('error', error.message || 'Failed to register user')
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            {/* modal */}
            <div className="relative bg-white text-black dark:bg-background rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 space-y-6 z-10">
                <h2 className="text-xl font-semibold mb-2">Register New User</h2>

                {/* Enhanced Stepper */}
                <Stepper
                    value={step + 1}
                    onValueChange={(val) => goToStep(val - 1)}
                    className="mb-6 mx-auto w-full"
                    orientation="horizontal"
                >
                    {steps.map((title, idx) => (
                        <StepperItem
                            key={idx + 1}
                            step={idx + 1}
                            className="flex-1"
                            completed={idx < step}
                        >
                            <div className="flex flex-col items-center gap-2 w-full">
                                <StepperTrigger className="group flex flex-col items-center gap-2">
                                    <StepperIndicator className="size-8 text-sm" />
                                    <div className="text-center">
                                        <StepperTitle className="text-xs font-medium group-data-[state=active]:text-primary group-data-[state=completed]:text-primary">
                                            {title}
                                        </StepperTitle>
                                        <StepperDescription className="text-xs mt-1 hidden sm:block">
                                            {idx === 0 && 'Enter basic details'}
                                            {idx === 1 && 'Add professional info'}
                                            {idx === 2 && 'Assign to facility'}
                                            {idx === 3 && 'Review and confirm'}
                                        </StepperDescription>
                                    </div>
                                </StepperTrigger>
                                {/* {idx < steps.length - 1 && (
                                    <StepperSeparator className="hidden sm:block absolute top-4 left-1/2 transform translate-x-1/2 w-full" />
                                )} */}
                            </div>
                        </StepperItem>
                    ))}
                </Stepper>

                {/* Step content with transition */}
                <div
                    ref={contentRef}
                    className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 transition-all duration-300"
                >
                    {step === 0 && (
                        // ... Basic Information step ...
                        <>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex flex-col gap-1 p-2 w-full">
                                        <Label htmlFor="firstname">First Name</Label>
                                        <Input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            className="w-full"
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
                                    </div>
                                    <div className="flex flex-col gap-1 p-2 w-full">
                                        <Label htmlFor="lastname">Last Name</Label>
                                        <Input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            className="w-full"
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
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
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
                                </div>
                                <div className="p-2">
                                    <Label htmlFor="phone_number" className="mb-2">
                                        Phone Number
                                    </Label>
                                    <PhoneNumberInput
                                        value={form.phone_number}
                                        onChange={(value) =>
                                            setForm({
                                                ...form,
                                                phone_number: value || '',
                                            })
                                        }
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {step === 1 && (
                        // ... Professional Details step ...
                        <div className="space-y-4">
                            <Label htmlFor="specialty">Specialty</Label>
                            <Input
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
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={form.role}
                                onValueChange={(value) =>
                                    setForm({
                                        ...form,
                                        role: value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="nurse">Nurse</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <Label htmlFor="license_number">License Number</Label>
                            <Input
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
                            <p className="text-xs text-muted-foreground mt-1">
                                Required for medical professionals
                            </p>
                        </div>
                    )}
                    {step === 2 && (
                        // ... Facility Assignment step ...
                        <div className="space-y-4">
                            <Label htmlFor="facility_id">Healthcare Facility</Label>
                            <Select
                                value={form.facility_id}
                                onValueChange={(value) =>
                                    setForm({
                                        ...form,
                                        facility_id: value,
                                    })
                                }
                                disabled={facilitiesLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            facilitiesLoading
                                                ? 'Loading facilities...'
                                                : 'Select a facility'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {facilities.map((facility) => (
                                        <SelectItem
                                            key={facility.facility_id}
                                            value={facility.facility_id}
                                        >
                                            {facility.facility_name} - {facility.city}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Select the primary facility where this user will work
                            </p>

                            <Label htmlFor="facility_role">Facility Role</Label>
                            <Select
                                value={form.facility_role}
                                onValueChange={(value) =>
                                    setForm({
                                        ...form,
                                        facility_role: value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select facility role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="nurse">Nurse</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="facility_admin">Facility Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Role within the selected facility
                            </p>

                            <Label htmlFor="department">Department (Optional)</Label>
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

                            <div className="flex gap-4">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    type="date"
                                    id="start_date"
                                    name="start_date"
                                    value={form.start_date}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            start_date: e.target.value,
                                        })
                                    }
                                />
                                <Label htmlFor="subscription_expires">
                                    Personal Subscription Expires
                                </Label>
                                <Input
                                    type="date"
                                    id="subscription_expires"
                                    name="subscription_expires"
                                    value={form.subscription_expires}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            subscription_expires: e.target.value,
                                        })
                                    }
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional individual subscription
                                </p>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        // ... Review & Confirm step ...
                        <div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">Full Name</span>
                                    <span>
                                        {form.firstname} {form.middlename && `${form.middlename} `}
                                        {form.lastname}
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
                                    <span className="font-medium">Facility</span>
                                    <span>
                                        {facilities.find((f) => f.facility_id === form.facility_id)
                                            ?.facility_name || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Facility Role</span>
                                    <span className="capitalize">
                                        {form.facility_role || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Department</span>
                                    <span>{form.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Start Date</span>
                                    <span>{form.start_date || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Personal Subscription</span>
                                    <span>{form.subscription_expires || 'No expiration'}</span>
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
                        onClick={onClose}
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
                                onClick={handleSubmit}
                                disabled={!isConfirmed}
                                isLoading={loading}
                            >
                                Submit
                            </LoadingButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RegisterUserModal
