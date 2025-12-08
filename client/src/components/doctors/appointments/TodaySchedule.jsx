import React, { Suspense, lazy, useState } from 'react'

// UI Component
import {
    Calendar,
    Clock,
    PlusCircle,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    UserCheck,
} from 'lucide-react'
import { cn, formatTime, getStatusBadgeColor } from '@/util/utils'
import { Dialog, DialogTrigger } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
                errorMessage =
                    error.response?.data?.message ||
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
        <div className="p-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-b-0">
            <div className="flex items-center justify-between gap-3">
                {/* Time & Patient Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Time with indicator */}
                    <div className="flex flex-col items-center min-w-[70px]">
                        <span className="text-base font-bold text-gray-900">
                            {formatTime(appointment.appointment_time)}
                        </span>
                        {getTimeIndicator()}
                    </div>

                    <Separator orientation="vertical" className="h-12" />

                    {/* Patient Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                                {appointment.patient_name ||
                                    appointment.patients?.firstname +
                                        ' ' +
                                        appointment.patients?.lastname ||
                                    appointment.patient?.full_name ||
                                    'Unknown Patient'}
                            </h4>
                            {appointment.appointment_type && (
                                <Badge
                                    variant="outline"
                                    className={cn('text-xs capitalize px-1.5 py-0 border', {
                                        'bg-red-50 text-red-700 border-red-200':
                                            appointment.appointment_type === 'emergency',
                                        'bg-yellow-50 text-yellow-700 border-yellow-200':
                                            appointment.appointment_type === 'followup',
                                        'bg-green-50 text-green-700 border-green-200':
                                            appointment.appointment_type === 'checkup',
                                        'bg-purple-50 text-purple-700 border-purple-200':
                                            appointment.appointment_type === 'vaccination',
                                        'bg-blue-50 text-blue-700 border-blue-200':
                                            appointment.appointment_type === 'consultation',
                                    })}
                                >
                                    {appointment.appointment_type}
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 truncate">
                            {appointment.reason || 'General Consultation'}
                        </p>

                        {appointment.doctor_name && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Dr. {appointment.doctor_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end gap-2 min-w-fit">
                    <Badge
                        className={cn(
                            'text-xs font-medium whitespace-nowrap',
                            getStatusBadgeColor(appointment.status)
                        )}
                    >
                        {appointment.status?.charAt(0).toUpperCase() +
                            appointment.status?.slice(1) || 'Scheduled'}
                    </Badge>

                    <div className="flex items-center space-x-1">
                        {(appointment.status?.toLowerCase() === 'scheduled' ||
                            !appointment.status) && (
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
                        {/* <div className="text-center">
                            <p className="text-2xl font-bold text-accent">
                                {upcomingAppointments.length}
                            </p>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                Remaining
                            </p>
                        </div> */}
                    </div>
                </div>
            </div>

            {/* Appointments List - ScrollArea for constant height */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : sortedAppointments.length > 0 ? (
                    <ScrollArea className="h-full">
                        {(upcomingAppointments.length > 0
                            ? upcomingAppointments
                            : sortedAppointments
                        ).map((appointment) => (
                            <AppointmentCard
                                key={appointment.appointment_id || appointment.id}
                                appointment={appointment}
                                onAction={onAppointmentAction}
                            />
                        ))}
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

            {/* Enhanced Footer with Legend */}
            {sortedAppointments.length > 0 && (
                <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
                    <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200">
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
                            <span className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">
                                    {upcomingAppointments.length}
                                </span>{' '}
                                remaining
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TodaySchedule
