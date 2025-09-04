import axios from 'axios'
import backendConnection from '../backendApi'
import { axiosConfig } from '../axiosConfig'

export const getAllPrescriptions = async (patientId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/patient_record/${patientId}/prescriptions`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Get prescription error: ', error)
        throw error
    }
}

export const addPrescription = async (patientId, prescriptionData) => {
    try {
        const response = await axios.post(
            `
            ${backendConnection()}/patient_record/${patientId}/prescriptions`,
            prescriptionData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Add prescription error: ', error)
        throw error
    }
}

export const updatePrescription = async (patientId, prescriptionData) => {
    try {
        const response = await axios.put(
            `
            ${backendConnection()}/patient_record/${patientId}/prescriptions`,
            prescriptionData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Update prescription error: ', error)
        throw error
    }
}

export default {
    getAllPrescriptions,
    addPrescription,
    updatePrescription,
}
