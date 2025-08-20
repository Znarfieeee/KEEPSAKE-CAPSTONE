import { axiosConfig } from '../axiosConfig'
import backendConnection from '../backendApi'
import axios from 'axios'

export const getPatientById = async (patientId) => {
  const response = await axios.get(
    `
    ${backendConnection()}/patient/${patientId}`,
    axiosConfig
  )
  return response.data
}
