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
    const response = await axios.post(
      `${backendConnection()}/patient_records`,
      patientData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Add patient record error:', error)
    throw error
  }
}

export const updatePatientRecord = async (patientData) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientData.id}`,
      patientData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Update patient record error:', error)
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

// New API functions for related records
export const addDeliveryRecord = async (patientId, deliveryData) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/delivery`,
      deliveryData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Add delivery record error:', error)
    throw error
  }
}

export const updateDeliveryRecord = async (patientId, deliveryData) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/delivery`,
      deliveryData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Update delivery record error:', error)
    throw error
  }
}

export const addAnthropometricRecord = async (patientId, anthropometricData) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/anthropometric`,
      anthropometricData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Add anthropometric record error:', error)
    throw error
  }
}

export const updateAnthropometricRecord = async (patientId, anthropometricData) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/anthropometric`,
      anthropometricData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Update anthropometric record error:', error)
    throw error
  }
}

export const addScreeningRecord = async (patientId, screeningData) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/screening`,
      screeningData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Add screening record error:', error)
    throw error
  }
}

export const updateScreeningRecord = async (patientId, screeningData) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/screening`,
      screeningData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Update screening record error:', error)
    throw error
  }
}

export const addAllergyRecord = async (patientId, allergyData) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/patient_record/${patientId}/allergies`,
      allergyData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Add allergy record error:', error)
    throw error
  }
}

export const updateAllergyRecord = async (patientId, allergyData) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/patient_record/${patientId}/allergies`,
      allergyData,
      axiosConfig
    )
    return response.data
  } catch (error) {
    console.error('Update allergy record error:', error)
    throw error
  }
}

export default {
  getPatients,
  getPatientById,
  addPatientRecord,
  updatePatientRecord,
  deactivate_patient,
  addDeliveryRecord,
  updateDeliveryRecord,
  addAnthropometricRecord,
  updateAnthropometricRecord,
  addScreeningRecord,
  updateScreeningRecord,
  addAllergyRecord,
  updateAllergyRecord,
}
