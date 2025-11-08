import { axiosConfig } from '../axiosConfig'
import backendConnection from '../backendApi'
import axios from 'axios'

export const getPatients = async () => {
  try {
    const response = await axios.get(`${backendConnection()}/patient_records`, axiosConfig)
    return response.data
  } catch (error) {
    console.error('Get patients error:', error)
    throw error
  }
}

export const getPatientById = async (patientId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/patient_record/${patientId}?include_related=true`,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Get patient by ID error:', error)
    throw error
  }
}

export const addPatientRecord = async (patientData) => {
  try {
    console.log('Sending patient data:', patientData)
    const response = await axios.post(
      `${backendConnection()}/patient_records`,
      patientData,
      axiosConfig
    )
    console.log('Patient creation response:', response.data)
    return response.data
  } catch (error) {
    console.error('Add patient record error:', error)

    // Enhanced error handling for better user feedback
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to create patient record',
        details: errorData?.details,
        fieldErrors: errorData?.field_errors,
        status: error.response.status
      }
    } else if (error.request) {
      // Request made but no response received
      throw {
        ...error,
        message: 'No response from server. Please check your connection.',
        details: 'Network error or server is not responding'
      }
    } else {
      // Something else happened
      throw {
        ...error,
        message: error.message || 'An unexpected error occurred',
        details: 'Request setup error'
      }
    }
  }
}

export const updatePatientRecord = async (patientData) => {
  try {
    console.log('Updating patient record:', patientData)
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientData.id || patientData.patient_id}`,
      patientData,
      axiosConfig
    )
    console.log('Patient update response:', response.data)
    return response.data
  } catch (error) {
    console.error('Update patient record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to update patient record',
        details: errorData?.details,
        fieldErrors: errorData?.field_errors,
        status: error.response.status
      }
    }
    throw error
  }
}

export const deactivate_patient = async (patientId) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}`,
      {},
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Deactivate patient error:', error)
    throw error
  }
}

export const deletePatientRecord = async (patientId) => {
  try {
    console.log('Deleting patient record:', patientId)
    const response = await axios.delete(
      `${backendConnection()}/patient_record/${patientId}`,
      axiosConfig
    )
    console.log('Patient deletion response:', response.data)
    return response.data
  } catch (error) {
    console.error('Delete patient record error:', error)

    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to delete patient record',
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

// New API functions for related records
export const addDeliveryRecord = async (patientId, deliveryData) => {
  try {
    console.log('Sending delivery data for patient:', patientId, deliveryData)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/delivery`,
      deliveryData,
      axiosConfig
    )
    console.log('Delivery record response:', response.data)
    return response.data
  } catch (error) {
    console.error('Add delivery record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to create delivery record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const updateDeliveryRecord = async (patientId, deliveryData) => {
  try {
    console.log('Updating delivery record for patient:', patientId, deliveryData)
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/delivery`,
      deliveryData,
      axiosConfig
    )
    console.log('Delivery update response:', response.data)
    return response.data
  } catch (error) {
    console.error('Update delivery record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to update delivery record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const addAnthropometricRecord = async (patientId, anthropometricData) => {
  try {
    console.log('Sending anthropometric data for patient:', patientId, anthropometricData)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/anthropometric`,
      anthropometricData,
      axiosConfig
    )
    console.log('Anthropometric record response:', response.data)
    return response.data
  } catch (error) {
    console.error('Add anthropometric record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to create anthropometric record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const updateAnthropometricRecord = async (patientId, anthropometricData) => {
  try {
    console.log('Updating anthropometric record for patient:', patientId, anthropometricData)
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/anthropometric`,
      anthropometricData,
      axiosConfig
    )
    console.log('Anthropometric update response:', response.data)
    return response.data
  } catch (error) {
    console.error('Update anthropometric record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to update anthropometric record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const addScreeningRecord = async (patientId, screeningData) => {
  try {
    console.log('Sending screening data for patient:', patientId, screeningData)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/screening`,
      screeningData,
      axiosConfig
    )
    console.log('Screening record response:', response.data)
    return response.data
  } catch (error) {
    console.error('Add screening record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to create screening record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const updateScreeningRecord = async (patientId, screeningData) => {
  try {
    console.log('Updating screening record for patient:', patientId, screeningData)
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/screening`,
      screeningData,
      axiosConfig
    )
    console.log('Screening update response:', response.data)
    return response.data
  } catch (error) {
    console.error('Update screening record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to update screening record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const addAllergyRecord = async (patientId, allergyData) => {
  try {
    console.log('Sending allergy data for patient:', patientId, allergyData)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/allergies`,
      allergyData,
      axiosConfig
    )
    console.log('Allergy record response:', response.data)
    return response.data
  } catch (error) {
    console.error('Add allergy record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to create allergy record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export const updateAllergyRecord = async (patientId, allergyData) => {
  try {
    console.log('Adding allergy record for patient:', patientId, allergyData)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/allergies`,
      allergyData,
      axiosConfig
    )
    console.log('Allergy add response:', response.data)
    return response.data
  } catch (error) {
    console.error('Add allergy record error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to add allergy record',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

// ============================================================================
// PARENT ACCESS MANAGEMENT API FUNCTIONS
// ============================================================================

/**
 * Search for existing parent users by email or phone
 * @param {string} email - Email to search for
 * @param {string} phone - Phone number to search for
 */
export const searchParents = async (email = '', phone = '') => {
  try {
    const params = new URLSearchParams()
    if (email) params.append('email', email)
    if (phone) params.append('phone', phone)

    const response = await axios.get(
      `${backendConnection()}/parents/search?${params.toString()}`,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Search parents error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to search for parents',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

/**
 * Get all parents/guardians assigned to a specific patient
 * @param {string} patientId - Patient ID
 */
export const getPatientParents = async (patientId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/patient_record/${patientId}/parents`,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Get patient parents error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to fetch parent information',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

/**
 * Assign an existing parent user to a patient
 * @param {string} patientId - Patient ID
 * @param {object} data - { parent_user_id, relationship }
 */
export const assignExistingParent = async (patientId, data) => {
  try {
    console.log('Assigning existing parent to patient:', patientId, data)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/assign-parent`,
      data,
      axiosConfig
    )
    console.log('Assign parent response:', response.data)
    return response.data
  } catch (error) {
    console.error('Assign existing parent error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to assign parent to patient',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

/**
 * Create a new parent user and assign them to a patient
 * @param {string} patientId - Patient ID
 * @param {object} data - { email, firstname, lastname, phone_number, relationship, facility_id }
 */
export const createAndAssignParent = async (patientId, data) => {
  try {
    console.log('Creating and assigning new parent to patient:', patientId, data)
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/create-and-assign-parent`,
      data,
      axiosConfig
    )
    console.log('Create and assign parent response:', response.data)
    return response.data
  } catch (error) {
    console.error('Create and assign parent error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to create and assign parent',
        details: errorData?.details,
        suggestion: errorData?.suggestion,
        existing_user_id: errorData?.existing_user_id,
        status: error.response.status
      }
    }
    throw error
  }
}

/**
 * Update parent relationship type
 * @param {string} patientId - Patient ID
 * @param {string} accessId - Parent access ID
 * @param {object} data - { relationship }
 */
export const updateParentRelationship = async (patientId, accessId, data) => {
  try {
    console.log('Updating parent relationship:', patientId, accessId, data)
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/parent_access/${accessId}`,
      data,
      axiosConfig
    )
    console.log('Update parent relationship response:', response.data)
    return response.data
  } catch (error) {
    console.error('Update parent relationship error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to update parent relationship',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

/**
 * Remove parent access from a patient
 * @param {string} patientId - Patient ID
 * @param {string} accessId - Parent access ID
 */
export const removeParentAccess = async (patientId, accessId) => {
  try {
    console.log('Removing parent access:', patientId, accessId)
    const response = await axios.delete(
      `${backendConnection()}/patient_record/${patientId}/remove-parent/${accessId}`,
      axiosConfig
    )
    console.log('Remove parent access response:', response.data)
    return response.data
  } catch (error) {
    console.error('Remove parent access error:', error)
    if (error.response) {
      const errorData = error.response.data
      throw {
        ...error,
        message: errorData?.message || 'Failed to remove parent access',
        details: errorData?.details,
        status: error.response.status
      }
    }
    throw error
  }
}

export default {
  getPatients,
  getPatientById,
  addPatientRecord,
  updatePatientRecord,
  deactivate_patient,
  deletePatientRecord,
  addDeliveryRecord,
  updateDeliveryRecord,
  addAnthropometricRecord,
  updateAnthropometricRecord,
  addScreeningRecord,
  updateScreeningRecord,
  addAllergyRecord,
  updateAllergyRecord,
  // Parent access management
  searchParents,
  getPatientParents,
  assignExistingParent,
  createAndAssignParent,
  updateParentRelationship,
  removeParentAccess,
}
