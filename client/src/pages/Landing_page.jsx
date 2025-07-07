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
    QrCodeIcon,
    GlobeAltIcon,
} from "@heroicons/react/24/outline"
import { IoShieldHalfOutline } from "react-icons/io5"
import { CiMobile3 } from "react-icons/ci"
import { TbClockCog } from "react-icons/tb"
import { PiDevicesLight } from "react-icons/pi"

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

    const feature = [
        {
            icon: <IoShieldHalfOutline className="h-8 w-8 text-blue-600" />,
            title: "Security and Policy",
            desc: "Your baby's data is safe with us – encrypted and stored securely.",
        },
        {
            icon: <QrCodeIcon className="h-8 w-8 text-green-600" />,
            title: "QR Code Sharing",
            desc: "Seamlessly share medical recorded with any hospital or clinic using QR codes.",
        },
        {
            icon: <CiMobile3 className="h-8 w-8 text-purple-600" />,
            title: "User-Friendly Interface",
            desc: "Track milestones and access medical records at your fingertips",
        },
        {
            icon: <TbClockCog className="h-8 w-8 text-orange-600" />,
            title: "Real-Time Updates",
            desc: "Stay up-to-date with automatic updates and reminders",
        },
        {
            icon: <GlobeAltIcon className="h-8 w-8 text-cyan-600" />,
            title: "Online & Offline Access",
            desc: "Access records anytime, even with/out an internet connection.",
        },
        {
            icon: <PiDevicesLight className="h-8 w-8 text-rose-600" />,
            title: "Multi-Device Access",
            desc: "Access your baby's information anytime, anywhere, on any device.",
        },
    ]

    const clinics = [
        {
            name: "De La Peña's Pediatric Clinic",
            address:
                "8W23+MC7 ASCO Bldg, Tiburcio Padilla St, Cebu City, 6000 Cebu",
        },
        {
            name: "Dr. Darwin L. Pitogo",
            address: "Maria Antonio Village, Labogon, Mandaue, 6014 Cebu",
        },
        {
            name: "Alima Pediatric Clinic",
            address: "F. Ramos St, Cogon, Cebu City, 6000 Cebu",
        },
        {
            name: "Alima Pediatric Clinic",
            address: "Urgello St, Cebu City, 6000 Cebu",
        },
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
                    <section className="screen-one p-4 text-black ">
                        <h1 className="font-bold text-4xl top-down">
                            Securely Organize and Track Your Baby's Medical
                            Journey
                        </h1>
                        <p className="font-100 text-sm mt-4 left-to-right">
                            A digital platform to store, track, and share your
                            baby's health records and milestones with ease.
                        </p>
                        <div
                            id="buttons"
                            className="flex justify-center my-10 gap-6 z-10 rise-up">
                            <Button variant="default" size="lg">
                                Get Started
                            </Button>
                            <Button variant="outline" size="lg">
                                Learn More
                            </Button>
                        </div>
                        <img
                            src={hero1}
                            alt="Hero 1"
                            className="mt-4 right-to-left"
                        />
                    </section>

                    {/* How it Works */}
                    <section
                        id="separator-one"
                        className="w-screen bg-primary p-4 mt-20">
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
                    <section className="screen-two p-4 mx-4 mt-6">
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
                        <div className="mt-8 text-left space-y-2">
                            <h2 className="text-2xl font-semibold text-center">
                                What We Provide
                            </h2>
                            <ul className="space-y-4 items-center">
                                {whatWeProvide.map((whatWeProvide, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 text-gray-700">
                                        <ShieldCheckIcon className="w-6 h-6 flex-shrink-0" />
                                        <span>{whatWeProvide}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                    {/* What makes us more special  */}
                    <section className="screen-three w-screen p-4">
                        <header>
                            <h1 className="font-semibold text-3xl mb-4 mt-8">
                                What Makes Us More Special
                            </h1>
                            <hr />
                            <h1 className="font-bold text-2xl mt-2">
                                KEY
                                <span className="text-primary"> FEATURES</span>
                            </h1>
                        </header>
                        <div className="mt-6 max-w-2xl mx-auto px-6 grid grid-cols-2 gap-4">
                            {feature.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
                                    {feature.icon}
                                    <h3 className="mt-4 text-lg font-semibold">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                    {/* Footer Section */}
                    <section className="footer w-screen flex flex-col text-black bg-gradient-to-t from-[#c4dee3] to-[#fffafa] p-6 mt-6 ">
                        <div id="box1" className="p-4 ">
                            <p className="text-justify text-md">
                                KEEPSAKE is dedicated to simplifying baby health
                                record management. Since 2025, we've been
                                providing parents and healthcare providers with
                                a secure, user-friendly platform to easily
                                track, store, and share medical milestones
                            </p>
                        </div>
                        <hr />
                        <div id="box2" className="my-6">
                            <h1 className="text-center text-2xl font-bold">
                                Clinics
                            </h1>
                            <div className="max-w-2xl mx-auto px-6 flex flex-col gap-2">
                                {clinics.map((clinic, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col text-start">
                                        <h3 className="mt-2 text-lg font-semibold">
                                            {clinic.name}
                                        </h3>
                                        <p className=" text-sm">
                                            {clinic.address}
                                        </p>
                                    </div>
                                ))}
                                <Link
                                    to="/"
                                    className="hover:text-white transition-all duration-200">
                                    See more...
                                </Link>
                            </div>
                        </div>
                        <hr />
                        <div
                            id="box3"
                            className="mt-2 max-w-2xl mx-auto p-6 gap-4">
                            <h1 className="text-center text-2xl font-bold">
                                Connect with us
                            </h1>
                            <div
                                id="link"
                                className="grid grid-cols-2 gap-20 mx-auto pt-4">
                                <div className="left-side flex flex-col gap-2">
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-all duration-200">
                                        Facebook
                                    </Link>
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-all duration-200">
                                        Twitter
                                    </Link>
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-all duration-200">
                                        Instagram
                                    </Link>
                                </div>
                                <div className="right-side flex flex-col gap-2">
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-all duration-200">
                                        Career
                                    </Link>
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-all duration-200">
                                        Support
                                    </Link>
                                    <Link
                                        to="/"
                                        className="hover:text-white transition-all duration-200">
                                        Privacy policy
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <hr />
                        <div id="box4" className="mt-2 max-w-2xl mx-auto p-6">
                            <h1 className="text-start text-xl font-bold">
                                Email us
                            </h1>
                            <p className="text-sm">support@keepsake.com</p>

                            <h1 className="text-start text-xl font-bold mt-8">
                                Address
                            </h1>
                            <p className="text-sm">
                                123 Fatima St., Bulacao, Cebu City, 6000 Cebu
                            </p>
                        </div>
                    </section>
                    <footer className="bg-primary w-screen text-center p-2 text-white font-semibold">
                        © 2025 KEEPSAKE, All Rights Reserved
                    </footer>
                </section>
            </div>
        </>
    )
}

export default Landing_page
