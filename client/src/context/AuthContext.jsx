/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, logout, getSession, refreshSession as refreshToken } from '../api/auth'
import { AuthContext } from './auth'
import { showToast } from '../util/alertHelper'

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [sessionStatus, setSessionStatus] = useState()
    const navigate = useNavigate()

    // Session timing constants
    const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes - refresh tokens
    const ACTIVITY_THROTTLE = 30 * 1000 // 30 seconds - throttle activity updates
    const VISIBILITY_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes - refresh when returning to tab
    // Note: No IDLE_LOGOUT_TIME - sessions persist for 30 days based on backend Redis timeout

    const refreshTimerRef = useRef(null)
    const lastActivityRef = useRef(Date.now())
    const lastRefreshRef = useRef(Date.now())
    const isActiveRef = useRef(true)
    const refreshPromiseRef = useRef(null) // Prevent concurrent refresh calls

    const clearAllTimers = useCallback(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current)
            refreshTimerRef.current = null
        }
    }, [])

    const navigateOnLogin = useCallback(
        (role) => {
            switch (role) {
                case 'admin':
                    navigate('/admin')
                    break
                case 'doctor':
                    navigate('/pediapro')
                    break
                case 'parent':
                    navigate('/parent')
                    break
                case 'nurse':
                    navigate('/nurse')
                    break
                case 'facility_admin':
                    navigate('/facility_admin')
                    break
                default:
                    navigate('/')
            }
        },
        [navigate]
    )

    const checkExistingSession = useCallback(async () => {
        try {
            const data = await getSession()
            if (data.status === 'success' && data.user) {
                setUser(data.user)
                setIsAuthenticated(true)
                lastActivityRef.current = Date.now()
                lastRefreshRef.current = Date.now()
                setSessionStatus('active')

                // Check if this is first login and redirect to first-login page
                if (data.user?.is_first_login) {
                    navigate('/first-login', { replace: true })
                }

                return true
            }
            return false
        } catch (error) {
            // Silent failure - expected when no session exists
            return false
        }
    }, [navigate])

    const runRefreshSession = useCallback(
        async (force = false) => {
            if (refreshPromiseRef.current && !force) {
                return refreshPromiseRef.current
            }

            const refreshPromise = async () => {
                if (isRefreshing && !force) return false

                try {
                    setIsRefreshing(true)
                    const data = await refreshToken()

                    if (data.status === 'success') {
                        setUser(data.user)
                        setIsAuthenticated(true)
                        lastRefreshRef.current = Date.now()
                        setSessionStatus('active')

                        // Check if this is first login and redirect to first-login page
                        if (data.user?.is_first_login) {
                            navigate('/first-login', { replace: true })
                        }

                        return true
                    }

                    if (isAuthenticated) {
                        showToast('warning', 'Session expired. Please log in again.')
                        await signOut(true)
                    }
                    return false
                } catch (_) {
                    // Silent failure for security
                    if (isAuthenticated) {
                        showToast('warning', 'Session expired. Please log in again.')
                        await signOut(true)
                    }
                    return false
                } finally {
                    setIsRefreshing(false)
                    refreshPromiseRef.current = null
                }
            }

            refreshPromiseRef.current = refreshPromise()
            return refreshPromiseRef.current
        },
        [isAuthenticated, isRefreshing, navigate]
    )

    const signIn = useCallback(
        async (email, password) => {
            try {
                setLoading(true)

                const hasExistingSession = await checkExistingSession()
                if (hasExistingSession) {
                    return { success: true, message: 'Already logged in' }
                }

                const response = await login(email, password)

                // Check if 2FA is required
                if (response.status === '2fa_required' || response.requires_2fa) {
                    // Return the response without setting auth state
                    // Login.jsx will handle the 2FA flow
                    return response
                }

                if (response.status === 'success') {
                    showToast('success', 'Login successful')
                    setUser(response.user)
                    setIsAuthenticated(true)
                    lastRefreshRef.current = Date.now()
                    setSessionStatus('active')

                    // Check if this is first login
                    if (response.user?.is_first_login) {
                        // Redirect to first login page instead of dashboard
                        navigate('/first-login', { replace: true })
                    } else {
                        navigateOnLogin(response.user.role)
                    }
                    return response
                } else {
                    // Use the specific error message from the backend response
                    const errorMessage = response.message || 'Invalid credentials'
                    throw new Error(errorMessage)
                }
            } catch (error) {
                // Preserve the specific error message and re-throw for Login component to handle
                const errorMessage = error.message || 'Authentication failed'
                throw new Error(errorMessage)
            } finally {
                setLoading(false)
            }
        },
        [checkExistingSession, navigateOnLogin, navigate]
    )

    const signOut = useCallback(
        async (silent = false) => {
            try {
                setLoading(true)
                isActiveRef.current = false

                clearAllTimers()

                if (!silent) {
                    try {
                        await logout()
                        showToast('success', 'Logout successful')
                    } catch (_) {
                        showToast('info', 'You have been logged out!')
                    }
                } else {
                    try {
                        await logout()
                    } catch {
                        // Silent handling of logged out session.
                    }
                }
            } catch {
                // Silent failure but ensure user is logged out locally
                if (!silent) return showToast('info', 'You have been logged out!')
                showToast('info', 'You have been logged out')
            } finally {
                setLoading(false)
                setUser(null)
                setIsAuthenticated(false)
                setSessionStatus('expired')
                refreshPromiseRef.current = null
                // Reset font size to default on logout
                document.documentElement.style.setProperty('--base-font-size', '16px')
                navigate('/login')
            }
        },
        [clearAllTimers, navigate]
    )

    const handleActivity = useCallback(() => {
        if (!isAuthenticated) return

        const now = Date.now()
        const timeSinceLastActivity = now - lastActivityRef.current

        if (timeSinceLastActivity < ACTIVITY_THROTTLE) return

        lastActivityRef.current = now
        isActiveRef.current = true
        setSessionStatus('active')

        // Idle logout disabled - sessions now expire based on backend Redis timeout (30 days)
        // No automatic logout on inactivity - only token expiry will log users out
    }, [isAuthenticated, ACTIVITY_THROTTLE])

    useEffect(() => {
        if (!isAuthenticated) return

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
        events.forEach((e) => window.addEventListener(e, handleActivity))

        return () => {
            events.forEach((e) => window.removeEventListener(e, handleActivity))
        }
    }, [isAuthenticated, handleActivity])

    const _startSessionManagement = useCallback(() => {
        if (!isAuthenticated) return
        clearAllTimers()
        refreshTimerRef.current = setInterval(async () => {
            const now = Date.now()
            const timeSinceLastRefresh = now - lastRefreshRef.current

            // Refresh token every 15 minutes regardless of activity
            // No idle check - sessions persist for 30 days based on backend Redis timeout
            if (timeSinceLastRefresh >= REFRESH_INTERVAL) {
                await runRefreshSession()
            }
        }, REFRESH_INTERVAL)

        handleActivity()
    }, [isAuthenticated, handleActivity, clearAllTimers, runRefreshSession, REFRESH_INTERVAL])

    // Removed debug helpers (btnClicked/alerts) for production readiness

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true)

                // First, try to get existing session
                const hasValidSession = await checkExistingSession()

                if (hasValidSession) {
                    // Session exists and is valid, user is logged in
                    lastRefreshRef.current = Date.now()
                    lastActivityRef.current = Date.now()
                    setSessionStatus('active')
                } else {
                    // Try to refresh the session with the stored token
                    const refreshedSession = await runRefreshSession()

                    if (refreshedSession) {
                        // Session refreshed successfully
                        lastActivityRef.current = Date.now()
                    } else {
                        // No valid session, user needs to log in
                        setUser(null)
                        setIsAuthenticated(false)
                        setSessionStatus('expired')
                    }
                }
            } catch (error) {
                // Silent failure - expected on first visit or after session expiry
                setUser(null)
                setIsAuthenticated(false)
                setSessionStatus('expired')
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()
    }, [checkExistingSession, runRefreshSession])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                handleActivity()

                const now = Date.now()
                const timeSinceLastRefresh = now - lastRefreshRef.current

                if (timeSinceLastRefresh > VISIBILITY_REFRESH_THRESHOLD) {
                    runRefreshSession()
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isAuthenticated, handleActivity, runRefreshSession, VISIBILITY_REFRESH_THRESHOLD])

    useEffect(() => {
        const handleOnline = () => {
            if (isAuthenticated) {
                runRefreshSession()
            }
        }

        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [isAuthenticated, runRefreshSession])

    const updateUser = useCallback((updatedUserData) => {
        setUser((prevUser) => ({
            ...prevUser,
            ...updatedUserData,
        }))
    }, [])

    // Apply font size to DOM when user font_size changes
    useEffect(() => {
        if (user?.font_size) {
            document.documentElement.style.setProperty('--base-font-size', `${user.font_size}px`)
        } else {
            document.documentElement.style.setProperty('--base-font-size', '16px')
        }
    }, [user?.font_size])

    const contextValue = {
        // Core auth state
        user,
        isAuthenticated,
        loading,
        isRefreshing,
        sessionStatus, // 'active', 'warning', 'expired'

        // Auth actions
        signIn,
        signOut,
        checkExistingSession,
        refreshSession: runRefreshSession,
        updateUser,

        // Legacy/debug: removed in production

        // Utility functions for components that need session info
        isSessionActive: () => sessionStatus === 'active',
        isSessionWarning: () => sessionStatus === 'warning',

        // Session timing info (for components that might show countdown timers)
        sessionTiming: {
            lastActivity: lastActivityRef.current,
            lastRefresh: lastRefreshRef.current,
            refreshIntervalMs: REFRESH_INTERVAL,
            // Note: No idle timeout - sessions persist for 30 days via backend
        },
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
