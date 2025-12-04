import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar,
    Users,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Heart,
    Zap,
    TrendingUp,
    UserCheck,
    ClipboardCheck,
    Bell,
    ScanQrCodeIcon,
    ClockPlusIcon,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { getAppointmentsForMyFacility } from '@/api/doctors/appointment'
import { getPatients } from '@/api/doctors/patient'

// Lazy load modal components for better performance
const ScheduleAppointmentModal = lazy(() =>
    import('@/components/doctors/appointments/ScheduleAppointmentModal')
)

const NurseDashboard = () => {
    const navigate = useNavigate()
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])
    const [loadingAppointments, setLoadingAppointments] = useState(true)
    const [loadingPatients, setLoadingPatients] = useState(true)

    // Modal states
    const [showScheduleAppointmentModal, setShowScheduleAppointmentModal] = useState(false)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    // Real-time updates listener
    useEffect(() => {
        const handleAppointmentUpdated = () => {
            fetchDashboardData()
        }

        const handlePatientCreated = () => {
            fetchDashboardData()
        }

        window.addEventListener('appointment-updated', handleAppointmentUpdated)
        window.addEventListener('appointment-created', handleAppointmentUpdated)
        window.addEventListener('patient-created', handlePatientCreated)

        return () => {
            window.removeEventListener('appointment-updated', handleAppointmentUpdated)
            window.removeEventListener('appointment-created', handleAppointmentUpdated)
            window.removeEventListener('patient-created', handlePatientCreated)
        }
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoadingAppointments(true)
            setLoadingPatients(true)

            const [appointmentsRes, patientsRes] = await Promise.all([
                getAppointmentsForMyFacility(),
                getPatients(),
            ])

            if (appointmentsRes?.status === 'success') {
                setAppointments(appointmentsRes.data || [])
            }
            if (patientsRes?.status === 'success') {
                setPatients(patientsRes.data || [])
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
        } finally {
            setLoadingAppointments(false)
            setLoadingPatients(false)
        }
    }

    // Compute dashboard metrics
    const dashboardMetrics = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todaysAppointments = appointments.filter((apt) => {
            if (!apt.appointment_date) return false
            const aptDate = new Date(apt.appointment_date)
            aptDate.setHours(0, 0, 0, 0)
            return aptDate.getTime() === today.getTime()
        })

        const upcomingAppointments = appointments.filter((apt) => {
            if (!apt.appointment_date) return false
            const aptDate = new Date(apt.appointment_date)
            aptDate.setHours(0, 0, 0, 0)
            return aptDate >= today
        })

        // NURSE-SPECIFIC METRICS

        // Pending check-ins (scheduled or confirmed appointments today without check-in)
        const pendingCheckIns = todaysAppointments.filter(
            (apt) => apt.status === 'scheduled' || apt.status === 'confirmed'
        ).length

        // Patients with critical allergies
        const criticalAllergies = patients.filter((patient) => {
            if (!patient.related_records?.allergies) return false
            return patient.related_records.allergies.some(
                (allergy) =>
                    allergy.severity?.toLowerCase() === 'severe' ||
                    allergy.severity?.toLowerCase() === 'critical'
            )
        }).length

        // Measurements recorded today (from anthropometric records)
        let measurementsToday = 0
        patients.forEach((patient) => {
            if (patient.related_records?.anthropometric_measurements) {
                const todayMeasurements =
                    patient.related_records.anthropometric_measurements.filter((m) => {
                        if (!m.measurement_date) return false
                        const mDate = new Date(m.measurement_date)
                        mDate.setHours(0, 0, 0, 0)
                        return mDate.getTime() === today.getTime()
                    })
                measurementsToday += todayMeasurements.length
            }
        })

        // Patients needing measurement updates (no measurements in last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const patientsNeedingMeasurements = patients.filter((patient) => {
            if (!patient.related_records?.anthropometric_measurements) return true
            const measurements = patient.related_records.anthropometric_measurements
            if (measurements.length === 0) return true

            const latestMeasurement = measurements.reduce((latest, current) => {
                const latestDate = new Date(latest.measurement_date || 0)
                const currentDate = new Date(current.measurement_date || 0)
                return currentDate > latestDate ? current : latest
            })

            const latestDate = new Date(latestMeasurement.measurement_date)
            return latestDate < thirtyDaysAgo
        }).length

        return {
            totalPatients: patients.length,
            todaysAppointments: todaysAppointments.length,
            upcomingAppointments: upcomingAppointments.length,
            completedAppointments: appointments.filter((a) => a.status === 'completed').length,
            // Nurse-specific metrics
            pendingCheckIns,
            criticalAllergies,
            measurementsToday,
            patientsNeedingMeasurements,
        }
    }, [appointments, patients])

    const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
        const colorStyles = {
            blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
            green: 'border-green-200 bg-gradient-to-br from-green-50 to-white',
            purple: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white',
            orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
            red: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
        }
        const iconColors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
            red: 'bg-red-100 text-red-600',
        }

        return (
            <div
                className={`${colorStyles[color]} border rounded-xl p-5 h-full shadow-sm hover:shadow-md transition-all duration-200`}
            >
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        {loadingAppointments || loadingPatients ? (
                            <Skeleton className="h-8 w-20 mt-1" />
                        ) : (
                            <p className="text-4xl font-bold text-gray-900">{value}</p>
                        )}
                        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    {Icon && (
                        <div className={`${iconColors[color]} rounded-lg p-3`}>
                            <Icon size={28} />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const AppointmentCard = ({ appointment, isLoading = false }) => {
        if (isLoading) {
            return (
                <div className="p-4 border border-gray-200 rounded-lg">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </div>
            )
        }

        const statusColors = {
            scheduled: 'bg-blue-100 text-blue-700',
            confirmed: 'bg-green-100 text-green-700',
            completed: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700',
            no_show: 'bg-orange-100 text-orange-700',
        }

        return (
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{appointment.appointment_type}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                            {appointment.appointment_time && ` - ${appointment.appointment_time}`}
                        </p>
                    </div>
                    <Badge
                        className={statusColors[appointment.status] || 'bg-gray-100 text-gray-700'}
                    >
                        {appointment.status}
                    </Badge>
                </div>
            </div>
        )
    }

    const MeasurementCard = ({ measurement, isLoading = false }) => {
        if (isLoading) {
            return (
                <div className="p-4 border border-gray-200 rounded-lg">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </div>
            )
        }

        return (
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium text-gray-900">{measurement.patient_name}</p>
                        <div className="mt-2 space-y-1">
                            {measurement.weight && (
                                <p className="text-sm text-gray-600">
                                    <Heart size={12} className="inline mr-1" />
                                    Weight: {measurement.weight} kg
                                </p>
                            )}
                            {measurement.height && (
                                <p className="text-sm text-gray-600">
                                    <TrendingUp size={12} className="inline mr-1" />
                                    Height: {measurement.height} cm
                                </p>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            <Calendar size={12} className="inline mr-1" />
                            {new Date(measurement.date_measured).toLocaleDateString()}
                        </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Recorded</Badge>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 grid-rows-6 gap-4">
                {/* Row 1: Stat Cards */}
                <div className="col-span-3">
                    <StatCard
                        icon={Users}
                        title="Total Patients"
                        value={dashboardMetrics.totalPatients}
                        subtitle="In your facility"
                        color="blue"
                    />
                </div>
                <div className="col-span-3 col-start-4">
                    <StatCard
                        icon={Calendar}
                        title="Today's Appointments"
                        value={dashboardMetrics.todaysAppointments}
                        subtitle="Scheduled for today"
                        color="green"
                    />
                </div>
                <div className="col-span-3 col-start-7">
                    <StatCard
                        icon={Clock}
                        title="Upcoming"
                        value={dashboardMetrics.upcomingAppointments}
                        subtitle="Next 30 days"
                        color="purple"
                    />
                </div>

                {/* Quick Actions Card - Top Right */}
                <div className="col-span-3 row-span-2 col-start-10">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg md:text-xl">Quick Access</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 w-full">
                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowScheduleAppointmentModal(true)}
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 rounded-lg hover:border-blue-400 hover:bg-blue-50"
                                >
                                    <ClockPlusIcon className="w-6 h-6 text-blue-600" />
                                    <span className="text-xs font-medium text-gray-700">
                                        Schedule Appointment
                                    </span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/nurse/appointments')}
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 rounded-lg hover:border-orange-400 hover:bg-orange-50"
                                >
                                    <Calendar className="w-6 h-6 text-orange-600" />
                                    <span className="text-xs font-medium text-gray-700">
                                        View Appointments
                                    </span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/nurse/qr_scanner')}
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 rounded-lg hover:border-green-400 hover:bg-green-50"
                                >
                                    <ScanQrCodeIcon className="w-6 h-6 text-green-600" />
                                    <span className="text-xs font-medium text-gray-700">
                                        QR Scanner
                                    </span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Appointments Card - Large Section */}
                <div className="col-span-9 row-span-3 col-start-1 row-start-2">
                    <Card className="border border-gray-200 shadow-sm h-full">
                        <CardHeader className="border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar className="text-blue-600" size={24} />
                                    Upcoming Appointments
                                </CardTitle>
                                <Badge className="bg-blue-100 text-blue-700">
                                    {dashboardMetrics.upcomingAppointments}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loadingAppointments ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <AppointmentCard key={i} isLoading={true} />
                                    ))}
                                </div>
                            ) : appointments.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {appointments
                                        .filter((apt) => {
                                            if (!apt.appointment_date) return false
                                            const aptDate = new Date(apt.appointment_date)
                                            aptDate.setHours(0, 0, 0, 0)
                                            const today = new Date()
                                            today.setHours(0, 0, 0, 0)
                                            return aptDate >= today
                                        })
                                        .slice(0, 5)
                                        .map((appointment) => (
                                            <AppointmentCard
                                                key={appointment.appointment_id}
                                                appointment={appointment}
                                            />
                                        ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No upcoming appointments
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Summary Card - Right Side */}
                <div className="col-span-3 row-span-4 col-start-10 row-start-3">
                    <Card className="border border-gray-200 shadow-sm h-full">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Zap className="text-yellow-600" size={20} />
                                Today's Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-gray-600">Appointments Today</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                    {dashboardMetrics.todaysAppointments}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-gray-600">Upcoming (Next 30 days)</p>
                                <p className="text-2xl font-bold text-purple-700 mt-1">
                                    {dashboardMetrics.upcomingAppointments}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-700 mt-1">
                                    {dashboardMetrics.completedAppointments}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Patient Summary Card - Bottom Left */}
                <div className="col-span-4 row-span-2 row-start-5">
                    <Card className="border border-gray-200 shadow-sm h-full">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="text-purple-600" size={20} />
                                Patient Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-gray-600">Total Patients</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                    {dashboardMetrics.totalPatients}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-xs text-gray-600">Completed Appointments</p>
                                <p className="text-2xl font-bold text-orange-700 mt-1">
                                    {dashboardMetrics.completedAppointments}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Nurse Reminders & Alerts - Bottom Middle */}
                <div className="col-span-5 row-span-2 col-start-5 row-start-5">
                    <Card className="border border-gray-200 shadow-sm h-full">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="text-orange-600" size={20} />
                                Reminders & Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-3">
                            {/* Pending Check-ins Alert */}
                            {dashboardMetrics.pendingCheckIns > 0 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <UserCheck className="text-blue-600 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-900">
                                            {dashboardMetrics.pendingCheckIns} patient
                                            {dashboardMetrics.pendingCheckIns > 1 ? 's' : ''}{' '}
                                            waiting for check-in
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Review today's appointments and check in patients
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Critical Allergies Alert */}
                            {dashboardMetrics.criticalAllergies > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-red-600 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900">
                                            {dashboardMetrics.criticalAllergies} patient
                                            {dashboardMetrics.criticalAllergies > 1 ? 's' : ''} with
                                            critical allergies
                                        </p>
                                        <p className="text-xs text-red-700 mt-1">
                                            Review before administering any medications
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Measurements Needed Alert */}
                            {dashboardMetrics.patientsNeedingMeasurements > 0 && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                                    <ClipboardCheck className="text-orange-600 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-orange-900">
                                            {dashboardMetrics.patientsNeedingMeasurements} patient
                                            {dashboardMetrics.patientsNeedingMeasurements > 1
                                                ? 's'
                                                : ''}{' '}
                                            need measurements
                                        </p>
                                        <p className="text-xs text-orange-700 mt-1">
                                            No vitals recorded in the last 30 days
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Measurements Today Summary */}
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                <CheckCircle className="text-green-600 mt-0.5" size={18} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900">
                                        {dashboardMetrics.measurementsToday} measurement
                                        {dashboardMetrics.measurementsToday !== 1 ? 's' : ''}{' '}
                                        recorded today
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Keep up the excellent work!
                                    </p>
                                </div>
                            </div>

                            {/* No alerts state */}
                            {dashboardMetrics.pendingCheckIns === 0 &&
                                dashboardMetrics.criticalAllergies === 0 &&
                                dashboardMetrics.patientsNeedingMeasurements === 0 &&
                                dashboardMetrics.measurementsToday === 0 && (
                                    <div className="text-center text-gray-500 py-4">
                                        <CheckCircle
                                            size={32}
                                            className="mx-auto mb-2 opacity-50 text-green-500"
                                        />
                                        <p className="text-sm">All tasks up to date!</p>
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Schedule Appointment Modal */}
            <Dialog
                open={showScheduleAppointmentModal}
                onOpenChange={setShowScheduleAppointmentModal}
            >
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    }
                >
                    <ScheduleAppointmentModal
                        onSuccess={() => setShowScheduleAppointmentModal(false)}
                    />
                </Suspense>
            </Dialog>
        </div>
    )
}

export default NurseDashboard
