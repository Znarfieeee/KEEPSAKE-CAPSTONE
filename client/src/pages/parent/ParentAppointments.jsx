import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { getParentChildren, getChildAppointments } from '@/api/parent/children'
import { showToast } from '@/util/alertHelper'

// UI Components
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

// Parent Appointment Components
import ChildSelector from '@/components/parent/appointments/ChildSelector'
import ParentTodaySchedule from '@/components/parent/appointments/ParentTodaySchedule'
import ParentCalendarGrid from '@/components/parent/appointments/ParentCalendarGrid'
import ParentAllAppointments from '@/components/parent/appointments/ParentAllAppointments'

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

    // Filter states (only for child selection - other filters are in AllAppointments component)
    const [selectedChildId, setSelectedChildId] = useState('all')

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
                            .catch(() => {
                                // Silently fail for individual child - continue with others
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

                setAppointments(sortedAppointments)
            } catch (err) {
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
     * Get appointments filtered by selected child (for Today's Schedule and Calendar)
     */
    const childFilteredAppointments = useMemo(() => {
        if (selectedChildId === 'all') {
            return appointments
        }
        return appointments.filter((apt) => apt.patient_id === selectedChildId)
    }, [appointments, selectedChildId])

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
                        {/* <p className="text-gray-600">
                            View and track appointments for your children
                        </p> */}
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
        <div className="space-y-4 sm:space-y-6 min-h-screen p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        My Children's Appointments
                    </h1>
                </div>
            </div>

            {/* Child Selector */}
            <ChildSelector
                children={children}
                selectedChildId={selectedChildId}
                onSelectChild={handleSelectChild}
                appointmentCounts={appointmentCounts}
                childColors={childColors}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-4">
                    <ParentTodaySchedule
                        appointments={todayAppointments.filter((apt) =>
                            selectedChildId === 'all' ? true : apt.patient_id === selectedChildId
                        )}
                        children={children}
                        childColors={childColors}
                        loading={refreshing}
                    />
                </div>

                {/* Calendar View */}
                <div className="lg:col-span-2">
                    <div className="mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                            Calendar View
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Monthly appointment overview
                        </p>
                    </div>
                    <ParentCalendarGrid
                        appointments={childFilteredAppointments}
                        children={children}
                        childColors={childColors}
                    />
                </div>
            </div>

            {/* All Appointments Section */}
            <ParentAllAppointments
                appointments={childFilteredAppointments}
                children={children}
                childColors={childColors}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                getChildName={getChildName}
            />

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
