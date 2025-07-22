import backendConnection from "./backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}

export const getFacilities = async () => {
    const response = await axios.get(
        `${backendConnection()}/facilities`,
        axiosConfig
    )
    return response.data
}

export const createFacility = async facilityData => {
    const response = await axios.post(
        `${backendConnection()}/facilities`,
        facilityData,
        axiosConfig
    )
    return response.data
}

export default {
    getFacilities,
    createFacility,
}
