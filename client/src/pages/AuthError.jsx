import React, { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

const AuthError = () => {
    const [searchParams] = useSearchParams()
    const [error, setError] = useState("")

    useEffect(() => {
        const errorMessage =
            searchParams.get("error") ||
            "An unknown error occurred during authentication."
        setError(errorMessage)
        console.error("Auth error:", errorMessage)
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Authentication Failed
                    </h2>

                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>

                    <div className="space-y-3">
                        <Link
                            to="/login"
                            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center">
                            Try Again
                        </Link>

                        <Link
                            to="/"
                            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center">
                            Go Home
                        </Link>
                    </div>

                    <p className="text-xs text-gray-500 mt-6">
                        If you continue to experience issues, please contact
                        support.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AuthError
