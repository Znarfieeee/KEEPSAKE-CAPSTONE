import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/util/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/badge'
import { TooltipHelper } from '@/util/TooltipHelper'

/**
 * CalendarGrid Component
 * Displays a monthly calendar with appointment indicators
 * Shows appointment counts and types for each day
 */
const CalendarGrid = ({ appointments = [], className }) => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)
    const [showDayDetail, setShowDayDetail] = useState(false)

    // Get current month and year
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const today = new Date()

    /**
     * Generate calendar data for the current month
     */
    const calendarData = useMemo(() => {
        // Get first day of the month and how many days in the month
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.

        // Get days from previous month to fill the calendar grid
        const daysFromPrevMonth = startingDayOfWeek
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

        // Get days from next month to fill the calendar grid (42 total cells - 6 rows x 7 days)
        const totalCells = 42
        const daysFromNextMonth = totalCells - daysFromPrevMonth - daysInMonth

        const days = []

        // Add previous month days
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                isPrevMonth: true,
                date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
            })
        }

        // Add current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                isCurrentMonth: true,
                isPrevMonth: false,
                date: new Date(currentYear, currentMonth, day),
            })
        }

        // Add next month days
        for (let day = 1; day <= daysFromNextMonth; day++) {
            days.push({
                day,
                isCurrentMonth: false,
                isPrevMonth: false,
                date: new Date(currentYear, currentMonth + 1, day),
            })
        }

        return days
    }, [currentMonth, currentYear])

    /**
     * Get appointments for a specific date
     */
    const getAppointmentsForDate = (date) => {
        return appointments.filter((appointment) => {
            if (!appointment.appointment_date) return false

            const appointmentDate = new Date(appointment.appointment_date)
            return (
                appointmentDate.getDate() === date.getDate() &&
                appointmentDate.getMonth() === date.getMonth() &&
                appointmentDate.getFullYear() === date.getFullYear()
            )
        })
    }

    /**
     * Get appointment type distribution for legend
     */
    const appointmentStats = useMemo(() => {
        const stats = {
            consultation: 0,
            followup: 0,
            emergency: 0,
            checkup: 0,
            vaccination: 0,
            total: appointments.length,
        }

        appointments.forEach((apt) => {
            const type = apt.appointment_type?.toLowerCase() || 'consultation'
            if (stats.hasOwnProperty(type)) {
                stats[type]++
            } else {
                stats.consultation++
            }
        })

        return stats
    }, [appointments])

    /**
     * Navigate to previous month
     */
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1))
    }

    /**
     * Navigate to next month
     */
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1))
    }

    /**
     * Navigate to today's date
     */
    const goToToday = () => {
        setCurrentDate(new Date())
    }

    /**
     * Handle day click to show appointments
     */
    const handleDayClick = (dayData) => {
        if (!dayData.isCurrentMonth) return // Only allow clicks on current month days

        const dayAppointments = getAppointmentsForDate(dayData.date)
        setSelectedDay({
            date: dayData.date,
            appointments: dayAppointments,
            dayNumber: dayData.day,
        })
        setShowDayDetail(true)
    }

    /**
     * Get appointment type badge styling
     */
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

    /**
     * Format appointment time
     */
    const formatAppointmentTime = (timeString) => {
        if (!timeString) return 'No time specified'

        try {
            const time = new Date(`2000-01-01T${timeString}`)
            return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        } catch (error) {
            return timeString
        }
    }

    /**
     * Check if a date is today
     */
    const isToday = (date) => {
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    /**
     * Get appointment indicator color based on type and count
     */
    const getAppointmentIndicator = (dayAppointments) => {
        if (dayAppointments.length === 0) return null

        const hasEmergency = dayAppointments.some(
            (apt) => apt.appointment_type?.toLowerCase() === 'emergency'
        )
        const hasFollowup = dayAppointments.some(
            (apt) => apt.appointment_type?.toLowerCase() === 'followup'
        )

        if (hasEmergency) return 'bg-red-500'
        if (hasFollowup) return 'bg-yellow-400'
        return 'bg-primary'
    }

    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ]

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className={cn('bg-white p-4 rounded-lg border border-gray-200', className)}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                    {monthNames[currentMonth]} {currentYear}
                </h4>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonth}
                        className="p-1 h-8 w-8"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="px-2 h-8 text-xs"
                    >
                        Today
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextMonth}
                        className="p-1 h-8 w-8"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-sm">
                {/* Day Headers */}
                {dayNames.map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-gray-500 text-xs">
                        {day}
                    </div>
                ))}

                {/* Calendar Days */}
                {calendarData.map((dayData, index) => {
                    const dayAppointments = getAppointmentsForDate(dayData.date)
                    const appointmentCount = dayAppointments.length
                    const indicatorColor = getAppointmentIndicator(dayAppointments)

                    return (
                        <div
                            key={index}
                            className={cn(
                                'relative p-2 text-center cursor-pointer hover:bg-primary/20 rounded transition-all duration-200',
                                {
                                    // Current month days
                                    'text-gray-900': dayData.isCurrentMonth,
                                    // Previous/next month days
                                    'text-gray-400 cursor-not-allowed': !dayData.isCurrentMonth,
                                    // Today's date
                                    'bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300':
                                        isToday(dayData.date) && dayData.isCurrentMonth,
                                    // Days with appointments
                                    'bg-blue-50 border border-blue-200 hover:bg-blue-100':
                                        appointmentCount > 0 &&
                                        !isToday(dayData.date) &&
                                        dayData.isCurrentMonth,
                                    // Hover state for clickable days
                                    'hover:bg-gray-100 hover:shadow-sm': dayData.isCurrentMonth,
                                }
                            )}
                            onClick={() => dayData.isCurrentMonth && handleDayClick(dayData)}
                            title={
                                appointmentCount > 0
                                    ? `${appointmentCount} appointment${
                                          appointmentCount > 1 ? 's' : ''
                                      } - Click to view details`
                                    : dayData.isCurrentMonth
                                    ? 'Click to view day details'
                                    : ''
                            }
                        >
                            <span className="relative z-10">{dayData.day}</span>

                            {/* Appointment Count Indicator */}
                            {appointmentCount > 0 && (
                                <div className="absolute top-1 right-1 flex items-center justify-center">
                                    <div
                                        className={cn(
                                            'w-2 h-2 rounded-full',
                                            indicatorColor || 'bg-primary'
                                        )}
                                    />
                                    {appointmentCount > 1 && (
                                        <span className="absolute -top-1 -right-1 text-xs font-bold text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                            {appointmentCount > 9 ? '9+' : appointmentCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Simplified Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium">
                                {appointmentStats.consultation +
                                    appointmentStats.checkup +
                                    appointmentStats.vaccination}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span className="text-sm font-medium">{appointmentStats.followup}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium">
                                {appointmentStats.emergency}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded-full"></div>
                            <span className="text-sm font-medium">Today</span>
                        </div>

                        <TooltipHelper
                            classname="bg-primary text-white border shadow-lg"
                            content={
                                <div className="p-3 space-y-2">
                                    <div className="text-sm font-medium text-white mb-2 border-b border-gray-600 pb-1">
                                        Legend:
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-gray-100">
                                            Regular appointments (consultation, checkup,
                                            vaccination)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                        <span className="text-gray-100">
                                            Follow-up appointments
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-gray-100">
                                            Emergency appointments
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-blue-100 border border-blue-300 rounded-full"></div>
                                        <span className="text-gray-100">Today's date</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-600 text-sm text-gray-300">
                                        Click any day to view appointment details
                                    </div>
                                </div>
                            }
                        >
                            <Info className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help" />
                        </TooltipHelper>
                    </div>

                    {appointmentStats.total > 0 && (
                        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                            <span className="font-semibold">{appointmentStats.total}</span> total
                        </div>
                    )}
                </div>
            </div>

            {/* Day Detail Modal */}
            <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            {selectedDay && (
                                <span>
                                    {selectedDay.date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[60vh]">
                        {selectedDay && selectedDay.appointments.length > 0 ? (
                            <div className="space-y-4 p-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-gray-900">
                                        {selectedDay.appointments.length} Appointment
                                        {selectedDay.appointments.length > 1 ? 's' : ''} Scheduled
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                        {selectedDay.appointments.length} Total
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    {selectedDay.appointments
                                        .sort((a, b) => {
                                            // Sort by appointment time
                                            const timeA = a.appointment_time || '00:00'
                                            const timeB = b.appointment_time || '00:00'
                                            return timeA.localeCompare(timeB)
                                        })
                                        .map((appointment, index) => (
                                            <div
                                                key={appointment.appointment_id || index}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            <span className="font-medium text-gray-900">
                                                                {formatAppointmentTime(
                                                                    appointment.appointment_time
                                                                )}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className={getAppointmentTypeBadge(
                                                                    appointment.appointment_type
                                                                )}
                                                            >
                                                                {appointment.appointment_type ||
                                                                    'Consultation'}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User className="w-4 h-4 text-gray-500" />
                                                            <span className="text-gray-700">
                                                                {appointment.patient_name ||
                                                                    'Patient Name Not Available'}
                                                            </span>
                                                        </div>

                                                        {appointment.reason && (
                                                            <div className="mt-2">
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-medium">
                                                                        Reason:
                                                                    </span>{' '}
                                                                    {appointment.reason}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {appointment.notes && (
                                                            <div className="mt-2">
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-medium">
                                                                        Notes:
                                                                    </span>{' '}
                                                                    {appointment.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {appointment.status && (
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                appointment.status === 'confirmed'
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : appointment.status ===
                                                                      'pending'
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                                            }
                                                        >
                                                            {appointment.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="font-medium text-gray-900 mb-1">
                                    No Appointments Scheduled
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {selectedDay &&
                                        `No appointments are scheduled for ${selectedDay.date.toLocaleDateString()}`}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowDayDetail(false)}
                            className="px-4 py-2"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CalendarGrid
