import React from "react"
import { Link } from "react-router-dom"
import Hamburger from "../components/ui/Hamburger"

function Landing_page() {
    return (
        <>
            <div id="screen-1">
                <header>
                    <Hamburger />
                    <img src="/KEEPSAKE.png" alt="KEEPSAKE Logo" />
                    <Link to="/login">Login</Link>
                </header>
            </div>
        </>
    )
}

export default Landing_page
