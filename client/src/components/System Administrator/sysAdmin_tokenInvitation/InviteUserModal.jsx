import React from "react"
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

const InviteUserModal = ({ facilities, onCreateInvitation, isLoading }) => {
    const [formData, setFormData] = React.useState({
        email: "",
        role: "",
        facility_id: "",
        expires_at: "",
    })
    const [isOpen, setIsOpen] = React.useState(false)

    const handleSubmit = async e => {
        e.preventDefault()
        try {
            await onCreateInvitation(formData)
            setFormData({
                email: "",
                role: "",
                facility_id: "",
                expires_at: "",
            })
            setIsOpen(false)
        } catch (error) {
            console.error("Error creating invitation:", error)
        }
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const minDateTime = () => {
        const date = new Date()
        date.setHours(date.getHours() + 1)
        return date.toISOString().slice(0, 16)
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

                    {/* Expiration Date */}
                    <div className="space-y-2">
                        <Label htmlFor="expires_at">Expires At</Label>
                        <Input
                            id="expires_at"
                            type="datetime-local"
                            min={minDateTime()}
                            value={formData.expires_at}
                            onChange={e =>
                                handleChange("expires_at", e.target.value)
                            }
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Invitation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default InviteUserModal
