/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState, lazy, Suspense, useCallback } from 'react'
import { useAuth } from '@/context/auth'
import { getUserById, updateUserStatus, deleteUser } from '@/api/admin/users'
import { useUsersRealtime, useFacilityUsersRealtime, supabase } from '@/hook/useSupabaseRealtime'

// UI Components
import UserRegistryHeader from '@/components/System Administrator/sysAdmin_users/UserRegistryHeader'
import UserFilters from '@/components/System Administrator/sysAdmin_users/UserFilters'
import UserTable from '@/components/System Administrator/sysAdmin_users/UserTable'
import Unauthorized from '@/components/Unauthorized'

// Helper
import { showToast } from '@/util/alertHelper'
import { displayRoles } from '@/util/roleHelper'
import { getUserStatusBadgeColor, formatUserStatus } from '@/util/utils'

// Helper function to format last login time
const formatLastLogin = (lastLoginTime) => {
    try {
        if (!lastLoginTime || lastLoginTime === 'null') return 'Never'

        const lastLogin = new Date(lastLoginTime)
        const now = new Date()
        const diffInHours = Math.floor((now - lastLogin) / (1000 * 60 * 60))

        if (diffInHours < 24) {
            return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
        } else {
            const days = Math.floor(diffInHours / 24)
            const remainingHours = diffInHours % 24

            if (remainingHours === 0) {
                return `${days} ${days === 1 ? 'day' : 'days'} ago`
            } else {
                return `${days} ${days === 1 ? 'day' : 'days'} and ${remainingHours} ${
                    remainingHours === 1 ? 'hour' : 'hours'
                } ago`
            }
        }
    } catch (error) {
        return 'Never'
    }
}

// Lazy-loaded components
const RegisterUserModal = lazy(() =>
    import('../../components/System Administrator/sysAdmin_users/RegisterUserModal')
)
const UserDetailModal = lazy(() =>
    import('../../components/System Administrator/sysAdmin_users/UserDetailModal')
)
const UserAssignFacility = lazy(() =>
    import('../../components/System Administrator/sysAdmin_users/UserAssignFacility')
)
const EditUserModal = lazy(() =>
    import('../../components/System Administrator/sysAdmin_users/EditUserModal')
)
const ConfirmationDialog = lazy(() =>
    import('../../components/ui/ConfirmationDialog')
)

const UsersRegistry = () => {
    const { user } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [planFilter, setPlanFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals state
    const [showRegister, setShowRegister] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [detailUser, setDetailUser] = useState(null)
    const [showEdit, setShowEdit] = useState(false)
    const [editUser, setEditUser] = useState(null)
    const [showAssignFacility, setShowAssignFacility] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(null)

    // Confirmation dialogs state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showStatusDialog, setShowStatusDialog] = useState(false)
    const [confirmationUser, setConfirmationUser] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Helper to normalize user records coming from API
    const formatUser = useCallback(
        (raw) => ({
            id: raw.user_id,
            email: raw.email,
            firstname: raw.firstname,
            lastname: raw.lastname,
            role: displayRoles(raw.role),
            specialty: raw.specialty || '—',
            license_number: raw.license_number || '—',
            contact: raw.phone_number || '—',
            sub_exp: raw.subscription_expires,
            plan: raw.is_subscribed ? 'Premium' : 'Free',
            status: raw.is_active ? 'active' : 'inactive',
            statusBadgeColor: getUserStatusBadgeColor(raw.is_active ? 'active' : 'inactive'),
            statusDisplay: formatUserStatus(raw.is_active ? 'active' : 'inactive'),
            created_at: new Date(raw.created_at).toLocaleDateString(),
            updated_at: raw.updated_at ? new Date(raw.updated_at).toLocaleDateString() : '—',
            last_login:
                raw.last_sign_in_at && raw.last_sign_in_at !== 'null'
                    ? formatLastLogin(raw.last_sign_in_at)
                    : 'Never',
            assigned_facility:
                raw.facility_users?.[0]?.healthcare_facilities?.facility_name || 'Not Assigned',
            facility_role: displayRoles(raw.facility_users?.[0]?.role || ''),
            facility_id: raw.facility_users?.[0]?.healthcare_facilities?.id || null,
        }),
        []
    )

    const updateSpecificUser = useCallback(
        async (userId) => {
            try {
                const res = await getUserById(userId)
                if (res.status === 'success') {
                    const updatedUserData = formatUser(res.data)
                    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUserData : u)))
                    return updatedUserData
                }
            } catch (err) {
                console.error('Error updating specific user:', err)
                return null
            }
        },
        [formatUser]
    )

    const updateUserFacilityInfo = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('facility_users')
                .select(
                    `
                    role,
                    healthcare_facilities (
                        facility_id,
                        facility_name
                    )
                `
                )
                .eq('user_id', userId)
                .single()

            if (error || !data) {
                // User is not assigned to any facility
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === userId
                            ? {
                                  ...u,
                                  assigned_facility: 'Not Assigned',
                                  facility_role: '—',
                                  facility_id: null,
                              }
                            : u
                    )
                )
                return
            }

            // User is assigned to a facility
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? {
                              ...u,
                              assigned_facility:
                                  data.healthcare_facilities?.facility_name || 'Not Assigned',
                              facility_role: displayRoles(data.role || ''),
                              facility_id: data.healthcare_facilities?.facility_id || null,
                          }
                        : u
                )
            )
        } catch (error) {
            console.error('Error updating user facility info:', error)
        }
    }, [])

    // Fetch user from Supabase Realtime
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)

            // Step 1: Get basic user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (userError) {
                showToast('error', 'Failed to load users')
                console.error('User fetch error:', userError)
                return
            }

            // Step 2: Get facility assignments separately
            const { data: facilityData, error: facilityError } = await supabase.from(
                'facility_users'
            ).select(`
                    user_id,
                    role,
                    healthcare_facilities (
                        facility_id,
                        facility_name
                    )
                `)

            if (facilityError) {
                console.warn('Facility data fetch error:', facilityError)
            }

            // Step 3: Merge the data
            const usersWithFacilities = userData.map((user) => {
                const facilityAssignment = facilityData?.find((f) => f.user_id === user.user_id)

                return {
                    ...formatUser(user),
                    assigned_facility:
                        facilityAssignment?.healthcare_facilities?.facility_name || 'Not Assigned',
                    facility_role: displayRoles(facilityAssignment?.role || ''),
                    facility_id: facilityAssignment?.healthcare_facilities?.facility_id || null,
                }
            })

            setUsers(usersWithFacilities)
        } catch (error) {
            showToast('error', 'Failed to load users')
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [formatUser])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // Handle user table changes
    const handleUserChange = useCallback(
        ({ type, user, raw }) => {
            switch (type) {
                case 'INSERT':
                    setUsers((prev) => {
                        const exists = prev.some((u) => u.id === user.id)
                        if (exists) return prev

                        showToast('success', `New user "${user.email}" added`)
                        return [user, ...prev] // Add to beginning for newest first
                    })
                    break

                case 'UPDATE':
                    setUsers((prev) =>
                        prev.map((u) => {
                            if (u.id === user.id) {
                                return {
                                    ...user,
                                    // Preserve facility info that might not be in the update
                                    assigned_facility:
                                        user.assigned_facility === 'Loading...'
                                            ? u.assigned_facility
                                            : user.assigned_facility,
                                    facility_role:
                                        user.facility_role === '—'
                                            ? u.facility_role
                                            : user.facility_role,
                                    facility_id: user.facility_id || u.facility_id,
                                }
                            }
                            return u
                        })
                    )

                    // Update detail modal if it's showing this user
                    if (showDetail && detailUser?.id === user.id) {
                        setDetailUser((prev) => ({ ...prev, ...user }))
                    }
                    break

                case 'DELETE':
                    setUsers((prev) => prev.filter((u) => u.id !== user.id))
                    showToast('warning', `User "${user.email}" removed`)

                    // Close detail modal if showing deleted user
                    if (showDetail && detailUser?.id === user.id) {
                        setShowDetail(false)
                        setDetailUser(null)
                    }
                    break

                default:
                    console.warn('Unknown real-time event type:', type)
            }
        },
        [showDetail, detailUser]
    )

    // Handle facility assignment changes
    const handleFacilityUserChange = useCallback(
        ({ type, facilityUser }) => {
            console.log(`Facility assignment ${type}:`, facilityUser)

            // Update the affected user's facility info
            updateUserFacilityInfo(facilityUser.user_id)

            const actionMap = {
                INSERT: 'assigned to facility',
                UPDATE: 'facility assignment updated',
                DELETE: 'removed from facility',
            }

            showToast('info', `User ${actionMap[type] || 'updated'}`)
        },
        [updateUserFacilityInfo]
    )

    // Set up real-time subscriptions
    useUsersRealtime({
        onUserChange: handleUserChange,
    })

    useFacilityUsersRealtime({
        onFacilityUserChange: handleFacilityUserChange,
    })

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch = search
                ? [u.firstname, u.lastname, u.email, u.specialty, u.assigned_facility].some(
                      (field) => String(field).toLowerCase().includes(search.toLowerCase())
                  )
                : true
            const matchesStatus =
                statusFilter && statusFilter !== 'all' ? u.status === statusFilter : true
            const matchesType =
                typeFilter && typeFilter !== 'all'
                    ? u.role.toLowerCase() === typeFilter.toLowerCase()
                    : true
            const matchesPlan =
                planFilter && planFilter !== 'all'
                    ? u.plan.toLowerCase() === (planFilter === 'true' ? 'premium' : 'freemium')
                    : true
            return matchesSearch && matchesStatus && matchesType && matchesPlan
        })
    }, [users, search, statusFilter, typeFilter, planFilter])

    // Role-based guard
    if (user.role !== 'admin') {
        return <Unauthorized />
    }

    const handleView = (user) => {
        setDetailUser(user)
        setShowDetail(true)
    }

    const handleEdit = (user) => {
        setEditUser(user)
        setShowEdit(true)
    }

    const handleToggleStatus = (user) => {
        setConfirmationUser(user)
        setShowStatusDialog(true)
    }

    const confirmStatusToggle = async () => {
        if (!confirmationUser) return

        try {
            setActionLoading(true)
            const newStatus = confirmationUser.status === 'active' ? 'inactive' : 'active'

            const response = await updateUserStatus(confirmationUser.id, newStatus)

            if (response.status === 'success') {
                setUsers((prev) =>
                    prev.map((u) => {
                        if (u.id === confirmationUser.id) {
                            return {
                                ...u,
                                status: newStatus,
                                statusBadgeColor: getUserStatusBadgeColor(newStatus),
                                statusDisplay: formatUserStatus(newStatus),
                            }
                        }
                        return u
                    })
                )
                showToast('success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
            } else {
                showToast('error', response.message || 'Failed to update user status')
            }
        } catch (error) {
            console.error('Status update error:', error)
            showToast('error', error.message || 'Failed to update user status')
        } finally {
            setActionLoading(false)
            setShowStatusDialog(false)
            setConfirmationUser(null)
        }
    }

    const handleFacilityAssignment = (user) => {
        setSelectedUserId(user.id)
        setShowAssignFacility(true)
    }

    const handleDelete = (user) => {
        setConfirmationUser(user)
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        if (!confirmationUser) return

        try {
            setActionLoading(true)

            const response = await deleteUser(confirmationUser.id)

            if (response.status === 'success') {
                setUsers((prev) => prev.filter((u) => u.id !== confirmationUser.id))
                showToast('success', 'User deleted successfully')

                // Close detail modal if showing deleted user
                if (showDetail && detailUser?.id === confirmationUser.id) {
                    setShowDetail(false)
                    setDetailUser(null)
                }
            } else {
                showToast('error', response.message || 'Failed to delete user')
            }
        } catch (error) {
            console.error('Delete error:', error)
            showToast('error', error.message || 'Failed to delete user')
        } finally {
            setActionLoading(false)
            setShowDeleteDialog(false)
            setConfirmationUser(null)
        }
    }

    const handleExportCSV = () => {
        const headers = [
            'Full Name',
            'Email',
            'Role',
            'Specialty',
            'License Number',
            'Contact',
            'Status',
            'Assigned Facility',
            'Facility Role',
            'Created At',
            'Last Updated',
        ]
        const rows = users.map((u) => [
            `${u.firstname} ${u.lastname}`,
            u.email,
            u.role,
            u.specialty,
            u.license_number,
            u.contact,
            u.status,
            u.assigned_facility,
            u.facility_role,
            u.created_at,
            u.updated_at,
        ])
        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'users.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleReports = () => {
        showToast('info', 'Reports dashboard coming soon')
    }

    return (
        <div className="p-6 px-20 space-y-6">
            <UserRegistryHeader
                onOpenRegister={() => setShowRegister(true)}
                onExportCSV={handleExportCSV}
                onOpenReports={handleReports}
                onRefresh={fetchUsers}
            />

            <UserFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                }}
                typeFilter={typeFilter}
                onTypeChange={(val) => {
                    setTypeFilter(val)
                    setPage(1)
                }}
                planFilter={planFilter}
                onPlanChange={(val) => {
                    setPlanFilter(val)
                    setPage(1)
                }}
            />

            <UserTable
                users={filteredUsers}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onTransfer={handleFacilityAssignment}
                onDelete={handleDelete}
            />

            {/* Modals – lazily loaded */}
            <Suspense fallback={null}>
                {showRegister && (
                    <RegisterUserModal open={showRegister} onClose={() => setShowRegister(false)} />
                )}
                {showDetail && (
                    <UserDetailModal
                        open={showDetail}
                        user={detailUser}
                        onClose={() => setShowDetail(false)}
                        onAuditLogs={handleFacilityAssignment}
                    />
                )}
                {showEdit && (
                    <EditUserModal
                        open={showEdit}
                        user={editUser}
                        onClose={() => {
                            setShowEdit(false)
                            setEditUser(null)
                        }}
                    />
                )}
                {showAssignFacility && (
                    <UserAssignFacility
                        open={showAssignFacility}
                        userId={selectedUserId}
                        user={users.find((u) => u.id === selectedUserId)}
                        onClose={() => {
                            setShowAssignFacility(false)
                            setSelectedUserId(null)
                            // Refresh user data after assignment
                            if (selectedUserId) {
                                updateUserFacilityInfo(selectedUserId)
                            }
                        }}
                    />
                )}

                {/* Confirmation Dialogs */}
                {showDeleteDialog && confirmationUser && (
                    <ConfirmationDialog
                        open={showDeleteDialog}
                        onOpenChange={setShowDeleteDialog}
                        title="Delete User"
                        description={`Are you sure you want to permanently delete user "${confirmationUser.firstname} ${confirmationUser.lastname}"? This action cannot be undone and will remove all associated data.`}
                        confirmText={`${confirmationUser.firstname} ${confirmationUser.lastname}`}
                        requireTyping={true}
                        destructive={true}
                        loading={actionLoading}
                        onConfirm={confirmDelete}
                    />
                )}

                {showStatusDialog && confirmationUser && (
                    <ConfirmationDialog
                        open={showStatusDialog}
                        onOpenChange={setShowStatusDialog}
                        title={`${confirmationUser.status === 'active' ? 'Deactivate' : 'Activate'} User`}
                        description={`Are you sure you want to ${confirmationUser.status === 'active' ? 'deactivate' : 'activate'} user "${confirmationUser.firstname} ${confirmationUser.lastname}"?`}
                        loading={actionLoading}
                        onConfirm={confirmStatusToggle}
                    />
                )}
            </Suspense>
        </div>
    )
}

export default UsersRegistry
