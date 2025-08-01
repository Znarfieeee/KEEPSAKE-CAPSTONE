import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/auth"
import Loader from "./ui/Loader"

/**
 * A wrapper component for routes that require authentication and specific role access.
 * If the user is not authenticated, they are redirected to the login page.
 * If requiredRole is specified and user doesn't have that role, they see an access denied message.
 *
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Components to render if authorized
 * @param {string} [props.requiredRole] Optional role required to access this route (e.g., "Admin")
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading, isAuthenticated } = useAuth()
    const location = useLocation()

    // Show loading state while checking authentication
    if (loading) {
        return <Loader />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (requiredRole && user?.role !== requiredRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access this page. This area
                        requires {requiredRole} privileges.
                    </p>
                    <button
                        onClick={() => {
                            alert("Unauthorized Access!")
                            window.history.back()
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    // Render children if authenticated and authorized
    return children
}

export default ProtectedRoute
