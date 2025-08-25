import React from "react"
import { Button } from "../ui/Button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/Dialog"
import {
    Mail,
    Phone,
    Globe,
    MapPin,
    User,
    BadgeInfo,
    Calendar,
    Hospital,
} from "lucide-react"

// Helper to return a Tailwind color class based on status
const getStatusColor = status => {
    switch (status?.toLowerCase()) {
        case "active":
            return "bg-green-500"
        case "inactive":
            return "bg-gray-400"
        case "pending":
            return "bg-yellow-500"
        case "suspended":
            return "bg-red-500"
        default:
            return "bg-muted"
    }
}

const InfoItem = ({ icon: Icon, label, value }) => (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <span className="font-medium text-foreground">{label}:</span>
        <span className="ml-auto">{value || "—"}</span>
    </li>
)

const FacilityDetailModal = ({ open, facility, onClose }) => {
    if (!facility) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg  border-0 shadow-xl p-6 rounded-xl">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 mb-1">
                            {/* Status Dot Indicator */}
                            <span className="relative flex h-3 w-3">
                                <span
                                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(
                                        facility.status
                                    )}`}></span>
                                <span
                                    className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor(
                                        facility.status
                                    )}`}></span>
                            </span>
                            <DialogTitle className="text-2xl font-semibold">
                                {facility.name}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Basic Info */}
                    <div>
                        <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                            <BadgeInfo className="w-4 h-4 text-primary" />
                            Basic Information
                        </h3>
                        <ul className="space-y-1">
                            <InfoItem
                                icon={Hospital}
                                label="Type"
                                value={facility.type}
                            />
                            <InfoItem
                                icon={MapPin}
                                label="Location"
                                value={facility.location}
                            />
                            <InfoItem
                                icon={Phone}
                                label="Contact"
                                value={facility.contact}
                            />
                            <InfoItem
                                icon={Mail}
                                label="Email"
                                value={facility.email}
                            />
                            <InfoItem
                                icon={Globe}
                                label="Website"
                                value={facility.website}
                            />
                        </ul>
                    </div>

                    {/* Subscription */}
                    <div>
                        <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Subscription Details
                        </h3>
                        <ul className="space-y-1">
                            <InfoItem label="Plan" value={facility.plan} />
                            <InfoItem label="Expiry" value={facility.expiry} />
                        </ul>
                    </div>

                    {/* Assigned Admin */}
                    <div>
                        <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            Assigned Admin
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {facility.admin || "—"}
                        </p>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex justify-end">
                    <Button
                        className="hover:text-red-500 hover:bg-red-200 text-xs py-1 px-3"
                        variant="outline"
                        onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default FacilityDetailModal
