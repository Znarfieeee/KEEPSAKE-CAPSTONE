import axios from 'axios'
import backendConnection from '../backendApi'
import { axiosConfig } from '../axiosConfig'

/**
 * Add anthropometric measurement for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} measurementData - Measurement data
 * @param {number} measurementData.weight - Weight in kg (optional)
 * @param {number} measurementData.height - Height in cm (optional)
 * @param {number} measurementData.head_circumference - Head circumference in cm (optional)
 * @param {number} measurementData.chest_circumference - Chest circumference in cm (optional)
 * @param {number} measurementData.abdominal_circumference - Abdominal circumference in cm (optional)
 * @param {string} measurementData.measurement_date - Measurement date (YYYY-MM-DD)
 * @returns {Promise<Object>} Response data
 */
export const addMeasurement = async (patientId, measurementData) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/patient_record/${patientId}/growth-milestone`,
            measurementData,
            axiosConfig
        )

        return response.data
    } catch (error) {
        console.error('Add measurement error:', error)
        throw error.response?.data || error
    }
}

/**
 * Get all measurements for a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Response data with measurements array
 */
export const getMeasurements = async (patientId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/patient_record/${patientId}/growth-milestones`,
            axiosConfig
        )

        return response.data
    } catch (error) {
        console.error('Get measurements error:', error)
        throw error.response?.data || error
    }
}

/**
 * Update a measurement
 * @param {string} patientId - Patient ID
 * @param {string} measurementId - Measurement ID
 * @param {Object} measurementData - Updated measurement data
 * @returns {Promise<Object>} Response data
 */
export const updateMeasurement = async (patientId, measurementId, measurementData) => {
    try {
        const response = await axios.put(
            `${backendConnection()}/patient_record/${patientId}/growth-milestone/${measurementId}`,
            measurementData,
            axiosConfig
        )

        return response.data
    } catch (error) {
        console.error('Update measurement error:', error)
        throw error.response?.data || error
    }
}

/**
 * Delete a measurement
 * @param {string} patientId - Patient ID
 * @param {string} measurementId - Measurement ID
 * @returns {Promise<Object>} Response data
 */
export const deleteMeasurement = async (patientId, measurementId) => {
    try {
        const response = await axios.delete(
            `${backendConnection()}/patient_record/${patientId}/growth-milestone/${measurementId}`,
            axiosConfig
        )

        return response.data
    } catch (error) {
        console.error('Delete measurement error:', error)
        throw error.response?.data || error
    }
}

export default {
    addMeasurement,
    getMeasurements,
    updateMeasurement,
    deleteMeasurement,
}
