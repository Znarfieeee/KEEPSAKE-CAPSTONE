import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { getAppointmentsByDoctor } from '@/api/doctors/appointment'
import { useAppointmentsRealtime } from '@/hook/useSupabaseRealtime'

// UI Components
import TodaySchedule from '@/components/doctors/appointments/TodaySchedule'
import CalendarGrid from '@/components/doctors/appointments/CalendarGrid'
import AllAppointments from '@/components/doctors/appointments/AllAppointments'
import AppointmentLoadingSkeleton from '@/components/doctors/appointments/AppointmentLoadingSkeleton'
import { showToast } from '@/util/alertHelper'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { PlusCircle } from 'lucide-react'

// Lazy load the modal component
const ScheduleAppointmentModal = lazy(() =>
    import('@/components/doctors/appointments/ScheduleAppointmentModal')
)

const DoctorAppointments = () => {
    // State management
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Hooks
    const { user } = useAuth()
    const navigate = useNavigate()

    /**
     * Handle real-time appointment changes from Supabase
     * Updates the appointments state based on the change type
     */
    const handleAppointmentChange = useCallback(({ type, appointment }) => {
        setAppointments((prevAppointments) => {
            let updatedAppointments = [...prevAppointments]

            switch (type) {
                case 'INSERT':
                    updatedAppointments = [...prevAppointments, appointment]
                    break
                case 'UPDATE':
                    updatedAppointments = prevAppointments.map((app) =>
                        app.id === appointment.id ? appointment : app
                    )
                    break
                case 'DELETE':
                    updatedAppointments = prevAppointments.filter(
                        (app) => app.id !== appointment.id
                    )
                    break
                default:
                    console.warn('Unknown appointment change type:', type)
                    break
            }

            // Sort appointments by date and time
            return updatedAppointments.sort(
                (a, b) =>
                    new Date(`${a.appointment_date} ${a.appointment_time || '00:00'}`) -
                    new Date(`${b.appointment_date} ${b.appointment_time || '00:00'}`)
            )
        })
    }, [])

    // Initialize Supabase realtime subscription
    useAppointmentsRealtime({
        onAppointmentChange: handleAppointmentChange,
        doctorId: user?.id,
    })

    /**
     * Fetch appointments from the API
     * Handles loading states and error management
     */
    const fetchAppointments = useCallback(async () => {
        if (!user?.id) {
            setError('User not authenticated')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await getAppointmentsByDoctor(user.id)

            if (response.status === 'success' && response.data) {
                // Sort appointments by date and time
                const sortedAppointments = response.data.sort(
                    (a, b) =>
                        new Date(`${a.appointment_date} ${a.appointment_time || '00:00'}`) -
                        new Date(`${b.appointment_date} ${b.appointment_time || '00:00'}`)
                )

                setAppointments(sortedAppointments)
            } else {
                throw new Error(response.message || 'Failed to fetch appointments')
            }
        } catch (err) {
            console.error('Error fetching appointments:', err)
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                'Error loading appointments. Please try again later.'
            setError(errorMessage)
            showToast('error', errorMessage)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    // Fetch appointments on component mount and when user changes
    useEffect(() => {
        if (user?.id) {
            fetchAppointments()
        }
    }, [fetchAppointments, user?.id])

    /**
     * Filter appointments for today
     * Returns appointments scheduled for the current date
     */
    const getTodayAppointments = useCallback(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return appointments.filter((appointment) => {
            if (!appointment.appointment_date) return false

            const appointmentDate = new Date(appointment.appointment_date)
            appointmentDate.setHours(0, 0, 0, 0)

            return appointmentDate.getTime() === today.getTime()
        })
    }, [appointments])

    /**
     * Handle successful appointment scheduling
     * Refreshes the appointments list and closes the modal
     */
    const handleScheduleSuccess = useCallback(() => {
        fetchAppointments()
        setIsModalOpen(false)
        showToast('success', 'Appointment scheduled successfully!')
    }, [fetchAppointments])

    /**
     * Handle appointment actions (check-in, cancel, etc.)
     */
    const handleAppointmentAction = useCallback(async (action, appointment) => {
        try {
            switch (action) {
                case 'checkin':
                    // Handle check-in logic here
                    console.log('Checking in appointment:', appointment.id)
                    showToast(
                        'success',
                        `Checked in ${appointment.patient?.full_name || 'Patient'}`
                    )
                    break
                case 'cancel':
                    // Handle cancel logic here
                    console.log('Cancelling appointment:', appointment.id)
                    showToast(
                        'info',
                        `Cancelled appointment for ${appointment.patient?.full_name || 'Patient'}`
                    )
                    break
                default:
                    console.warn('Unknown appointment action:', action)
            }
        } catch (error) {
            console.error('Error handling appointment action:', error)
            showToast('error', 'Failed to perform action. Please try again.')
        }
    }, [])

    // Show loading skeleton while fetching data
    if (loading) {
        return <AppointmentLoadingSkeleton />
    }

    // Show error message if there's an authentication error
    if (error && !user?.id) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => navigate('/login')}>Go to Login</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 min-h-screen p-6">
            {/* Header with Add Appointment Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Doctor Appointments</h1>
                    <p className="text-gray-600">Manage your appointment schedule</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Appointment
                        </Button>
                    </DialogTrigger>

                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        }
                    >
                        <ScheduleAppointmentModal
                            isOpen={isModalOpen}
                            onSuccess={handleScheduleSuccess}
                        />
                    </Suspense>
                </Dialog>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                {/* Today's Schedule - Takes up 4 columns on large screens */}
                <div className="lg:col-span-4">
                    <TodaySchedule
                        appointments={getTodayAppointments()}
                        loading={loading}
                        onAppointmentAction={handleAppointmentAction}
                        onRefresh={fetchAppointments}
                        className="h-full"
                    />
                </div>

                {/* Calendar View - Takes up 2 columns on large screens */}
                <div className="lg:col-span-2">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar View</h3>
                        <p className="text-sm text-gray-500">Monthly appointment overview</p>
                    </div>
                    <CalendarGrid appointments={appointments} />
                </div>
            </div>

            {/* All Appointments Table */}
            <div className="w-full">
                <AllAppointments
                    appointments={appointments}
                    onRefresh={fetchAppointments}
                    loading={loading}
                />
            </div>

            {/* Error Display */}
            {error && user?.id && (
                <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
                    <p className="text-sm">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                            setError(null)
                            fetchAppointments()
                        }}
                    >
                        Retry
                    </Button>
                </div>
            )}
        </div>
    )
}

export default DoctorAppointments
