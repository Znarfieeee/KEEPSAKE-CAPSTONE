import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar,
    Users,
    Activity,
    User,
    Plus,
    Clock,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Syringe,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { getAppointmentsForMyFacility } from '@/api/doctors/appointment'
import { getPatients } from '@/api/doctors/patient'

// Lazy load modal components for better performance
const StepperAddPatientModal = lazy(() => import('@/components/doctors/patient_records/StepperAddPatientModal'))
const ScheduleAppointmentModal = lazy(() => import('@/components/doctors/appointments/ScheduleAppointmentModal'))

const DoctorDashboard = () => {
    const navigate = useNavigate()
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])
    const [vaccinations, setVaccinations] = useState([])
    const [loadingAppointments, setLoadingAppointments] = useState(true)
    const [loadingPatients, setLoadingPatients] = useState(true)
    const [loadingVaccinations, setLoadingVaccinations] = useState(true)

    // Modal states
    const [showAddPatientModal, setShowAddPatientModal] = useState(false)
    const [showScheduleAppointmentModal, setShowScheduleAppointmentModal] = useState(false)

    // Fetch appointments, patients, and vaccinations on mount
    useEffect(() => {
        fetchAppointmentsAndPatients()
    }, [])

    // Real-time updates listener
    useEffect(() => {
        const handlePatientCreated = () => {
            fetchAppointmentsAndPatients()
        }

        const handleAppointmentUpdated = () => {
            fetchAppointmentsAndPatients()
        }

        window.addEventListener('patient-created', handlePatientCreated)
        window.addEventListener('appointment-updated', handleAppointmentUpdated)
        window.addEventListener('appointment-created', handleAppointmentUpdated)

        return () => {
            window.removeEventListener('patient-created', handlePatientCreated)
            window.removeEventListener('appointment-updated', handleAppointmentUpdated)
            window.removeEventListener('appointment-created', handleAppointmentUpdated)
        }
    }, [])

    const fetchAppointmentsAndPatients = async () => {
        try {
            setLoadingAppointments(true)
            setLoadingPatients(true)
            setLoadingVaccinations(true)

            const [appointmentsRes, patientsRes] = await Promise.all([
                getAppointmentsForMyFacility(),
                getPatients(),
            ])

            if (appointmentsRes?.status === 'success') {
                setAppointments(appointmentsRes.data || [])
            }
            if (patientsRes?.status === 'success') {
                setPatients(patientsRes.data || [])
                // Extract vaccination data from patient related records
                const allVaccinations = []
                patientsRes.data.forEach((patient) => {
                    if (patient.related_records?.vaccinations) {
                        allVaccinations.push(...patient.related_records.vaccinations)
                    }
                })
                setVaccinations(allVaccinations)
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
        } finally {
            setLoadingAppointments(false)
            setLoadingPatients(false)
            setLoadingVaccinations(false)
        }
    }

    // Modal handlers
    const handleAddPatientSuccess = () => {
        setShowAddPatientModal(false)
        // Real-time updates will handle data refresh
    }

    const handleScheduleAppointmentSuccess = () => {
        setShowScheduleAppointmentModal(false)
        // Real-time updates will handle data refresh
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

        // Vaccination metrics
        const completedVaccinations = vaccinations.filter((v) => v.administered_date).length
        const totalVaccinations = vaccinations.length
        const overdueVaccinations = vaccinations.filter((v) => {
            if (!v.next_dose_due) return false
            return new Date(v.next_dose_due) < new Date()
        }).length
        const vaccCompliancePercent =
            totalVaccinations > 0
                ? Math.round((completedVaccinations / totalVaccinations) * 100)
                : 0

        // NEW METRIC 1: Count of PATIENTS with overdue vaccinations (not individual vaccinations)
        const patientsWithOverdueVaccinations = patients.filter((patient) => {
            if (!patient.related_records?.vaccinations) return false
            return patient.related_records.vaccinations.some((vax) => {
                if (!vax.next_dose_due) return false
                return new Date(vax.next_dose_due) < today
            })
        }).length

        // NEW METRIC 2: Active prescriptions (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        let activePrescriptionsCount = 0
        patients.forEach((patient) => {
            if (patient.related_records?.prescriptions) {
                const recentPrescriptions = patient.related_records.prescriptions.filter((rx) => {
                    if (!rx.prescription_date) return false
                    const rxDate = new Date(rx.prescription_date)
                    return rxDate >= thirtyDaysAgo
                })
                activePrescriptionsCount += recentPrescriptions.length
            }
        })

        // NEW METRIC 3: Pending appointments (scheduled, confirmed, or checked_in status)
        const pendingAppointmentsCount = appointments.filter((apt) => {
            const isPending = ['scheduled', 'confirmed', 'checked_in'].includes(apt.status)
            if (!apt.appointment_date) return isPending
            const aptDate = new Date(apt.appointment_date)
            aptDate.setHours(0, 0, 0, 0)
            return isPending && aptDate >= today
        }).length

        return {
            totalPatients: patients.length,
            todaysPatients: todaysAppointments.length,
            upcomingAppointments: upcomingAppointments.length,
            completedAppointments: appointments.filter((a) => a.status === 'completed').length,
            totalVaccinations,
            completedVaccinations,
            overdueVaccinations,
            vaccCompliancePercent,
            // New production-ready metrics
            patientsWithOverdueVaccinations,
            activePrescriptionsCount,
            pendingAppointmentsCount,
        }
    }, [appointments, patients, vaccinations])

    const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
        const colorStyles = {
            blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
            green: 'border-green-200 bg-gradient-to-br from-green-50 to-white',
            purple: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white',
            orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
        }
        const iconColors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
        }

        return (
            <div
                className={`${colorStyles[color]} border rounded-xl p-5 h-full shadow-sm hover:shadow-md transition-all duration-200`}
            >
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        {loadingAppointments || loadingPatients || loadingVaccinations ? (
                            <Skeleton className="h-8 w-20 mt-1" />
                        ) : (
                            <p className="text-4xl font-bold text-gray-900">{value}</p>
                        )}
                        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    {Icon && (
                        <div
                            className={`${iconColors[color]} p-3 rounded-lg flex items-center justify-center`}
                        >
                            <Icon className="h-6 w-6" />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const PatientCard = ({ patient, showDate = false, showStatus = true }) => {
        const displayName =
            patient.patient_name ||
            `${patient.firstname || ''} ${patient.lastname || ''}`.trim() ||
            'Unknown Patient'
        const dateDisplay = showDate
            ? new Date(patient.appointment_date).toLocaleDateString()
            : patient.appointment_time

        return (
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{displayName}</p>
                        <p className="text-sm text-gray-500">
                            {dateDisplay || 'N/A'} • {patient.appointment_type || 'General'}
                        </p>
                    </div>
                </div>
                {showStatus && (
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                            patient.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : patient.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : patient.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                        {patient.status
                            ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1)
                            : 'Scheduled'}
                    </span>
                )}
            </div>
        )
    }

    const AppointmentOverviewCard = ({ appointments = [], isLoading = false }) => {
        const upcoming = appointments
            .filter((apt) => {
                if (!apt.appointment_date) return false
                const aptDate = new Date(apt.appointment_date)
                aptDate.setHours(0, 0, 0, 0)
                return aptDate >= new Date(new Date().setHours(0, 0, 0, 0))
            })
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
            .slice(0, 5)

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between w-full h-full">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Upcoming Appointments
                        </CardTitle>
                        <Button
                            onClick={() => navigate('/pediapro/appointments')}
                            variant="outline"
                            size="sm"
                        >
                            View All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : upcoming.length === 0 ? (
                        <div className="text-center py-6 text-gray-600">
                            <p>No upcoming appointments</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {upcoming.map((apt) => (
                                <PatientCard
                                    key={apt.id || apt.appointment_id}
                                    patient={apt}
                                    showDate={true}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const PediatricHealthCard = ({ title, metric, value, unit, icon: Icon, color = 'blue' }) => {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            orange: 'bg-orange-50 text-orange-600',
            purple: 'bg-purple-50 text-purple-600',
        }

        return (
            <Card className="h-40">
                <CardContent className="pt-6">
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{title}</p>
                            <p className="text-sm text-gray-500">{metric}</p>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                {loadingPatients ? (
                                    <Skeleton className="h-8 w-20" />
                                ) : (
                                    <>
                                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                                        <p className="text-xs text-gray-500">{unit}</p>
                                    </>
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
                            >
                                <Icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const QuickActionButton = ({ icon: Icon, label, onClick, variant = 'primary' }) => (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                variant === 'primary'
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'
            }`}
        >
            <Icon className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium text-center">{label}</span>
        </button>
    )

    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                {/* <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Welcome back! Here's your facility overview.
                    </p>
                </div> */}

                {/* Main Grid Layout */}
                <div className="grid grid-cols-12 grid-rows-5 gap-4">
                    {/* Row 1: Stat Cards (3 cols each) */}
                    {/* Total Patients */}
                    <div className="col-span-3">
                        <StatCard
                            title="Total Patients"
                            value={dashboardMetrics.totalPatients}
                            subtitle="In your facility"
                            icon={Users}
                            color="blue"
                        />
                    </div>

                    {/* Today's Patients Stat */}
                    <div className="col-span-3 col-start-4">
                        <StatCard
                            title="Today's Patients"
                            value={dashboardMetrics.todaysPatients}
                            subtitle="Appointments"
                            icon={Calendar}
                            color="green"
                        />
                    </div>

                    {/* Upcoming Appointments Stat */}
                    <div className="col-span-3 col-start-7">
                        <StatCard
                            title="Upcoming Appointments"
                            value={dashboardMetrics.upcomingAppointments}
                            subtitle="Next 30 days"
                            icon={Clock}
                            color="purple"
                        />
                    </div>

                    {/* Quick Actions - Right Column, Row 1-2 */}
                    <div className="col-span-3 row-span-2 col-start-10">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    <QuickActionButton
                                        icon={Plus}
                                        label="Add Patient"
                                        onClick={() => setShowAddPatientModal(true)}
                                        variant="primary"
                                    />
                                    <QuickActionButton
                                        icon={Calendar}
                                        label="Add Appointment"
                                        onClick={() => setShowScheduleAppointmentModal(true)}
                                        variant="primary"
                                    />
                                    <QuickActionButton
                                        icon={Activity}
                                        label="View Records"
                                        onClick={() => navigate('/pediapro/patient_records')}
                                    />
                                    <QuickActionButton
                                        icon={Clock}
                                        label="Schedule"
                                        onClick={() => navigate('/pediapro/appointments')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Patients List - Row 2-4, Col 1-9 */}
                    <div className="col-span-9 row-span-3 row-start-2">
                        <Card className="h-full overflow-y-auto">
                            <CardHeader className="sticky top-0 bg-white z-10 pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        Today's Patients
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {loadingAppointments ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {appointments
                                            .filter((apt) => {
                                                if (!apt.appointment_date) return false
                                                const today = new Date()
                                                today.setHours(0, 0, 0, 0)
                                                const aptDate = new Date(apt.appointment_date)
                                                aptDate.setHours(0, 0, 0, 0)
                                                return aptDate.getTime() === today.getTime()
                                            })
                                            .slice(0, 10)
                                            .map((apt) => (
                                                <PatientCard
                                                    key={apt.id || apt.appointment_id}
                                                    patient={apt}
                                                />
                                            ))}
                                        {appointments.filter((apt) => {
                                            if (!apt.appointment_date) return false
                                            const today = new Date()
                                            today.setHours(0, 0, 0, 0)
                                            const aptDate = new Date(apt.appointment_date)
                                            aptDate.setHours(0, 0, 0, 0)
                                            return aptDate.getTime() === today.getTime()
                                        }).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                <p>No patients scheduled for today</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upcoming Appointments - Row 5-7, Col 1-9 */}
                    <div className="col-span-9 row-span-3 col-start-1 row-start-5">
                        <AppointmentOverviewCard
                            appointments={appointments}
                            isLoading={loadingAppointments}
                        />
                    </div>

                    {/* Health Metrics - Row 3-10, Col 10-12 */}
                    <div className="col-span-3 row-span-8 col-start-10 row-start-3 space-y-4">
                        {/* Overdue Vaccinations */}
                        <PediatricHealthCard
                            title="Overdue Vaccinations"
                            metric="Patients requiring follow-up"
                            value={dashboardMetrics.patientsWithOverdueVaccinations}
                            unit="patients"
                            icon={Syringe}
                            color="orange"
                        />

                        {/* Active Prescriptions */}
                        <PediatricHealthCard
                            title="Active Prescriptions"
                            metric="Last 30 days"
                            value={dashboardMetrics.activePrescriptionsCount}
                            unit="prescriptions"
                            icon={Activity}
                            color="purple"
                        />

                        {/* Pending Appointments */}
                        <PediatricHealthCard
                            title="Pending Appointments"
                            metric="Awaiting completion"
                            value={dashboardMetrics.pendingAppointmentsCount}
                            unit="appointments"
                            icon={Clock}
                            color="blue"
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddPatientModal && (
                <Suspense fallback={
                    <Dialog open={true}>
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </Dialog>
                }>
                    <StepperAddPatientModal
                        open={showAddPatientModal}
                        onClose={() => setShowAddPatientModal(false)}
                    />
                </Suspense>
            )}

            <Dialog open={showScheduleAppointmentModal} onOpenChange={setShowScheduleAppointmentModal}>
                <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                }>
                    <ScheduleAppointmentModal
                        onSuccess={handleScheduleAppointmentSuccess}
                    />
                </Suspense>
            </Dialog>
        </>
    )
}

export default DoctorDashboard
