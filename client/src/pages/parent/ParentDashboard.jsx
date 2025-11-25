import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getParentChildren, getChildAppointments, getChildDetails } from '@/api/parent/children'
import { getMeasurements } from '@/api/doctors/measurements'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loader from '@/components/ui/Loader'
import { Skeleton } from '@/components/ui/skeleton'
import { TbHeartbeat, TbVaccine, TbRuler } from 'react-icons/tb'
import { BiCalendar } from 'react-icons/bi'
import { Users } from 'lucide-react'
import { ParentTodaySchedule } from '@/components/parent/appointments'
import { cn, getStatusBadgeColor } from '@/util/utils'
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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between w-full">
                    <CardTitle>Upcoming Appointments</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-48 flex items-center justify-center">
                        <Loader />
                    </div>
                ) : upcoming.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-600">
                        No upcoming appointments
                    </div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {upcoming.slice(0, 6).map((apt) => (
                            <div
                                key={apt.id || apt.appointment_id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                            childColors[apt.patient_id] || 'bg-gray-400'
                                        }`}
                                    >
                                        {getChildName(apt.patient_id)?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {getChildName(apt.patient_id)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(apt.__date).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right text-xs text-gray-500 mr-2 hidden sm:block">
                                        {apt.healthcare_facilities?.facility_name}
                                    </div>
                                    <span
                                        className={cn(
                                            'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                                            getStatusBadgeColor(apt.status)
                                        )}
                                    >
                                        {apt.status || 'Scheduled'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                {/* <p className="text-gray-600 mt-2">
                    Welcome! View and manage your children's health information.
                </p> */}
                <Link to="appointments" class>
                    View Appointments
                </Link>
                <Link to="/parent/children" class>
                    View Records
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 `-  `gap-6">
                <Card className="h-36 flex items-center justify-center">
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-center w-full">
                                <p className="text-sm text-gray-600">My Children</p>
                                {loading ? (
                                    <div className="mt-2">
                                        <Skeleton className="h-8 w-16 mx-auto" />
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {children.length}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-36">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <BiCalendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Upcoming Appointments</p>
                                {loading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
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
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-36">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <TbVaccine className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Overdue Vaccinations</p>
                                {loading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {
                                            vaccinations.filter(
                                                (v) =>
                                                    v.next_dose_due &&
                                                    new Date(v.next_dose_due) < new Date()
                                            ).length
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-36">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-green-100 rounded-full">
                                <TbRuler className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Latest Measurement</p>
                                {loading || loadingMeasurements ? (
                                    <Skeleton className="h-8 w-28" />
                                ) : measurements.length > 0 ? (
                                    <>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {measurements[0].weight
                                                ? `${measurements[0].weight} kg`
                                                : '—'}{' '}
                                            /{' '}
                                            {measurements[0].height
                                                ? `${measurements[0].height} cm`
                                                : '—'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {measurements[0].date
                                                ? new Date(
                                                      measurements[0].date
                                                  ).toLocaleDateString()
                                                : ''}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">—</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid: Schedule + Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <AppointmentOverviewCard
                        appointments={appointments}
                        childrenList={children}
                        childColors={childColors}
                        getChildName={getChildName}
                        loading={loadingAppointments}
                    />
                </div>

                <div className="space-y-6">
                    {/* Growth Chart Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between w-full">
                                <CardTitle>Growth Milestones</CardTitle>
                                <div className="w-40">
                                    <select
                                        value={selectedChildId}
                                        onChange={(e) => setSelectedChildId(e.target.value)}
                                        className="w-full rounded-md border px-2 py-1 text-sm"
                                    >
                                        <option value="all">All Children</option>
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
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingMeasurements ? (
                                <div className="h-64 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : measurements.length === 0 ? (
                                <div className="text-center py-12">
                                    <TbHeartbeat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600">
                                        No growth measurements available
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Open a child profile to view detailed measurements.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={measurements}
                                            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(d) =>
                                                    new Date(d).toLocaleDateString()
                                                }
                                            />
                                            <YAxis yAxisId="left" orientation="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip
                                                labelFormatter={(lbl) =>
                                                    new Date(lbl).toLocaleDateString()
                                                }
                                            />
                                            <Legend />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="weight"
                                                stroke="#2563eb"
                                                name="Weight (kg)"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="height"
                                                stroke="#10b981"
                                                name="Height (cm)"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vaccination Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Vaccination Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {vaccinations.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">
                                        No vaccination records available
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Select a child to view immunizations.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {vaccinations.slice(0, 6).map((v) => {
                                        const nextDue = v.next_dose_due
                                            ? new Date(v.next_dose_due)
                                            : null
                                        const isOverdue = nextDue && nextDue < new Date()
                                        return (
                                            <div
                                                key={v.vax_id || v.id}
                                                className="flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-medium">{v.vaccine_name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {v.dose_number
                                                            ? `Dose ${v.dose_number}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <div>
                                                    {v.administered_date ? (
                                                        <Badge variant="outline">
                                                            {new Date(
                                                                v.administered_date
                                                            ).toLocaleDateString()}
                                                        </Badge>
                                                    ) : nextDue ? (
                                                        <Badge
                                                            variant={
                                                                isOverdue
                                                                    ? 'destructive'
                                                                    : 'default'
                                                            }
                                                        >
                                                            {isOverdue
                                                                ? 'Overdue'
                                                                : `Due ${nextDue.toLocaleDateString()}`}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Planned</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Children List */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Children</h2>

                {children.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <TbHeartbeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg mb-2">No children registered</p>
                                <p className="text-gray-500 text-sm">
                                    Contact your healthcare provider to link your child's medical
                                    records.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child) => {
                            const patient = child.patient
                            return (
                                <Link
                                    key={patient.patient_id}
                                    to={`/parent/child/${patient.patient_id}`}
                                >
                                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {patient.firstname}{' '}
                                                        {patient.middlename
                                                            ? `${patient.middlename} `
                                                            : ''}
                                                        {patient.lastname}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {patient.age || 'Age not calculated'}
                                                    </CardDescription>
                                                </div>
                                                <Badge
                                                    variant={
                                                        patient.sex === 'male'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {patient.sex === 'male' ? 'Male' : 'Female'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Relationship:
                                                    </span>
                                                    <span className="font-medium capitalize">
                                                        {child.relationship}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Date of Birth:
                                                    </span>
                                                    <span className="font-medium">
                                                        {new Date(
                                                            patient.date_of_birth
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {patient.bloodtype && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">
                                                            Blood Type:
                                                        </span>
                                                        <span className="font-medium">
                                                            {patient.bloodtype}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t">
                                                <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                                    View Details →
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
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <TbHeartbeat className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-blue-900">Read-Only Access</p>
                            <p className="text-sm text-blue-700 mt-1">
                                You have view-only access to your children's medical records. For
                                any updates or changes, please contact your healthcare provider.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ParentDashboard
