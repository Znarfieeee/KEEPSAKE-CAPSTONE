import React from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'

import {
    Mail,
    Phone,
    User,
    Calendar,
    Building2,
    Briefcase,
    Award,
    IdCard,
    Clock,
} from 'lucide-react'

// Helper to determine badge color based on status
const getStatusColor = (status) => {
    if (status) {
        return 'bg-green-500 text-green-100 border-green-200'
    }
    return 'bg-gray-400 text-gray-100 border-gray-200'
}

const InfoItem = ({ icon: Icon, label, value }) => (
    <li className="flex items-start gap-3 text-sm py-2">
        {Icon && (
            <div className="mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <span className="font-medium text-muted-foreground block text-xs uppercase tracking-wide">
                {label}
            </span>
            <span className="text-foreground block break-words">{value || '—'}</span>
        </div>
    </li>
)

const FacilityUserDetailModal = ({ open, user, onClose }) => {
    if (!open || !user) return null

    const fullName = `${user.firstname} ${user.lastname}`
    const formattedStartDate = user.start_date
        ? new Date(user.start_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '—'

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-2xl p-0 mx-auto border-0 shadow-xl rounded-xl overflow-hidden"
                showCloseButton={false}
            >
                {/* Header Section with gradient */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-semibold text-foreground">
                                        {fullName}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={`${getStatusColor(user.is_active)} gap-1.5 px-3 py-1`}
                            >
                                <span
                                    className={`size-2 rounded-full ${user.is_active ? 'bg-green-100 animate-pulse' : 'bg-gray-200'}`}
                                />
                                {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Facility Assignment */}
                    <div className="bg-muted/30 rounded-lg p-4">
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Facility Assignment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    Facility
                                </p>
                                <p className="text-sm font-medium">{user.facility_name || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    Role
                                </p>
                                <Badge variant="secondary" className="capitalize">
                                    {user.role || '—'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    Department
                                </p>
                                <p className="text-sm">{user.department || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    Start Date
                                </p>
                                <p className="text-sm">{formattedStartDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div>
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            Professional Information
                        </h3>
                        <ul className="space-y-1 divide-y">
                            <InfoItem
                                icon={Award}
                                label="Specialty"
                                value={user.specialty}
                            />
                            <InfoItem
                                icon={IdCard}
                                label="License Number"
                                value={user.license_number}
                            />
                        </ul>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            Contact Information
                        </h3>
                        <ul className="space-y-1 divide-y">
                            <InfoItem icon={Mail} label="Email Address" value={user.email} />
                            <InfoItem
                                icon={Phone}
                                label="Phone Number"
                                value={user.phone_number}
                            />
                        </ul>
                    </div>

                    {/* Account Information */}
                    {user.created_at && (
                        <div>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Account Information
                            </h3>
                            <ul className="space-y-1 divide-y">
                                <InfoItem
                                    icon={Calendar}
                                    label="Created"
                                    value={
                                        user.created_at
                                            ? new Date(user.created_at).toLocaleDateString(
                                                  'en-US',
                                                  {
                                                      month: 'long',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                  }
                                              )
                                            : '—'
                                    }
                                />
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 pt-0">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default FacilityUserDetailModal
