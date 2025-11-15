import React, { useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, RefreshCw, Calendar, Clock, History, Filter } from 'lucide-react'
import { cn, getStatusBadgeColor } from '@/util/utils'

const ParentAllAppointments = ({
    appointments = [],
    onRefresh,
    refreshing = false,
    getChildName,
}) => {
    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [timeFilter, setTimeFilter] = useState('all') // Default to 'all' to show everything

    /**
     * Filter appointments based on selected criteria
     */
    const filteredAppointments = useMemo(() => {
        let filtered = [...appointments]

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(
                (apt) => apt.status?.toLowerCase() === statusFilter.toLowerCase()
            )
        }

        // Filter by time (upcoming/past)
        if (timeFilter !== 'all') {
            const now = new Date()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            filtered = filtered.filter((apt) => {
                if (!apt.appointment_date) return false

                // Parse the date properly - handle both ISO format and date strings
                let aptDate
                if (apt.appointment_date.includes('T')) {
                    // ISO format: "2025-11-15T00:00:00"
                    aptDate = new Date(apt.appointment_date)
                } else {
                    // Date string: "2025-11-15"
                    const [year, month, day] = apt.appointment_date.split('-').map(Number)
                    aptDate = new Date(year, month - 1, day) // month is 0-indexed
                }

                // Set the time if available
                if (apt.appointment_time) {
                    const timeParts = apt.appointment_time.split(':')
                    const hours = parseInt(timeParts[0], 10)
                    const minutes = parseInt(timeParts[1], 10)
                    aptDate.setHours(hours, minutes, 0, 0)
                } else {
                    // If no time, set to end of day for upcoming, start for past
                    if (timeFilter === 'upcoming') {
                        aptDate.setHours(23, 59, 59, 999)
                    } else {
                        aptDate.setHours(0, 0, 0, 0)
                    }
                }

                if (timeFilter === 'upcoming') {
                    return aptDate >= now
                } else if (timeFilter === 'past') {
                    return aptDate < now
                }
                return true
            })
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((apt) => {
                const childName = getChildName(apt.patient_id).toLowerCase()
                const doctorName = getDoctorNameFromAppointment(apt).toLowerCase()
                const reason = (apt.reason || '').toLowerCase()
                const facilityName = (apt.healthcare_facilities?.facility_name || '').toLowerCase()

                return (
                    childName.includes(query) ||
                    doctorName.includes(query) ||
                    reason.includes(query) ||
                    facilityName.includes(query)
                )
            })
        }

        // Sort by date in descending order (most recent first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.appointment_date)
            const dateB = new Date(b.appointment_date)
            return dateB - dateA // Most recent first (descending order)
        })

        return filtered
    }, [appointments, statusFilter, timeFilter, searchQuery, getChildName])

    const getDoctorNameFromAppointment = (appointment) => {
        if (appointment.users?.firstname && appointment.users?.lastname) {
            return `Dr. ${appointment.users.firstname} ${appointment.users.lastname}`
        }
        return appointment.doctor_name || 'Any Available'
    }

    const getFacilityName = (appointment) => {
        return appointment.healthcare_facilities?.facility_name || 'Unknown Facility'
    }

    const formatAppointmentDate = (dateString) => {
        if (!dateString) return 'Date not set'

        let date
        if (dateString.includes('T')) {
            date = new Date(dateString)
        } else {
            const [year, month, day] = dateString.split('-').map(Number)
            date = new Date(year, month - 1, day)
        }

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const formatAppointmentTime = (timeString) => {
        if (!timeString) return 'No time set'
        try {
            return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })
        } catch {
            return timeString
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col gap-4">
                    {/* Title and Refresh */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                All Appointments
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {filteredAppointments.length} of {appointments.length} appointments
                            </p>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className={cn(
                                'flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors',
                                refreshing && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                        </button>
                    </div>

                    {/* Controls - Responsive layout */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input - Full width on mobile */}
                        <div className="relative flex-1 sm:flex-none order-first sm:order-last">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-full sm:w-48"
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Time Filter Tabs */}
                            <Tabs
                                value={timeFilter}
                                onValueChange={setTimeFilter}
                                className="w-auto"
                            >
                                <TabsList className="grid grid-cols-3">
                                    <TabsTrigger value="upcoming" className="text-xs px-2 sm:px-3">
                                        <Clock className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Upcoming</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="past" className="text-xs px-2 sm:px-3">
                                        <History className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Past</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="all" className="text-xs px-2 sm:px-3">
                                        <Calendar className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">All</span>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] sm:w-[160px]">
                                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {filteredAppointments.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Child
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Doctor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Facility
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Purpose
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAppointments.map((appointment) => {
                                const childName = getChildName(appointment.patient_id)
                                return (
                                    <tr
                                        key={appointment.appointment_id || appointment.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {childName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <div>
                                                    <div>
                                                        {formatAppointmentDate(
                                                            appointment.appointment_date
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-gray-500 mt-1">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatAppointmentTime(
                                                            appointment.appointment_time
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    'inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize',
                                                    {
                                                        'bg-red-100 text-red-700 border border-red-200':
                                                            appointment.appointment_type ===
                                                            'emergency',
                                                        'bg-yellow-100 text-yellow-700 border border-yellow-200':
                                                            appointment.appointment_type ===
                                                            'followup',
                                                        'bg-green-100 text-green-700 border border-green-200':
                                                            appointment.appointment_type ===
                                                            'checkup',
                                                        'bg-purple-100 text-purple-700 border border-purple-200':
                                                            appointment.appointment_type ===
                                                            'vaccination',
                                                        'bg-blue-100 text-blue-700 border border-blue-200':
                                                            !appointment.appointment_type ||
                                                            appointment.appointment_type ===
                                                                'consultation',
                                                    }
                                                )}
                                            >
                                                {appointment.appointment_type || 'Consultation'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <span>
                                                    {getDoctorNameFromAppointment(appointment)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <span className="truncate max-w-[150px]">
                                                    {getFacilityName(appointment)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {appointment.reason || 'General Consultation'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                                                    getStatusBadgeColor(appointment.status)
                                                )}
                                            >
                                                {appointment.status || 'Scheduled'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No appointments found
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'No appointments scheduled yet.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ParentAllAppointments
