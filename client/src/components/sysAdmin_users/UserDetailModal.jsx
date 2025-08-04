import React from "react"
import { Button } from "../ui/Button"
import StatusBadge from "./UserStatusBadge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/Dialog"

const UserDetailModal = ({ open, user, onClose }) => {
    if (!open || !user) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-6 py-10 mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {`${user.firstname} ${user.lastname}`}
                    </DialogTitle>
                </DialogHeader>

                {/* Basic info */}
                <div className="mt-4">
                    <h3 className="font-medium mb-2">Basic Info</h3>
                    <ul className="text-sm space-y-1">
                        <li>Email: {user.email}</li>
                        <li>Role: {user.role}</li>
                        <li>Specialty: {user.specialty}</li>
                        <li>License Number: {user.license_number}</li>
                        <li>Contact: {user.contact}</li>
                    </ul>
                </div>

                {/* Facility Information */}
                <div className="mt-4">
                    <h3 className="font-medium mb-2">Facility Assignment</h3>
                    <ul className="text-sm space-y-1">
                        <li>Assigned Facility: {user.assigned_facility}</li>
                        <li>Facility Role: {user.facility_role}</li>
                    </ul>
                </div>

                {/* Registration Info */}
                <div className="mt-4">
                    <h3 className="font-medium mb-2">Registration Info</h3>
                    <ul className="text-sm space-y-1">
                        <li>Created: {user.created_at}</li>
                        <li>Last Updated: {user.updated_at}</li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default UserDetailModal
