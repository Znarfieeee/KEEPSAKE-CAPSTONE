import backendConnection from "./backendApi"
import axios from "axios"

const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}

export const login = async (email, password) => {
    const response = await axios.post(
        `${backendConnection()}/login`,
        { email, password },
        axiosConfig
    )
    console.log(response.data)
    return response.data
}

export const logout = async () => {
    const response = await axios.post(
        `${backendConnection()}/logout`,
        {},
        axiosConfig
    )
    console.log(response.data)
    return response.data
}

export const refresh = async () => {
    const response = await axios.post(
        `${backendConnection()}/token/refresh`,
        {},
        axiosConfig
    )
    return response.data
}
