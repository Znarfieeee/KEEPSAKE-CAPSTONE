import React, { useState, useEffect, useCallback } from 'react'
import { createFacility } from '@/api/admin/facility'
import { sanitizeObject } from '@/util/sanitize'

// UI Components
import { showToast } from '@/util/alertHelper'
import { Button } from '@/components/ui/Button'
import LoadingButton from '@/components/ui/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    facility_name: '',
    address: '',
    city: '',
    zip_code: '',
    type: 'clinic',
    contact_number: '',
    email: '',
    website: '',
    plan: 'standard',
    subscription_expires: '',
}

const steps = [
    'Facility Information',
    'Contact & Admin Details',
    'Plan & Subscription',
    'Review & Confirm',
]

const RegisterFacilityModal = ({ open, onClose }) => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    // Ref for scroll animation when changing steps
    const contentRef = React.useRef(null)

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [step])

    // Transition effect when changing steps
    const goToStep = useCallback(
        (newStep) => {
            if (newStep > step) {
                if (step === 0 && (!form.facility_name || !form.address || !form.city)) {
                    showToast('error', 'Please fill in all required fields')
                    return
                }
                if (step === 1 && (!form.contact_number || !form.email)) {
                    showToast('error', 'Please fill in contact number and email')
                    return
                }
                if (step === 2 && (!form.plan || !form.subscription_expires)) {
                    showToast('error', 'Please select plan and expiry date')
                    return
                }
            }
            setStep(newStep)
        },
        [step, form]
    )

    const next = useCallback(() => goToStep(Math.min(steps.length - 1, step + 1)), [goToStep, step])
    const prev = useCallback(() => goToStep(Math.max(0, step - 1)), [goToStep, step])

    // Optimized form field handlers
    const handleInputChange = useCallback((field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }, [])

    // Optimized handlers for each field
    const handleFacilityNameChange = useCallback(
        (e) => handleInputChange('facility_name', e.target.value),
        [handleInputChange]
    )
    const handleAddressChange = useCallback(
        (e) => handleInputChange('address', e.target.value),
        [handleInputChange]
    )
    const handleCityChange = useCallback(
        (e) => handleInputChange('city', e.target.value),
        [handleInputChange]
    )
    const handleZipCodeChange = useCallback(
        (e) => handleInputChange('zip_code', e.target.value),
        [handleInputChange]
    )
    const handleTypeChange = useCallback(
        (value) => handleInputChange('type', value),
        [handleInputChange]
    )
    const handleContactChange = useCallback(
        (e) => handleInputChange('contact_number', e.target.value),
        [handleInputChange]
    )
    const handleEmailChange = useCallback(
        (e) => handleInputChange('email', e.target.value),
        [handleInputChange]
    )
    const handleWebsiteChange = useCallback(
        (e) => handleInputChange('website', e.target.value),
        [handleInputChange]
    )
    const handlePlanChange = useCallback(
        (value) => handleInputChange('plan', value),
        [handleInputChange]
    )
    const handleExpiryChange = useCallback(
        (e) => handleInputChange('subscription_expires', e.target.value),
        [handleInputChange]
    )

    const reset = useCallback(() => {
        setForm(initialForm)
        setStep(0)
        setIsConfirmed(false)
    }, [])

    const handleSubmit = useCallback(async () => {
        try {
            setLoading(true)
            const payload = sanitizeObject({
                ...form,
            })
            const res = await createFacility(payload)

            if (res.status === 'success') {
                showToast('success', 'Facility registered successfully')
                // Notify other components (e.g., FacilitiesRegistry) to update list
                window.dispatchEvent(new CustomEvent('facility-created', { detail: res.data }))
                reset()
                onClose()
            } else {
                showToast('error', res.message || 'Failed to register facility')
            }
        } catch (error) {
            console.error('Registration error:', error)
            showToast('error', error.message || 'Failed to register facility')
        } finally {
            setLoading(false)
        }
    }, [form, reset, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            {/* modal */}
            <div className="relative bg-white text-black dark:bg-background rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 space-y-6 z-10">
                <h2 className="text-xl font-semibold mb-2">Register Facility</h2>

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
                                            {idx === 0 && 'Basic facility details'}
                                            {idx === 1 && 'Contact information'}
                                            {idx === 2 && 'Plan and subscription'}
                                            {idx === 3 && 'Review and confirm'}
                                        </StepperDescription>
                                    </div>
                                </StepperTrigger>
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
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 p-2">
                                    <Label htmlFor="facility_name">Facility Name *</Label>
                                    <Input
                                        type="text"
                                        id="facility_name"
                                        name="facility_name"
                                        value={form.facility_name}
                                        onChange={handleFacilityNameChange}
                                        placeholder="St. Luke's Hospital"
                                        required
                                    />
                                </div>
                                <div className="w-[180px] p-2">
                                    <Label htmlFor="type">Facility Type</Label>
                                    <Select value={form.type} onValueChange={handleTypeChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="clinic">Clinic</SelectItem>
                                            <SelectItem value="hospital">Hospital</SelectItem>
                                            <SelectItem value="health_center">
                                                Health Center
                                            </SelectItem>
                                            <SelectItem value="diagnostic_center">
                                                Diagnostic Center
                                            </SelectItem>
                                            <SelectItem value="specialty_clinic">
                                                Specialty Clinic
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="p-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={form.address}
                                    onChange={handleAddressChange}
                                    placeholder="123 Main Street"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={form.city}
                                        onChange={handleCityChange}
                                        placeholder="Cebu City"
                                        required
                                    />
                                </div>
                                <div className="p-2">
                                    <Label htmlFor="zip_code">Zip Code</Label>
                                    <Input
                                        type="text"
                                        id="zip_code"
                                        name="zip_code"
                                        value={form.zip_code}
                                        onChange={handleZipCodeChange}
                                        placeholder="6000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="p-2">
                                <Label htmlFor="contact_number">Contact Number *</Label>
                                <Input
                                    type="tel"
                                    id="contact_number"
                                    name="contact_number"
                                    value={form.contact_number}
                                    onChange={handleContactChange}
                                    placeholder="(032) 123-4567 or 0912-345-6789"
                                    required
                                />
                            </div>

                            <div className="p-2">
                                <Label htmlFor="email">Admin Email *</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleEmailChange}
                                    placeholder="admin@example.com"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Primary contact email for facility administration
                                </p>
                            </div>

                            <div className="p-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={form.website}
                                    onChange={handleWebsiteChange}
                                    placeholder="https://example.com"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional - Facility website or online presence
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="p-2">
                                <Label htmlFor="plan">Subscription Plan *</Label>
                                <Select value={form.plan} onValueChange={handlePlanChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard Plan</SelectItem>
                                        <SelectItem value="premium">Premium Plan</SelectItem>
                                        <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Choose the subscription plan that best fits your facility's
                                    needs
                                </p>
                            </div>

                            <div className="p-2">
                                <Label htmlFor="subscription_expires">Subscription Expires *</Label>
                                <Input
                                    type="date"
                                    id="subscription_expires"
                                    name="subscription_expires"
                                    value={form.subscription_expires}
                                    onChange={handleExpiryChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Set the subscription expiration date
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">Facility Name</span>
                                    <span>{form.facility_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Type</span>
                                    <span className="capitalize">{form.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Address</span>
                                    <span>{form.address}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">City</span>
                                    <span>{form.city}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Zip Code</span>
                                    <span>{form.zip_code || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Contact Number</span>
                                    <span>{form.contact_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Admin Email</span>
                                    <span>{form.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Website</span>
                                    <span>{form.website || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Plan</span>
                                    <span className="capitalize">{form.plan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Subscription Expires</span>
                                    <span>{form.subscription_expires}</span>
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

export default RegisterFacilityModal
