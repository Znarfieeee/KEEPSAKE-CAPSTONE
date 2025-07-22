import React, { useState, useRef, useEffect } from "react"
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
    name: "",
    address: "",
    city: "",
    zip_code: "",
    type: "clinic", // Optional UI-only field
    contact: "",
    adminEmail: "",
    plan: "standard",
    expiry: "",
}

const steps = ["Facility Info", "Assign Admin", "Plan & Expiry", "Review"]

const RegisterFacilityModal = ({ open, onClose, onSubmit }) => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)

    // Ref for scroll animation when changing steps
    const contentRef = useRef(null)

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
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)
            await onSubmit(form)
            // Parent component handles toasts
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
                                <label className="block text-sm font-medium">
                                    Facility Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="example:  St. Luke's Hospital"
                                />
                            </div>

                            {/* Address */}
                            <div className="flex flex-col form-control">
                                <label className="block text-sm font-medium">
                                    Address
                                </label>
                                <input
                                    type="text"
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
                                    <label className="block text-sm font-medium">
                                        City
                                    </label>
                                    <input
                                        type="text"
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
                                    <label className="block text-sm font-medium">
                                        Zip Code
                                    </label>
                                    <input
                                        type="text"
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
                                <label className="block text-sm font-medium">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    value={form.contact}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            contact: e.target.value,
                                        })
                                    }
                                    placeholder="example: +63 912 345 6789 or (032) 123 4567"
                                />
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <div className="space-y-3">
                            <div className="flex flex-col form-control">
                                <label className="block text-sm font-medium">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={form.adminEmail}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            adminEmail: e.target.value,
                                        })
                                    }
                                    placeholder="admin@example.com"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    You can invite a new admin by email or
                                    assign an existing user later.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3 flex flex-col gap-4">
                            <div className="flex flex-col form-control">
                                <label className="block text-sm font-medium">
                                    Plan
                                </label>
                                <select
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
                                <label className="block text-sm font-medium">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={form.expiry}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            expiry: e.target.value,
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
                                    <span>{form.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Type</span>
                                    <span className="capitalize">
                                        {form.type}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Contact</span>
                                    <span>{form.contact}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Admin Email
                                    </span>
                                    <span>{form.adminEmail || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Plan</span>
                                    <span className="capitalize">
                                        {form.plan}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Expiry</span>
                                    <span>{form.expiry || "—"}</span>
                                </div>
                            </div>
                            {/* Confirm Button */}
                            <div className="flex items-center gap-2 mt-4">
                                <Checkbox
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
