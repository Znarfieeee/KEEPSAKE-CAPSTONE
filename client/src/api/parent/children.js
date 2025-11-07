import { axiosConfig } from '../axiosConfig'
import backendConnection from '../backendApi'
import axios from 'axios'

/**
 * Get all children that the current parent has access to
 */
export const getParentChildren = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/parent/children`,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Get parent children error:', error)
    throw error
  }
}

/**
 * Get detailed information about a specific child (read-only)
 * @param {string} patientId - The patient ID of the child
 */
export const getChildDetails = async (patientId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/parent/child/${patientId}`,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Get child details error:', error)

    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to fetch child details',
        details: errorData?.details,
        status: error.response.status
      }
    } else if (error.request) {
      throw {
        ...error,
        message: 'No response from server. Please check your connection.',
        details: 'Network error or server is not responding'
      }
    } else {
      throw {
        ...error,
        message: error.message || 'An unexpected error occurred',
        details: 'Request setup error'
      }
    }
  }
}

/**
 * Get appointments for a specific child
 * @param {string} patientId - The patient ID of the child
 */
export const getChildAppointments = async (patientId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/parent/child/${patientId}/appointments`,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Get child appointments error:', error)

    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to fetch appointments',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export default {
  getParentChildren,
  getChildDetails,
  getChildAppointments,
}
