import React, { useState, memo, useCallback, useEffect } from "react"

// UI Components
import { Dialog, DialogContent } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Helper
import { showToast } from "@/util/alertHelper"

const EditFacilityModal = memo(({ open, facility, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        facility_name: "",
        address: "",
        city: "",
        zip_code: "",
        contact_number: "",
        email: "",
        website: "",
        type: "hospital",
        plan: "basic",
        subscription_status: "active",
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (facility) {
            const locationParts = facility.location
                ? facility.location.split(",").map(part => part.trim())
                : []

            setFormData({
                facility_name: facility.name || "",
                address: locationParts[0] || "",
                city: locationParts[1] || "",
                zip_code: locationParts[2] || "",
                contact_number: facility.contact || "",
                email: facility.email || "",
                website: facility.website || "",
                type: facility.type || "hospital",
                plan: facility.plan || "basic",
                subscription_status: facility.subscription_status || "active",
            })
            setErrors({})
        }
    }, [facility])

    const sanitizeInput = val => val.trimStart()

    const handleChange = useCallback(
        (field, value) => {
            const sanitizedValue =
                typeof value === "string" ? sanitizeInput(value) : value
            setFormData(prev => ({ ...prev, [field]: sanitizedValue }))

            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: null }))
            }
        },
        [errors]
    )

    const validateForm = useCallback(() => {
        const newErrors = {}

        if (!formData.facility_name.trim())
            newErrors.facility_name = "Facility name is required"
        if (!formData.email.trim()) newErrors.email = "Email is required"
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email"
        }
        if (!formData.contact_number.trim())
            newErrors.contact_number = "Contact number is required"
        if (!formData.address.trim()) newErrors.address = "Address is required"
        if (!formData.city.trim()) newErrors.city = "City is required"
        if (!formData.zip_code.trim())
            newErrors.zip_code = "ZIP code is required"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    const handleSubmit = useCallback(
        async e => {
            e.preventDefault()

            if (!validateForm()) return

            setIsLoading(true)

            try {
                const updatedFacility = {
                    ...facility,
                    id: facility.id,
                    name: formData.facility_name,
                    location: `${formData.address}, ${formData.city}, ${formData.zip_code}`,
                    contact: formData.contact_number,
                    email: formData.email,
                    website: formData.website,
                    type: formData.type,
                    plan: formData.plan,
                    subscription_status: formData.subscription_status,
                }

                await onSave(updatedFacility)
                showToast("success", "Facility updated successfully!")
                onClose()
            } catch (error) {
                console.error("Error updating facility:", error)
                showToast(
                    "error",
                    "Failed to update facility. Please try again."
                )
            } finally {
                setIsLoading(false)
            }
        },
        [formData, facility, onSave, onClose, validateForm]
    )

    if (!open || !facility) return null

    const typeOptions = [
        { value: "hospital", label: "Hospital" },
        { value: "clinic", label: "Clinic" },
        { value: "pharmacy", label: "Pharmacy" },
    ]

    const planOptions = [
        { value: "basic", label: "Basic" },
        { value: "premium", label: "Premium" },
        { value: "enterprise", label: "Enterprise" },
    ]

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "pending", label: "Pending" },
        { value: "suspended", label: "Suspended" },
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Edit {facility.name}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-200">
                                Basic Information
                            </h3>

                            <div className="space-y-1">
                                <Label htmlFor="facility_name">
                                    Facility Name
                                </Label>
                                <Input
                                    id="facility_name"
                                    value={formData.facility_name}
                                    onChange={e =>
                                        handleChange(
                                            "facility_name",
                                            e.target.value
                                        )
                                    }
                                    required
                                />
                                {errors.facility_name && (
                                    <p className="text-sm text-red-500">
                                        {errors.facility_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={e =>
                                        handleChange("email", e.target.value)
                                    }
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="contact_number">
                                    Contact Number
                                </Label>
                                <Input
                                    id="contact_number"
                                    value={formData.contact_number}
                                    onChange={e =>
                                        handleChange(
                                            "contact_number",
                                            e.target.value
                                        )
                                    }
                                    required
                                />
                                {errors.contact_number && (
                                    <p className="text-sm text-red-500">
                                        {errors.contact_number}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={e =>
                                        handleChange("website", e.target.value)
                                    }
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        {/* Location and Settings */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-200">
                                Location & Settings
                            </h3>

                            <div className="space-y-1">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e =>
                                        handleChange("address", e.target.value)
                                    }
                                    required
                                />
                                {errors.address && (
                                    <p className="text-sm text-red-500">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={e =>
                                            handleChange("city", e.target.value)
                                        }
                                        required
                                    />
                                    {errors.city && (
                                        <p className="text-sm text-red-500">
                                            {errors.city}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="zip_code">ZIP Code</Label>
                                    <Input
                                        id="zip_code"
                                        value={formData.zip_code}
                                        onChange={e =>
                                            handleChange(
                                                "zip_code",
                                                e.target.value
                                            )
                                        }
                                        required
                                    />
                                    {errors.zip_code && (
                                        <p className="text-sm text-red-500">
                                            {errors.zip_code}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Facility Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={value =>
                                        handleChange("type", value)
                                    }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map(option => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Subscription Plan</Label>
                                <Select
                                    value={formData.plan}
                                    onValueChange={value =>
                                        handleChange("plan", value)
                                    }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {planOptions.map(option => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.subscription_status}
                                    onValueChange={value =>
                                        handleChange(
                                            "subscription_status",
                                            value
                                        )
                                    }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map(option => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isLoading}
                            disabled={isLoading}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
})

export default EditFacilityModal
