import React from 'react'
import { format } from 'date-fns'

// UI Components
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, FileText, Phone, MapPin, UserCheck } from 'lucide-react'

// Utilities
import { cn, formatTime, getStatusBadgeColor } from '@/util/utils'

const ViewAppointmentModal = ({ appointment, onClose }) => {
    if (!appointment) return null

    const patientName =
        appointment.patient_name ||
        appointment.patients?.firstname + ' ' + appointment.patients?.lastname ||
        appointment.patient?.full_name ||
        'Unknown Patient'

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return null
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    return (
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
                <h2 className="text-2xl font-semibold text-gray-900">Appointment Details</h2>
                <DialogDescription>
                    View complete appointment information and patient details
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Appointment Status</h3>
                    <Badge
                        variant={
                            appointment.status?.toLowerCase() === 'completed'
                                ? 'default'
                                : appointment.status?.toLowerCase() === 'confirmed'
                                ? 'secondary'
                                : appointment.status?.toLowerCase() === 'cancelled'
                                ? 'destructive'
                                : 'outline'
                        }
                        className={cn(
                            'text-sm font-medium',
                            getStatusBadgeColor(appointment.status)
                        )}
                    >
                        {appointment.status?.charAt(0).toUpperCase() +
                            appointment.status?.slice(1) || 'Scheduled'}
                    </Badge>
                </div>

                <Separator />

                {/* Patient Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        Patient Information
                    </h3>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Full Name
                                </label>
                                <p className="text-sm text-gray-900 font-semibold">{patientName}</p>
                            </div>

                            {appointment.patients?.date_of_birth && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Age</label>
                                    <p className="text-sm text-gray-900">
                                        {calculateAge(appointment.patients.date_of_birth)} years old
                                    </p>
                                </div>
                            )}

                            {appointment.patients?.sex && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Gender
                                    </label>
                                    <p className="text-sm text-gray-900 capitalize">
                                        {appointment.patients.sex}
                                    </p>
                                </div>
                            )}

                            {appointment.patients?.date_of_birth && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Date of Birth
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {format(
                                            new Date(appointment.patients.date_of_birth),
                                            'MMMM d, yyyy'
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Appointment Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-green-600" />
                        Appointment Details
                    </h3>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Date</label>
                                <p className="text-sm text-gray-900 font-semibold">
                                    {format(
                                        new Date(appointment.appointment_date),
                                        'EEEE, MMMM d, yyyy'
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Time</label>
                                <p className="text-sm text-gray-900 font-semibold">
                                    {formatTime(appointment.appointment_time)}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Appointment Type
                                </label>
                                <p className="text-sm text-gray-900 capitalize">
                                    {appointment.appointment_type || 'Consultation'}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Reason for Visit
                                </label>
                                <p className="text-sm text-gray-900">
                                    {appointment.reason || 'General Consultation'}
                                </p>
                            </div>

                            {appointment.doctor_name && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500">
                                        Assigned Doctor
                                    </label>
                                    <p className="text-sm text-gray-900 flex items-center">
                                        <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                                        Dr. {appointment.doctor_name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {appointment.notes && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                                Additional Notes
                            </h3>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-900 leading-relaxed">
                                    {appointment.notes}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Facility Information */}
                {appointment.facility && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                                Facility Information
                            </h3>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-900">
                                    {appointment.facility.facility_name}
                                </p>
                                {appointment.facility.address && (
                                    <p className="text-sm text-gray-600">
                                        {appointment.facility.address}
                                    </p>
                                )}
                                {appointment.facility.contact_number && (
                                    <p className="text-sm text-gray-600 flex items-center">
                                        <Phone className="h-4 w-4 mr-1" />
                                        {appointment.facility.contact_number}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <DialogFooter className="flex justify-end">
                <DialogClose asChild>
                    <Button variant="outline" onClick={onClose} className="border-gray-200">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}

export default ViewAppointmentModal
