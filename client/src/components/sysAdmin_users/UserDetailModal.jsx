import React from "react"
import { Button } from "../ui/Button"
import StatusBadge from "./UserStatusBadge"

const UserDetailModal = ({ open, user, onClose, onAuditLogs }) => {
    if (!open || !user) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white dark:bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 space-y-6 z-10">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h2 className="text-xl font-semibold mb-1 line-clamp-2">
                            {`${user.firstname} ${user.lastname}`}
                        </h2>
                        <StatusBadge status={user.status} />
                    </div>
                    <button
                        className="text-xl text-black cursor-pointer hover:text-red-500"
                        onClick={onClose}>
                        ×
                    </button>
                </div>

                {/* Basic info */}
                <div>
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
                <div>
                    <h3 className="font-medium mb-2">Facility Assignment</h3>
                    <ul className="text-sm space-y-1">
                        <li>Assigned Facility: {user.assigned_facility}</li>
                        <li>Facility Role: {user.facility_role}</li>
                    </ul>
                </div>

                {/* Registration Info */}
                <div>
                    <h3 className="font-medium mb-2">Registration Info</h3>
                    <ul className="text-sm space-y-1">
                        <li>Created: {user.created_at}</li>
                        <li>Last Updated: {user.updated_at}</li>
                    </ul>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAuditLogs(user)}>
                        View Logs
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UserDetailModal
