import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/util/utils'
import { Button } from '@/components/ui/button'

/**
 * CalendarGrid Component
 * Displays a monthly calendar with appointment indicators
 * Shows appointment counts and types for each day
 */
const CalendarGrid = ({ appointments = [], className }) => {
    const [currentDate, setCurrentDate] = useState(new Date())

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
                                'relative p-2 text-center cursor-pointer hover:bg-blue-50 rounded transition-colors',
                                {
                                    // Current month days
                                    'text-gray-900': dayData.isCurrentMonth,
                                    // Previous/next month days
                                    'text-gray-400': !dayData.isCurrentMonth,
                                    // Today's date
                                    'bg-secondary text-primary font-semibold':
                                        isToday(dayData.date) && dayData.isCurrentMonth,
                                    // Days with appointments
                                    'bg-accent text-white':
                                        appointmentCount > 0 &&
                                        !isToday(dayData.date) &&
                                        dayData.isCurrentMonth,
                                }
                            )}
                            title={
                                appointmentCount > 0
                                    ? `${appointmentCount} appointment${
                                          appointmentCount > 1 ? 's' : ''
                                      }`
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

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span>
                            Regular (
                            {appointmentStats.consultation +
                                appointmentStats.checkup +
                                appointmentStats.vaccination}
                            )
                        </span>
                    </div>

                    {appointmentStats.followup > 0 && (
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span>Follow-up ({appointmentStats.followup})</span>
                        </div>
                    )}

                    {appointmentStats.emergency > 0 && (
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Emergency ({appointmentStats.emergency})</span>
                        </div>
                    )}
                </div>

                {/* Total Appointments Display */}
                {appointmentStats.total > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                        Total appointments this month:{' '}
                        <span className="font-semibold">{appointmentStats.total}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CalendarGrid
