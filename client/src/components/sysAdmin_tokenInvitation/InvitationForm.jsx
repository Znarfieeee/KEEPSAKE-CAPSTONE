import React from "react"
import { Button } from "../ui/Button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/Dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

const InvitationForm = ({ facilities, onCreateInvitation, isLoading }) => {
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

    // Calculate minimum date-time for expiry (current time + 1 hour)
    const minDateTime = () => {
        const date = new Date()
        date.setHours(date.getHours() + 1)
        return date.toISOString().slice(0, 16)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                    Create New Invitation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Invitation</DialogTitle>
                    {/* <DialogDescription>
                        Create a new invitation token for a user. The token will
                        be valid until the specified expiry date.
                    </DialogDescription> */}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
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
                    {formData.role && formData.role !== "parent" && (
                        <div className="space-y-2">
                            <Label htmlFor="facility">Facility</Label>
                            <Select
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

export default InvitationForm
