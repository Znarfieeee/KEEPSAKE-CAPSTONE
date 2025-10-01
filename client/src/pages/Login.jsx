import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { sanitizeInput } from '../util/sanitize'

// Images
import LOGO from '../assets/logo1.png'

// UI Components
import { IoMdArrowBack } from 'react-icons/io'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import GoogleButton from '../components/ui/GoogleButton'
import LoadingButton from '../components/ui/LoadingButton'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip'

const Login = () => {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { signIn } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [capsLockOn, setCapsLockOn] = useState(false)

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

    async function handleSubmit(e) {
        e.preventDefault()
        setFormError('')
        setIsLoading(true)

        const email = sanitizeInput(emailRef.current.value)
        const password = sanitizeInput(passwordRef.current.value)
        try {
            await signIn(email, password)
            setIsLoading(false)
        } catch (err) {
            // Handle specific error cases with improved messaging
            const errorMessage = err.message?.toLowerCase() || ''

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
                errorMessage.includes('user is inactive')
            ) {
                setFormError(
                    'Your account has been deactivated. Please contact your administrator for assistance.'
                )
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                setFormError(
                    'Unable to connect to the server. Please check your internet connection and try again.'
                )
            } else if (
                errorMessage.includes('unavailable') ||
                errorMessage.includes('temporarily')
            ) {
                setFormError(
                    'The authentication service is temporarily unavailable. Please try again in a few minutes.'
                )
            } else if (errorMessage.includes('authentication failed')) {
                setFormError('Authentication failed. Please verify your email and password.')
            } else if (errorMessage.includes('email and password are required')) {
                setFormError('Please enter both your email and password.')
            } else {
                // Use the original error message if it's user-friendly, otherwise use a generic message
                const originalMessage =
                    err.message || 'An unexpected error occurred. Please try again.'
                setFormError(
                    originalMessage.length > 100
                        ? 'An unexpected error occurred. Please try again.'
                        : originalMessage
                )
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="absolute top-8 left-8 z-10">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-black  hover:text-primary transition duration-300 ease-in-out"
                >
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm ">Go back</span>
                </Link>
            </div>
            <div
                id="screen-container"
                className="login-bg text-black flex justify-center items-center"
            >
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col justify-center items-center shadow p-6 border-1 border-gray-200 bg-white w-md rounded-lg"
                >
                    <div id="header-container" className="p-4 mb-6 space-y-2">
                        <img src={LOGO} alt="KEEPSAKE Logo" className="h-20 w-auto mx-auto" />
                        <span className="text-center">
                            <h1 className="text-2xl font-bold">Welcome back!</h1>
                            <p className="text-sm">Please enter your details to login</p>
                        </span>
                    </div>
                    <hr className="mt-6 pb-4" />
                    <div id="input-container" className="w-full">
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
                                onClick={handleSubmit}
                                className="w-[90%] mt-6 bg-primary text-white"
                                loadingText="Signing in..."
                                type="submit"
                                children="Sign in"
                            />
                        </div>
                    </div>
                    <div className="flex items-center w-full mt-6">
                        {/* <Separator className="flex-grow" /> */}
                        <span className="text-xs text-muted-foreground mx-auto">OR</span>
                        {/* <Separator className="flex-grow" /> */}
                    </div>
                    <GoogleButton className="w-[90%] mx-auto mt-6 bg-gray-100 border border-gray-300 hover:bg-gray-200" />
                    <p className="text-sm mt-4 text-center">
                        Manual self-registration is disabled.&nbsp;
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="underline text-primary">Why?</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Consult the nearest available clinic with KEEPSAKE to have an
                                    account.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </p>
                </form>
            </div>
        </>
    )
}

export default Login
