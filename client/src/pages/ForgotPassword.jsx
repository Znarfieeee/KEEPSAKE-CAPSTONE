import React from "react"
import { Link } from "react-router-dom"

// UI Components
import { IoMdArrowBack } from "react-icons/io"
import LOGO from "../assets/logo1.png"

const ForgotPassword = () => {
    return (
        <>
            <div className="absolute top-8 left-8 z-10">
                <Link
                    to="/login"
                    className="flex items-center gap-2 text-black  hover:text-primary transition duration-300 ease-in-out">
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm ">Go back to Login</span>
                </Link>
            </div>
            <div
                id="screen-container"
                className="login-bg text-black flex justify-center items-center">
                <form
                    // onSubmit={handleSubmit}
                    className="flex flex-col justify-center items-center shadow p-6 border-1 border-gray-200 bg-white w-md rounded-lg">
                    <div id="header-container" className="p-4 mb-6 space-y-2">
                        <img
                            src={LOGO}
                            alt="KEEPSAKE Logo"
                            className="h-20 w-auto mx-auto"
                        />
                        <span className="text-center">
                            <h1 className="text-2xl font-bold">
                                Forgot Password
                            </h1>
                            <p className="text-sm">Nya nani kapoy pa</p>
                        </span>
                    </div>
                    <hr className="mt-6 pb-4" />
                    <div
                        id="input-container"
                        className="w-full flex justify-center">
                        <span className="mx-auto">
                            basta forget password ni
                        </span>
                    </div>
                </form>
            </div>
        </>
    )
}

export default ForgotPassword
