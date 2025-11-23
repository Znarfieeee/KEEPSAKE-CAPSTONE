import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

export const getAppointments = async () => {
    try {
        const response = await axios.get(`${backendConnection()}/appointments`, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Get appointments error: ', error)
        throw error
    }
}

export const getAppointmentsByPatient = async (patientId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/appointments/patient/${patientId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Get patient appointments error:', error)
        throw error
    }
}

export const getAppointmentsByDoctor = async (doctorId, bustCache = false) => {
    try {
        const url = bustCache
            ? `${backendConnection()}/appointments/doctor/${doctorId}?bust_cache=true`
            : `${backendConnection()}/appointments/doctor/${doctorId}`
        const response = await axios.get(url, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Get doctor appointments error:', error)
        throw error
    }
}

export const getAppointmentsByFacility = async (facilityId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/appointments/facility/${facilityId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Get facility appointments error:', error)
        throw error
    }
}

export const getAppointmentsForMyFacility = async (bustCache = false) => {
    try {
        const url = bustCache
            ? `${backendConnection()}/appointments/my-facility?bust_cache=true`
            : `${backendConnection()}/appointments/my-facility`
        const response = await axios.get(url, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Get my facility appointments error:', error)
        throw error
    }
}

export const searchPatientByName = async (searchTerm) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/search_patients?name=${encodeURIComponent(searchTerm)}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Search patient by name error: ', error)
        throw error
    }
}

export const getAvailableDoctors = async () => {
    try {
        const response = await axios.get(`${backendConnection()}/doctors/available`, axiosConfig)
        return response.data
    } catch (error) {
        console.error('Error getting available doctors: ', error)
        throw error
    }
}

export const scheduleAppointment = async (appointmentData) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/appointments`,
            appointmentData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Schedule appointment error:', error)
        throw error
    }
}

export const updateAppointment = async (appointmentId, appointmentData) => {
    try {
        const response = await axios.put(
            `${backendConnection()}/appointments/${appointmentId}`,
            appointmentData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Update appointment error:', error)
        throw error
    }
}

export const updateAppointmentStatus = async (appointmentId, status, notes = '') => {
    try {
        const response = await axios.patch(
            `${backendConnection()}/appointments/${appointmentId}/status`,
            { status, notes },
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Update appointment status error:', error)
        throw error
    }
}

export const cancelAppointment = async (appointmentId) => {
    try {
        const response = await axios.delete(
            `${backendConnection()}/appointments/${appointmentId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Cancel appointment error:', error)
        throw error
    }
}

export default {
    getAppointments,
    getAppointmentsByPatient,
    getAppointmentsByDoctor,
    getAppointmentsByFacility,
    getAppointmentsForMyFacility,
    searchPatientByName,
    scheduleAppointment,
    updateAppointment,
    updateAppointmentStatus,
    cancelAppointment,
}
