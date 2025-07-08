import React, { useRef } from "react"
import { Link } from "react-router-dom"

// Images
import LOGO from "../assets/logo2.png"

// UI Components
import { Button } from "../components/ui/Button"

const Login = () => {
    const email = useRef()
    const password = useRef()

    return (
        <>
            <div
                id="screen-container"
                className="login-bg text-black flex justify-center items-center">
                <form
                    action=""
                    className="flex flex-col justify-center items-center shadow p-6 border-px border-black bg-white min-w-2xs min-h-20 md:w-lg">
                    <img
                        src={LOGO}
                        alt="KEEPSAKE Logo"
                        className="h-30 w-auto p-6"
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
                            />
                        </div>
                        <div className="flex flex-col form-control mt-4">
                            <div className="flex flex-row justify-between items-center">
                                <label htmlFor="password">Password</label>
                                <Link className="text-primary hover:text-secondary text-sm transition duration-300 ease-in-out">
                                    Forget password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                placeholder="Enter password"
                            />
                        </div>
                        <div
                            id="btn"
                            className="flex justify-center items-center">
                            <Button className="w-[90%] mt-6">Sign in</Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}

export default Login
