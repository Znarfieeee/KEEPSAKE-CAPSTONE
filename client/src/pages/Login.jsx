import React, { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/auth"

// Images
import LOGO from "../assets/logo2.png"

// UI Components
import { Button } from "../components/ui/Button"

const Login = () => {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { signIn, loading } = useAuth()
    const [formError, setFormError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        const email = emailRef.current.value
        const password = passwordRef.current.value
        try {
            await signIn(email, password)
            // Navigation happens in AuthProvider redirect effect
        } catch (err) {
            setFormError(err.message || "Login failed")
        }
    }

    function fpBtn() {
        alert("Forget password is clicked!")
    }

    return (
        <div
            id="screen-container"
            className="login-bg text-black flex justify-center items-center">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col justify-center items-center shadow p-6 border-px border-black bg-white min-w-2xs min-h-20 md:w-lg">
                <img
                    src={LOGO}
                    alt="KEEPSAKE Logo"
                    className="h-15 mb-10 w-auto"
                />
                <hr className="mt-6 pb-4" />
                <div id="input-container" className="w-full">
                    <div className="flex flex-col form-control">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="Enter email"
                            ref={emailRef}
                            required
                        />
                    </div>
                    <div className="flex flex-col form-control mt-4">
                        <div className="flex flex-row justify-between items-center">
                            <label htmlFor="password">Password</label>
                            <Link
                                className="text-primary hover:text-secondary text-sm transition duration-300 ease-in-out"
                                onClick={fpBtn}>
                                Forget password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Enter password"
                            ref={passwordRef}
                            required
                        />
                    </div>
                    {formError && (
                        <p className="text-red-500 text-sm mt-2">{formError}</p>
                    )}
                    <div id="btn" className="flex justify-center items-center">
                        <Button className="w-[90%] mt-6" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default Login
