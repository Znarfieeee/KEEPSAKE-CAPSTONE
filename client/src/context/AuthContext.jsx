import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { login, logout } from "../api/auth"
import { AuthContext } from "./auth"
import { showToast } from "../util/alertHelper"

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false) // Initialize as false
    const [userDetail, setUserDetail] = useState(null) // New state for user detail

    const navigate = useNavigate()

    const signIn = async (email, password) => {
        setLoading(true)
        try {
            const response = await login(email, password)

            showToast("success", "Login successful")
            setUser(response.user)
            setUserDetail(response.user_detail) // Save full user record
            setLoading(false)
            return response
        } catch (err) {
            showToast("error", "Login failed")
            setLoading(false) // Reset loading on error
            throw err // Re-throw the error to be handled by the login component
        }
    }

    const signOut = async () => {
        setLoading(true)
        setUser(null)

        try {
            await logout() // Added await here
            showToast("success", "Logout successful")
        } catch (err) {
            console.error("There is an error: ", err)
            showToast("error", "Logout failed")
        } finally {
            setLoading(false)
        }
    }

    const btnClicked = () => {
        alert("Button clicked")
    }

    // Additional utility method can be added later to refresh userDetail if needed.

    /* ------------------------------------------------------------------
     * Navigate based on the authenticated user's role
     * ------------------------------------------------------------------*/
    useEffect(() => {
        if (!loading && user?.role) {
            switch (user.role) {
                case "SystemAdmin":
                case "admin":
                    navigate("/admin")
                    break
                case "Pediapro":
                    navigate("/pediapro")
                    break
                case "Keepsaker":
                    navigate("/keepsaker")
                    break
                case "VitalCustodian":
                    navigate("/vital_custodian")
                    break
                default:
                    navigate("/")
            }
        }
    }, [loading, user, navigate])

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                userDetail,
                setUserDetail,
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
