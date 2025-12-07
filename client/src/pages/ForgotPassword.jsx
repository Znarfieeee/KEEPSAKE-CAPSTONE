import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { IoMdArrowBack } from 'react-icons/io'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import LOGO from '../assets/logo1.png'
import { requestPasswordReset } from '../api/passwordReset'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validate email format
        if (!email.trim()) {
            setError('Please enter your email address')
            return
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address')
            return
        }

        setLoading(true)

        try {
            await requestPasswordReset(email.trim().toLowerCase())
            setSubmitted(true)
        } catch (err) {
            setError(err.message || 'Failed to send reset link. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen login-bg text-black flex justify-center items-center p-4">
                <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full border border-gray-200">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
                        <p className="text-gray-600 leading-relaxed">
                            If an account exists with{' '}
                            <strong className="text-gray-900">{email}</strong>, you will receive
                            password reset instructions shortly.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 text-left">
                            <p className="font-semibold mb-2">What to do next:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Check your email inbox</li>
                                <li>Look for an email from KEEPSAKE</li>
                                <li>Click the reset link (valid for 30 minutes)</li>
                                <li>Check your spam folder if you don't see it</li>
                            </ul>
                        </div>
                    </div>

                    {/* Back to Login */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition duration-200"
                        >
                            <IoMdArrowBack />
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen login-bg text-black flex justify-center items-center p-4">
            {/* Back to Login - Top Left */}
            <div className="absolute top-8 left-8 z-10">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-black hover:text-primary transition duration-300 ease-in-out"
                >
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm">to Home</span>
                </Link>
            </div>

            {/* Main Form Container */}
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full border border-gray-200"
            >
                {/* Logo and Header */}
                <div className="text-center mb-8 space-y-4">
                    <img src={LOGO} alt="KEEPSAKE Logo" className="h-20 w-auto mx-auto" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                        <p className="text-sm text-gray-600 mt-2">
                            Enter your email address and we'll send you a link to reset your
                            password
                        </p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Email Input */}
                <div className="space-y-2 mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md
                                     focus:ring-2 focus:ring-primary focus:border-primary
                                     placeholder-gray-400 text-gray-900
                                     disabled:bg-gray-100 disabled:cursor-not-allowed
                                     transition duration-200"
                            disabled={loading}
                            autoFocus
                            required
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-semibold
                             py-3 px-4 rounded-md transition duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2
                             shadow-md hover:shadow-lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Sending Reset Link...
                        </>
                    ) : (
                        'Send Reset Link'
                    )}
                </button>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Remember your password?{' '}
                        <Link
                            to="/login"
                            className="text-primary hover:text-primary-dark font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}

export default ForgotPassword
