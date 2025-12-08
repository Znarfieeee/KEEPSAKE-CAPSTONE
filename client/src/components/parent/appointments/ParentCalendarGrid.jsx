import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Info } from 'lucide-react'
import { cn, getStatusBadgeColor, formatTime } from '@/util/utils'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/badge'
import { TooltipHelper } from '@/util/TooltipHelper'

/**
 * ParentCalendarGrid Component
 * Displays a monthly calendar with appointments color-coded by child
 */
const ParentCalendarGrid = ({ appointments = [], children = [], childColors = {}, className }) => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)
    const [showDayDetail, setShowDayDetail] = useState(false)

    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const today = new Date()

    /**
     * Generate calendar data for the current month
     */
    const calendarData = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const daysFromPrevMonth = startingDayOfWeek
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

        const totalCells = 42
        const daysFromNextMonth = totalCells - daysFromPrevMonth - daysInMonth

        const days = []

        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                isPrevMonth: true,
                date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
            })
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                isCurrentMonth: true,
                isPrevMonth: false,
                date: new Date(currentYear, currentMonth, day),
            })
        }

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
     * Get child name by patient ID
     */
    const getChildName = (patientId) => {
        const child = children.find((c) => (c.patient_id || c.id) === patientId)
        if (child) {
            return child.firstname && child.lastname
                ? `${child.firstname} ${child.lastname}`
                : child.full_name || 'Unknown Child'
        }
        return 'Unknown Child'
    }

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
        if (!dayData.isCurrentMonth) return

        const dayAppointments = getAppointmentsForDate(dayData.date)
        setSelectedDay({
            date: dayData.date,
            appointments: dayAppointments,
            dayNumber: dayData.day,
        })
        setShowDayDetail(true)
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
     * Get unique child colors for a day's appointments
     */
    const getChildColorsForDay = (dayAppointments) => {
        const uniqueChildren = [...new Set(dayAppointments.map((apt) => apt.patient_id))]
        return uniqueChildren.slice(0, 3).map((childId) => childColors[childId] || 'bg-blue-500')
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
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousMonth}
                        className="p-1 h-8 w-8"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="px-2 h-8 text-xs"
                    >
                        Today
                    </Button>

                    <Button
                        variant="ghost"
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
                    const childColorsDots = getChildColorsForDay(dayAppointments)

                    return (
                        <div
                            key={index}
                            className={cn(
                                'relative p-2 text-center cursor-pointer hover:bg-primary/20 rounded transition-all duration-200 min-h-[40px]',
                                {
                                    'text-gray-900': dayData.isCurrentMonth,
                                    'text-gray-400 cursor-not-allowed': !dayData.isCurrentMonth,
                                    'bg-blue-100 text-primary font-semibold border-2 border-blue-300':
                                        isToday(dayData.date) && dayData.isCurrentMonth,
                                    'bg-blue-50 border border-blue-200 hover:bg-blue-100':
                                        appointmentCount > 0 &&
                                        !isToday(dayData.date) &&
                                        dayData.isCurrentMonth,
                                    'hover:bg-gray-100 hover:shadow-sm': dayData.isCurrentMonth,
                                }
                            )}
                            onClick={() => dayData.isCurrentMonth && handleDayClick(dayData)}
                            title={
                                appointmentCount > 0
                                    ? `${appointmentCount} appointment${
                                          appointmentCount > 1 ? 's' : ''
                                      } - Click to view`
                                    : dayData.isCurrentMonth
                                    ? 'Click to view day details'
                                    : ''
                            }
                        >
                            <span className="relative z-10">{dayData.day}</span>

                            {/* Child Color Indicators */}
                            {appointmentCount > 0 && (
                                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5">
                                    {childColorsDots.map((color, i) => (
                                        <div
                                            key={i}
                                            className={cn('w-1.5 h-1.5 rounded-full', color)}
                                        />
                                    ))}
                                    {appointmentCount > 3 && (
                                        <span className="text-[8px] text-gray-500 ml-0.5">+</span>
                                    )}
                                </div>
                            )}

                            {/* Appointment Count Badge */}
                            {appointmentCount > 1 && (
                                <span className="absolute -top-1 -right-1 text-xs font-bold text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                    {appointmentCount > 9 ? '9+' : appointmentCount}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <TooltipHelper
                        classname="bg-primary text-white border shadow-lg"
                        content={
                            <div className="p-4 space-y-3">
                                <div className="text-sm font-medium text-white border-b border-gray-600 pb-2">
                                    Children Legend
                                </div>
                                <div className="space-y-2">
                                    {children.map((child) => {
                                        const childId = child.patient_id || child.id
                                        const childName =
                                            child.firstname && child.lastname
                                                ? `${child.firstname} ${child.lastname}`
                                                : child.full_name || 'Unknown'
                                        return (
                                            <div
                                                key={childId}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <div
                                                    className={cn(
                                                        'w-3 h-3 rounded-full',
                                                        childColors[childId] || 'bg-blue-500'
                                                    )}
                                                />
                                                <span>{childName}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="text-xs text-gray-300 pt-2 border-t border-gray-600">
                                    Click any day to view appointment details
                                </div>
                            </div>
                        }
                    >
                        <div className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary hover:text-primary/80 cursor-help" />
                            <span className="text-sm text-gray-600">
                                {appointments.length} total appointments
                            </span>
                        </div>
                    </TooltipHelper>
                </div>
            </div>

            {/* Day Detail Modal */}
            <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
                <DialogContent
                    className="max-w-2xl max-h-[80vh] overflow-hidden"
                    showCloseButton={false}
                >
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
                            <div className="space-y-4 p-2 mt-6">
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
                                            const timeA = a.appointment_time || '00:00'
                                            const timeB = b.appointment_time || '00:00'
                                            return timeA.localeCompare(timeB)
                                        })
                                        .map((appointment, index) => {
                                            const childId = appointment.patient_id
                                            const childColor = childColors[childId] || 'bg-blue-500'
                                            const childName = getChildName(childId)

                                            return (
                                                <div
                                                    key={appointment.appointment_id || index}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={cn(
                                                                'w-1 h-full min-h-[60px] rounded-full',
                                                                childColor
                                                            )}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={cn(
                                                                            'w-3 h-3 rounded-full',
                                                                            childColor
                                                                        )}
                                                                    />
                                                                    <span className="font-semibold text-gray-900">
                                                                        {childName}
                                                                    </span>
                                                                </div>
                                                                {appointment.status && (
                                                                    <Badge
                                                                        className={cn(
                                                                            'text-xs font-medium',
                                                                            getStatusBadgeColor(
                                                                                appointment.status
                                                                            )
                                                                        )}
                                                                    >
                                                                        {appointment.status}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock className="w-4 h-4 text-gray-500" />
                                                                <span className="font-medium text-gray-900">
                                                                    {formatTime(
                                                                        appointment.appointment_time
                                                                    ) || 'Time TBD'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 mb-2">
                                                                <User className="w-4 h-4 text-gray-500" />
                                                                <span className="text-gray-700">
                                                                    {appointment.users?.firstname &&
                                                                    appointment.users?.lastname
                                                                        ? `Dr. ${appointment.users.firstname} ${appointment.users.lastname}`
                                                                        : appointment.doctor_name ||
                                                                          'Any Available Doctor'}
                                                                </span>
                                                            </div>

                                                            {appointment.reason && (
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-medium">
                                                                        Reason:
                                                                    </span>{' '}
                                                                    {appointment.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
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
                        <Button onClick={() => setShowDayDetail(false)} className="px-8 py-2">
                            OK
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ParentCalendarGrid
