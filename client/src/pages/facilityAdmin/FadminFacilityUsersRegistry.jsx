import React, { useState, useMemo, lazy, Suspense } from 'react'
import { useAuth } from '@/context/auth'
import { showToast } from '@/util/alertHelper'
import { useFacilityUsers } from '@/hooks/useFacilityUsers'

// UI Components
import UserRegistryHeader from '@/components/facilityAdmin/fadmin_facilityUsers/UserRegistryHeader'
import UserFilters from '@/components/facilityAdmin/fadmin_facilityUsers/UserFilters'
import UserTable from '@/components/facilityAdmin/fadmin_facilityUsers/UserTable'
import Unauthorized from '@/components/Unauthorized'

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

    // Use custom hook for user management
    const {
        loading,
        // error,
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

    // Filtered users based on search and filter criteria
    const filteredUsers = useMemo(() => {
        return filterUsers({
            search,
            role: roleFilter,
            status: statusFilter,
            department: departmentFilter,
        })
    }, [filterUsers, search, roleFilter, statusFilter, departmentFilter])

    // Clear all filters
    const clearFilters = () => {
        setSearch('')
        setRoleFilter('all')
        setStatusFilter('all')
        setDepartmentFilter('all')
        setPage(1)
    }

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

    return (
        <div className="p-6 space-y-6">
            <UserRegistryHeader
                onOpenRegister={() => setShowAddUser(true)}
                onExportCSV={handleExportCSV}
                onOpenReports={handleReports}
                onRefresh={refresh}
                isLoading={loading}
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
                clearFilters={clearFilters}
            />

            <UserTable
                users={filteredUsers}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onActivateUser={handleActivateUser}
                onDeactivateUser={handleDeactivateUser}
                currentUserRole={user?.role}
            />

            {/* Modals – lazily loaded */}
            <Suspense fallback={null}>
                {showAddUser && (
                    <AddUserModal
                        open={showAddUser}
                        onClose={() => setShowAddUser(false)}
                        onSubmit={handleCreateUser}
                        loading={actionLoading}
                    />
                )}

                {showDetail && selectedUser && (
                    <UserDetailModal
                        open={showDetail}
                        user={selectedUser}
                        onClose={() => {
                            setShowDetail(false)
                            setSelectedUser(null)
                        }}
                        onEdit={handleEditUser}
                        currentUserRole={user?.role}
                    />
                )}

                {showEdit && editingUser && (
                    <EditUserModal
                        open={showEdit}
                        user={editingUser}
                        onSubmit={handleUpdateUser}
                        onClose={() => {
                            setShowEdit(false)
                            setEditingUser(null)
                        }}
                        loading={actionLoading}
                    />
                )}
            </Suspense>
        </div>
    )
}

export default FadminFacilityUsersRegistry
