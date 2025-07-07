import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"

// images
import hero1 from "../assets/hero1.png"
import hero2 from "../assets/hero2.png"

// UI Components
import Hamburger from "../components/ui/Hamburger"
import { Button } from "../components/ui/Button"
import {
    PhoneIcon,
    CalendarIcon,
    MapIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline"

function Landing_page() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const toggleDrawer = () => setDrawerOpen(open => !open)
    const [show, setShow] = useState(true)
    const [lastY, setLastY] = useState(0)

    const steps = [
        {
            icon: <PhoneIcon className="h-8 w-8 text-blue-600" />,
            title: "Contact Our Team",
            desc: "Reach out via phone or email and tell us your needs",
        },
        {
            icon: <CalendarIcon className="h-8 w-8 text-green-600" />,
            title: "Pick a Date & Time",
            desc: "Choose a slot that fits your schedule",
        },
        {
            icon: <MapIcon className="h-8 w-8 text-purple-600" />,
            title: "Clinics Available",
            desc: "Find nearby clinics offering our KEEPSAKE service",
        },
    ]

    const whatWeProvide = [
        "Secure storage for your baby’s medical records.",
        "Easy tracking of health milestones.",
        "Convenient access anytime, anywhere.",
        "Simple collaboration with healthcare providers.",
    ]

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY
            if (currentY < lastY) {
                // scrolling up → show header
                setShow(true)
            } else if (currentY > lastY) {
                // scrolling down → hide header
                setShow(false)
            }
            setLastY(currentY)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [lastY])

    return (
        <>
            <div id="landing" className="bg-white font-inter">
                <header
                    className={`
                                fixed inset-x-0 z-50 bg-white/80 backdrop-blur-sm shadow
                                transition-transform duration-300 ease-in-out
                                ${show ? "translate-y-0" : "-translate-y-full"}
                            `}>
                    <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
                        <Hamburger open={drawerOpen} toggle={toggleDrawer} />
                        <img
                            src="/KEEPSAKE.png"
                            alt="KEEPSAKE Logo"
                            className="h-10 w-auto"
                        />
                        <Link to="/login">
                            <Button variant="default">Login</Button>
                        </Link>
                    </div>
                    {/* Drawer */}
                    <div
                        className={`fixed left-0 w-full bg-white/80 backdrop-blur-sm shadow-lg z-40 transition-all rounded-b-xl duration-500 overflow-hidden
                    ${
                        drawerOpen
                            ? "top-[71px] h-15 opacity-100"
                            : "top-[71px] h-0 opacity-0"
                    }
                    `}>
                        <nav className="flex flex-row items-center justify-center h-full gap-6">
                            <Link to="/" onClick={toggleDrawer}>
                                Home
                            </Link>
                            <Link to="/services" onClick={toggleDrawer}>
                                Services
                            </Link>
                            <Link to="/about" onClick={toggleDrawer}>
                                About us
                            </Link>
                            <Link to="/clinics" onClick={toggleDrawer}>
                                Clinics
                            </Link>
                        </nav>
                    </div>
                    {/* Overlay */}
                    {drawerOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={toggleDrawer}
                        />
                    )}
                </header>
                <hr />

                {/* Landing Section */}
                <section
                    id="screen-container"
                    className=" flex flex-col mt-18 items-center justify-around min-h-[60vh] bg-gradient-to-b from-[#c4dee3] to-[#fffafa]">
                    <section className="screen-one p-4 mx-4 text-black">
                        <h1 className="font-bold text-4xl top-down">
                            Securely Organize and Track Your Baby's Medical
                            Journey
                        </h1>
                        <p className="font-100 text-sm mt-4 left-to-right">
                            A digital platform to store, track, and share your
                            baby's health records and milestones with ease.
                        </p>
                        <img
                            src={hero1}
                            alt="Hero 1"
                            className="mt-4 right-to-left"
                        />
                        <div
                            id="buttons"
                            className="flex justify-center gap-6 z-10 rise-up">
                            <Button variant="default" size="lg">
                                Get Started
                            </Button>
                            <Button variant="outline" size="lg">
                                Learn More
                            </Button>
                        </div>
                    </section>

                    {/* How it Works */}
                    <section
                        id="separator-one"
                        className="w-screen bg-primary p-4 mt-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl font-bold text-white pt-4">
                                How It Works
                            </h2>
                            <p className="text-white">
                                Just three simple steps to get started service
                            </p>
                        </div>
                        <div className="mt-6 max-w-2xl mx-auto px-6 flex flex-col gap-2">
                            {steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
                                    {step.icon}
                                    <h3 className="mt-4 text-xl font-semibold">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-gray-500">
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section two */}
                    <section className="screen-two p-4 mx-4">
                        <div className="max-w-2xl mx-auto text-center space-y-6">
                            <h1 className="text-4xl font-extrabold">
                                Every Milestone Matters—Secure Your Baby's
                                Health Journey
                            </h1>
                            <hr />
                            <p className="text-lg text-gray-600 mt-4">
                                Keepsake safeguards your baby's health journey
                                so you can cherish every moment.
                            </p>
                        </div>
                        <img src={hero2} />
                        <p className="text-lg text-gray-600 mt-4 text-center">
                            Keepsake safeguards your baby’s health journey so
                            you can cherish every moment.
                        </p>
                        <div className="mt-8 text-left space-y-6">
                            <h2 className="text-2xl font-semibold text-center">
                                What We Provide
                            </h2>
                            <ul className="space-y-4 items-center">
                                {whatWeProvide.map((whatWeProvide, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 text-gray-700">
                                        <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        <span>{whatWeProvide}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </section>
            </div>
        </>
    )
}

export default Landing_page
