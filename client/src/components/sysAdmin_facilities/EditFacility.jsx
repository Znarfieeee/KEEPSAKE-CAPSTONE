import React, { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { showToast } from "../../util/alertHelper"

// UI Components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/Dialog"
import { Button } from "../ui/Button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select"

const EditFacility = ({ open, facility, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        facility_name: facility?.name || "",
        address: facility?.location?.split(",")[0]?.trim() || "",
        city: facility?.location?.split(",")[1]?.trim() || "",
        zip_code: facility?.location?.split(",")[2]?.trim() || "",
        contact_number: facility?.contact || "",
        email: facility?.email || "",
        website: facility?.website || "",
        type: facility?.type || "hospital",
        plan: facility?.plan || "basic",
        subscription_status: facility?.status || "active",
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from("healthcare_facilities")
                .update({
                    facility_name: formData.facility_name,
                    address: formData.address,
                    city: formData.city,
                    zip_code: formData.zip_code,
                    contact_number: formData.contact_number,
                    email: formData.email,
                    website: formData.website,
                    type: formData.type,
                    plan: formData.plan,
                    subscription_status: formData.subscription_status,
                })
                .eq("facility_id", facility.id)

            if (error) throw error

            showToast("success", "Facility updated successfully!")
            if (onUpdate) {
                onUpdate({
                    ...facility,
                    name: formData.facility_name,
                    location: `${formData.address}, ${formData.city}, ${formData.zip_code}`,
                    contact: formData.contact_number,
                    email: formData.email,
                    website: formData.website,
                    type: formData.type,
                    plan: formData.plan,
                    status: formData.subscription_status,
                })
            }
            onClose()
        } catch (error) {
            console.error("Error updating facility:", error)
            showToast("error", "Failed to update facility")
        } finally {
            setIsLoading(false)
        }
    }

    if (!facility) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        Edit {facility.name}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="form-control">
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
                            </div>
                            <div className="form-control">
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
                            </div>
                            <div className="form-control">
                                <Label htmlFor="contact">Contact Number</Label>
                                <Input
                                    id="contact"
                                    value={formData.contact_number}
                                    onChange={e =>
                                        handleChange(
                                            "contact_number",
                                            e.target.value
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="form-control">
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

                        {/* Location and Status */}
                        <div className="space-y-4">
                            <div className="form-control">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e =>
                                        handleChange("address", e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={e =>
                                        handleChange("city", e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <Label htmlFor="zip_code">ZIP Code</Label>
                                <Input
                                    id="zip_code"
                                    value={formData.zip_code}
                                    onChange={e =>
                                        handleChange("zip_code", e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="form-control">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={value =>
                                            handleChange("type", value)
                                        }>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hospital">
                                                Hospital
                                            </SelectItem>
                                            <SelectItem value="clinic">
                                                Clinic
                                            </SelectItem>
                                            <SelectItem value="pharmacy">
                                                Pharmacy
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="form-control">
                                    <Label>Plan</Label>
                                    <Select
                                        value={formData.plan}
                                        onValueChange={value =>
                                            handleChange("plan", value)
                                        }>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">
                                                Basic
                                            </SelectItem>
                                            <SelectItem value="premium">
                                                Premium
                                            </SelectItem>
                                            <SelectItem value="enterprise">
                                                Enterprise
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="form-control">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.subscription_status}
                                        onValueChange={value =>
                                            handleChange(
                                                "subscription_status",
                                                value
                                            )
                                        }>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                Pending
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="hover:bg-destructive/10 hover:text-destructive">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary text-white hover:bg-primary/90">
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditFacility
