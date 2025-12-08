import React, { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { sanitizeInput } from '../util/sanitize'
import { verify2FALogin, resend2FALoginCode } from '../api/auth'

// Images
import LOGO from '@/assets/logo1.png'

// UI Components
import { IoMdArrowBack } from 'react-icons/io'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Mail, Shield } from 'lucide-react'
import GoogleButton from '@/components/ui/GoogleButton'
import LoadingButton from '@/components/ui/LoadingButton'
import TooltipHelper from '../util/TooltipHelper'
import { OTPInput } from 'input-otp'

// OTP Slot Component
const Slot = (props) => {
    return (
        <div
            className={`relative flex size-12 items-center justify-center border border-gray-300 bg-white font-medium text-gray-900 shadow-sm transition-all first:rounded-l-md last:rounded-r-md ${
                props.isActive ? 'z-10 border-primary ring-2 ring-primary/50' : ''
            }`}
        >
            {props.char !== null && <div className="text-xl">{props.char}</div>}
        </div>
    )
}

const Login = () => {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { signIn, checkExistingSession, isAuthenticated, user } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [capsLockOn, setCapsLockOn] = useState(false)

    // 2FA state
    const [show2FA, setShow2FA] = useState(false)
    const [twoFACode, setTwoFACode] = useState('')
    const [twoFAUserId, setTwoFAUserId] = useState(null)
    const [twoFAEmail, setTwoFAEmail] = useState('')
    const [resendCooldown, setResendCooldown] = useState(60) // Start with 60s countdown
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [resendAttempts, setResendAttempts] = useState(0)

    // Handle capslock detection
    const handleCapsLock = (e) => {
        setCapsLockOn(e.getModifierState('CapsLock'))
    }

    // Add event listeners for capslock
    useEffect(() => {
        window.addEventListener('keydown', handleCapsLock)
        window.addEventListener('keyup', handleCapsLock)
        return () => {
            window.removeEventListener('keydown', handleCapsLock)
            window.removeEventListener('keyup', handleCapsLock)
        }
    }, [])

    // Cooldown timer for resend - only runs when 2FA is shown
    useEffect(() => {
        if (show2FA && resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [show2FA, resendCooldown])

    // Initialize countdown when 2FA screen is shown
    useEffect(() => {
        if (show2FA) {
            setResendCooldown(60)
            setResendAttempts(0)
        }
    }, [show2FA])

    // Auto-check for existing session on mount and redirect to proper dashboard
    useEffect(() => {
        let mounted = true
        const checkSessionAndRedirect = async () => {
            try {
                // If already authenticated, redirect immediately
                if (isAuthenticated && user?.role) {
                    if (!mounted) return
                    const role = user.role
                    switch (role) {
                        case 'admin':
                            return navigate('/admin', { replace: true })
                        case 'doctor':
                            return navigate('/pediapro', { replace: true })
                        case 'parent':
                            return navigate('/parent', { replace: true })
                        case 'vital_custodian':
                        case 'nurse':
                            return navigate('/nurse', { replace: true })
                        case 'facility_admin':
                            return navigate('/facility_admin', { replace: true })
                        default:
                            return navigate('/', { replace: true })
                    }
                }

                // Otherwise, check for an existing session
                const hasSession = await checkExistingSession()
                if (!mounted) return

                if (hasSession && user?.role) {
                    const role = user.role
                    switch (role) {
                        case 'admin':
                            return navigate('/admin', { replace: true })
                        case 'doctor':
                            return navigate('/pediapro', { replace: true })
                        case 'parent':
                            return navigate('/parent', { replace: true })
                        case 'vital_custodian':
                        case 'nurse':
                            return navigate('/nurse', { replace: true })
                        case 'facility_admin':
                            return navigate('/facility_admin', { replace: true })
                        default:
                            return navigate('/', { replace: true })
                    }
                }
            } catch {
                // silent fail - don't block the login screen
            }
        }

        checkSessionAndRedirect()

        return () => {
            mounted = false
        }
    }, [checkExistingSession, isAuthenticated, navigate, user])

    async function handleSubmit(e) {
        e.preventDefault()
        setFormError('')
        setIsLoading(true)

        const email = sanitizeInput(emailRef.current.value)
        const password = sanitizeInput(passwordRef.current.value)

        try {
            const response = await signIn(email, password)

            // Check if 2FA is required
            if (response?.status === '2fa_required' || response?.requires_2fa) {
                setShow2FA(true)
                setTwoFAUserId(response.user_id)
                setTwoFAEmail(response.email)
                setFormError(null)
                setIsLoading(false)
                return
            }
        } catch (err) {
            const errorMessage = (err?.message || '').toLowerCase()

            if (
                errorMessage.includes('invalid email') ||
                errorMessage.includes('email is not valid')
            ) {
                setFormError('Please enter a valid email address.')
            } else if (
                errorMessage.includes('invalid password') ||
                errorMessage.includes('invalid credentials') ||
                errorMessage.includes('incorrect email or password')
            ) {
                setFormError(
                    'The email or password you entered is incorrect. Please check your credentials and try again.'
                )
            } else if (
                errorMessage.includes('user not found') ||
                errorMessage.includes('account not found')
            ) {
                setFormError(
                    'No account found with this email address. Please contact your administrator if you believe this is an error.'
                )
            } else if (
                errorMessage.includes('account is inactive') ||
                errorMessage.includes('user is inactive') ||
                errorMessage.includes('deactivated') ||
                errorMessage.includes('disabled') ||
                errorMessage.includes('banned') ||
                errorMessage.includes('suspended')
            ) {
                setFormError(
                    'Your account has been deactivated. Please contact your administrator for assistance.'
                )
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                setFormError('Network error. Please check your connection and try again.')
            } else {
                setFormError(err?.message || 'Authentication failed. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function handle2FAVerify() {
        if (twoFACode.length !== 6) {
            setFormError('Please enter a valid 6-digit code')
            return
        }

        setIsLoading(true)
        setFormError(null)

        try {
            const response = await verify2FALogin(twoFAUserId, twoFACode)

            // Check if we got user data in response
            if (response?.status === 'success' && response?.user) {
                const role = response.user.role

                // Navigate directly based on role for faster experience
                switch (role) {
                    case 'admin':
                        navigate('/admin', { replace: true })
                        break
                    case 'doctor':
                        navigate('/pediapro', { replace: true })
                        break
                    case 'parent':
                        navigate('/parent', { replace: true })
                        break
                    case 'vital_custodian':
                    case 'nurse':
                        navigate('/nurse', { replace: true })
                        break
                    case 'facility_admin':
                        navigate('/facility_admin', { replace: true })
                        break
                    default:
                        navigate('/', { replace: true })
                }

                // Trigger page reload to refresh auth context
                setTimeout(() => {
                    window.location.reload()
                }, 100)
            } else {
                // Fallback to reload
                window.location.reload()
            }
        } catch (err) {
            setFormError(err?.message || 'Invalid verification code. Please try again.')
            setIsLoading(false)
        }
    }

    async function handleResend2FACode() {
        if (resendCooldown > 0 || resendAttempts >= 3) {
            return
        }

        setResendLoading(true)
        setFormError(null)
        setResendSuccess(false)

        try {
            await resend2FALoginCode(twoFAUserId)
            setResendSuccess(true)
            setResendCooldown(60) // Reset to 60 second countdown
            setResendAttempts(resendAttempts + 1)

            // Clear success message after 3 seconds
            setTimeout(() => {
                setResendSuccess(false)
            }, 3000)
        } catch (err) {
            setFormError(err?.message || 'Failed to resend code. Please try again.')
        } finally {
            setResendLoading(false)
        }
    }

    function handleBack2FA() {
        setShow2FA(false)
        setTwoFACode('')
        setTwoFAUserId(null)
        setTwoFAEmail('')
        setFormError(null)
        setResendCooldown(60)
        setResendSuccess(false)
        setResendAttempts(0)
    }

    return (
        <>
            <div className="absolute top-8 left-8 z-10">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-black  hover:text-primary transition duration-300 ease-in-out"
                >
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm ">Home</span>
                </Link>
            </div>
            <div
                id="screen-container"
                className="login-bg text-black flex justify-center items-center"
            >
                <form
                    onSubmit={
                        show2FA
                            ? (e) => {
                                  e.preventDefault()
                                  handle2FAVerify()
                              }
                            : handleSubmit
                    }
                    className="flex flex-col justify-center items-center shadow p-6 border-1 border-gray-200 bg-white w-md rounded-lg"
                >
                    <div id="header-container" className="p-4 mb-6 space-y-2">
                        <img src={LOGO} alt="KEEPSAKE Logo" className="h-20 w-auto mx-auto" />
                        <span className="text-center">
                            {show2FA ? (
                                <>
                                    <h1 className="text-2xl font-bold">
                                        Two-Factor Authentication
                                    </h1>
                                    <p className="text-sm">Enter the code sent to your email</p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold">Welcome back!</h1>
                                    <p className="text-sm">Please enter your details to login</p>
                                </>
                            )}
                        </span>
                    </div>
                    <hr className="mt-6 pb-4" />
                    <div id="input-container" className="w-full">
                        {show2FA ? (
                            /* 2FA Verification Form */
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-900">
                                            Code sent to {twoFAEmail}
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Please check your email for the verification code
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="2fa-code"
                                        className="block text-sm font-medium text-gray-700 mb-3"
                                    >
                                        Verification Code
                                    </label>
                                    <div className="flex justify-center">
                                        <OTPInput
                                            id="2fa-code"
                                            containerClassName="flex items-center gap-2"
                                            maxLength={6}
                                            value={twoFACode}
                                            onChange={(value) => setTwoFACode(value)}
                                            render={({ slots }) => (
                                                <div className="flex gap-2">
                                                    {slots.map((slot, idx) => (
                                                        <Slot key={idx} {...slot} />
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        Code expires in 10 minutes
                                    </p>
                                </div>

                                {/* Resend code section */}
                                {resendSuccess && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-sm text-green-700 text-center">
                                            ✓ Verification code sent successfully!
                                        </p>
                                    </div>
                                )}

                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Didn't receive the code?{' '}
                                        <button
                                            type="button"
                                            onClick={handleResend2FACode}
                                            disabled={
                                                resendCooldown > 0 ||
                                                resendLoading ||
                                                resendAttempts >= 3
                                            }
                                            className={`font-medium transition-colors ${
                                                resendCooldown > 0 ||
                                                resendLoading ||
                                                resendAttempts >= 3
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-primary hover:text-secondary cursor-pointer'
                                            }`}
                                        >
                                            {resendLoading ? (
                                                'Sending...'
                                            ) : resendAttempts >= 3 ? (
                                                'Max attempts reached'
                                            ) : resendCooldown > 0 ? (
                                                <>Resend Code ({resendCooldown}s)</>
                                            ) : (
                                                'Resend Code'
                                            )}
                                        </button>
                                        {resendAttempts > 0 && resendAttempts < 3 && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({resendAttempts}/3 attempts)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex justify-center items-center">
                                    <button
                                        type="button"
                                        onClick={handleBack2FA}
                                        className="text-sm text-black hover:text-primary transition duration-300 ease-in-out cursor-pointer"
                                    >
                                        Back to login
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Login Form */
                            <>
                                <div className="flex flex-col form-control">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder="juan@keepsake.com"
                                        ref={emailRef}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <div className="flex flex-col form-control mt-4">
                                    <div className="flex flex-row justify-between items-center">
                                        <label htmlFor="password">Password</label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-primary hover:text-secondary text-sm transition duration-300 ease-in-out"
                                            tabIndex="-1"
                                        >
                                            Forget password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            id="password"
                                            placeholder="********"
                                            ref={passwordRef}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            tabIndex="-1"
                                        >
                                            {showPassword ? (
                                                <FiEyeOff className="size-4" />
                                            ) : (
                                                <FiEye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                    {capsLockOn && (
                                        <p className="text-amber-600 text-xs mt-1 flex items-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 mr-1"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Caps Lock is on
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Error display - Best practice: Right above the submit button */}
                        {formError && (
                            <div className="mt-6 mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md shadow-sm">
                                <div className="flex items-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-3 text-red-400 flex-shrink-0 mt-0.5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-red-700 text-sm font-medium leading-relaxed">
                                            {formError}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div id="btn" className="flex justify-center items-center">
                            <LoadingButton
                                isLoading={isLoading}
                                onClick={show2FA ? handle2FAVerify : handleSubmit}
                                className="w-[90%] mt-6 bg-primary text-white"
                                loadingText={show2FA ? 'Verifying...' : 'Signing in...'}
                                type="submit"
                                disabled={show2FA && twoFACode.length !== 6}
                                children={show2FA ? 'Verify Code' : 'Sign in'}
                            />
                        </div>
                    </div>

                    {!show2FA && (
                        <>
                            <div className="flex items-center w-full mt-6">
                                {/* <Separator className="flex-grow" /> */}
                                <span className="text-xs text-muted-foreground mx-auto">OR</span>
                                {/* <Separator className="flex-grow" /> */}
                            </div>
                            <GoogleButton className="w-[90%] mx-auto mt-6 bg-gray-100 border border-gray-300 hover:bg-gray-200" />
                            <p className="text-sm mt-4 text-center">
                                Manual self-registration is disabled.&nbsp;
                                <TooltipHelper
                                    content="Consult the nearest available clinic with KEEPSAKE to
                                            have an account."
                                >
                                    <span className="underline text-primary">Why?</span>
                                </TooltipHelper>
                            </p>
                        </>
                    )}
                </form>
            </div>
        </>
    )
}

export default Login
