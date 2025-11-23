import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Create a new vaccination record for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} vaccinationData - Vaccination data
 * @returns {Promise} API response
 */
export const createVaccination = async (patientId, vaccinationData) => {
    const response = await axios.post(
        `${backendConnection()}/pediapro/patients/${patientId}/vaccinations`,
        vaccinationData,
        axiosConfig
    )
    return response.data
}

/**
 * Update a vaccination record
 * @param {string} patientId - Patient ID
 * @param {string} vaxId - Vaccination ID
 * @param {Object} vaccinationData - Updated vaccination data
 * @returns {Promise} API response
 */
export const updateVaccination = async (patientId, vaxId, vaccinationData) => {
    const response = await axios.put(
        `${backendConnection()}/pediapro/patients/${patientId}/vaccinations/${vaxId}`,
        vaccinationData,
        axiosConfig
    )
    return response.data
}

/**
 * Delete a vaccination record (soft delete for HIPAA/GDPR compliance)
 * @param {string} patientId - Patient ID
 * @param {string} vaxId - Vaccination ID
 * @returns {Promise} API response
 */
export const deleteVaccination = async (patientId, vaxId) => {
    const response = await axios.delete(
        `${backendConnection()}/pediapro/patients/${patientId}/vaccinations/${vaxId}`,
        axiosConfig
    )
    return response.data
}

/**
 * Restore a soft-deleted vaccination record (Admin only)
 * @param {string} patientId - Patient ID
 * @param {string} vaxId - Vaccination ID
 * @returns {Promise} API response
 */
export const restoreVaccination = async (patientId, vaxId) => {
    const response = await axios.post(
        `${backendConnection()}/pediapro/patients/${patientId}/vaccinations/${vaxId}/restore`,
        {},
        axiosConfig
    )
    return response.data
}
