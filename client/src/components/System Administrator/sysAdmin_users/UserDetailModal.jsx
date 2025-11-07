import React from 'react'
import { Button } from '@/components/ui/Button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'

import { Mail, Phone, Globe, MapPin, User, BadgeInfo, Calendar, Hospital } from 'lucide-react'

// Helper to determine dot color based on status
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'bg-green-500'
        case 'inactive':
            return 'bg-gray-400'
        case 'pending':
            return 'bg-yellow-500'
        case 'suspended':
            return 'bg-red-500'
        default:
            return 'bg-muted'
    }
}

const InfoItem = ({ icon: Icon, label, value }) => (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <span className="font-medium text-foreground">{label}:</span>
        <span className="ml-auto">{value || '—'}</span>
    </li>
)

const UserDetailModal = ({ open, user, onClose }) => {
    if (!open || !user) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-xl p-4 mx-auto border-0 shadow-xl rounded-xl"
                showCloseButton={false}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {/* Status Dot */}
                        <span className="relative flex h-3 w-3">
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(
                                    user.status
                                )}`}
                            ></span>
                            <span
                                className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor(
                                    user.status
                                )}`}
                            ></span>
                        </span>
                        <DialogTitle className="text-2xl font-semibold">
                            {`${user.firstname} ${user.lastname}`}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Basic Info */}
                    <div>
                        <h3 className="font-semibold text-base mb-2">Basic Info</h3>
                        <ul className="space-y-1">
                            <InfoItem icon={Mail} label="Email" value={user.email} />
                            <InfoItem label="Role" value={user.role} />
                            <InfoItem label="Specialty" value={user.specialty} />
                            <InfoItem label="License Number" value={user.license_number} />
                            <InfoItem label="Contact" value={user.contact} />
                        </ul>
                    </div>

                    {/* Facility Information */}
                    <div>
                        <h3 className="font-semibold text-base mb-2">Facility Assignment</h3>
                        <ul className="space-y-1">
                            <InfoItem label="Assigned Facility" value={user.assigned_facility} />
                            <InfoItem label="Facility Role" value={user.facility_role} />
                        </ul>
                    </div>

                    {/* Registration Info */}
                    <div>
                        <h3 className="font-semibold text-base mb-2">Registration Info</h3>
                        <ul className="space-y-1">
                            <InfoItem label="Created" value={user.created_at} />
                            <InfoItem label="Last Updated" value={user.updated_at} />
                        </ul>
                    </div>
                </div>

                <DialogFooter className="mt-10 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default UserDetailModal
