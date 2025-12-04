import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { getAllFacilityUsers, getFacilityUsers } from '@/api/admin/facility'
import { updateUserStatus, removeUserFromFacility, updateFacilityUser } from '@/api/admin/users'

// UI Components
import FacilityUsersTable from '@/components/System Administrator/sysAdmin_facilities/FacilityUsersTable'
import FacilityUserDetailModal from '@/components/System Administrator/sysAdmin_facilities/FacilityUserDetailModal'
import EditFacilityUserModal from '@/components/System Administrator/sysAdmin_facilities/EditFacilityUserModal'
import Unauthorized from '@/components/Unauthorized'
import { Button } from '@/components/ui/Button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Download, ChevronLeft } from 'lucide-react'

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
    const [roleFilter, setRoleFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modal state
    const [showUserDetail, setShowUserDetail] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showEditUser, setShowEditUser] = useState(false)
    const [editingUser, setEditingUser] = useState(null)

    // Get facility from URL query params
    const facilityIdFromUrl = searchParams.get('facility')

    // Fetch facility users with caching for faster loads
    const fetchFacilityUsers = useCallback(async () => {
        try {
            setLoading(true)

            // Use specific endpoint if facility ID is provided, otherwise get all
            // bust_cache: false uses cached data for faster loading (5-minute TTL on backend)
            const response = facilityIdFromUrl
                ? await getFacilityUsers(facilityIdFromUrl, { bust_cache: false })
                : await getAllFacilityUsers({ bust_cache: false })

            if (response.status === 'success') {
                // For specific facility endpoint, data is in response.users
                // For all facilities endpoint, data is in response.data
                const users = facilityIdFromUrl ? response.users : response.data
                setFacilityUsers(users || [])
            } else {
                showToast('error', response.message || 'Failed to load facility users')
            }
        } catch {
            showToast('error', 'Failed to load facility users')
        } finally {
            setLoading(false)
        }
    }, [facilityIdFromUrl])

    useEffect(() => {
        fetchFacilityUsers()
    }, [fetchFacilityUsers])

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

            const matchesRole =
                roleFilter && roleFilter !== 'all'
                    ? fu.role.toLowerCase() === roleFilter.toLowerCase()
                    : true

            return matchesSearch && matchesStatus && matchesRole
        })
    }, [facilityUsers, search, statusFilter, roleFilter])

    // Get unique roles for filter
    const uniqueRoles = useMemo(() => {
        const roles = new Set()
        facilityUsers.forEach((fu) => {
            if (fu.role) roles.add(fu.role)
        })
        return Array.from(roles).sort()
    }, [facilityUsers])

    // Get facility name for display
    const facilityName = useMemo(() => {
        if (!facilityIdFromUrl || facilityUsers.length === 0) return null
        return facilityUsers[0]?.facility_name
    }, [facilityIdFromUrl, facilityUsers])

    // Role-based guard
    if (user.role !== 'admin') {
        return <Unauthorized />
    }

    const handleView = (user) => {
        setSelectedUser(user)
        setShowUserDetail(true)
    }

    const handleGoto = (facilityId) => {
        navigate(`/admin/facilities?highlight=${facilityId}`)
    }

    const handleEdit = (user) => {
        setEditingUser(user)
        setShowEditUser(true)
    }

    const handleSaveEdit = async (facilityId, userId, userData) => {
        try {
            const response = await updateFacilityUser(facilityId, userId, userData)

            if (response.status === 'success') {
                showToast('success', 'User updated successfully')
                await fetchFacilityUsers()
            } else {
                showToast('error', response.message || 'Failed to update user')
            }
        } catch {
            showToast('error', 'Failed to update user')
        }
    }

    const handleActivateDeactivate = async (user) => {
        try {
            const action = user.is_active ? 'deactivated' : 'activated'
            const response = await updateUserStatus(user.user_id)

            if (response.status === 'success') {
                showToast('success', `User ${action} successfully`)
                await fetchFacilityUsers()
            } else {
                showToast('error', response.message || 'Failed to update user status')
            }
        } catch {
            showToast('error', 'Failed to update user status')
        }
    }

    const handleDelete = async (user) => {
        try {
            const response = await removeUserFromFacility(user.facility_id, user.user_id)

            if (response.status === 'success') {
                showToast('success', 'User removed from facility successfully')
                await fetchFacilityUsers()
            } else {
                showToast('error', response.message || 'Failed to remove user from facility')
            }
        } catch {
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
                        <Link to={-1} className="hover:text-primary">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {facilityName
                                    ? `${facilityName} - Users`
                                    : 'Facility Users Registry'}
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportCSV}>
                        <Download className="size-4 mr-2" />
                        Export CSV
                    </Button>
                    {/* <Button variant="outline" size="sm" onClick={fetchFacilityUsers}>
                        <RefreshCw className="size-4 mr-2" />
                        Refresh
                    </Button> */}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by name, email, department, specialty..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="w-full px-4 py-2 border rounded-md dark:bg-input/30 dark:border-input"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                        value={roleFilter}
                        onValueChange={(value) => {
                            setRoleFilter(value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {uniqueRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {displayRoles(role)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
                onActivateDeactivate={handleActivateDeactivate}
                onDelete={handleDelete}
            />

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Showing {filteredUsers.length} of {facilityUsers.length} user{' '}
                    {facilityUsers.length === 1 ? 'assignment' : 'assignments'}
                    {facilityName && ` in ${facilityName}`}
                </span>
                {!facilityIdFromUrl && (
                    <span>{uniqueRoles.length} unique roles across facilities</span>
                )}
            </div>

            {/* User Detail Modal */}
            <FacilityUserDetailModal
                open={showUserDetail}
                user={selectedUser}
                onClose={() => {
                    setShowUserDetail(false)
                    setSelectedUser(null)
                }}
            />

            {/* Edit User Modal */}
            <EditFacilityUserModal
                open={showEditUser}
                user={editingUser}
                onClose={() => {
                    setShowEditUser(false)
                    setEditingUser(null)
                }}
                onSave={handleSaveEdit}
            />
        </div>
    )
}

export default FacilityUsersRegistry
