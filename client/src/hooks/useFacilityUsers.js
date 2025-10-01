import { useState, useEffect, useCallback } from 'react'
import {
    getFacilityUsers,
    createFacilityUser,
    updateFacilityUser,
    deleteFacilityUser,
    activateFacilityUser,
    deactivateFacilityUser,
} from '@/api/facilityAdmin/users'
import { showToast } from '@/util/alertHelper'

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
    } catch {
        return 'Never'
    }
}

/**
 * Custom hook for managing facility users
 * Provides state management and CRUD operations for users
 */
export const useFacilityUsers = () => {
    // State
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch users from API
    const fetchUsers = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true)
            setError(null)

            const response = await getFacilityUsers()

            if (response.status === 'success') {
                // Transform the backend response to match frontend expectations
                const transformedUsers = response.data.map((facilityUser) => ({
                    // Main identifiers
                    id: facilityUser.user_id,
                    user_id: facilityUser.user_id,
                    facility_id: facilityUser.facility_id,

                    // User display information
                    full_name: `${facilityUser.user_info?.firstname || ''} ${
                        facilityUser.user_info?.lastname || ''
                    }`.trim(),
                    firstname: facilityUser.user_info?.firstname || '',
                    lastname: facilityUser.user_info?.lastname || '',
                    email: facilityUser.user_info?.email || '',
                    phone: facilityUser.user_info?.phone_number || '',

                    // Role and department information
                    role: facilityUser.role, // This is the facility role
                    user_role: facilityUser.user_info?.role || '', // This is the user's system role
                    department: facilityUser.department || '',
                    license_number: facilityUser.user_info?.license_number || '',

                    // Status and dates
                    last_login: facilityUser.user_info?.last_sign_in_at
                        ? formatLastLogin(facilityUser.user_info.last_sign_in_at)
                        : 'Never',
                    status: facilityUser.user_info?.is_active ? 'active' : 'inactive',
                    start_date: facilityUser.start_date,
                    end_date: facilityUser.end_date,
                    created_at: facilityUser.user_info?.created_at || facilityUser.created_at,
                    updated_at: facilityUser.updated_at,

                    // Assignment information
                    assigned_by: facilityUser.assigned_by,
                    assigned_by_info: facilityUser.assigned_by_info
                        ? {
                              name: `${facilityUser.assigned_by_info.firstname || ''} ${
                                  facilityUser.assigned_by_info.lastname || ''
                              }`.trim(),
                              email: facilityUser.assigned_by_info.email || '',
                          }
                        : null,
                }))
                setUsers(transformedUsers)
            } else {
                setError(response.message)
                showToast('error', response.message)
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to fetch users'
            setError(errorMsg)
            showToast('error', errorMsg)
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [])

    // Create new user
    const createUser = useCallback(async (userData) => {
        try {
            setLoading(true)
            const response = await createFacilityUser(userData)

            if (response.status === 'success') {
                // Add new user to state
                setUsers((prev) => [...prev, response.data])
                showToast('success', response.message)

                return { success: true, data: response.data }
            } else {
                showToast('error', response.message)
                return { success: false, error: response.message }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create user'
            showToast('error', errorMsg)
            return { success: false, error: errorMsg }
        } finally {
            setLoading(false)
        }
    }, [])

    // Update user
    const updateUser = useCallback(async (userId, userData) => {
        try {
            setLoading(true)
            const response = await updateFacilityUser(userId, userData)

            if (response.status === 'success') {
                // Update user in state
                setUsers((prev) =>
                    prev.map((user) => (user.id === userId ? { ...user, ...response.data } : user))
                )
                showToast('success', response.message)
                return { success: true, data: response.data }
            } else {
                showToast('error', response.message)
                return { success: false, error: response.message }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to update user'
            showToast('error', errorMsg)
            return { success: false, error: errorMsg }
        } finally {
            setLoading(false)
        }
    }, [])

    // Delete user
    const deleteUser = useCallback(async (userId) => {
        try {
            setLoading(true)
            const response = await deleteFacilityUser(userId)

            if (response.status === 'success') {
                // Remove user from state
                setUsers((prev) => prev.filter((user) => user.id !== userId))
                showToast('success', response.message)

                return { success: true }
            } else {
                showToast('error', response.message)
                return { success: false, error: response.message }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to delete user'
            showToast('error', errorMsg)
            return { success: false, error: errorMsg }
        } finally {
            setLoading(false)
        }
    }, [])

    // Activate user
    const activateUser = useCallback(async (userId) => {
        try {
            const response = await activateFacilityUser(userId)

            if (response.status === 'success') {
                // Update user status in state
                setUsers((prev) =>
                    prev.map((user) => (user.id === userId ? { ...user, status: 'active' } : user))
                )
                showToast('success', response.message)
                return { success: true }
            } else {
                showToast('error', response.message)
                return { success: false, error: response.message }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to activate user'
            showToast('error', errorMsg)
            return { success: false, error: errorMsg }
        }
    }, [])

    // Deactivate user
    const deactivateUser = useCallback(async (userId) => {
        try {
            const response = await deactivateFacilityUser(userId)

            if (response.status === 'success') {
                // Update user status in state
                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === userId ? { ...user, status: 'inactive' } : user
                    )
                )
                showToast('success', response.message)
                return { success: true }
            } else {
                showToast('error', response.message)
                return { success: false, error: response.message }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to deactivate user'
            showToast('error', errorMsg)
            return { success: false, error: errorMsg }
        }
    }, [])

    // Refresh data
    const refresh = useCallback(() => {
        fetchUsers()
    }, [fetchUsers])

    // Initial data load
    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // Helper functions for filtering and searching
    const filterUsers = useCallback(
        (filters) => {
            if (!filters) return users

            return users.filter((user) => {
                const matchesSearch =
                    !filters.search ||
                    user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    user.user_id?.toString().includes(filters.search) ||
                    user.id?.toString().includes(filters.search) ||
                    user.license_number?.toLowerCase().includes(filters.search.toLowerCase())

                const matchesRole =
                    !filters.role || filters.role === 'all' || user.role === filters.role

                const matchesStatus =
                    !filters.status || filters.status === 'all' || user.status === filters.status

                const matchesDepartment =
                    !filters.department ||
                    filters.department === 'all' ||
                    user.department === filters.department

                return matchesSearch && matchesRole && matchesStatus && matchesDepartment
            })
        },
        [users]
    )

    // Export CSV data generator
    const generateCSVData = useCallback(
        (filteredUsers = users) => {
            const headers = [
                'User ID',
                'Full Name',
                'Email',
                'Phone',
                'Facility Role',
                'User Role',
                'Department/Specialty',
                'License Number',
                'Status',
                'Start Date',
                'End Date',
                'Assigned By',
                'Created Date',
                'Updated Date',
            ]

            const rows = filteredUsers.map((user) => [
                user.user_id || user.id,
                user.full_name || '',
                user.email || '',
                user.phone || '',
                user.role || '',
                user.user_role || '',
                user.department || '',
                user.license_number || '',
                user.status || '',
                user.start_date ? new Date(user.start_date).toLocaleDateString() : '',
                user.end_date ? new Date(user.end_date).toLocaleDateString() : '',
                user.assigned_by_info?.name || '',
                user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
                user.updated_at ? new Date(user.updated_at).toLocaleDateString() : '',
            ])

            return [headers, ...rows]
        },
        [users]
    )

    return {
        // State
        users,
        loading,
        error,

        // Actions
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        activateUser,
        deactivateUser,
        refresh,

        // Utilities
        filterUsers,
        generateCSVData,

        // Computed values
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === 'active').length,
        inactiveUsers: users.filter((u) => u.status === 'inactive').length,
    }
}

export default useFacilityUsers
