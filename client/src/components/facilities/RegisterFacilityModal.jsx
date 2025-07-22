import React, { useState, useEffect } from "react"
import { createFacility } from "../../api/facility"

// UI Components
import { showToast } from "../../util/alertHelper"
import { Button } from "../ui/Button"
import LoadingButton from "../ui/LoadingButton"
import {
    Stepper,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTrigger,
} from "@/components/ui/stepper"
import Checkbox from "../ui/Checkbox"

const initialForm = {
    facility_name: "",
    address: "",
    city: "",
    zip_code: "",
    type: "clinic",
    contact_number: "",
    email: "",
    website: "",
    plan: "standard",
    subscription_expires: "",
}

const steps = ["Facility Info", "Assign Admin", "Plan & Expiry", "Review"]

const RegisterFacilityModal = ({ open, onClose }) => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    // Ref for scroll animation when changing steps
    const contentRef = React.useRef(null)

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: "smooth" })
        }
    }, [step])

    const next = () => setStep(s => Math.min(steps.length - 1, s + 1))
    const prev = () => setStep(s => Math.max(0, s - 1))

    const reset = () => {
        setForm(initialForm)
        setStep(0)
        setIsConfirmed(false)
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)
            const payload = {
                ...form,
            }
            const res = await createFacility(payload)

            if (res.status === "success") {
                showToast("success", "Facility registered")
                // Notify other components (e.g., FacilitiesRegistry) to update list
                window.dispatchEvent(
                    new CustomEvent("facility-created", { detail: res.data })
                )
            } else {
                showToast("error", res.message || "Failed to register facility")
            }

            reset()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* modal */}
            <div className="relative bg-white text-black dark:bg-background rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 space-y-6 z-10">
                <h2 className="text-xl font-semibold mb-2">
                    Register Facility
                </h2>

                {/* Stepper */}
                <Stepper
                    value={step + 1}
                    onValueChange={val => setStep(val - 1)}
                    className="mb-4 mx-auto w-full justify-center"
                    orientation="horizontal">
                    {steps.map((_, idx) => (
                        <StepperItem
                            key={idx + 1}
                            step={idx + 1}
                            className="flex-1 text-white data-[state=checked]:text-white">
                            <StepperTrigger asChild>
                                <StepperIndicator />
                            </StepperTrigger>
                            {idx < steps.length - 1 && (
                                <StepperSeparator className="bg-white/20" />
                            )}
                        </StepperItem>
                    ))}
                </Stepper>

                {/* Step content */}
                <div
                    ref={contentRef}
                    className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {step === 0 && (
                        <>
                            {/* Facility Name */}
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="facility_name"
                                    className="block text-sm font-medium">
                                    Facility Name
                                </label>
                                <input
                                    type="text"
                                    id="facility_name"
                                    name="facility_name"
                                    value={form.facility_name}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            facility_name: e.target.value,
                                        })
                                    }
                                    placeholder="example:  St. Luke's Hospital"
                                />
                            </div>

                            {/* Address */}
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="address"
                                    className="block text-sm font-medium">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={form.address}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            address: e.target.value,
                                        })
                                    }
                                    placeholder="example: 123 Main St"
                                />
                            </div>

                            {/* City & Zip */}
                            <div className="flex gap-2 form-control">
                                <div className="flex-1">
                                    <label
                                        htmlFor="city"
                                        className="block text-sm font-medium">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={form.city}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                city: e.target.value,
                                            })
                                        }
                                        placeholder="example: Cebu"
                                    />
                                </div>
                                <div className="w-36">
                                    <label
                                        htmlFor="zip_code"
                                        className="block text-sm font-medium">
                                        Zip Code
                                    </label>
                                    <input
                                        type="text"
                                        id="zip_code"
                                        name="zip_code"
                                        value={form.zip_code}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                zip_code: e.target.value,
                                            })
                                        }
                                        placeholder="example: 6000"
                                    />
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="contact_number"
                                    className="block text-sm font-medium">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    id="contact_number"
                                    name="contact_number"
                                    value={form.contact_number}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            contact_number: e.target.value,
                                        })
                                    }
                                    placeholder="example: 0912 345 6789 or (032) 123 4567"
                                />
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <div className="space-y-3">
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="admin@example.com"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    You can invite a new admin by email or
                                    assign an existing user later.
                                </p>
                            </div>
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="website"
                                    className="block text-sm font-medium">
                                    Website
                                </label>
                                <input
                                    type="text"
                                    id="website"
                                    name="website"
                                    value={form.website}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            website: e.target.value,
                                        })
                                    }
                                    placeholder="https://example.com"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    You can leave blank if not applicable.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3 flex flex-col gap-4">
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="plan"
                                    className="block text-sm font-medium">
                                    Plan
                                </label>
                                <select
                                    id="plan"
                                    name="plan"
                                    value={form.plan}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            plan: e.target.value,
                                        })
                                    }>
                                    <option value="standard">Standard</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">
                                        Enterprise
                                    </option>
                                </select>
                            </div>
                            <div className="flex flex-col form-control">
                                <label
                                    htmlFor="subscription_expires"
                                    className="block text-sm font-medium">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    id="subscription_expires"
                                    name="subscription_expires"
                                    value={form.subscription_expires}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            subscription_expires:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Facility Name
                                    </span>
                                    <span>{form.facility_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Type</span>
                                    <span className="capitalize">
                                        {form.type}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Contact</span>
                                    <span>{form.contact_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Admin Email
                                    </span>
                                    <span>{form.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Plan</span>
                                    <span className="capitalize">
                                        {form.plan}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Expiry</span>
                                    <span>{form.subscription_expires}</span>
                                </div>
                            </div>
                            {/* Confirm Button */}
                            <div className="flex items-center gap-2 mt-4">
                                <Checkbox
                                    name="isConfirmed"
                                    checked={isConfirmed}
                                    onChange={() =>
                                        setIsConfirmed(!isConfirmed)
                                    }
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
                        onClick={onClose}>
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
                                isLoading={loading}>
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
