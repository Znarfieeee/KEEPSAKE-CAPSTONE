import React, { useState, useMemo } from 'react'
import { Filter, Search, RotateCcw, Eye, Calendar, Clock, User } from 'lucide-react'
import { cn, getStatusBadgeColor } from '@/util/utils'

const AllAppointments = ({ appointments, onRefresh, loading = false }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)

    // Filter and search appointments
    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => {
            const patientName =
                appointment.patient?.full_name ||
                `${appointment.patient?.first_name || ''} ${
                    appointment.patient?.last_name || ''
                }`.trim() ||
                'Unknown Patient'

            // Search filter
            const matchesSearch =
                searchTerm === '' ||
                patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                appointment.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

            // Status filter
            const matchesStatus =
                statusFilter === 'all' ||
                appointment.status?.toLowerCase() === statusFilter.toLowerCase()

            return matchesSearch && matchesStatus
        })
    }, [appointments, searchTerm, statusFilter])

    const handleStatusChange = (status) => {
        setStatusFilter(status)
        setShowFilters(false)
    }

    const getAppointmentActions = (appointment) => {
        const baseActions = [
            {
                icon: Eye,
                label: 'View Details',
                onClick: () => console.log('View appointment:', appointment.id),
                className: 'text-blue-600 hover:text-blue-800',
            },
        ]

        // Add status-specific actions
        if (appointment.status?.toLowerCase() === 'scheduled') {
            baseActions.push({
                icon: RotateCcw,
                label: 'Reschedule',
                onClick: () => console.log('Reschedule appointment:', appointment.id),
                className: 'text-yellow-600 hover:text-yellow-800',
            })
        }

        return baseActions
    }

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'no-show', label: 'No Show' },
    ]

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {filteredAppointments.length} of {appointments.length} appointments
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-3">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    'flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors',
                                    statusFilter !== 'all'
                                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                                        : 'border-gray-200'
                                )}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {statusOptions.find((opt) => opt.value === statusFilter)?.label}
                            </button>

                            {showFilters && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    {statusOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusChange(option.value)}
                                            className={cn(
                                                'w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg',
                                                statusFilter === option.value &&
                                                    'bg-blue-50 text-blue-700'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search appointments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                            />
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className={cn(
                                'flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors',
                                loading && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <RotateCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        </button>
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
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Purpose
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAppointments.map((appointment) => (
                                <tr
                                    key={appointment.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appointment.patient?.full_name ||
                                                        `${appointment.patient?.firstname || ''} ${
                                                            appointment.patient?.lastname || ''
                                                        }`.trim() ||
                                                        'Unknown Patient'}
                                                </div>
                                                {appointment.patient?.age && (
                                                    <div className="text-sm text-gray-500">
                                                        {appointment.patient.age} years old
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                            <div>
                                                <div>
                                                    {new Date(
                                                        appointment.appointment_date
                                                    ).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </div>
                                                <div className="flex items-center text-gray-500 mt-1">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {appointment.appointment_time
                                                        ? new Date(
                                                              `2000-01-01T${appointment.appointment_time}`
                                                          ).toLocaleTimeString('en-US', {
                                                              hour: 'numeric',
                                                              minute: '2-digit',
                                                              hour12: true,
                                                          })
                                                        : 'No time set'}
                                                </div>
                                            </div>
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
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {getAppointmentActions(appointment).map(
                                                (action, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={action.onClick}
                                                        className={cn(
                                                            'p-1 rounded hover:bg-gray-100 transition-colors',
                                                            action.className
                                                        )}
                                                        title={action.label}
                                                    >
                                                        <action.icon className="h-4 w-4" />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No appointments found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'No appointments scheduled yet.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AllAppointments
