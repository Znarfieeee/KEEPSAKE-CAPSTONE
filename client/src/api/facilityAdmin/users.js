import backendConnection from '../backendApi';
import axios from 'axios';
import { axiosConfig } from '../axiosConfig';

const BASE_URL = `${backendConnection()}/facility_admin`;

/**
 * Facility Admin User Management API
 * Handles CRUD operations for users within a facility
 */

/**
 * Get all users in the current facility
 * @returns {Promise<Object>} Response with users array
 */
export const getFacilityUsers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/users`, axiosConfig);
    return {
      success: true,
      data: response.data.users || [],
      message: 'Users fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching facility users:', error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || 'Failed to fetch users'
    };
  }
};

/**
 * Get a specific user by ID within the facility
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with user data
 */
export const getFacilityUserById = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${userId}`, axiosConfig);
    return {
      success: true,
      data: response.data.user,
      message: 'User fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to fetch user'
    };
  }
};

/**
 * Create a new user in the facility
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} Response with created user
 */
export const createFacilityUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/users`, userData, axiosConfig);
    return {
      success: true,
      data: response.data.user,
      message: response.data.message || 'User created successfully'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to create user'
    };
  }
};

/**
 * Update an existing user in the facility
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Response with updated user
 */
export const updateFacilityUser = async (userId, userData) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/users/${userId}`,
      userData,
      axiosConfig
    );
    return {
      success: true,
      data: response.data.user,
      message: response.data.message || 'User updated successfully'
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to update user'
    };
  }
};

/**
 * Delete a user from the facility (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deleteFacilityUser = async (userId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/users/${userId}`, axiosConfig);
    return {
      success: true,
      data: null,
      message: response.data.message || 'User deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to delete user'
    };
  }
};

/**
 * Activate a user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with updated user
 */
export const activateFacilityUser = async (userId) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/users/${userId}/activate`,
      {},
      axiosConfig
    );
    return {
      success: true,
      data: response.data.user,
      message: response.data.message || 'User activated successfully'
    };
  } catch (error) {
    console.error('Error activating user:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to activate user'
    };
  }
};

/**
 * Deactivate a user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with updated user
 */
export const deactivateFacilityUser = async (userId) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/users/${userId}/deactivate`,
      {},
      axiosConfig
    );
    return {
      success: true,
      data: response.data.user,
      message: response.data.message || 'User deactivated successfully'
    };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to deactivate user'
    };
  }
};

/**
 * Resend invitation email to a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response confirming email sent
 */
export const resendUserInvitation = async (userId) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/users/${userId}/resend-invitation`,
      {},
      axiosConfig
    );
    return {
      success: true,
      data: null,
      message: response.data.message || 'Invitation email sent successfully'
    };
  } catch (error) {
    console.error('Error resending invitation:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to resend invitation'
    };
  }
};

/**
 * Reset user password
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response confirming password reset
 */
export const resetUserPassword = async (userId) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/users/${userId}/reset-password`,
      {},
      axiosConfig
    );
    return {
      success: true,
      data: null,
      message: response.data.message || 'Password reset email sent successfully'
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to reset password'
    };
  }
};

/**
 * Get user statistics for the facility
 * @returns {Promise<Object>} Response with user statistics
 */
export const getFacilityUserStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/users/stats`, axiosConfig);
    return {
      success: true,
      data: response.data.stats,
      message: 'Statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to fetch statistics'
    };
  }
};

/**
 * Export facility users to CSV
 * @param {Object} filters - Optional filters for export
 * @returns {Promise<Object>} Response with CSV data or download URL
 */
export const exportFacilityUsers = async (filters = {}) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/users/export`,
      { filters },
      {
        ...axiosConfig,
        responseType: 'blob' // For file download
      }
    );

    return {
      success: true,
      data: response.data,
      message: 'Export completed successfully'
    };
  } catch (error) {
    console.error('Error exporting users:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to export users'
    };
  }
};

// Export all functions as named exports and default export
export default {
  getFacilityUsers,
  getFacilityUserById,
  createFacilityUser,
  updateFacilityUser,
  deleteFacilityUser,
  activateFacilityUser,
  deactivateFacilityUser,
  resendUserInvitation,
  resetUserPassword,
  getFacilityUserStats,
  exportFacilityUsers
};