import React, { useState, useEffect } from "react"
import { createUser } from "../../../api/admin/users"
import { sanitizeObject } from "../../../util/sanitize"

// UI Components
import { showToast } from "../../../util/alertHelper"
import { Button } from "../../ui/Button"
import LoadingButton from "../../ui/LoadingButton"
import {
    Stepper,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTrigger,
} from "@/components/ui/stepper"
import Checkbox from "../../ui/Checkbox"

const initialForm = {
    email: "",
    password: "keepsake123",
    firstname: "",
    lastname: "",
    specialty: "",
    role: "",
    license_number: "",
    phone_number: "",
    facility_id: "",
    facility_role: "",
    status: "active", // Added default status
}

const steps = [
    "Basic Information",
    "Professional Details",
    "Subscription & Facility",
    "Review & Confirm",
]

const RegisterUserModal = ({ open, onClose }) => {
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

    // Transition effect when changing steps
    const goToStep = newStep => {
        if (newStep > step) {
            if (
                step === 0 &&
                (!form.email || !form.firstname || !form.lastname)
            ) {
                showToast("error", "Please fill in all required fields")
                return
            }
            if (step === 1 && (!form.role || !form.specialty)) {
                showToast("error", "Please fill in all required fields")
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
            const payload = sanitizeObject({
                ...form,
                password: "keepsake123", // Default password as specified in initialForm
            })

            const res = await createUser(payload)

            if (res.status === "success") {
                showToast("success", "User registered successfully")
                // Notify other components to update user list
                window.dispatchEvent(
                    new CustomEvent("user-created", { detail: res.data })
                )
                reset()
                onClose()
            } else {
                showToast("error", res.message || "Failed to register user")
            }
        } catch (error) {
            showToast("error", error.message || "Failed to register user")
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
                    Register New User
                </h2>

                {/* Stepper */}
                <Stepper
                    value={step + 1}
                    onValueChange={val => goToStep(val - 1)}
                    className="mb-4 mx-auto w-full justify-center"
                    orientation="horizontal">
                    {steps.map((title, idx) => (
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

                {/* Step content with transition */}
                <div
                    ref={contentRef}
                    className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 transition-all duration-300">
                    {step === 0 && (
                        // ... Basic Information step ...
                        <>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 form-control">
                                        <label
                                            htmlFor="firstname"
                                            className="block text-sm font-medium">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            value={form.firstname}
                                            onChange={e =>
                                                setForm({
                                                    ...form,
                                                    firstname: e.target.value,
                                                })
                                            }
                                            placeholder="Juan"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 form-control">
                                        <label
                                            htmlFor="lastname"
                                            className="block text-sm font-medium">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            value={form.lastname}
                                            onChange={e =>
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
                                <div className="form-control">
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium">
                                        Email Address
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
                                        placeholder="juan@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label
                                        htmlFor="phone_number"
                                        className="block text-sm font-medium">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone_number"
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                phone_number: e.target.value,
                                            })
                                        }
                                        placeholder="09123456789"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {step === 1 && (
                        // ... Professional Details step ...
                        <div className="space-y-3">
                            <div className="form-control">
                                <label
                                    htmlFor="specialty"
                                    className="block text-sm font-medium">
                                    Specialty
                                </label>
                                <input
                                    type="text"
                                    id="specialty"
                                    name="specialty"
                                    value={form.specialty}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            specialty: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Pediatrician"
                                />
                            </div>
                            <div className="form-control">
                                <label
                                    htmlFor="role"
                                    className="block text-sm font-medium">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={form.role}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            role: e.target.value,
                                        })
                                    }
                                    required>
                                    <option value="">Select a role</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label
                                    htmlFor="license_number"
                                    className="block text-sm font-medium">
                                    License Number
                                </label>
                                <input
                                    type="text"
                                    id="license_number"
                                    name="license_number"
                                    value={form.license_number}
                                    onChange={e =>
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
                        </div>
                    )}
                    {step === 2 && (
                        // ... Subscription & Facility step ...
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
                                    <option value="standard">Freemium</option>
                                    <option value="premium">Premium</option>
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
                            {/* Facility assignment fields can be added here if needed */}
                        </div>
                    )}
                    {step === 3 && (
                        // ... Review & Confirm step ...
                        <div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Full Name
                                    </span>
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
                                    <span className="capitalize">
                                        {form.role}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Specialty
                                    </span>
                                    <span>{form.specialty || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        License Number
                                    </span>
                                    <span>{form.license_number || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Plan</span>
                                    <span>{form.plan || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Expiry Date
                                    </span>
                                    <span>
                                        {form.subscription_expires || "N/A"}
                                    </span>
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

export default RegisterUserModal
