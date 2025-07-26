import React from "react"
import { Button } from "../ui/Button"
import StatusBadge from "./StatusBadge"

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
                            {user.name}
                        </h2>
                        <StatusBadge status={user.status} />
                    </div>
                    <button
                        className="text-xl text-black cursor-pointer hover:text-red-500"
                        onClick={onClose}>
                        {" "}
                        X
                    </button>
                </div>

                {/* Basic info */}
                <div>
                    <h3 className="font-medium mb-2">Basic Info</h3>
                    <ul className="text-sm space-y-1">
                        <li>Type: {user.type}</li>
                        <li>Location: {user.location}</li>
                        <li>Contact: {user.contact}</li>
                        <li>Email: {user.email}</li>
                        <li>Website: {user.website}</li>
                    </ul>
                </div>

                {/* Subscription */}
                <div>
                    <h3 className="font-medium mb-2">Subscription</h3>
                    <ul className="text-sm space-y-1">
                        <li>Plan: {user.plan}</li>
                        <li>Expiry: {user.expiry}</li>
                    </ul>
                </div>

                {/* Admin */}
                <div>
                    <h3 className="font-medium mb-2">Assigned Admin</h3>
                    <p className="text-sm">{user.admin}</p>
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
