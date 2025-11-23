import React, { useMemo, useState, useCallback, lazy, Suspense } from 'react'
import { useAuth } from '@/context/auth'
import { useFacilityUsers } from '@/hooks/useFacilityUsers'

// UI Components
import UserRegistryHeader from '@/components/facilityAdmin/fadmin_facilityUsers/UserRegistryHeader'
import UserFilters from '@/components/facilityAdmin/fadmin_facilityUsers/UserFilters'
import UserTable from '@/components/facilityAdmin/fadmin_facilityUsers/UserTable'
import Unauthorized from '@/components/Unauthorized'

// Helper
import { useFacilityUsersRealtime } from '@/hook/useSupabaseRealtime'
import { showToast } from '@/util/alertHelper'

// Lazy-loaded components (modals are heavy and used conditionally)
const AddUserModal = lazy(() =>
    import('@/components/facilityAdmin/fadmin_facilityUsers/AddUserModal')
)
const UserDetailModal = lazy(() =>
    import('@/components/facilityAdmin/fadmin_facilityUsers/UserDetailModal')
)
const EditUserModal = lazy(() =>
    import('@/components/facilityAdmin/fadmin_facilityUsers/EditUserModal')
)
const FadminFacilityUsersRegistry = () => {
    const { user } = useAuth()
    const {
        users,
        loading,
        createUser,
        updateUser,
        deleteUser,
        activateUser,
        deactivateUser,
        refresh,
        filterUsers,
        generateCSVData,
        totalUsers,
    } = useFacilityUsers()

    // UI state
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [departmentFilter, setDepartmentFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals state
    const [showAddUser, setShowAddUser] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [editingUser, setEditingUser] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Filter users based on current filter state
    const filteredUsers = useMemo(() => {
        return filterUsers({
            search,
            role: roleFilter,
            status: statusFilter,
            department: departmentFilter,
        })
    }, [filterUsers, search, roleFilter, statusFilter, departmentFilter])

    const clearFilters = () => {
        setSearch('')
        setRoleFilter('all')
        setStatusFilter('all')
        setDepartmentFilter('all')
        setPage(1)
    }

    const handleUserChange = useCallback(
        ({ type, facilityUser }) => {
            console.log(`Real-time user ${type} received:`, facilityUser)

            switch (type) {
                case 'INSERT':
                    // Refresh the users list to get updated data
                    refresh()
                    showToast('success', 'A new user has been added to your facility')
                    break

                case 'UPDATE':
                    // Refresh the users list to get updated data
                    refresh()
                    showToast('info', 'A facility user has been updated')

                    // Update detail view if it's the same user
                    if (showDetail && selectedUser?.id === facilityUser.user_id) {
                        // The refresh will handle updating the detail view
                        setTimeout(() => {
                            const updatedUser = users.find((u) => u.id === facilityUser.user_id)
                            if (updatedUser) {
                                setSelectedUser(updatedUser)
                            }
                        }, 500)
                    }
                    break

                case 'DELETE':
                    // Refresh the users list to get updated data
                    refresh()
                    showToast('warning', 'A user has been removed from your facility')

                    // Close detail view if it's the deleted user
                    if (showDetail && selectedUser?.id === facilityUser.user_id) {
                        setShowDetail(false)
                        setSelectedUser(null)
                    }
                    break

                default:
                    console.warn('Unknown real-time event type: ', type)
            }
        },
        [showDetail, selectedUser, refresh, users]
    )

    useFacilityUsersRealtime({
        onFacilityUserChange: handleUserChange,
    })

    // The useFacilityUsers hook handles data loading automatically

    // Pagination logic for users
    const paginatedUsers = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredUsers.slice(startIndex, endIndex)
    }, [filteredUsers, page, itemsPerPage])

    // Role-based guard - only facility admins can access this page
    if (!user || user.role !== 'facility_admin') {
        return <Unauthorized />
    }

    // Event handlers
    const handleViewUser = (userToView) => {
        setSelectedUser(userToView)
        setShowDetail(true)
    }

    const handleEditUser = (userToEdit) => {
        setEditingUser(userToEdit)
        setShowEdit(true)
    }

    // This function is not needed for user management

    // Testing purposes
    const handleDeleteUser = async (userToDelete) => {
        if (!window.confirm(`Delete user ${userToDelete.full_name}?`)) return

        setActionLoading(true)
        const result = await deleteUser(userToDelete.id)
        setActionLoading(false)

        if (result.success && showDetail && selectedUser?.id === userToDelete.id) {
            setShowDetail(false)
            setSelectedUser(null)
        }
    }

    const handleActivateUser = async (userToActivate) => {
        setActionLoading(true)
        await activateUser(userToActivate.id)
        setActionLoading(false)
    }

    const handleDeactivateUser = async (userToDeactivate) => {
        setActionLoading(true)
        await deactivateUser(userToDeactivate.id)
        setActionLoading(false)
    }

    const handleCreateUser = async (userData) => {
        setActionLoading(true)
        const result = await createUser(userData)
        setActionLoading(false)

        if (result.success) {
            setShowAddUser(false)
        }
        return result
    }

    const handleUpdateUser = async (userData) => {
        if (!editingUser) return

        setActionLoading(true)
        const result = await updateUser(editingUser.id, userData)
        setActionLoading(false)

        if (result.success) {
            setShowEdit(false)
            setEditingUser(null)

            showToast('success', result.success.message)

            // Update detail view if open
            if (showDetail && selectedUser?.id === editingUser.id) {
                setSelectedUser(result.data)
            }
        }
        return result
    }

    const handleExportCSV = () => {
        const csvData = generateCSVData(filteredUsers)
        const csvContent = csvData.map((row) => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `facility-users-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleReports = () => {
        showToast('info', 'User reports dashboard coming soon')
    }

    /* ------------------------------------------------------------ */
    return (
        <div className="p-6 px-20 space-y-6">
            <UserRegistryHeader
                onOpenAddUser={() => setShowAddUser(true)}
                onExportCSV={handleExportCSV}
                onOpenReports={handleReports}
                onRefresh={refresh}
                totalUsers={totalUsers}
            />

            <UserFilters
                search={search}
                onSearchChange={setSearch}
                roleFilter={roleFilter}
                onRoleChange={(val) => {
                    setRoleFilter(val)
                    setPage(1)
                }}
                statusFilter={statusFilter}
                onStatusChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                }}
                departmentFilter={departmentFilter}
                onDepartmentChange={(val) => {
                    setDepartmentFilter(val)
                    setPage(1)
                }}
                onClearFilters={clearFilters}
            />

            <UserTable
                users={paginatedUsers}
                loading={loading}
                actionLoading={actionLoading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                totalUsers={filteredUsers.length}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onActivate={handleActivateUser}
                onDeactivate={handleDeactivateUser}
            />

            {/* Modals – lazily loaded */}
            <Suspense fallback={null}>
                {showAddUser && (
                    <AddUserModal
                        open={showAddUser}
                        onClose={() => setShowAddUser(false)}
                        onSave={handleCreateUser}
                        loading={actionLoading}
                    />
                )}
                {showDetail && (
                    <UserDetailModal
                        open={showDetail}
                        user={selectedUser}
                        onClose={() => setShowDetail(false)}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        onActivate={handleActivateUser}
                        onDeactivate={handleDeactivateUser}
                        loading={actionLoading}
                    />
                )}
                {showEdit && (
                    <EditUserModal
                        open={showEdit}
                        user={editingUser}
                        onSave={handleUpdateUser}
                        onClose={() => setShowEdit(false)}
                        loading={actionLoading}
                    />
                )}
            </Suspense>
        </div>
    )
}

export default FadminFacilityUsersRegistry
