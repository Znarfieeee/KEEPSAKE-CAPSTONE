import React from "react"
import { Button } from "../ui/Button"
import StatusBadge from "./StatusBadge"

const FacilityDetailModal = ({ open, facility, onClose, onAuditLogs }) => {
    if (!open || !facility) return null

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
                            {facility.name}
                        </h2>
                        <StatusBadge status={facility.status} />
                    </div>
                    <Button variant="outline" size="icon" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                {/* Basic info */}
                <div>
                    <h3 className="font-medium mb-2">Basic Info</h3>
                    <ul className="text-sm space-y-1">
                        <li>ID: {facility.id}</li>
                        <li>Type: {facility.type}</li>
                        <li>Location: {facility.location}</li>
                        <li>Contact: {facility.contact}</li>
                    </ul>
                </div>

                {/* Subscription */}
                <div>
                    <h3 className="font-medium mb-2">Subscription</h3>
                    <ul className="text-sm space-y-1">
                        <li>Plan: {facility.plan}</li>
                        <li>Expiry: {facility.expiry}</li>
                    </ul>
                </div>

                {/* Admin */}
                <div>
                    <h3 className="font-medium mb-2">Assigned Admin</h3>
                    <p className="text-sm">{facility.admin}</p>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAuditLogs(facility)}>
                        View Logs
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default FacilityDetailModal
