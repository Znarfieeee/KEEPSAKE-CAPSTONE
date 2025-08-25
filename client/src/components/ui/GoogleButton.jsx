import React, { memo, useState, useEffect, useRef } from "react"
import { FcGoogle } from "react-icons/fc"
import { useAuth } from "../../context/auth"
import backendConnection from "../../api/backendApi"

const GoogleButton = memo(({ className = "", disabled = false }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const { isAuthenticated, checkExistingSession } = useAuth()
    const popupRef = useRef(null)
    const pollTimerRef = useRef(null)

    // Match with Flask allowed_origins
    const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

    const cleanup = () => {
        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close()
        }
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }
    }

    useEffect(() => {
        const handleMessage = async event => {
            // Allow only from whitelisted origins
            if (!allowedOrigins.includes(event.origin)) {
                console.warn(
                    "Received message from unexpected origin:",
                    event.origin
                )
                return
            }

            const { type, success, error: authError } = event.data

            if (type === "GOOGLE_AUTH_COMPLETE") {
                cleanup()

                if (success) {
                    try {
                        const hasSession = await checkExistingSession()
                        if (hasSession) {
                            console.log("Session validated after Google auth")
                            setError(null)
                        } else {
                            setError(
                                "Session validation failed after authentication"
                            )
                            clearErrorAfterTimeout()
                        }
                    } catch (err) {
                        console.error("Session check failed:", err)
                        setError("Failed to validate session")
                        clearErrorAfterTimeout()
                    }
                } else {
                    console.error("Google auth error from popup:", authError)
                    setError(authError || "Authentication failed")
                    clearErrorAfterTimeout()
                }

                setIsLoading(false)
            }
        }

        window.addEventListener("message", handleMessage)
        return () => {
            window.removeEventListener("message", handleMessage)
            cleanup()
        }
    }, [checkExistingSession])

    const startPolling = () => {
        pollTimerRef.current = setInterval(() => {
            if (popupRef.current && popupRef.current.closed) {
                console.log("Popup was closed by user")
                cleanup()
                setIsLoading(false)
                setError("Authentication was cancelled")
                clearErrorAfterTimeout()
            }
        }, 1000)
    }

    const clearErrorAfterTimeout = () => {
        setTimeout(() => {
            setError(null)
        }, 5000)
    }

    const handleGoogleLogin = async () => {
        if (isLoading || disabled || isAuthenticated) return

        try {
            setIsLoading(true)
            setError(null)

            const width = 500
            const height = 600
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const googleAuthUrl = `${backendConnection()}/auth/google`
            popupRef.current = window.open(
                googleAuthUrl,
                "googleAuth",
                `width=${width},height=${height},left=${left},top=${top},` +
                    "resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=no"
            )

            if (!popupRef.current) {
                throw new Error(
                    "Popup was blocked. Please allow popups for this site."
                )
            }

            startPolling()
            popupRef.current.focus()
        } catch (err) {
            console.error("Google login error:", err)
            setError(err.message || "Failed to initiate Google authentication")
            clearErrorAfterTimeout()
            setIsLoading(false)
            cleanup()
        }
    }

    useEffect(() => {
        return () => cleanup()
    }, [])

    return (
        <div className="w-full">
            <button
                onClick={handleGoogleLogin}
                disabled={isLoading || disabled || isAuthenticated}
                className={`
                    flex items-center justify-center gap-3
                    px-4 py-1.5 rounded-lg font-medium text-sm
                    transition-all duration-200 ease-in-out
                    hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${className}
                `}
                type="button"
                aria-label="Sign in with Google">
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <FcGoogle className="size-4" />
                        <span>Continue with Google</span>
                    </>
                )}
            </button>

            {error && (
                <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-4 mr-2 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </p>
                </div>
            )}
        </div>
    )
})

export default GoogleButton
