import React, { createContext, useContext, useState, useCallback } from 'react'
import { getPatientById } from '@/api/doctors/patient'

export const PatientContext = createContext()

export const PatientProvider = ({ children }) => {
  const [patientsCache, setPatientsCache] = useState(new Map())
  const [loading, setLoading] = useState(false)

  const getPatient = useCallback(async (patientId) => {
    // Check if we have a cached version
    if (patientsCache.has(patientId)) {
      return patientsCache.get(patientId)
    }

    // If not in cache, fetch from API
    try {
      setLoading(true)
      const response = await getPatientById(patientId)
      const patientData = response.data

      // Cache the result
      setPatientsCache((prev) => new Map(prev).set(patientId, patientData))
      return patientData
    } catch (error) {
      console.error('Error fetching patient:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePatientInCache = useCallback((patientId, newData) => {
    setPatientsCache((prev) => new Map(prev).set(patientId, newData))
  }, [])

  const invalidateCache = useCallback((patientId) => {
    setPatientsCache((prev) => {
      const newCache = new Map(prev)
      newCache.delete(patientId)
      return newCache
    })
  }, [])

  return (
    <PatientContext.Provider
      value={{
        getPatient,
        updatePatient: updatePatientInCache,
        invalidateCache,
        loading,
      }}
    >
      {children}
    </PatientContext.Provider>
  )
}

// Fix get patient by ID
// 1. Working getPatientById route
// 2. Frontend supabase realtime implementation for live update
// 3. Contextualize for better accessing but still need a fix. || Rely solely on redis caching...
