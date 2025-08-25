import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SendButton from "../../ui/SendButton"

const InviteUserModal = ({ facilities, onCreateInvitation, isLoading }) => {
    const [formSuccess, setFormSuccess] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        role: "",
        facility_id: "",
    })

    const handleSubmit = async e => {
        e.preventDefault()
        setFormSuccess(false)
        try {
            await onCreateInvitation(formData)
            setFormSuccess(true)
            setFormData({
                email: "",
                role: "",
                facility_id: "",
            })
            setTimeout(() => {
                setFormSuccess(false)
                setIsOpen(false)
            }, 1000)
        } catch (error) {
            console.error("Error creating invitation:", error)
        }
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Register New User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Register New User</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={e =>
                                handleChange("email", e.target.value)
                            }
                            required
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={value => handleChange("role", value)}
                            required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="facility_admin">
                                    Facility Admin
                                </SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Facility (only if role != parent) */}
                    {formData.role && formData.role !== "parent" && (
                        <div className="space-y-2">
                            <Label htmlFor="facility">Facility</Label>
                            <Select
                                value={formData.facility_id}
                                onValueChange={value =>
                                    handleChange("facility_id", value)
                                }
                                required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select facility" />
                                </SelectTrigger>
                                <SelectContent>
                                    {facilities?.map(facility => (
                                        <SelectItem
                                            key={facility.facility_id}
                                            value={facility.facility_id}>
                                            {facility.facility_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter className="flex justify-end">
                        <SendButton
                            isLoading={isLoading}
                            isSuccess={formSuccess}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default InviteUserModal
