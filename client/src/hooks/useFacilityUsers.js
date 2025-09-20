import { useState, useEffect, useCallback } from 'react';
import {
  getFacilityUsers,
  createFacilityUser,
  updateFacilityUser,
  deleteFacilityUser,
  activateFacilityUser,
  deactivateFacilityUser,
  getFacilityUserStats
} from '@/api/facilityAdmin/users';
import { showToast } from '@/util/alertHelper';

/**
 * Custom hook for managing facility users
 * Provides state management and CRUD operations for users
 */
export const useFacilityUsers = () => {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch users from API
  const fetchUsers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await getFacilityUsers();

      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.error);
        showToast('error', response.error);
      }
    } catch {
      const errorMsg = 'Failed to fetch users';
      setError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Fetch user statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await getFacilityUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  }, []);

  // Create new user
  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await createFacilityUser(userData);

      if (response.success) {
        // Add new user to state
        setUsers(prev => [...prev, response.data]);
        showToast('success', response.message);

        // Refresh stats
        fetchStats();

        return { success: true, data: response.data };
      } else {
        showToast('error', response.error);
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = 'Failed to create user';
      showToast('error', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  // Update user
  const updateUser = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      const response = await updateFacilityUser(userId, userData);

      if (response.success) {
        // Update user in state
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, ...response.data } : user
          )
        );
        showToast('success', response.message);
        return { success: true, data: response.data };
      } else {
        showToast('error', response.error);
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = 'Failed to update user';
      showToast('error', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await deleteFacilityUser(userId);

      if (response.success) {
        // Remove user from state
        setUsers(prev => prev.filter(user => user.id !== userId));
        showToast('success', response.message);

        // Refresh stats
        fetchStats();

        return { success: true };
      } else {
        showToast('error', response.error);
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = 'Failed to delete user';
      showToast('error', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  // Activate user
  const activateUser = useCallback(async (userId) => {
    try {
      const response = await activateFacilityUser(userId);

      if (response.success) {
        // Update user status in state
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, status: 'active' } : user
          )
        );
        showToast('success', response.message);
        return { success: true };
      } else {
        showToast('error', response.error);
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = 'Failed to activate user';
      showToast('error', errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Deactivate user
  const deactivateUser = useCallback(async (userId) => {
    try {
      const response = await deactivateFacilityUser(userId);

      if (response.success) {
        // Update user status in state
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, status: 'inactive' } : user
          )
        );
        showToast('success', response.message);
        return { success: true };
      } else {
        showToast('error', response.error);
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = 'Failed to deactivate user';
      showToast('error', errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Initial data load
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Helper functions for filtering and searching
  const filterUsers = useCallback((filters) => {
    if (!filters) return users;

    return users.filter(user => {
      const matchesSearch = !filters.search ||
        user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.id?.toString().includes(filters.search);

      const matchesRole = !filters.role || filters.role === 'all' ||
        user.role === filters.role;

      const matchesStatus = !filters.status || filters.status === 'all' ||
        user.status === filters.status;

      const matchesDepartment = !filters.department || filters.department === 'all' ||
        user.department === filters.department;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [users]);

  // Export CSV data generator
  const generateCSVData = useCallback((filteredUsers = users) => {
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone',
      'Role',
      'Department',
      'Status',
      'Created Date',
      'Last Login'
    ];

    const rows = filteredUsers.map(user => [
      user.id,
      user.full_name || '',
      user.email || '',
      user.phone || '',
      user.role || '',
      user.department || '',
      user.status || '',
      user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
      user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
    ]);

    return [headers, ...rows];
  }, [users]);

  return {
    // State
    users,
    loading,
    error,
    stats,

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
    activeUsers: users.filter(u => u.status === 'active').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length
  };
};

export default useFacilityUsers;