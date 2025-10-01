import React, { Suspense, lazy, useState } from 'react'
import { format } from 'date-fns'

// UI Component
import {
    Calendar,
    Clock,
    User,
    PlusCircle,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    UserCheck,
} from 'lucide-react'
import { cn, formatTime, getStatusBadgeColor } from '@/util/utils'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { showToast } from '@/util/alertHelper'
import { updateAppointmentStatus, cancelAppointment } from '@/api/doctors/appointment'

const ScheduleAppointmentModal = lazy(() =>
    import('@/components/doctors/appointments/ScheduleAppointmentModal')
)

const AppointmentCard = ({ appointment, onAction }) => {
    const [loadingAction, setLoadingAction] = useState(null)

    const handleAction = async (actionType) => {
        setLoadingAction(actionType)
        try {
            let response
            const appointmentId = appointment.appointment_id || appointment.id

            // Debug logging
            console.log('Appointment data:', appointment)
            console.log('Appointment ID being used:', appointmentId)
            console.log('Action type:', actionType)

            if (!appointmentId) {
                throw new Error('Appointment ID is missing')
            }

            switch (actionType) {
                case 'confirm':
                    response = await updateAppointmentStatus(appointmentId, 'confirmed')
                    showToast('success', 'Appointment confirmed successfully')
                    break
                case 'checkin':
                    response = await updateAppointmentStatus(
                        appointmentId,
                        'checked_in',
                        'Patient checked in'
                    )
                    showToast('success', 'Patient checked in successfully')
                    break
                case 'complete':
                    response = await updateAppointmentStatus(
                        appointmentId,
                        'completed',
                        'Appointment completed'
                    )
                    showToast('success', 'Appointment completed successfully')
                    break
                case 'cancel':
                    response = await cancelAppointment(appointmentId)
                    showToast('success', 'Appointment cancelled successfully')
                    break
                default:
                    console.warn('Unknown appointment action:', actionType)
                    return
            }

            // Dispatch custom event for immediate real-time update
            if (response?.data) {
                window.dispatchEvent(
                    new CustomEvent('appointment-updated', {
                        detail: response.data,
                    })
                )
            }

            // Notify parent component about the change
            await onAction?.(actionType, appointment, response)
        } catch (error) {
            console.error(`Error ${actionType}ing appointment:`, error)
            console.error('Error response:', error.response)
            console.error('Error config:', error.config)

            let errorMessage = `Failed to ${actionType} appointment`

            if (error.response) {
                // Server responded with error
                errorMessage = error.response?.data?.message ||
                              error.response?.data?.details ||
                              `Server error (${error.response.status}): ${error.response.statusText}`
                console.error('Server response data:', error.response.data)
            } else if (error.request) {
                // Request was made but no response
                errorMessage = 'No response from server. Please check your connection.'
            } else {
                // Error in request setup
                errorMessage = error.message || errorMessage
            }

            showToast('error', errorMessage)
            throw error
        } finally {
            setLoadingAction(null)
        }
    }

    const handleCheckIn = () => handleAction('checkin')
    const handleCancel = () => handleAction('cancel')
    const handleComplete = () => handleAction('complete')
    const handleConfirm = () => handleAction('confirm')

    const getTimeIndicator = () => {
        if (!appointment.appointment_time) return null

        const [hours, minutes] = appointment.appointment_time.split(':').map(Number)
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

    return (
        <div className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 last:border-b-0 group">
            <div className="flex items-start justify-between">
                {/* Patient Info */}
                <div className="flex items-start space-x-3 flex-1">
                    <div className="relative">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="absolute -top-1 -right-1">{getTimeIndicator()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                                {appointment.patient_name ||
                                    appointment.patients?.firstname +
                                        ' ' +
                                        appointment.patients?.lastname ||
                                    appointment.patient?.full_name ||
                                    'Unknown Patient'}
                            </h4>
                            <span className="text-lg font-bold text-primary">
                                {formatTime(appointment.appointment_time)}
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center text-sm text-gray-600">
                                <FileText className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                <span className="truncate">
                                    {appointment.reason || 'General Consultation'}
                                </span>
                            </div>

                            {appointment.patients?.date_of_birth && (
                                <div className="flex items-center text-xs text-gray-500">
                                    <User className="h-3 w-3 mr-2 text-gray-400" />
                                    <span>
                                        Born:{' '}
                                        {format(
                                            new Date(appointment.patients.date_of_birth),
                                            'MMM d, yyyy'
                                        )}
                                    </span>
                                    {appointment.patients?.sex && (
                                        <span className="ml-3 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                                            {appointment.patients.sex.charAt(0).toUpperCase() +
                                                appointment.patients.sex.slice(1)}
                                        </span>
                                    )}
                                </div>
                            )}

                            {appointment.doctor_name && (
                                <div className="flex items-center text-xs text-primary font-medium">
                                    <UserCheck className="h-3 w-3 mr-2" />
                                    <span>Dr. {appointment.doctor_name}</span>
                                </div>
                            )}

                            {appointment.notes && (
                                <div className="flex items-start text-xs text-gray-500 bg-gray-50 rounded-md p-2 mt-2">
                                    <FileText className="h-3 w-3 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="leading-relaxed">{appointment.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end space-y-2">
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
                            'text-xs font-medium',
                            getStatusBadgeColor(appointment.status)
                        )}
                    >
                        {appointment.status?.charAt(0).toUpperCase() +
                            appointment.status?.slice(1) || 'Scheduled'}
                    </Badge>

                    <div className="flex items-center space-x-1">
                        {(appointment.status?.toLowerCase() === 'scheduled' || !appointment.status) && (
                            <>
                                <Button
                                    onClick={handleConfirm}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                    disabled={loadingAction !== null}
                                >
                                    {loadingAction === 'confirm' ? (
                                        <div className="flex items-center">
                                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                            Confirming...
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Confirm Appointment
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={loadingAction !== null}
                                >
                                    {loadingAction === 'cancel' ? (
                                        <div className="flex items-center">
                                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                            Cancelling...
                                        </div>
                                    ) : (
                                        <>
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Cancel
                                        </>
                                    )}
                                </Button>
                            </>
                        )}

                        {appointment.status?.toLowerCase() === 'confirmed' && (
                            <>
                                <Button
                                    onClick={handleCheckIn}
                                    size="sm"
                                    className="h-7 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700"
                                    disabled={loadingAction !== null}
                                >
                                    {loadingAction === 'checkin' ? (
                                        <div className="flex items-center">
                                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Checking In...
                                        </div>
                                    ) : (
                                        <>
                                            <UserCheck className="h-3 w-3 mr-1" />
                                            Mark as Arrived
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={loadingAction !== null}
                                >
                                    {loadingAction === 'cancel' ? (
                                        <div className="flex items-center">
                                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                            Cancelling...
                                        </div>
                                    ) : (
                                        <>
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Cancel
                                        </>
                                    )}
                                </Button>
                            </>
                        )}

                        {(appointment.status?.toLowerCase() === 'checked_in' ||
                            appointment.status?.toLowerCase() === 'in_progress') && (
                            <Button
                                onClick={handleComplete}
                                size="sm"
                                className="h-7 px-2 text-xs bg-green-600 text-white hover:bg-green-700"
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === 'complete' ? (
                                    <div className="flex items-center">
                                        <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Completing...
                                    </div>
                                ) : (
                                    <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Mark as Complete
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
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
    const sortedAppointments = (appointments || []).sort((a, b) => {
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
            <div className="px-6 py-3 border-b border-gray-200">
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
                            .slice(0, 8)
                            .map((appointment) => (
                                <AppointmentCard
                                    key={appointment.appointment_id || appointment.id}
                                    appointment={appointment}
                                    onAction={onAppointmentAction}
                                />
                            ))}

                        {sortedAppointments.length > 8 && (
                            <div className="p-4 text-center border-t border-gray-200 bg-gray-50">
                                <p className="text-sm text-gray-600 font-medium">
                                    +{sortedAppointments.length - 8} more appointments today
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-primary hover:text-primary/80"
                                    onClick={() => onRefresh?.()}
                                >
                                    View All Appointments
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-12 w-12 text-primary" />
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                            No appointments scheduled
                        </h4>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Your schedule is clear for today. Perfect time to catch up or schedule
                            new appointments.
                        </p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    <PlusCircle className="h-5 w-5 mr-2" />
                                    Schedule First Appointment
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

            {/* Enhanced Footer */}
            {sortedAppointments.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                                <span className="text-gray-600 font-medium">Next: </span>
                                <span className="text-gray-900 font-semibold">
                                    {upcomingAppointments.length > 0
                                        ? formatTime(upcomingAppointments[0].appointment_time)
                                        : 'No more appointments'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                                {upcomingAppointments.length} remaining
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRefresh?.()}
                                className="text-xs text-primary hover:text-primary/80"
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TodaySchedule
