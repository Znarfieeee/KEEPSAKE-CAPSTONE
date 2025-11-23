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

    const IDLE_LOGOUT_TIME = 30 * 60 * 1000 // 30 minutes - auto logout
    const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes - refresh tokens
    const ACTIVITY_THROTTLE = 30 * 1000 // 30 seconds - throttle activity updates
    const VISIBILITY_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes - refresh when returning to tab

    const refreshTimerRef = useRef(null)
    const idleTimerRef = useRef(null)
    const lastActivityRef = useRef(Date.now())
    const lastRefreshRef = useRef(Date.now())
    const isActiveRef = useRef(true)
    const refreshPromiseRef = useRef(null) // Prevent concurrent refresh calls

    const clearAllTimers = useCallback(() => {
        ;[refreshTimerRef, idleTimerRef].forEach((timer) => {
            if (timer.current) {
                clearTimeout(timer.current)
                clearInterval(timer.current)
                timer.current = null
            }
        })
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
                case 'vital_custodian':
                    navigate('/vital_custodian')
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
            if (data.status === 'success') {
                setUser(data.user)
                setIsAuthenticated(true)
                return true
            }
            return false
        } catch {
            // Suppress detailed error logging
            return false
        }
    }, [])

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
        [isAuthenticated, isRefreshing]
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

                if (response.status === 'success') {
                    showToast('success', 'Login successful')
                    setUser(response.user)
                    setIsAuthenticated(true)
                    lastRefreshRef.current = Date.now()
                    setSessionStatus('active')

                    navigateOnLogin(response.user.role)
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
        [checkExistingSession, navigateOnLogin]
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
                navigate('/login')
            }
        },
        [clearAllTimers]
    )

    const handleActivity = useCallback(() => {
        if (!isAuthenticated) return

        const now = Date.now()
        const timeSinceLastActivity = now - lastActivityRef.current

        if (timeSinceLastActivity < ACTIVITY_THROTTLE) return

        lastActivityRef.current = now
        isActiveRef.current = true
        setSessionStatus('active')

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

        idleTimerRef.current = setTimeout(() => {
            if (isAuthenticated && isActiveRef.current) {
                setSessionStatus('expired')
                showToast('info', 'Logging out due to inactivity')
                signOut(true)
            }
        }, IDLE_LOGOUT_TIME)
    }, [isAuthenticated, signOut, ACTIVITY_THROTTLE, IDLE_LOGOUT_TIME])

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
            const timeSinceLastActivity = now - lastActivityRef.current

            if (
                timeSinceLastActivity < IDLE_LOGOUT_TIME &&
                timeSinceLastRefresh >= REFRESH_INTERVAL
            ) {
                await runRefreshSession()
            }
        }, REFRESH_INTERVAL)

        handleActivity()
    }, [
        isAuthenticated,
        handleActivity,
        clearAllTimers,
        runRefreshSession,
        IDLE_LOGOUT_TIME,
        REFRESH_INTERVAL,
    ])

    // Removed debug helpers (btnClicked/alerts) for production readiness

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
                        setSessionStatus('expired')
                    }
                } else {
                    lastRefreshRef.current = Date.now()
                    setSessionStatus('active')
                }
            } catch (_) {
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
            idleTimeoutMs: IDLE_LOGOUT_TIME,
            refreshIntervalMs: REFRESH_INTERVAL,
        },
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
