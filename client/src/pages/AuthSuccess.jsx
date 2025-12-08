import React, { useEffect } from "react"
import { useAuth } from "@/context/auth"
import { Navigate } from "react-router-dom"

const AuthSuccess = () => {
    const { isAuthenticated, loading, user } = useAuth()

    // Auth state is monitored without console logging

    // Show loading while auth context is processing
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        Completing sign in...
                    </h2>
                    <p className="text-gray-500">
                        Please wait while we verify your credentials.
                    </p>
                </div>
            </div>
        )
    }

    // Once loading is complete, redirect based on auth state
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // User is authenticated, let AuthContext handle the role-based navigation
    // This component will be unmounted when navigation occurs
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Sign in successful!
                </h2>
                <p className="text-gray-500">
                    Redirecting you to your dashboard...
                </p>
            </div>
        </div>
    )
}

export default AuthSuccess
