import backendConnection from "../backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}

export const getFacilities = async () => {
    const response = await axios.get(
        `${backendConnection()}/admin/facilities`,
        axiosConfig
    )
    return response.data
}

export const getFacilityById = async facilityId => {
    const response = await axios.get(
        `${backendConnection()}/admin/facilities/${facilityId}`,
        axiosConfig
    )
    return response.data
}

export const createFacility = async facilityData => {
    const response = await axios.post(
        `${backendConnection()}/admin/facilities`,
        facilityData,
        axiosConfig
    )
    return response.data
}

export default {
    getFacilities,
    getFacilityById,
    createFacility,
}
