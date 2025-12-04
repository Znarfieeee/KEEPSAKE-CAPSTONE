import React, { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Hamburger from '@/components/ui/Hamburger'
import { Button } from '@/components/ui/Button'

/**
 * LandingLayout Component
 * Reusable layout for public landing pages with top navigation
 * Includes responsive navbar with mobile drawer
 */
const LandingLayout = () => {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const toggleDrawer = () => setDrawerOpen((open) => !open)
    const [show, setShow] = useState(true)
    const [lastY, setLastY] = useState(0)

    // Auto-hide navbar on scroll down
    useEffect(() => {
        const threshold = 30
        const handleScroll = () => {
            const currentY = window.scrollY
            const scrollDiff = Math.abs(currentY - lastY)

            if (currentY < lastY) {
                // scrolling up → show header
                setShow(true)
            } else if (currentY > lastY) {
                // scrolling down → hide header
                if (currentY > 5 && currentY > lastY && scrollDiff > threshold) {
                    setShow(false)
                }
            }
            setLastY(currentY)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastY])

    return (
        <div className="bg-white font-inter overflow-x-hidden min-h-screen">
            {/* Top Navigation */}
            <header
                className={`
                    fixed justify-center mx-auto inset-x-0 z-50 bg-white shadow
                    transition-transform duration-300 ease-in-out
                    ${show ? 'translate-y-0' : '-translate-y-full'}
                `}
            >
                <div className="flex justify-between items-center p-2 w-full mx-auto md:px-16 lg:px-40">
                    {/* Mobile Hamburger */}
                    <div className="md:hidden">
                        <Hamburger open={drawerOpen} toggle={toggleDrawer} />
                    </div>

                    {/* Logo */}
                    <Link to="/">
                        <img
                            src="/KEEPSAKE.png"
                            alt="KEEPSAKE Logo"
                            className="h-10 w-auto md:h-14"
                        />
                    </Link>

                    <div className="flex justify-end items-center gap-8">
                        {/* Desktop Navigation */}
                        <nav className="hidden flex-row items-center justify-center h-full gap-8 font-semibold text-sm md:flex md:gap-6 lg:gap-8">
                            <Link
                                to="/"
                                className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                            >
                                Home
                            </Link>
                            <Link
                                to="/services"
                                className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                            >
                                Services
                            </Link>
                            <Link
                                to="/about"
                                className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                            >
                                About us
                            </Link>
                            <Link
                                to="/clinics"
                                className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                            >
                                Clinics
                            </Link>
                            <Link
                                to="/pricing"
                                className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                            >
                                Pricing
                            </Link>
                        </nav>

                        {/* Login Button */}
                        <Link to="/login">
                            <Button
                                variant="default"
                                className="px-4 py-2 text-base md:px-6 md:py-4 md:text-md hover:scale-110 transition-all duration-300 delay-50"
                            >
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Drawer */}
                <div
                    className={`fixed left-0 w-full bg-white shadow-lg z-40 transition-all border-t-2 border-gray-200 rounded-b-xl duration-500 overflow-hidden ${
                        drawerOpen ? 'h-16' : 'h-0'
                    }`}
                >
                    <nav className="flex flex-row justify-center items-center h-full gap-6 text-sm font-semibold">
                        <Link
                            to="/"
                            onClick={() => setDrawerOpen(false)}
                            className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                        >
                            Home
                        </Link>
                        <Link
                            to="/services"
                            onClick={() => setDrawerOpen(false)}
                            className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                        >
                            Services
                        </Link>
                        <Link
                            to="/about"
                            onClick={() => setDrawerOpen(false)}
                            className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                        >
                            About us
                        </Link>
                        <Link
                            to="/clinics"
                            onClick={() => setDrawerOpen(false)}
                            className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                        >
                            Clinics
                        </Link>
                        <Link
                            to="/pricing"
                            onClick={() => setDrawerOpen(false)}
                            className="hover:text-primary transition ease-in-out duration-300 delay-50 hover:scale-110"
                        >
                            Pricing
                        </Link>
                    </nav>
                </div>

                {/* Overlay */}
                {drawerOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black bg-opacity-20"
                        onClick={toggleDrawer}
                    />
                )}
            </header>

            {/* Page Content */}
            <div className="pt-16">
                <Outlet />
            </div>
        </div>
    )
}

export default LandingLayout
