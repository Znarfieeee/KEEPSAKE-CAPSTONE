import { axiosConfig } from '../axiosConfig'
import backendConnection from '../backendApi'
import axios from 'axios'

export const getPatients = async () => {
  const response = await axios.get(`${backendConnection()}/patient_records`, axiosConfig)
  return response.data
}

export const getPatientById = async (patientId) => {
  const response = await axios.get(
    `
    ${backendConnection()}/patient_record/${patientId}`,
    axiosConfig
  )
  return response.data
}

export const addPatientRecord = async (patientData) => {
  const response = await axios.post(
    `${backendConnection()}/patient_records`,
    patientData,
    axiosConfig
  )
  return response.data
}

export const updatePatientRecord = async (patientData) => {
  const response = await axios.put(
    `${backendConnection()}/patient_records/${patientData.id}`,
    patientData,
    axiosConfig
  )
  return response.data
}

export const deactivate_patient = async (patientId) => {
  const response = await axios.post(
    `${backendConnection()}/patient_record/${patientId}`,
    {},
    axiosConfig
  )
  return response.data
}

export default {
  getPatients,
  getPatientById,
  addPatientRecord,
  updatePatientRecord,
  deactivate_patient,
}
