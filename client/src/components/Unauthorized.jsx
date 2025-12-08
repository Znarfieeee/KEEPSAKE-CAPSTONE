import React from 'react'
import { useNavigate } from 'react-router-dom'

// Import hero image from assets folder (adjust path if needed)
import heroImg from '../assets/hero1.png'

// Reuse existing Button component for consistent styling
import { Button } from './ui/Button.jsx'

function Unauthorized() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
            <img
                src={heroImg}
                alt="Unauthorized Access"
                className="w-full max-w-md mb-8 select-none pointer-events-none"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                You are not authorized to view this page
            </h1>
            <p className="text-gray-600 mb-6">
                Please contact your administrator if you believe this is an error.
            </p>
            <Button onClick={() => navigate(-1)} size="lg">
                Go Back
            </Button>
        </div>
    )
}

export default Unauthorized
