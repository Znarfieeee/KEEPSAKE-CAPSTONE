import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { login, logout, getSession } from "../api/auth"
import { AuthContext } from "./auth"
import { showToast } from "../util/alertHelper"

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const navigate = useNavigate()

    const checkExistingSession = async () => {
        try {
            const response = await getSession()
            if (response.ok) {
                const data = await response.json()
                if (data.status === "success") {
                    setUser(data.user)
                    setIsAuthenticated(true)
                    return true
                }
            }
            return false
        } catch (err) {
            console.error("Session check failed: ", err)
            return false
        }
    }

    const refreshSession = async () => {
        try {
            const response = await refreshSession()
            if (response.ok) {
                const data = await response.json()
                if (data.status === "success") {
                    setUser(data.user)
                    setIsAuthenticated(true)
                    return true
                }
            }
            return false
        } catch (err) {
            console.error("Token refresh failed: ", err)
            return false
        }
    }

    const signIn = async (email, password) => {
        try {
            const hasExistingSession = await checkExistingSession()
            if (hasExistingSession) {
                return { success: true, message: "Already logged in" }
            }

            const response = await login(email, password)

            if (response.status === "success") {
                showToast("success", "Login successful")
                setUser(response.user)
                setIsAuthenticated(true)

                return response
            } else {
                throw new Error(response.message || "Login failed")
            }
        } catch (err) {
            showToast("error", err.message || "Login failed")
            throw err
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            await logout()
            showToast("success", "Logout successful")
        } catch (err) {
            console.error("There is an error: ", err)
            showToast("error", "Logout failed")
        } finally {
            setLoading(false)
            setUser(null)
            setIsAuthenticated(false)
        }
    }

    const btnClicked = () => {
        alert("Button clicked")
    }

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true)

                const hasValidSession = await checkExistingSession()
                if (!hasValidSession) {
                    const refreshedSession = await refreshSession()
                    if (!refreshedSession) {
                        setUser(null)
                        setIsAuthenticated(false)
                    }
                }
                setLoading(false)
            } catch (err) {
                if (err.message === "Session expired. Please login again.") {
                    setUser(null)
                }
                console.debug("Session error:", err.message)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()
    }, [])

    useEffect(() => {
        if (!isAuthenticated) return

        const refreshInterval = setInterval(async () => {
            await refreshSession()
        }, 25 * 60 * 1000)

        return () => clearInterval(refreshInterval)
    }, [isAuthenticated])

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
                isAuthenticated,
                signIn,
                signOut,
                loading,
                checkExistingSession,
                refreshSession,
                btnClicked,
            }}>
            {children}
        </AuthContext.Provider>
    )
}
