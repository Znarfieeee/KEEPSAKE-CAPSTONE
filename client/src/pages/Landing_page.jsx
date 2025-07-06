import React from "react"
import { Link } from "react-router-dom"
import Hamburger from "../components/ui/Hamburger"
import { Button } from "../components/ui/Button"

// UI Components

function Landing_page() {
    return (
        <>
            <div id="screen-1" className="bg-white">
                <header className="flex justify-between p-4 items-center">
                    <Hamburger />
                    <img
                        src="/KEEPSAKE.png"
                        alt="KEEPSAKE Logo"
                        className="h-10 w-auto"
                    />
                    <Link to="/login">
                        <Button className="text-white" variants="outline">
                            Login
                        </Button>
                    </Link>
                </header>
                <hr />
            </div>
        </>
    )
}

export default Landing_page
