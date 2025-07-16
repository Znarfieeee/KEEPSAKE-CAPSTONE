import React, { useState } from "react"
import { Button } from "../ui/Button"
import { showToast } from "../../util/alertHelper"

const initialForm = {
    name: "",
    type: "clinic",
    contact: "",
    adminEmail: "",
    plan: "standard",
    expiry: "",
}

const steps = ["Facility Info", "Assign Admin", "Plan & Expiry", "Review"]

const RegisterFacilityModal = ({ open, onClose, onSubmit }) => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)

    const next = () => setStep(s => Math.min(steps.length - 1, s + 1))
    const prev = () => setStep(s => Math.max(0, s - 1))

    const reset = () => {
        setForm(initialForm)
        setStep(0)
    }

    const handleSubmit = () => {
        onSubmit(form)
        showToast("success", "Facility registered")
        reset()
        onClose()
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
            <div className="relative bg-white dark:bg-background rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 space-y-6 z-10">
                <h2 className="text-xl font-semibold">Register Facility</h2>
                <p className="text-sm text-muted-foreground">
                    Step {step + 1} of {steps.length} – {steps[step]}
                </p>

                {/* Step content */}
                {step === 0 && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium">
                                Facility Name
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-input/30 dark:border-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">
                                Type
                            </label>
                            <select
                                value={form.type}
                                onChange={e =>
                                    setForm({ ...form, type: e.target.value })
                                }
                                className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-input/30 dark:border-input">
                                <option value="clinic">Clinic</option>
                                <option value="hospital">Hospital</option>
                                <option value="bhs">BHS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">
                                Contact Info
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
                                className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-input/30 dark:border-input"
                            />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-3">
                        <div>
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
                                className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-input/30 dark:border-input"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                You can invite a new admin by email or assign an
                                existing user later.
                            </p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium">
                                Plan
                            </label>
                            <select
                                value={form.plan}
                                onChange={e =>
                                    setForm({ ...form, plan: e.target.value })
                                }
                                className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-input/30 dark:border-input">
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                value={form.expiry}
                                onChange={e =>
                                    setForm({ ...form, expiry: e.target.value })
                                }
                                className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-input/30 dark:border-input"
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium">Facility Name</span>
                            <span>{form.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Type</span>
                            <span className="capitalize">{form.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Contact</span>
                            <span>{form.contact}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Admin Email</span>
                            <span>{form.adminEmail || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Plan</span>
                            <span className="capitalize">{form.plan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Expiry</span>
                            <span>{form.expiry || "—"}</span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
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
                            <Button size="sm" onClick={handleSubmit}>
                                Submit
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RegisterFacilityModal
