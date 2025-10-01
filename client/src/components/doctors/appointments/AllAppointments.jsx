import React, { useState, useMemo, Suspense, lazy } from 'react'

// UI Components
import {
    Filter,
    Search,
    RotateCcw,
    Eye,
    Calendar,
    Clock,
    User,
    Edit,
    CalendarX,
} from 'lucide-react'
import { cn, getStatusBadgeColor } from '@/util/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { showToast } from '@/util/alertHelper'
import { cancelAppointment } from '@/api/doctors/appointment'

// Helper
import TooltipHelper from '@/util/TooltipHelper'

// Lazy load modal components
const ViewAppointmentModal = lazy(() => import('./ViewAppointmentModal'))
const RescheduleAppointmentModal = lazy(() => import('./RescheduleAppointmentModal'))

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    return age
}

const AllAppointments = ({ appointments, onRefresh, loading = false }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [cancellingId, setCancellingId] = useState(null)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [appointmentToCancel, setAppointmentToCancel] = useState(null)

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
                appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    const handleViewAppointment = (appointment) => {
        setSelectedAppointment(appointment)
        setShowViewModal(true)
    }

    const handleRescheduleAppointment = (appointment) => {
        setSelectedAppointment(appointment)
        setShowRescheduleModal(true)
    }

    const handleRescheduleSuccess = () => {
        setShowRescheduleModal(false)
        setSelectedAppointment(null)
        // Don't call onRefresh - let real-time updates handle it
    }

    const handleCancelClick = (appointment) => {
        setAppointmentToCancel(appointment)
        setShowCancelDialog(true)
    }

    const handleCancelConfirm = async () => {
        if (!appointmentToCancel) return

        const appointmentId = appointmentToCancel.appointment_id || appointmentToCancel.id
        setCancellingId(appointmentId)

        try {
            const response = await cancelAppointment(appointmentId)

            if (response.status === 'success') {
                showToast('success', 'Appointment cancelled successfully')

                // Dispatch custom event for real-time update
                if (response.data) {
                    window.dispatchEvent(
                        new CustomEvent('appointment-updated', {
                            detail: response.data,
                        })
                    )
                }

                // Close dialog and reset
                setShowCancelDialog(false)
                setAppointmentToCancel(null)

                // Don't call onRefresh - let real-time updates handle it
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error)
            const errorMessage =
                error.response?.data?.message || error.message || 'Failed to cancel appointment'
            showToast('error', errorMessage)
        } finally {
            setCancellingId(null)
        }
    }

    const closeModals = () => {
        setShowViewModal(false)
        setShowRescheduleModal(false)
        setSelectedAppointment(null)
    }

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'checked_in', label: 'Checked In' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'no_show', label: 'No Show' },
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
                                        ? 'border-secondary bg-secondary text-primary'
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
                                                    'bg-secondary/50 text-primary'
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
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-64"
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
                                    Type
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
                                    key={appointment.appointment_id || appointment.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-3">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appointment.patient_name ||
                                                        `${appointment.patients?.firstname || ''} ${
                                                            appointment.patients?.lastname || ''
                                                        }`.trim() ||
                                                        'Unknown Patient'}
                                                </div>
                                                {appointment.patients?.date_of_birth && (
                                                    <div className="text-sm text-gray-500">
                                                        {calculateAge(
                                                            appointment.patients.date_of_birth
                                                        )}{' '}
                                                        years old
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
                                        <span
                                            className={cn(
                                                'inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize',
                                                {
                                                    'bg-red-100 text-red-700 border border-red-200':
                                                        appointment.appointment_type ===
                                                        'emergency',
                                                    'bg-yellow-100 text-yellow-700 border border-yellow-200':
                                                        appointment.appointment_type === 'followup',
                                                    'bg-green-100 text-green-700 border border-green-200':
                                                        appointment.appointment_type === 'checkup',
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
                                        <div className="flex gap-1">
                                            <TooltipHelper content="View Details">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:text-blue-600 hover:bg-blue-100"
                                                    onClick={() =>
                                                        handleViewAppointment(appointment)
                                                    }
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                            </TooltipHelper>

                                            {/* Only show reschedule for scheduled/confirmed appointments */}
                                            {(appointment.status?.toLowerCase() === 'scheduled' ||
                                                appointment.status?.toLowerCase() ===
                                                    'confirmed') && (
                                                <>
                                                    <TooltipHelper content="Reschedule Appointment">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="hover:text-yellow-600 hover:bg-yellow-100"
                                                            onClick={() =>
                                                                handleRescheduleAppointment(
                                                                    appointment
                                                                )
                                                            }
                                                            disabled={
                                                                cancellingId ===
                                                                (appointment.appointment_id ||
                                                                    appointment.id)
                                                            }
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                    </TooltipHelper>

                                                    <TooltipHelper content="Cancel Appointment">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="hover:text-red-600 hover:bg-red-100"
                                                            onClick={() =>
                                                                handleCancelClick(appointment)
                                                            }
                                                            disabled={
                                                                cancellingId ===
                                                                (appointment.appointment_id ||
                                                                    appointment.id)
                                                            }
                                                        >
                                                            {cancellingId ===
                                                            (appointment.appointment_id ||
                                                                appointment.id) ? (
                                                                <div className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                                            ) : (
                                                                <CalendarX className="size-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipHelper>
                                                </>
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

            {/* Legend Footer */}
            {/* {filteredAppointments.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Types:
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Consultation</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Check-up</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Follow-up</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Vaccination</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Emergency</span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Showing {filteredAppointments.length} of {appointments.length}{' '}
                            appointments
                        </div>
                    </div>
                </div>
            )} */}

            {/* View Appointment Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    }
                >
                    <ViewAppointmentModal appointment={selectedAppointment} onClose={closeModals} />
                </Suspense>
            </Dialog>

            {/* Reschedule Appointment Modal */}
            <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    }
                >
                    <RescheduleAppointmentModal
                        appointment={selectedAppointment}
                        onSuccess={handleRescheduleSuccess}
                        onClose={closeModals}
                    />
                </Suspense>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <ConfirmationDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                title="Cancel Appointment"
                description={`Are you sure you want to cancel the appointment for ${
                    appointmentToCancel?.patient_name ||
                    `${appointmentToCancel?.patients?.firstname || ''} ${
                        appointmentToCancel?.patients?.lastname || ''
                    }`.trim() ||
                    'this patient'
                }? This action cannot be undone.`}
                onConfirm={handleCancelConfirm}
                destructive={true}
                loading={cancellingId !== null}
            />
        </div>
    )
}

export default AllAppointments
