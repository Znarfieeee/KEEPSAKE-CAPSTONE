import React from "react"
import { Outlet, Link, Navigate } from "react-router-dom"

function Layout() {
    return (
        <div>
            <Outlet />
        </div>
    )
}

export default Layout
