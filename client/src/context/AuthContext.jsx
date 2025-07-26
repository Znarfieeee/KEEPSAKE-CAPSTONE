/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    login,
    logout,
    getSession,
    refreshSession as refreshToken,
} from "../api/auth"
import { AuthContext } from "./auth"
import { showToast } from "../util/alertHelper"

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const navigate = useNavigate()

    const checkExistingSession = async () => {
        try {
            const data = await getSession()
            if (data.status === "success") {
                setUser(data.user)
                setIsAuthenticated(true)
                return true
            }
            return false
        } catch (err) {
            // Suppress detailed error logging
            return false
        }
    }

    const runRefreshSession = async () => {
        try {
            const data = await refreshToken()
            if (data.status === "success") {
                setUser(data.user)
                setIsAuthenticated(true)
                return true
            }
            return false
        } catch (_) {
            // Silent failure for security
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
                navigateOnLogin(response.user.role)
                return response
            } else {
                showToast("error", "Invalid credentials")
                return { success: false, message: "Invalid credentials" }
            }
        } catch (_) {
            showToast("error", "Authentication failed")
            return { success: false, message: "Authentication failed" }
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            await logout()
            showToast("success", "Logout successful")
        } catch (_) {
            // Silent failure but ensure user is logged out locally
            showToast("info", "You have been logged out")
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
                    const refreshedSession = await runRefreshSession()
                    if (!refreshedSession) {
                        setUser(null)
                        setIsAuthenticated(false)
                    }
                }
                setLoading(false)
            } catch (_) {
                setUser(null)
                setIsAuthenticated(false)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()
    }, [])

    useEffect(() => {
        if (!isAuthenticated) return

        const refreshInterval = setInterval(async () => {
            await runRefreshSession()
        }, 25 * 60 * 1000)

        return () => clearInterval(refreshInterval)
    }, [isAuthenticated])

    // Only navigate on initial login, not on refresh
    const navigateOnLogin = role => {
        switch (role) {
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
            case "facility_admin":
                navigate("/facility_admin")
                break
            default:
                navigate("/")
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                signIn,
                signOut,
                loading,
                checkExistingSession,
                refreshSession: refreshToken,
                btnClicked,
            }}>
            {children}
        </AuthContext.Provider>
    )
}
