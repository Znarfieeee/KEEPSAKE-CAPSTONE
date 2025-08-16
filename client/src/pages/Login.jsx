import React, { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/auth"
import { sanitizeInput } from "../util/sanitize"

// Images
import LOGO from "../assets/logo1.png"

// UI Components
import { IoMdArrowBack } from "react-icons/io"
import { FiEye, FiEyeOff } from "react-icons/fi"
import GoogleButton from "../components/ui/GoogleButton"
import LoadingButton from "../components/ui/LoadingButton"
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "../components/ui/Tooltip"

const Login = () => {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { signIn } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setFormError("")
        setIsLoading(true)

        const email = sanitizeInput(emailRef.current.value)
        const password = sanitizeInput(passwordRef.current.value)
        try {
            await signIn(email, password)
            setIsLoading(false)
        } catch (err) {
            // Handle specific error cases for better UX
            if (err.message?.toLowerCase().includes("invalid email")) {
                setFormError("The email address you entered is not valid.")
            } else if (
                err.message?.toLowerCase().includes("invalid password") ||
                err.message?.toLowerCase().includes("invalid credentials")
            ) {
                setFormError("Incorrect email or password. Please try again.")
            } else if (err.message?.toLowerCase().includes("network")) {
                setFormError(
                    "Network error. Please check your internet connection."
                )
            } else if (err.message?.toLowerCase().includes("unavailable")) {
                setFormError(
                    "Service is temporarily unavailable. Please try again later."
                )
            } else {
                setFormError(
                    err.message ||
                        "An unexpected error occurred. Please try again."
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
                    className="flex items-center gap-2 text-black  hover:text-primary transition duration-300 ease-in-out">
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm ">Go back</span>
                </Link>
            </div>
            <div
                id="screen-container"
                className="login-bg text-black flex justify-center items-center">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col justify-center items-center shadow p-6 border-1 border-gray-200 bg-white w-md rounded-lg">
                    <div id="header-container" className="p-4 mb-6 space-y-2">
                        <img
                            src={LOGO}
                            alt="KEEPSAKE Logo"
                            className="h-20 w-auto mx-auto"
                        />
                        <span className="text-center">
                            <h1 className="text-2xl font-bold">
                                Welcome back!
                            </h1>
                            <p className="text-sm">
                                Please enter your details to login
                            </p>
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
                                    tabIndex="-1">
                                    Forget password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder="********"
                                    ref={passwordRef}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    tabIndex="-1">
                                    {showPassword ? (
                                        <FiEyeOff className="size-4" />
                                    ) : (
                                        <FiEye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {formError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {formError}
                                </p>
                            </div>
                        )}
                        <div
                            id="btn"
                            className="flex justify-center items-center">
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
                        <span className="text-xs text-muted-foreground mx-auto">
                            OR
                        </span>
                        {/* <Separator className="flex-grow" /> */}
                    </div>
                    <GoogleButton className="w-[90%] mx-auto mt-6 bg-gray-100 border border-gray-300 hover:bg-gray-200" />
                    <p className="text-sm mt-4 text-center">
                        Manual self-registration is disabled.&nbsp;
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="underline text-primary">
                                        Why?
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Consult the nearest available clinic with
                                    KEEPSAKE to have an account.
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
