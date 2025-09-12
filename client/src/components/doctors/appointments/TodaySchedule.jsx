import React, { Suspense, lazy } from 'react'

// UI Component
import { Calendar, Clock, User, PlusCircle } from 'lucide-react'
import { cn, formatTime, getStatusBadgeColor } from '@/util/utils'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const ScheduleAppointmentModal = lazy(() =>
    import('@/components/doctors/appointments/ScheduleAppointmentModal')
)

const AppointmentCard = ({ appointment, onAction }) => {
    const handleCheckIn = () => {
        onAction?.('checkin', appointment)
    }

    const handleCancel = () => {
        onAction?.('cancel', appointment)
    }

    return (
        <div className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0">
            <div className="flex items-center justify-between">
                {/* Patient Info */}
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {appointment.patient?.full_name ||
                                appointment.patient?.first_name +
                                    ' ' +
                                    appointment.patient?.last_name ||
                                'Unknown Patient'}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(appointment.appointment_time)}
                            </span>
                            <span>•</span>
                            <span>{appointment.reason || 'General Consultation'}</span>
                            {appointment.patient?.age && (
                                <>
                                    <span>•</span>
                                    <span>{appointment.patient.age} years old</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center space-x-2">
                    <span
                        className={cn(
                            'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                            getStatusBadgeColor(appointment.status)
                        )}
                    >
                        {appointment.status || 'Scheduled'}
                    </span>

                    {appointment.status?.toLowerCase() === 'scheduled' && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={handleCancel}
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCheckIn}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Check In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const TodaySchedule = ({ appointments, loading = false, onAppointmentAction, onRefresh }) => {
    const today = new Date()
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    // Sort today's appointments by time
    const sortedAppointments = appointments.sort((a, b) => {
        const timeA = a.appointment_time || '00:00'
        const timeB = b.appointment_time || '00:00'
        return timeA.localeCompare(timeB)
    })

    const upcomingAppointments = sortedAppointments.filter((apt) => {
        const appointmentTime = apt.appointment_time
        if (!appointmentTime) return true

        const [hours, minutes] = appointmentTime.split(':').map(Number)
        const appointmentDate = new Date()
        appointmentDate.setHours(hours, minutes, 0, 0)

        return appointmentDate >= new Date()
    })

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Today's Schedule
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                                {sortedAppointments.length}
                            </p>
                            <p className="text-xs text-gray-500">appointments</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                ) : sortedAppointments.length > 0 ? (
                    <div>
                        {(upcomingAppointments.length > 0
                            ? upcomingAppointments
                            : sortedAppointments
                        )
                            .slice(0, 5)
                            .map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    onAction={onAppointmentAction}
                                />
                            ))}

                        {sortedAppointments.length > 5 && (
                            <div className="p-4 text-center border-b border-gray-200">
                                <p className="text-sm text-gray-500">
                                    +{sortedAppointments.length - 5} more appointments
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                        <h4 className="text-lg font-medium text-gray-900 mb-1">
                            No appointments today
                        </h4>
                        <p className="text-gray-500 mb-4">Your schedule is clear for today</p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Appointment
                                </Button>
                            </DialogTrigger>
                            <Suspense fallback={null}>
                                <ScheduleAppointmentModal
                                    onSuccess={() => {
                                        onRefresh?.()
                                    }}
                                />
                            </Suspense>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Quick Stats Footer */}
            {sortedAppointments.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                            Next:{' '}
                            {upcomingAppointments.length > 0
                                ? formatTime(upcomingAppointments[0].appointment_time)
                                : 'No more appointments'}
                        </span>
                        <span>{upcomingAppointments.length} remaining</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TodaySchedule
