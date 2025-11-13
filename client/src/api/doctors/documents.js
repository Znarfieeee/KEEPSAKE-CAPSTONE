import axios from 'axios'
import backendConnection from '../backendApi'

/**
 * Upload a medical document for a patient
 * @param {string} patientId - Patient ID
 * @param {File} file - File to upload
 * @param {string} documentType - Type of document (lab_result, imaging_report, etc.)
 * @param {string} description - Optional description
 * @param {Object} relatedIds - Optional related record IDs
 * @returns {Promise<Object>} Response data
 */
export const uploadDocument = async (patientId, file, documentType, description = '', relatedIds = {}) => {
    try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('patient_id', patientId)
        formData.append('document_type', documentType)

        if (description?.trim()) {
            formData.append('description', description.trim())
        }

        // Add optional related record IDs
        if (relatedIds.appointmentId) {
            formData.append('related_appointment_id', relatedIds.appointmentId)
        }
        if (relatedIds.prescriptionId) {
            formData.append('related_prescription_id', relatedIds.prescriptionId)
        }
        if (relatedIds.vaccinationId) {
            formData.append('related_vaccination_id', relatedIds.vaccinationId)
        }

        const response = await axios.post(
            `${backendConnection()}/documents/upload`,
            formData,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )

        return response.data
    } catch (error) {
        console.error('Upload document error:', error)
        throw error.response?.data || error
    }
}

/**
 * Get all documents for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} options - Query options
 * @param {string} options.documentType - Filter by document type
 * @param {boolean} options.includeDeleted - Include deleted documents
 * @returns {Promise<Object>} Response data with documents array
 */
export const getPatientDocuments = async (patientId, options = {}) => {
    try {
        const params = new URLSearchParams()

        if (options.documentType) {
            params.append('document_type', options.documentType)
        }

        if (options.includeDeleted) {
            params.append('include_deleted', 'true')
        }

        const queryString = params.toString()
        const url = `${backendConnection()}/documents/patient/${patientId}${queryString ? '?' + queryString : ''}`

        const response = await axios.get(url, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return response.data
    } catch (error) {
        console.error('Get patient documents error:', error)
        throw error.response?.data || error
    }
}

/**
 * Get a specific document with download URL
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Response data with document and download URL
 */
export const getDocument = async (documentId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/documents/${documentId}`,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        return response.data
    } catch (error) {
        console.error('Get document error:', error)
        throw error.response?.data || error
    }
}

/**
 * Delete a document (soft delete)
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Response data
 */
export const deleteDocument = async (documentId) => {
    try {
        const response = await axios.delete(
            `${backendConnection()}/documents/${documentId}`,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        return response.data
    } catch (error) {
        console.error('Delete document error:', error)
        throw error.response?.data || error
    }
}

/**
 * Get available document types
 * @returns {Promise<Object>} Response data with document types array
 */
export const getDocumentTypes = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/documents/types`,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        return response.data
    } catch (error) {
        console.error('Get document types error:', error)
        throw error.response?.data || error
    }
}

export default {
    uploadDocument,
    getPatientDocuments,
    getDocument,
    deleteDocument,
    getDocumentTypes,
}
