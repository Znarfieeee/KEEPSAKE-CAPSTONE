import React from "react"

// UI Components
import { Button } from "../ui/Button"
import StatusBadge from "./StatusBadge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/Dialog"

const FacilityDetailModal = ({ open, facility, onClose }) => {
    if (!facility) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg border-0 shadow-sm p-6">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div>
                            <DialogTitle className="text-xl font-semibold mb-1">
                                {facility.name}
                            </DialogTitle>
                            <StatusBadge status={facility.status} />
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Basic info */}
                    <div>
                        <h3 className="font-medium mb-2">Basic Info</h3>
                        <ul className="text-sm space-y-1">
                            <li>Type: {facility.type}</li>
                            <li>Location: {facility.location}</li>
                            <li>Contact: {facility.contact}</li>
                            <li>Email: {facility.email}</li>
                            <li>Website: {facility.website}</li>
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
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default FacilityDetailModal
