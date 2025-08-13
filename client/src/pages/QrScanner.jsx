import React from "react"
import { useNavigate } from "react-router-dom"

// UI Components
import { IoMdArrowBack } from "react-icons/io"

const QrScanner = () => {
    const navigate = useNavigate()

    return (
        <>
            <div className="absolute top-8 left-8 z-10">
                <div
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-black  hover:text-primary transition duration-300 ease-in-out cursor-pointer">
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm ">Go back</span>
                </div>
            </div>
            <div className="flex h-screen w-screen justify-center items-center">
                <span>QR Code Scanner</span>
            </div>
        </>
    )
}

export default QrScanner
