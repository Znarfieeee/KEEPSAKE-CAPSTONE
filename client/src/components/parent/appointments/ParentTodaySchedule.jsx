import React from 'react'
import { Calendar, Clock, AlertCircle, User, MapPin, Stethoscope } from 'lucide-react'
import { cn, formatTime, getStatusBadgeColor } from '@/util/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * ParentTodaySchedule Component
 * Displays today's appointments for all children grouped by child
 */
const ParentTodaySchedule = ({
    appointments = [],
    children = [],
    childColors = {},
    loading = false
}) => {
    const today = new Date()
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    // Sort today's appointments by time
    const sortedAppointments = [...appointments].sort((a, b) => {
        const timeA = a.appointment_time || '00:00'
        const timeB = b.appointment_time || '00:00'
        return timeA.localeCompare(timeB)
    })

    // Group appointments by child
    const appointmentsByChild = sortedAppointments.reduce((acc, appointment) => {
        const childId = appointment.patient_id
        if (!acc[childId]) {
            acc[childId] = []
        }
        acc[childId].push(appointment)
        return acc
    }, {})

    const getChildName = (childId) => {
        const child = children.find(c => (c.patient_id || c.id) === childId)
        if (child) {
            return child.firstname && child.lastname
                ? `${child.firstname} ${child.lastname}`
                : child.full_name || 'Unknown Child'
        }
        return 'Unknown Child'
    }

    const getTimeIndicator = (appointmentTime) => {
        if (!appointmentTime) return null

        const [hours, minutes] = appointmentTime.split(':').map(Number)
        const appointmentDate = new Date()
        appointmentDate.setHours(hours, minutes, 0, 0)
        const now = new Date()

        const diffMinutes = Math.floor((appointmentDate - now) / (1000 * 60))

        if (diffMinutes < -30) {
            return <AlertCircle className="h-3 w-3 text-red-500" title="Overdue" />
        } else if (diffMinutes < 0) {
            return <Clock className="h-3 w-3 text-orange-500" title="In progress" />
        } else if (diffMinutes < 15) {
            return <AlertCircle className="h-3 w-3 text-amber-500" title="Starting soon" />
        }
        return <Clock className="h-3 w-3 text-gray-400" title="Upcoming" />
    }

    const upcomingAppointments = sortedAppointments.filter((apt) => {
        const appointmentTime = apt.appointment_time
        if (!appointmentTime) return true

        const [hours, minutes] = appointmentTime.split(':').map(Number)
        const appointmentDate = new Date()
        appointmentDate.setHours(hours, minutes, 0, 0)

        return appointmentDate >= new Date()
    })

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[490px]">
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            Today's Schedule
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 font-medium">{formattedDate}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">
                                {sortedAppointments.length}
                            </p>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                Total
                            </p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-accent">
                                {upcomingAppointments.length}
                            </p>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                Remaining
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : sortedAppointments.length > 0 ? (
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                            {Object.entries(appointmentsByChild).map(([childId, childAppointments]) => {
                                const childName = getChildName(childId)
                                const childColor = childColors[childId] || 'bg-blue-500'

                                return (
                                    <div key={childId} className="space-y-2">
                                        {/* Child Header */}
                                        <div className="flex items-center gap-2 sticky top-0 bg-white py-1">
                                            <div className={cn('w-3 h-3 rounded-full', childColor)} />
                                            <h4 className="font-semibold text-gray-900">{childName}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {childAppointments.length} appointment{childAppointments.length > 1 ? 's' : ''}
                                            </Badge>
                                        </div>

                                        {/* Child's Appointments */}
                                        <div className="space-y-2 pl-5">
                                            {childAppointments.map((appointment) => (
                                                <div
                                                    key={appointment.appointment_id || appointment.id}
                                                    className={cn(
                                                        'p-3 border-l-4 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors',
                                                        childColor.replace('bg-', 'border-')
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        {/* Time & Details */}
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-bold text-gray-900">
                                                                    {formatTime(appointment.appointment_time) || 'Time TBD'}
                                                                </span>
                                                                {getTimeIndicator(appointment.appointment_time)}
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                                                <span>
                                                                    {appointment.users?.firstname && appointment.users?.lastname
                                                                        ? `Dr. ${appointment.users.firstname} ${appointment.users.lastname}`
                                                                        : appointment.doctor_name || 'Any Available Doctor'}
                                                                </span>
                                                            </div>

                                                            {appointment.healthcare_facilities && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                                    <span className="truncate">
                                                                        {appointment.healthcare_facilities.facility_name || 'Unknown Facility'}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {appointment.reason && (
                                                                <p className="text-sm text-gray-600 truncate">
                                                                    {appointment.reason}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Status Badge */}
                                                        <Badge
                                                            className={cn(
                                                                'text-xs font-medium whitespace-nowrap',
                                                                getStatusBadgeColor(appointment.status)
                                                            )}
                                                        >
                                                            {appointment.status?.charAt(0).toUpperCase() +
                                                                appointment.status?.slice(1) || 'Scheduled'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-12 w-12 text-primary" />
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                            No appointments scheduled
                        </h4>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Your children have no appointments scheduled for today.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {sortedAppointments.length > 0 && (
                <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
                    <div className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                                <span className="text-gray-600 font-medium">Next: </span>
                                <span className="text-gray-900 font-semibold">
                                    {upcomingAppointments.length > 0
                                        ? `${formatTime(upcomingAppointments[0].appointment_time)} - ${getChildName(upcomingAppointments[0].patient_id)}`
                                        : 'No more appointments'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">
                                    {Object.keys(appointmentsByChild).length}
                                </span>{' '}
                                child{Object.keys(appointmentsByChild).length > 1 ? 'ren' : ''} with appointments
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ParentTodaySchedule
