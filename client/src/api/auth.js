import backendConnection from "./backendApi"
import axios from "axios"

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${backendConnection()}/login`, {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })

        const result = await response.json()

        if (!response === 200) {
            throw new Error("Invalid login response from server: " + result)
        }

        //  Replace it with supabase session management
        if (result) {
            if (result.token) {
                localStorage.setItem("token", result.token)
            }
            return result
        } else {
            throw new Error("Invalid login response from server: " + result)
        }
    } catch (err) {
        throw new Error("Invalid login response from server: " + err)
    }
}
