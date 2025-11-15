import React from 'react'
import { Calendar, Clock, User, MapPin, Stethoscope } from 'lucide-react'
import { cn, formatTime, getStatusBadgeColor } from '@/util/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'

/**
 * ParentAppointmentCard Component
 * Displays a single appointment card for parent view
 * Shows child name prominently, doctor info, facility details, and status
 */
const ParentAppointmentCard = ({ appointment, childName, childColor = 'bg-blue-500' }) => {
    const getAppointmentTypeBadge = (type) => {
        const lowerType = type?.toLowerCase() || 'consultation'
        switch (lowerType) {
            case 'emergency':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'followup':
            case 'follow-up':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'checkup':
            case 'check-up':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'vaccination':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200'
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Date not specified'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getDoctorName = () => {
        if (appointment.users?.firstname && appointment.users?.lastname) {
            return `Dr. ${appointment.users.firstname} ${appointment.users.lastname}`
        }
        return appointment.doctor_name || 'Any Available Doctor'
    }

    const getFacilityInfo = () => {
        if (appointment.healthcare_facilities) {
            return {
                name: appointment.healthcare_facilities.facility_name || 'Unknown Facility',
                address: appointment.healthcare_facilities.address || '',
                contact: appointment.healthcare_facilities.contact_number || ''
            }
        }
        return { name: 'Unknown Facility', address: '', contact: '' }
    }

    const facility = getFacilityInfo()

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Child Color Indicator */}
                    <div className={cn('w-1 h-full min-h-[80px] rounded-full', childColor)} />

                    <div className="flex-1 space-y-3">
                        {/* Header: Child Name & Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full', childColor)} />
                                <h4 className="font-semibold text-gray-900">{childName}</h4>
                            </div>
                            <Badge className={cn('text-xs font-medium', getStatusBadgeColor(appointment.status))}>
                                {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Scheduled'}
                            </Badge>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                    {formatDate(appointment.appointment_date)}
                                </span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                    {formatTime(appointment.appointment_time) || 'Time TBD'}
                                </span>
                            </div>
                        </div>

                        {/* Appointment Type & Reason */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {appointment.appointment_type && (
                                <Badge
                                    variant="outline"
                                    className={cn('text-xs capitalize', getAppointmentTypeBadge(appointment.appointment_type))}
                                >
                                    {appointment.appointment_type}
                                </Badge>
                            )}
                            {appointment.reason && (
                                <span className="text-sm text-gray-600">
                                    {appointment.reason}
                                </span>
                            )}
                        </div>

                        {/* Doctor & Facility Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                <span>{getDoctorName()}</span>
                                {appointment.users?.specialty && (
                                    <span className="text-gray-400">({appointment.users.specialty})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{facility.name}</span>
                            </div>
                        </div>

                        {/* Notes */}
                        {appointment.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-600">
                                    <span className="font-medium">Notes:</span> {appointment.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ParentAppointmentCard
