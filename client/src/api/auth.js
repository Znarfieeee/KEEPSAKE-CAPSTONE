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
    return response.data
}

export const logout = async () => {
    const response = await axios.post(
        `${backendConnection()}/logout`,
        {},
        axiosConfig
    )
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

// ------------------------------------------------------------
// Fetch the currently authenticated user using cookie-based session
// ------------------------------------------------------------
export const getSession = async () => {
    const response = await axios.get(
        `${backendConnection()}/session`,
        axiosConfig
    )
    return response.data
}
