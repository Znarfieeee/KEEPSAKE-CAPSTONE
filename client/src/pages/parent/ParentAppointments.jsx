import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { getParentChildren, getChildAppointments } from '@/api/parent/children'
import { showToast } from '@/util/alertHelper'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Search, RefreshCw, Calendar, Clock, AlertCircle, History } from 'lucide-react'
import { cn, getStatusBadgeColor } from '@/util/utils'

// Parent Appointment Components
import ChildFilterTabs from '@/components/parent/appointments/ChildFilterTabs'
import ParentTodaySchedule from '@/components/parent/appointments/ParentTodaySchedule'
import ParentCalendarGrid from '@/components/parent/appointments/ParentCalendarGrid'
import ParentAppointmentCard from '@/components/parent/appointments/ParentAppointmentCard'

// Child color palette for visual distinction
const CHILD_COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
]

const ParentAppointments = () => {
    // State management
    const [children, setChildren] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)

    // Filter states
    const [selectedChildId, setSelectedChildId] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [timeFilter, setTimeFilter] = useState('upcoming') // 'upcoming', 'past', 'all'

    // Hooks
    const { user } = useAuth()
    const navigate = useNavigate()

    // Generate child colors mapping
    const childColors = useMemo(() => {
        const colors = {}
        children.forEach((child, index) => {
            const childId = child.patient_id || child.id
            colors[childId] = CHILD_COLORS[index % CHILD_COLORS.length]
        })
        return colors
    }, [children])

    // Calculate appointment counts per child
    const appointmentCounts = useMemo(() => {
        const counts = {}
        children.forEach((child) => {
            const childId = child.patient_id || child.id
            counts[childId] = appointments.filter((apt) => apt.patient_id === childId).length
        })
        return counts
    }, [children, appointments])

    /**
     * Get child name by ID
     */
    const getChildName = useCallback(
        (childId) => {
            const child = children.find((c) => (c.patient_id || c.id) === childId)
            if (child) {
                return child.firstname && child.lastname
                    ? `${child.firstname} ${child.lastname}`
                    : child.full_name || 'Unknown Child'
            }
            return 'Unknown Child'
        },
        [children]
    )

    /**
     * Fetch all children and their appointments
     */
    const fetchData = useCallback(
        async (showRefreshIndicator = false) => {
            if (!user?.id) {
                setError('User not authenticated')
                setLoading(false)
                return
            }

            try {
                if (showRefreshIndicator) {
                    setRefreshing(true)
                } else {
                    setLoading(true)
                }
                setError(null)

                // Fetch children first
                console.log('Fetching children for parent:', user.id)
                const childrenResponse = await getParentChildren()

                if (childrenResponse.status !== 'success' || !childrenResponse.data) {
                    throw new Error(childrenResponse.message || 'Failed to fetch children')
                }

                // Transform the children data to flatten the patient object
                // API returns: { access_id, relationship, patient: {...} }
                // We need: { patient_id, firstname, lastname, relationship, ... }
                const childrenData = childrenResponse.data.map((accessRecord) => ({
                    ...accessRecord.patient,
                    access_id: accessRecord.access_id,
                    relationship: accessRecord.relationship,
                    granted_at: accessRecord.granted_at,
                    // Ensure patient_id is at top level
                    patient_id: accessRecord.patient?.patient_id || accessRecord.patient_id,
                }))

                console.log(`Found ${childrenData.length} children`)
                setChildren(childrenData)

                // Fetch appointments for all children in parallel
                const allAppointments = []

                if (childrenData.length > 0) {
                    const appointmentPromises = childrenData.map((child) => {
                        const childId = child.patient_id || child.id
                        return getChildAppointments(childId)
                            .then((response) => {
                                if (response.status === 'success' && response.data) {
                                    // Add patient_id to each appointment for child identification
                                    return response.data.map((apt) => ({
                                        ...apt,
                                        patient_id: childId,
                                    }))
                                }
                                return []
                            })
                            .catch((err) => {
                                console.error(
                                    `Error fetching appointments for child ${childId}:`,
                                    err
                                )
                                return []
                            })
                    })

                    const appointmentResults = await Promise.all(appointmentPromises)
                    appointmentResults.forEach((childAppointments) => {
                        allAppointments.push(...childAppointments)
                    })
                }

                // Sort all appointments by date and time
                const sortedAppointments = allAppointments.sort((a, b) => {
                    const dateA = new Date(`${a.appointment_date} ${a.appointment_time || '00:00'}`)
                    const dateB = new Date(`${b.appointment_date} ${b.appointment_time || '00:00'}`)
                    return dateA - dateB
                })

                console.log(`Loaded ${sortedAppointments.length} total appointments`)
                setAppointments(sortedAppointments)
            } catch (err) {
                console.error('Error fetching data:', err)
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    'Error loading appointments. Please try again later.'
                setError(errorMessage)
                showToast('error', errorMessage)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [user?.id]
    )

    // Initial data fetch
    useEffect(() => {
        if (user?.id) {
            fetchData()
        }
    }, [fetchData, user?.id])

    /**
     * Filter appointments based on selected criteria
     */
    const filteredAppointments = useMemo(() => {
        let filtered = [...appointments]

        // Filter by child
        if (selectedChildId !== 'all') {
            filtered = filtered.filter((apt) => apt.patient_id === selectedChildId)
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(
                (apt) => apt.status?.toLowerCase() === statusFilter.toLowerCase()
            )
        }

        // Filter by time (upcoming/past)
        const now = new Date()
        if (timeFilter === 'upcoming') {
            filtered = filtered.filter((apt) => {
                const aptDate = new Date(
                    `${apt.appointment_date} ${apt.appointment_time || '00:00'}`
                )
                return aptDate >= now
            })
        } else if (timeFilter === 'past') {
            filtered = filtered.filter((apt) => {
                const aptDate = new Date(
                    `${apt.appointment_date} ${apt.appointment_time || '00:00'}`
                )
                return aptDate < now
            })
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((apt) => {
                const childName = getChildName(apt.patient_id).toLowerCase()
                const doctorName = (apt.doctor_name || '').toLowerCase()
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

        return filtered
    }, [appointments, selectedChildId, statusFilter, timeFilter, searchQuery, getChildName])

    /**
     * Get today's appointments
     */
    const todayAppointments = useMemo(() => {
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
     * Handle child selection
     */
    const handleSelectChild = useCallback((childId) => {
        setSelectedChildId(childId)
    }, [])

    /**
     * Handle refresh
     */
    const handleRefresh = useCallback(() => {
        fetchData(true)
    }, [fetchData])

    // Loading skeleton
    if (loading && !refreshing) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                    <div className="lg:col-span-4">
                        <Skeleton className="h-[490px] w-full" />
                    </div>
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[490px] w-full" />
                    </div>
                </div>
            </div>
        )
    }

    // Authentication error
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

    // No children found
    if (children.length === 0 && !loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            My Children's Appointments
                        </h1>
                        <p className="text-gray-600">
                            View and track appointments for your children
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Children Found
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                            You don't have any children linked to your account yet. Please contact
                            your healthcare facility to grant you access.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 min-h-screen p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Children's Appointments</h1>
                    <p className="text-gray-600">View and track appointments for your children</p>
                </div>
                {/* 
                <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button> */}
            </div>

            {/* Child Filter Tabs */}
            <ChildFilterTabs
                children={children}
                selectedChildId={selectedChildId}
                onSelectChild={handleSelectChild}
                appointmentCounts={appointmentCounts}
                childColors={childColors}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-4">
                    <ParentTodaySchedule
                        appointments={
                            selectedChildId === 'all'
                                ? todayAppointments
                                : todayAppointments.filter(
                                      (apt) => apt.patient_id === selectedChildId
                                  )
                        }
                        children={children}
                        childColors={childColors}
                        loading={refreshing}
                    />
                </div>

                {/* Calendar View */}
                <div className="lg:col-span-2">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar View</h3>
                        <p className="text-sm text-gray-500">Monthly appointment overview</p>
                    </div>
                    <ParentCalendarGrid
                        appointments={
                            selectedChildId === 'all'
                                ? appointments
                                : appointments.filter((apt) => apt.patient_id === selectedChildId)
                        }
                        children={children}
                        childColors={childColors}
                    />
                </div>
            </div>

            {/* All Appointments Section */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold">All Appointments</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {filteredAppointments.length} appointment
                                {filteredAppointments.length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search appointments..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-full sm:w-64"
                                />
                            </div>

                            {/* Time Filter Tabs */}
                            <Tabs
                                value={timeFilter}
                                onValueChange={setTimeFilter}
                                className="w-auto"
                            >
                                <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                                    <TabsTrigger value="upcoming" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Upcoming
                                    </TabsTrigger>
                                    <TabsTrigger value="past" className="text-xs">
                                        <History className="h-3 w-3 mr-1" />
                                        Past
                                    </TabsTrigger>
                                    <TabsTrigger value="all" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        All
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Badge
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setStatusFilter('all')}
                        >
                            All Status
                        </Badge>
                        <Badge
                            variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer',
                                statusFilter === 'scheduled' && 'bg-blue-500'
                            )}
                            onClick={() => setStatusFilter('scheduled')}
                        >
                            Scheduled
                        </Badge>
                        <Badge
                            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer',
                                statusFilter === 'confirmed' && 'bg-green-500'
                            )}
                            onClick={() => setStatusFilter('confirmed')}
                        >
                            Confirmed
                        </Badge>
                        <Badge
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer',
                                statusFilter === 'completed' && 'bg-gray-500'
                            )}
                            onClick={() => setStatusFilter('completed')}
                        >
                            Completed
                        </Badge>
                        <Badge
                            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer',
                                statusFilter === 'cancelled' && 'bg-red-500'
                            )}
                            onClick={() => setStatusFilter('cancelled')}
                        >
                            Cancelled
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    {filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredAppointments.map((appointment) => (
                                <ParentAppointmentCard
                                    key={appointment.appointment_id || appointment.id}
                                    appointment={appointment}
                                    childName={getChildName(appointment.patient_id)}
                                    childColor={
                                        childColors[appointment.patient_id] || 'bg-blue-500'
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No appointments found
                            </h3>
                            <p className="text-gray-500">
                                {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
                                    ? 'Try adjusting your filters or search query.'
                                    : 'No appointments have been scheduled yet.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                            fetchData()
                        }}
                    >
                        Retry
                    </Button>
                </div>
            )}
        </div>
    )
}

export default ParentAppointments
