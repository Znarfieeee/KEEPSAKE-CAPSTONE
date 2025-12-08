import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
    Eye,
    EyeOff,
    Lock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ShieldCheck,
} from 'lucide-react'
import LOGO from '../assets/logo1.png'
import { verifyResetToken, resetPassword } from '../api/passwordReset'
import { showToast } from '../util/alertHelper'

const ResetPassword = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const token = searchParams.get('token')

    const [verifying, setVerifying] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [tokenError, setTokenError] = useState('')

    const [passwords, setPasswords] = useState({
        new_password: '',
        confirm_password: '',
    })

    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false,
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Password validation checks
    const passwordChecks = useMemo(() => {
        const pwd = passwords.new_password
        return {
            minLength: pwd.length >= 8,
            hasUppercase: /[A-Z]/.test(pwd),
            hasLowercase: /[a-z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        }
    }, [passwords.new_password])

    const isPasswordValid = Object.values(passwordChecks).every((check) => check)
    const passwordsMatch =
        passwords.new_password && passwords.new_password === passwords.confirm_password

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenError('No reset token found in URL')
                setVerifying(false)
                setTokenValid(false)
                return
            }

            try {
                const response = await verifyResetToken(token)
                setTokenValid(true)
                setUserEmail(response.email)
            } catch (err) {
                setTokenError(err.message || 'Invalid or expired reset link')
                setTokenValid(false)
            } finally {
                setVerifying(false)
            }
        }

        verifyToken()
    }, [token])

    const handleChange = (e) => {
        const { name, value } = e.target
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }))
        setError('')
    }

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!isPasswordValid) {
            setError('Please meet all password requirements')
            return
        }

        if (!passwordsMatch) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            await resetPassword(token, passwords.new_password, passwords.confirm_password)

            showToast({
                title: 'Password Reset Successful',
                description: 'You can now sign in with your new password',
                variant: 'success',
            })

            // Redirect to login after 1.5 seconds
            setTimeout(() => {
                navigate('/login', { replace: true })
            }, 1500)
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.')
            showToast({
                title: 'Password Reset Failed',
                description: err.message,
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const PasswordCheck = ({ check, label }) => (
        <div className="flex items-center gap-2.5 text-sm">
            {check ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
                <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <span className={check ? 'text-green-700 font-medium' : 'text-gray-600'}>{label}</span>
        </div>
    )

    // Loading state while verifying token
    if (verifying) {
        return (
            <div className="min-h-screen login-bg flex justify-center items-center p-4">
                <div className="bg-white shadow-xl rounded-lg p-12 max-w-md w-full border border-gray-200 text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Verifying Reset Link
                    </h2>
                    <p className="text-gray-600">Please wait...</p>
                </div>
            </div>
        )
    }

    // Invalid token state
    if (!tokenValid) {
        return (
            <div className="min-h-screen login-bg flex justify-center items-center p-4">
                <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full border border-gray-200">
                    {/* Error Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-red-100 p-3">
                            <XCircle className="h-12 w-12 text-red-600" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h1>
                        <p className="text-gray-600 leading-relaxed">{tokenError}</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800 text-left">
                            <p className="font-semibold mb-2">This link may be invalid because:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>It has already been used</li>
                                <li>It has expired (links are valid for 30 minutes)</li>
                                <li>It was copied incorrectly</li>
                            </ul>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 space-y-3">
                        <Link
                            to="/forgot-password"
                            className="block w-full bg-primary hover:bg-primary-dark text-white font-semibold
                                     py-3 px-4 rounded-md transition duration-200 text-center
                                     shadow-md hover:shadow-lg"
                        >
                            Request New Reset Link
                        </Link>
                        <Link
                            to="/login"
                            className="block w-full text-center text-primary hover:text-primary-dark font-medium
                                     py-2 transition duration-200"
                        >
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Valid token - show password reset form
    return (
        <div className="min-h-screen login-bg flex justify-center items-center p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-xl rounded-lg p-8 max-w-2xl w-full border border-gray-200"
            >
                {/* Logo and Header */}
                <div className="text-center mb-8 space-y-4">
                    <div className="flex justify-center mb-4">
                        <img src={LOGO} alt="KEEPSAKE Logo" className="h-20 w-auto" />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-primary mb-2">
                        <ShieldCheck className="h-6 w-6" />
                        <h1 className="text-2xl font-bold">Reset Your Password</h1>
                    </div>
                    <p className="text-sm text-gray-600">
                        Create a new password for <strong>{userEmail}</strong>
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label
                            htmlFor="new_password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            New Password <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="new_password"
                                name="new_password"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwords.new_password}
                                onChange={handleChange}
                                placeholder="Enter your new password"
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md
                                         focus:ring-2 focus:ring-primary focus:border-primary
                                         placeholder-gray-400 text-gray-900
                                         disabled:bg-gray-100 disabled:cursor-not-allowed
                                         transition duration-200"
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                            Password must contain:
                        </p>
                        <PasswordCheck
                            check={passwordChecks.minLength}
                            label="At least 8 characters"
                        />
                        <PasswordCheck
                            check={passwordChecks.hasUppercase}
                            label="One uppercase letter (A-Z)"
                        />
                        <PasswordCheck
                            check={passwordChecks.hasLowercase}
                            label="One lowercase letter (a-z)"
                        />
                        <PasswordCheck check={passwordChecks.hasNumber} label="One number (0-9)" />
                        <PasswordCheck
                            check={passwordChecks.hasSpecial}
                            label="One special character (!@#$%...)"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label
                            htmlFor="confirm_password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Confirm New Password <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwords.confirm_password}
                                onChange={handleChange}
                                placeholder="Confirm your new password"
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md
                                         focus:ring-2 focus:ring-primary focus:border-primary
                                         placeholder-gray-400 text-gray-900
                                         disabled:bg-gray-100 disabled:cursor-not-allowed
                                         transition duration-200"
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {passwords.confirm_password && (
                            <p
                                className={`text-sm ${
                                    passwordsMatch ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !isPasswordValid || !passwordsMatch}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold
                                 py-3 px-4 rounded-md transition duration-200
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-2
                                 shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>

                    {/* Back to Login */}
                    <div className="text-center pt-4">
                        <Link
                            to="/login"
                            className="text-sm text-primary hover:text-primary-dark font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default ResetPassword
