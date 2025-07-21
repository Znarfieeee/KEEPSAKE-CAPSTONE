import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { login, logout, getSession } from "../api/auth"
import { AuthContext } from "./auth"
import { showToast } from "../util/alertHelper"

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true) // Start as true until we check existing session

    const navigate = useNavigate()

    const signIn = async (email, password) => {
        setLoading(true)
        try {
            const response = await login(email, password)

            if (response.status === "success") {
                showToast("success", "Login successful")
                setUser(response.user)
            } else {
                throw new Error(response.message || "Login failed")
            }
            return response
        } catch (err) {
            showToast("error", err.message || "Login failed")
            throw err
        } finally {
            setLoading(false)
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

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await getSession()
                if (res.status === "success" && res.user) {
                    setUser(res.user)
                }
            } catch (err) {
                // Clear user state if session is expired
                if (err.message === "Session expired. Please login again.") {
                    setUser(null)
                    // Optionally redirect to login page
                    navigate("/login")
                }
                console.debug("Session error:", err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchSession()
    }, [navigate])

    useEffect(() => {
        if (!loading && user?.role) {
            switch (user.role) {
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
