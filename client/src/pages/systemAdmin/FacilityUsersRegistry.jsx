import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { getAllFacilityUsers } from '@/api/admin/facility'
import { useFacilityUsersRealtime } from '@/hook/useSupabaseRealtime'

// UI Components
import FacilityUsersTable from '@/components/System Administrator/sysAdmin_facilities/FacilityUsersTable'
import Unauthorized from '@/components/Unauthorized'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Download, ArrowLeft } from 'lucide-react'

// Helper
import { showToast } from '@/util/alertHelper'
import { displayRoles } from '@/util/roleHelper'

const FacilityUsersRegistry = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [facilityUsers, setFacilityUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [facilityFilter, setFacilityFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Get facility from URL query params
    const facilityIdFromUrl = searchParams.get('facility')

    // Fetch facility users
    const fetchFacilityUsers = useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllFacilityUsers({ bust_cache: false })

            if (response.status === 'success') {
                setFacilityUsers(response.data)
            } else {
                showToast('error', response.message || 'Failed to load facility users')
            }
        } catch (error) {
            console.error('Error fetching facility users:', error)
            showToast('error', 'Failed to load facility users')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchFacilityUsers()
    }, [fetchFacilityUsers])

    // Set facility filter from URL when component mounts or URL changes
    useEffect(() => {
        if (facilityIdFromUrl) {
            setFacilityFilter(facilityIdFromUrl)
        }
    }, [facilityIdFromUrl])

    // Handle real-time updates for facility_users table
    const handleFacilityUserChange = useCallback(({ type, facilityUser }) => {
        console.log(`Facility user ${type}:`, facilityUser)

        switch (type) {
            case 'INSERT':
                // Refetch data to get complete user details with proper joins
                fetchFacilityUsers()
                showToast('success', 'New user assigned to facility')
                break

            case 'UPDATE':
                // Refetch data to ensure consistency
                fetchFacilityUsers()
                showToast('info', 'Facility user assignment updated')
                break

            case 'DELETE':
                // Refetch data to update the list
                fetchFacilityUsers()
                showToast('warning', 'User removed from facility')
                break

            default:
                console.warn('Unknown real-time event type:', type)
        }
    }, [fetchFacilityUsers])

    // Set up real-time subscription
    useFacilityUsersRealtime({
        onFacilityUserChange: handleFacilityUserChange,
    })

    // Filter facility users
    const filteredUsers = useMemo(() => {
        return facilityUsers.filter((fu) => {
            const matchesSearch = search
                ? [
                      fu.firstname,
                      fu.lastname,
                      fu.email,
                      fu.specialty,
                      fu.facility_name,
                      fu.department,
                  ].some((field) => String(field).toLowerCase().includes(search.toLowerCase()))
                : true

            const matchesStatus =
                statusFilter && statusFilter !== 'all'
                    ? fu.is_active === (statusFilter === 'active')
                    : true

            const matchesFacility =
                facilityFilter && facilityFilter !== 'all'
                    ? fu.facility_id === facilityFilter
                    : true

            return matchesSearch && matchesStatus && matchesFacility
        })
    }, [facilityUsers, search, statusFilter, facilityFilter])

    // Get unique facilities for filter
    const uniqueFacilities = useMemo(() => {
        const facilities = new Map()
        facilityUsers.forEach((fu) => {
            if (!facilities.has(fu.facility_id)) {
                facilities.set(fu.facility_id, fu.facility_name)
            }
        })
        return Array.from(facilities, ([id, name]) => ({ id, name }))
    }, [facilityUsers])

    // Get selected facility name for display
    const selectedFacilityName = useMemo(() => {
        if (facilityFilter === 'all') return null
        const facility = uniqueFacilities.find((f) => f.id === facilityFilter)
        return facility?.name
    }, [facilityFilter, uniqueFacilities])

    // Role-based guard
    if (user.role !== 'admin') {
        return <Unauthorized />
    }

    const handleView = (user) => {
        console.log('View user:', user)
        showToast('info', 'User detail modal coming soon')
    }

    const handleGoto = (facilityId) => {
        // Navigate to the facility's detail page or dashboard
        navigate(`/system-admin/facilities/${facilityId}`)
    }

    const handleEdit = (user) => {
        console.log('Edit user:', user)
        showToast('info', 'Edit user assignment modal coming soon')
    }

    const handleDelete = async (user) => {
        try {
            showToast('info', 'Remove user feature coming soon')
            // TODO: Implement API endpoint for removing users from facilities
            // This should call: DELETE /admin/facilities/${user.facility_id}/users/${user.user_id}
        } catch (error) {
            console.error('Error removing user from facility:', error)
            showToast('error', 'Failed to remove user from facility')
        }
    }

    const handleExportCSV = () => {
        const headers = [
            'Full Name',
            'Email',
            'Role',
            'Department',
            'Specialty',
            'Contact',
            'Facility',
            'Start Date',
            'Status',
        ]
        const rows = facilityUsers.map((fu) => [
            `${fu.firstname} ${fu.lastname}`,
            fu.email,
            displayRoles(fu.role),
            fu.department || '—',
            fu.specialty || '—',
            fu.phone_number || '—',
            fu.facility_name,
            fu.start_date ? new Date(fu.start_date).toLocaleDateString() : '—',
            fu.is_active ? 'Active' : 'Inactive',
        ])
        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'facility_users.csv'
        link.click()
        URL.revokeObjectURL(url)
        showToast('success', 'Exported facility users to CSV')
    }

    return (
        <div className="p-6 px-20 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        {facilityIdFromUrl && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/admin/facilities')}
                                className="hover:bg-gray-100"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">
                                {selectedFacilityName
                                    ? `${selectedFacilityName} - Users`
                                    : 'Facility Users Registry'}
                            </h1>
                            <p className="text-muted-foreground">
                                {selectedFacilityName
                                    ? `View and manage users assigned to ${selectedFacilityName}`
                                    : 'View and manage user assignments across all facilities'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="size-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchFacilityUsers}>
                        <RefreshCw className="size-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name, email, facility, department..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="w-full px-4 py-2 border rounded-md dark:bg-input/30 dark:border-input"
                    />
                </div>
                <select
                    value={facilityFilter}
                    onChange={(e) => {
                        setFacilityFilter(e.target.value)
                        setPage(1)
                    }}
                    className="px-4 py-2 border rounded-md dark:bg-input/30 dark:border-input"
                >
                    <option value="all">All Facilities</option>
                    {uniqueFacilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>
                            {facility.name}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setPage(1)
                    }}
                    className="px-4 py-2 border rounded-md dark:bg-input/30 dark:border-input"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <FacilityUsersTable
                facilityUsers={filteredUsers}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onGoto={handleGoto}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Showing {filteredUsers.length} of {facilityUsers.length} facility user
                    assignments
                </span>
                <span>{uniqueFacilities.length} facilities with assigned users</span>
            </div>
        </div>
    )
}

export default FacilityUsersRegistry
