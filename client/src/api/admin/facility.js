import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

// Use the SUPABASE REAL-TIME INSTEAD
export const getFacilities = async ({ bust_cache = false } = {}) => {
  const response = await axios.get(
    `${backendConnection()}/admin/facilities${bust_cache ? '?bust_cache=true' : ''}`,
    axiosConfig
  )
  return response.data
}

export const getFacilityById = async (facilityId) => {
  const response = await axios.get(
    `${backendConnection()}/admin/facilities/${facilityId}`,
    axiosConfig
  )
  return response.data
}

export const createFacility = async (facilityData) => {
  const response = await axios.post(
    `${backendConnection()}/admin/facilities`,
    facilityData,
    axiosConfig
  )
  return response.data
}

export const updateFacility = async (facilityData) => {
  const response = await axios.put(
    `${backendConnection()}/admin/facilities/${facilityData.id}`,
    facilityData,
    axiosConfig
  )
  return response.data
}

export const deactivateFacility = async (facilityId) => {
  const response = await axios.post(
    `${backendConnection()}/admin/deactivate_facility/${facilityId}`,
    {}, // Empty body since we're not sending data
    {
      ...axiosConfig,
      headers: {
        ...axiosConfig.headers,
        Accept: 'application/json',
      },
    }
  )
  return response.data
}

export default {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deactivateFacility,
}
