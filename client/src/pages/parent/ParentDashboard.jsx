import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getParentChildren, getChildAppointments, getChildDetails } from '@/api/parent/children'
import { getMeasurements } from '@/api/doctors/measurements'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import Loader from '@/components/ui/Loader'
import { Skeleton } from '@/components/ui/skeleton'
import {
    TbHeartbeat,
    TbVaccine,
    TbRuler,
    TbWeight,
    TbAlertCircle,
    TbBell,
    TbCalendarEvent,
} from 'react-icons/tb'
import { BiCalendar, BiPhone } from 'react-icons/bi'
import {
    Users,
    Activity,
    FileText,
    Calendar,
    Bell,
    AlertTriangle,
    Clock,
    ChevronRight,
    TrendingUp,
    ScanQrCode,
    QrCode,
} from 'lucide-react'
import { cn } from '@/util/utils'
import { TooltipHelper } from '@/util/TooltipHelper'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts'
// Enhanced Appointment Card with better mobile support
function AppointmentOverviewCard({
    appointments = [],
    childColors = {},
    getChildName = () => 'Child',
    loading = false,
}) {
    const upcoming = (appointments || [])
        .map((a) => ({
            ...a,
            __date: new Date(`${a.appointment_date} ${a.appointment_time || '00:00'}`),
        }))
        .filter((a) => a.__date >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => a.__date - b.__date)

    const today = upcoming.filter((a) => {
        const aptDate = new Date(a.__date)
        const now = new Date()
        return aptDate.toDateString() === now.toDateString()
    })

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg md:text-xl">Upcoming Appointments</CardTitle>
                    </div>
                    <Link to="/parent/appointments">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                            View All
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
                {today.length > 0 && (
                    <Alert className="mt-3 bg-blue-50 border-blue-200">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <AlertTitle className="text-blue-900">Today's Appointments</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            You have {today.length} appointment{today.length > 1 ? 's' : ''}{' '}
                            scheduled for today
                        </AlertDescription>
                    </Alert>
                )}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-48 flex items-center justify-center">
                        <Loader />
                    </div>
                ) : upcoming.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No upcoming appointments</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Schedule a checkup with your healthcare provider
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[320px] pr-4">
                        <div className="space-y-3">
                            {upcoming.slice(0, 8).map((apt) => {
                                const isToday =
                                    new Date(apt.__date).toDateString() ===
                                    new Date().toDateString()
                                return (
                                    <div
                                        key={apt.id || apt.appointment_id}
                                        className={cn(
                                            'p-3 rounded-lg border transition-all hover:shadow-sm',
                                            isToday
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-white border-gray-200'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                                    childColors[apt.patient_id] || 'bg-gray-400'
                                                }`}
                                            >
                                                {getChildName(apt.patient_id)?.charAt(0) || 'C'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                                            {getChildName(apt.patient_id)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                                            <Clock className="w-3 h-3" />
                                                            <span>
                                                                {new Date(
                                                                    apt.__date
                                                                ).toLocaleString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            apt.status === 'scheduled'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="capitalize text-xs flex-shrink-0"
                                                    >
                                                        {apt.status || 'Scheduled'}
                                                    </Badge>
                                                </div>
                                                {apt.healthcare_facilities?.facility_name && (
                                                    <p className="text-xs text-gray-500 mt-2 truncate">
                                                        {apt.healthcare_facilities.facility_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

// Health Reminders Component
function HealthRemindersCard({ vaccinations = [], appointments = [], measurements = [] }) {
    const reminders = useMemo(() => {
        const alerts = []

        // Check for overdue vaccinations
        vaccinations.forEach((v) => {
            if (v.next_dose_due && new Date(v.next_dose_due) < new Date()) {
                alerts.push({
                    id: `vax-${v.vax_id}`,
                    type: 'vaccination',
                    severity: 'high',
                    title: 'Overdue Vaccination',
                    message: `${v.vaccine_name} - Dose ${v.dose_number || 'N/A'} is overdue`,
                    date: v.next_dose_due,
                    icon: TbVaccine,
                })
            } else if (v.next_dose_due) {
                const daysUntil = Math.ceil(
                    (new Date(v.next_dose_due) - new Date()) / (1000 * 60 * 60 * 24)
                )
                if (daysUntil <= 7 && daysUntil > 0) {
                    alerts.push({
                        id: `vax-upcoming-${v.vax_id}`,
                        type: 'vaccination',
                        severity: 'medium',
                        title: 'Upcoming Vaccination',
                        message: `${v.vaccine_name} - Dose ${
                            v.dose_number || 'N/A'
                        } due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
                        date: v.next_dose_due,
                        icon: Bell,
                    })
                }
            }
        })

        // Check for upcoming appointments (within 24 hours)
        appointments.forEach((apt) => {
            const aptDate = new Date(`${apt.appointment_date} ${apt.appointment_time || '00:00'}`)
            const hoursUntil = (aptDate - new Date()) / (1000 * 60 * 60)
            if (hoursUntil > 0 && hoursUntil <= 24) {
                alerts.push({
                    id: `apt-${apt.appointment_id}`,
                    type: 'appointment',
                    severity: 'high',
                    title: 'Appointment Reminder',
                    message: `Appointment scheduled ${
                        hoursUntil < 1
                            ? 'in less than an hour'
                            : `in ${Math.floor(hoursUntil)} hour${
                                  Math.floor(hoursUntil) > 1 ? 's' : ''
                              }`
                    }`,
                    date: aptDate,
                    icon: TbCalendarEvent,
                })
            }
        })

        // Check for measurement tracking (if no recent measurement in 3 months)
        if (measurements.length > 0) {
            const latestMeasurement = new Date(measurements[0].date)
            const monthsSince = (new Date() - latestMeasurement) / (1000 * 60 * 60 * 24 * 30)
            if (monthsSince > 3) {
                alerts.push({
                    id: 'measurement-reminder',
                    type: 'measurement',
                    severity: 'low',
                    title: 'Growth Tracking Due',
                    message: `Last measurement was ${Math.floor(monthsSince)} months ago`,
                    date: latestMeasurement,
                    icon: TbRuler,
                })
            }
        }

        return alerts.sort((a, b) => {
            const severityOrder = { high: 0, medium: 1, low: 2 }
            return severityOrder[a.severity] - severityOrder[b.severity]
        })
    }, [vaccinations, appointments, measurements])

    if (reminders.length === 0) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-lg md:text-xl">Health Reminders</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <TbHeartbeat className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-gray-600 font-medium">All caught up!</p>
                        <p className="text-sm text-gray-500 mt-1">No pending health reminders</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    <CardTitle className="text-lg md:text-xl">Health Reminders</CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                        {reminders.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-3">
                        {reminders.map((reminder) => {
                            const Icon = reminder.icon
                            const bgColor =
                                reminder.severity === 'high'
                                    ? 'bg-red-50'
                                    : reminder.severity === 'medium'
                                    ? 'bg-yellow-50'
                                    : 'bg-blue-50'
                            const borderColor =
                                reminder.severity === 'high'
                                    ? 'border-red-200'
                                    : reminder.severity === 'medium'
                                    ? 'border-yellow-200'
                                    : 'border-blue-200'
                            const textColor =
                                reminder.severity === 'high'
                                    ? 'text-red-700'
                                    : reminder.severity === 'medium'
                                    ? 'text-yellow-700'
                                    : 'text-blue-700'
                            const iconColor =
                                reminder.severity === 'high'
                                    ? 'text-red-600'
                                    : reminder.severity === 'medium'
                                    ? 'text-yellow-600'
                                    : 'text-blue-600'

                            return (
                                <Alert key={reminder.id} className={cn(bgColor, borderColor)}>
                                    <Icon className={cn('w-4 h-4', iconColor)} />
                                    <AlertTitle className="text-sm font-semibold">
                                        {reminder.title}
                                    </AlertTitle>
                                    <AlertDescription className={cn('text-xs', textColor)}>
                                        {reminder.message}
                                    </AlertDescription>
                                </Alert>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function ParentDashboard() {
    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [loadingAppointments, setLoadingAppointments] = useState(false)
    const [selectedChildId, setSelectedChildId] = useState('all')
    const [measurements, setMeasurements] = useState([])
    const [loadingMeasurements, setLoadingMeasurements] = useState(false)
    const [vaccinations, setVaccinations] = useState([])

    const childColors = useMemo(() => {
        const palette = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
        const map = {}
        ;(children || []).forEach((c, idx) => {
            const id = c.patient_id || c.patient?.patient_id || c.id
            map[id] = palette[idx % palette.length]
        })
        return map
    }, [children])

    // load children on mount
    useEffect(() => {
        fetchChildren()
    }, [])

    const getChildName = (childId) => {
        if (!childId) return 'Unknown Child'
        const found = children.find(
            (c) => (c.patient_id || c.patient?.patient_id || c.id) === childId
        )
        if (!found) return 'Unknown Child'
        if (found.firstname && found.lastname) return `${found.firstname} ${found.lastname}`
        return found.full_name || 'Unknown Child'
    }

    useEffect(() => {
        if (children.length > 0) {
            // default selected child is first child's patient id
            const first = children[0]
            const pid = first?.patient?.patient_id || first?.patient_id || 'all'
            setSelectedChildId(pid)
            fetchAllAppointments(children)
        }
    }, [children])

    const fetchChildren = async () => {
        try {
            setLoading(true)
            const response = await getParentChildren()
            if (response.status === 'success') {
                // transform to flatten patient object (matches other pages)
                const childrenData = response.data.map((accessRecord) => ({
                    ...accessRecord.patient,
                    access_id: accessRecord.access_id,
                    relationship: accessRecord.relationship,
                    granted_at: accessRecord.granted_at,
                    patient: accessRecord.patient,
                    patient_id: accessRecord.patient?.patient_id || accessRecord.patient_id,
                }))

                setChildren(childrenData)
            }
        } catch (err) {
            console.error('Error fetching children:', err)
            setError('Failed to load your children. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const fetchAllAppointments = async (childrenList) => {
        try {
            setLoadingAppointments(true)
            const allAppointments = []

            const promises = childrenList.map((child) => {
                const childId = child.patient_id || child.patient?.patient_id || child.id
                return getChildAppointments(childId)
                    .then((resp) => {
                        if (resp.status === 'success' && Array.isArray(resp.data)) {
                            return resp.data.map((apt) => ({ ...apt, patient_id: childId }))
                        }
                        return []
                    })
                    .catch(() => [])
            })

            const results = await Promise.all(promises)
            results.forEach((r) => allAppointments.push(...r))

            // sort by date/time
            allAppointments.sort((a, b) => {
                const dateA = new Date(`${a.appointment_date} ${a.appointment_time || '00:00'}`)
                const dateB = new Date(`${b.appointment_date} ${b.appointment_time || '00:00'}`)
                return dateA - dateB
            })

            setAppointments(allAppointments)
        } catch (err) {
            console.error('Error fetching appointments:', err)
        } finally {
            setLoadingAppointments(false)
        }
    }

    const fetchMeasurementsForChild = async (childId) => {
        if (!childId || childId === 'all') return setMeasurements([])
        try {
            setLoadingMeasurements(true)
            const resp = await getMeasurements(childId)
            if (resp?.status === 'success' && Array.isArray(resp.data)) {
                // map to chart-friendly format
                const mapped = resp.data.map((m) => ({
                    date: m.measurement_date || m.created_at || m.date || '',
                    weight: m.weight || null,
                    height: m.height || null,
                }))
                setMeasurements(mapped.reverse())
            } else if (Array.isArray(resp)) {
                const mapped = resp.map((m) => ({
                    date: m.measurement_date || m.created_at || m.date || '',
                    weight: m.weight || null,
                    height: m.height || null,
                }))
                setMeasurements(mapped.reverse())
            } else {
                setMeasurements([])
            }
        } catch (err) {
            console.error('Error fetching measurements:', err)
            setMeasurements([])
        } finally {
            setLoadingMeasurements(false)
        }
    }

    const fetchVaccinationsForChild = async (childId) => {
        if (!childId || childId === 'all') return setVaccinations([])
        try {
            const resp = await getChildDetails(childId)
            if (resp?.status === 'success' && resp.data) {
                const related = resp.data.related_records || []
                setVaccinations(related.vaccinations || [])
            } else {
                setVaccinations([])
            }
        } catch (err) {
            console.error('Error fetching vaccinations:', err)
            setVaccinations([])
        }
    }

    useEffect(() => {
        if (selectedChildId && selectedChildId !== 'all') {
            fetchMeasurementsForChild(selectedChildId)
            fetchVaccinationsForChild(selectedChildId)
        }
    }, [selectedChildId])

    // Render full dashboard layout immediately. Use skeletons only for specific data pieces while loading.

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            {/* Header with Quick Actions */}
            {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        My Family Health
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                        Track and manage your children's healthcare
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link to="/parent/appointments">
                        <Button variant="outline" size="sm" className="text-xs md:text-sm">
                            <Calendar className="w-4 h-4" />
                            Appointments
                        </Button>
                    </Link>
                    <Link to="/parent/children">
                        <Button variant="outline" size="sm" className="text-xs md:text-sm">
                            <FileText className="w-4 h-4" />
                            Records
                        </Button>
                    </Link>
                </div>
            </div> */}

            {/* Quick Stats - Enhanced and Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* My Children Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                    My Children
                                </p>
                                {loading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {children.length}
                                    </p>
                                )}
                                <Link
                                    to="/parent/children"
                                    className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                                >
                                    View All
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Appointments Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                    Upcoming
                                </p>
                                {loading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {
                                            appointments.filter((a) => {
                                                const d = new Date(a.appointment_date)
                                                d.setHours(0, 0, 0, 0)
                                                return (
                                                    d >= new Date(new Date().setHours(0, 0, 0, 0))
                                                )
                                            }).length
                                        }
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Appointments</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vaccinations Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                    Overdue Vaccines
                                </p>
                                {loading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p
                                        className={cn(
                                            'text-2xl md:text-3xl font-bold',
                                            vaccinations.filter(
                                                (v) =>
                                                    v.next_dose_due &&
                                                    new Date(v.next_dose_due) < new Date()
                                            ).length > 0
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                        )}
                                    >
                                        {
                                            vaccinations.filter(
                                                (v) =>
                                                    v.next_dose_due &&
                                                    new Date(v.next_dose_due) < new Date()
                                            ).length
                                        }
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {vaccinations.filter(
                                        (v) =>
                                            v.next_dose_due &&
                                            new Date(v.next_dose_due) < new Date()
                                    ).length === 0
                                        ? 'All up to date!'
                                        : 'Need attention'}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <TbVaccine className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Access Card - Desktop only */}
                <Card className="shadow-sm hover:shadow-md transition-shadow hidden lg:flex">
                    <CardContent className="pt-6 w-full">
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/parent/qr_scanner">
                                <Button
                                    variant="ghost"
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 hover:border-blue-400 hover:bg-blue-50 rounded-lg"
                                >
                                    <TooltipHelper content="Scan QR Code" side="top">
                                        <ScanQrCode className="w-6 h-6 text-blue-600" />
                                    </TooltipHelper>
                                    <span className="text-xs font-medium text-gray-700">
                                        Scan QR
                                    </span>
                                </Button>
                            </Link>
                            <Link to="/parent/share-qr">
                                <Button
                                    variant="ghost"
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 hover:border-green-400 hover:bg-green-50 rounded-lg"
                                >
                                    <TooltipHelper content="Share QR Code" side="top">
                                        <QrCode className="w-6 h-6 text-green-600" />
                                    </TooltipHelper>
                                    <span className="text-xs font-medium text-gray-700">
                                        Share QR
                                    </span>
                                </Button>
                            </Link>
                            <Link to="/parent/children">
                                <Button
                                    variant="ghost"
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 hover:border-purple-400 hover:bg-purple-50 rounded-lg"
                                >
                                    <FileText className="w-6 h-6 text-purple-600" />
                                    <span className="text-xs font-medium text-gray-700">
                                        Records
                                    </span>
                                </Button>
                            </Link>
                            <Link to="/parent/appointments">
                                <Button
                                    variant="ghost"
                                    className="w-full h-auto py-4 px-3 flex flex-col gap-2 hover:border-orange-400 hover:bg-orange-50 rounded-lg"
                                >
                                    <Calendar className="w-6 h-6 text-orange-600" />
                                    <span className="text-xs font-medium text-gray-700">
                                        Appointments
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Health Reminders - Priority Section */}
            <HealthRemindersCard
                vaccinations={vaccinations}
                appointments={appointments}
                measurements={measurements}
            />

            {/* Main Grid: Appointments + Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Appointments Section */}
                <AppointmentOverviewCard
                    appointments={appointments}
                    childrenList={children}
                    childColors={childColors}
                    getChildName={getChildName}
                    loading={loadingAppointments}
                />

                {/* Growth Chart Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <CardTitle className="text-lg md:text-xl">
                                    Growth Tracking
                                </CardTitle>
                            </div>
                            <select
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full sm:w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Select Child</option>
                                {children.map((c) => {
                                    const id = c.patient_id || c.patient?.patient_id || c.id
                                    return (
                                        <option key={id} value={id}>
                                            {c.firstname} {c.lastname}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingMeasurements ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader />
                            </div>
                        ) : measurements.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">
                                    No growth measurements available
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Select a child to view their growth chart
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TbWeight className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs font-medium text-blue-900">
                                                Weight
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-blue-700">
                                            {measurements[0]?.weight
                                                ? `${measurements[0].weight} kg`
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TbRuler className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-medium text-green-900">
                                                Height
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-green-700">
                                            {measurements[0]?.height
                                                ? `${measurements[0].height} cm`
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ height: 240 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={measurements}
                                            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(d) =>
                                                    new Date(d).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })
                                                }
                                                style={{ fontSize: '11px' }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                orientation="left"
                                                style={{ fontSize: '11px' }}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                style={{ fontSize: '11px' }}
                                            />
                                            <Tooltip
                                                labelFormatter={(lbl) =>
                                                    new Date(lbl).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })
                                                }
                                                contentStyle={{
                                                    fontSize: '12px',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="weight"
                                                stroke="#2563eb"
                                                name="Weight (kg)"
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: '#2563eb' }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="height"
                                                stroke="#10b981"
                                                name="Height (cm)"
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: '#10b981' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Vaccination Summary - Full Width */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <TbVaccine className="w-5 h-5 text-yellow-600" />
                        <CardTitle className="text-lg md:text-xl">Vaccination Timeline</CardTitle>
                        {selectedChildId !== 'all' && (
                            <Badge variant="outline" className="ml-auto">
                                {children.find(
                                    (c) =>
                                        (c.patient_id || c.patient?.patient_id) === selectedChildId
                                )?.firstname || 'Child'}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {vaccinations.length === 0 ? (
                        <div className="text-center py-12">
                            <TbVaccine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">
                                No vaccination records available
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Select a child to view their immunization history
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {vaccinations.slice(0, 9).map((v) => {
                                const nextDue = v.next_dose_due ? new Date(v.next_dose_due) : null
                                const isOverdue = nextDue && nextDue < new Date()
                                const isUpcoming =
                                    nextDue &&
                                    !isOverdue &&
                                    (nextDue - new Date()) / (1000 * 60 * 60 * 24) <= 30

                                return (
                                    <div
                                        key={v.vax_id || v.id}
                                        className={cn(
                                            'p-3 rounded-lg border transition-all',
                                            isOverdue
                                                ? 'bg-red-50 border-red-200'
                                                : isUpcoming
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-white border-gray-200'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="font-semibold text-sm text-gray-900 flex-1">
                                                {v.vaccine_name}
                                            </p>
                                            {v.dose_number && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs flex-shrink-0"
                                                >
                                                    Dose {v.dose_number}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-600">
                                                {v.administered_date ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        {new Date(
                                                            v.administered_date
                                                        ).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                ) : nextDue ? (
                                                    <span
                                                        className={cn(
                                                            'flex items-center gap-1',
                                                            isOverdue
                                                                ? 'text-red-600 font-medium'
                                                                : isUpcoming
                                                                ? 'text-yellow-600 font-medium'
                                                                : ''
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'w-1.5 h-1.5 rounded-full',
                                                                isOverdue
                                                                    ? 'bg-red-500'
                                                                    : isUpcoming
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-blue-500'
                                                            )}
                                                        ></span>
                                                        {isOverdue
                                                            ? 'Overdue'
                                                            : `Due ${nextDue.toLocaleDateString(
                                                                  'en-US',
                                                                  { month: 'short', day: 'numeric' }
                                                              )}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Planned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Children List - Enhanced */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Children</h2>
                    {children.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {children.length} {children.length === 1 ? 'child' : 'children'}
                        </Badge>
                    )}
                </div>

                {children.length === 0 ? (
                    <Card className="shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-900 font-semibold text-lg mb-2">
                                    No children registered
                                </p>
                                <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    Contact your healthcare provider to link your child's medical
                                    records to your account.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {children.map((child) => {
                            const patient = child.patient
                            const childId = patient.patient_id
                            const colorClass = childColors[childId] || 'bg-gray-400'

                            return (
                                <Link
                                    key={patient.patient_id}
                                    to={`/parent/child/${patient.patient_id}`}
                                    className="group"
                                >
                                    <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={cn(
                                                        'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0',
                                                        colorClass
                                                    )}
                                                >
                                                    {patient.firstname?.charAt(0)}
                                                    {patient.lastname?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-base md:text-lg truncate">
                                                        {patient.firstname}{' '}
                                                        {patient.middlename
                                                            ? `${patient.middlename} `
                                                            : ''}
                                                        {patient.lastname}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <CardDescription className="text-xs md:text-sm">
                                                            {patient.age || 'Age unknown'}
                                                        </CardDescription>
                                                        <Badge
                                                            variant={
                                                                patient.sex === 'male'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {patient.sex === 'male' ? 'M' : 'F'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-xs md:text-sm">
                                            <Separator className="mb-3" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    Relationship
                                                </span>
                                                <span className="font-semibold capitalize text-gray-900">
                                                    {child.relationship}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Birth Date
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {new Date(
                                                        patient.date_of_birth
                                                    ).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            {patient.bloodtype && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        Blood Type
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-semibold"
                                                    >
                                                        {patient.bloodtype}
                                                    </Badge>
                                                </div>
                                            )}
                                            <Separator className="my-3" />
                                            <div className="flex items-center justify-center pt-2">
                                                <span className="text-blue-600 text-xs md:text-sm font-semibold group-hover:text-blue-700 flex items-center gap-1">
                                                    View Full Profile
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Important Notice */}
            <Alert className="border-blue-200 bg-blue-50 mb-20 lg:mb-0">
                <TbHeartbeat className="w-5 h-5 text-blue-600" />
                <AlertTitle className="text-blue-900 font-semibold">Read-Only Access</AlertTitle>
                <AlertDescription className="text-blue-700">
                    You have view-only access to your children's medical records. For any updates or
                    changes, please contact your healthcare provider.
                </AlertDescription>
            </Alert>

            {/* Mobile Bottom Navigation Overlay - Quick Actions */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-2xl">
                <div className="grid grid-cols-4 gap-0 px-2 py-3 safe-area-inset-bottom">
                    <Link
                        to="/parent/scan-qr"
                        className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg active:bg-blue-100 transition-colors"
                    >
                        <TooltipHelper content="Scan QR Code" side="top">
                            <ScanQrCode className="w-6 h-6 text-blue-600" />
                        </TooltipHelper>
                    </Link>
                    <Link
                        to="/parent/share-qr"
                        className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg active:bg-green-100 transition-colors"
                    >
                        <TooltipHelper content="Share QR Code" side="top">
                            <QrCode className="w-6 h-6 text-green-600" />
                        </TooltipHelper>
                    </Link>
                    <Link
                        to="/parent/children"
                        className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg active:bg-purple-100 transition-colors"
                    >
                        <FileText className="w-6 h-6 text-purple-600" />
                        <span className="text-[10px] font-medium text-gray-700">Records</span>
                    </Link>
                    <Link
                        to="/parent/appointments"
                        className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg active:bg-orange-100 transition-colors"
                    >
                        <Calendar className="w-6 h-6 text-orange-600" />
                        <span className="text-[10px] font-medium text-gray-700">Appointments</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ParentDashboard
