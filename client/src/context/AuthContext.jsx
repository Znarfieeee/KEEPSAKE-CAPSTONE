import React, { useState } from "react"
import { login, logout } from "../api/auth"
import { AuthContext } from "./auth"
// import { showToast } from "../util/alertHelper"

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false) // Initialize as false

    const signIn = async (email, password) => {
        setLoading(true)
        try {
            const response = await login(email, password)

            setUser(response.user)
            setLoading(false)
            return response
        } catch (err) {
            setLoading(false) // Reset loading on error
            throw err // Re-throw the error to be handled by the login component
        }
    }

    const signOut = async () => {
        setLoading(true)
        setUser(null)

        try {
            await logout() // Added await here
        } catch (err) {
            console.error("There is an error: ", err)
        } finally {
            setLoading(false)
        }
    }

    const btnClicked = () => {
        alert("Button clicked")
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                signIn,
                signOut,
                loading,
                role: user?.role,
                btnClicked,
            }}>
            {children}
        </AuthContext.Provider>
    )
}
