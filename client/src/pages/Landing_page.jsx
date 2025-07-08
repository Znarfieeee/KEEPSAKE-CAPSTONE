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
            icon: <PhoneIcon className="size-8  text-blue-600" />,
            title: "Contact Our Team",
            desc: "Reach out via phone or email and tell us your needs",
        },
        {
            icon: <CalendarIcon className="size-8  text-green-600" />,
            title: "Pick a Date & Time",
            desc: "Choose a slot that fits your schedule",
        },
        {
            icon: <MapIcon className="size-8  text-purple-600" />,
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
            address: "Urgello St, Cebu City, 6000 Cebu",
        },
    ]

    useEffect(() => {
        const threshold = 50
        const handleScroll = () => {
            const currentY = window.scrollY
            const scrollDiff = Math.abs(currentY - lastY)

            if (currentY < lastY) {
                // scrolling up → show header
                setShow(true)
            } else if (currentY > lastY) {
                // scrolling down → hide header
                if (
                    currentY > 5 &&
                    currentY > lastY &&
                    scrollDiff > threshold
                ) {
                    setShow(false)
                }
            }
            setLastY(currentY)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [lastY])

    return (
        <>
            <div id="landing" className="bg-white font-inter overflow-x-hidden">
                <header
                    className={`
                                fixed justify-center mx-auto inset-x-0 z-50 bg-white/80 backdrop-blur-sm shadow
                                transition-transform duration-300 ease-in-out
                                ${show ? "translate-y-0" : "-translate-y-full"}
                            `}>
                    <div className="flex justify-between items-center p-2 w-full mx-auto md:px-16 lg:px-40">
                        <div className="md:hidden">
                            <Hamburger
                                open={drawerOpen}
                                toggle={toggleDrawer}
                            />
                        </div>
                        <img
                            src="/KEEPSAKE.png"
                            alt="KEEPSAKE Logo"
                            className="h-10 w-auto md:h-14"
                        />
                        <nav className="flex flex-row items-center justify-center h-full gap-6  md:gap-8 md:text-md max-md:hidden lg:gap-20">
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

                        <Link to="/login">
                            <Button
                                variant="default"
                                className="px-4 py-2 text-base md:px-6 md:py-4 md:text-md">
                                Login
                            </Button>
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
                    className="flex flex-col mt-16 items-center -z-100 lg:px-40">
                    <section className="screen-one p-8 md:p-12 text-black grid md:grid-cols-2">
                        <div>
                            <h1 className="font-bold text-4xl top-down md:text-6xl md:pt-10">
                                Securely Organize and Track Your Baby's Medical
                                Journey
                            </h1>
                            <p className="font-100 text-sm mt-4 left-to-right md:text-xl">
                                A digital platform to store, track, and share
                                your baby's health records and milestones with
                                ease.
                            </p>
                            <div
                                id="buttons"
                                className="flex justify-center items-center my-10 gap-6 z-10 rise-up md:mt-15">
                                <Button
                                    variant="default"
                                    className="px-6 py-4 text-base lg:px-8 lg:py-6 lg:text-lg">
                                    Get Started
                                </Button>
                                <Button
                                    variant="outline"
                                    className="px-6 py-4 text-base lg:px-8 lg:py-6 lg:text-lg">
                                    Learn More
                                </Button>
                            </div>
                        </div>
                        <img
                            src={hero1}
                            alt="Hero 1"
                            className="mt-4 right-to-left mx-auto -z-px md:h-125 md:w-auto"
                        />
                    </section>

                    {/* How it Works */}
                    <section
                        id="separator-one"
                        className="w-screen bg-primary p-8 mt-20 grid">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl font-bold text-white">
                                How It Works
                            </h2>
                            <p className="text-white">
                                Just three simple steps to get started service
                            </p>
                        </div>
                        <div className="flex flex-col justify-center items-center gap-4 mt-8 px-6 md:flex-row md:gap-6 lg:mx-50 lg:gap-15">
                            {steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col w-80 h-40 items-center text-center p-4 bg-white rounded-lg shadow md:w-[200px] md:h-60 lg:h-50">
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
                        <img src={hero2} className="my-10 mx-auto grow" />
                        <p className="text-lg text-gray-600 mt-4 text-center">
                            Keepsake safeguards your baby’s health journey so
                            you can cherish every moment.
                        </p>
                        <div className="mt-12 text-left space-y-2">
                            <h2 className="text-2xl font-semibold text-center">
                                What We Provide
                            </h2>
                            <ul className="space-y-6 mt-6 items-center">
                                {whatWeProvide.map((whatWeProvide, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 text-gray-700">
                                        <ShieldCheckIcon className="size-6 flex-shrink-0" />
                                        <span>{whatWeProvide}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                    {/* What makes us more special  */}
                    <section className="screen-three w-screen mt-10">
                        <div className="lg:mx-40">
                            <header className="mx-10">
                                <h1 className="font-semibold text-3xl mb-6">
                                    What Makes Us More Special
                                </h1>
                                <hr />
                                <h1 className="font-bold text-2xl mt-2">
                                    KEY
                                    <span className="text-primary">
                                        {" "}
                                        FEATURES
                                    </span>
                                </h1>
                            </header>
                            <div className="mt-6 max-w-2xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-4 ">
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
                        </div>
                    </section>
                    {/* Footer Section */}
                    <section className="footer w-screen flex flex-col text-black bg-gradient-to-t from-[#c4dee3] to-[#fffafa] p-6 mt-6 ">
                        <div
                            id="container"
                            className="grid md:grid-cols-2 lg:grid-cols-4">
                            <div id="box1" className="my-6">
                                <h1 className="text-center text-2xl font-bold">
                                    KEEPSAKE
                                </h1>
                                <p className="text-justify text-md px-4 mt-2">
                                    <strong>KEEPSAKE </strong>
                                    is dedicated to simplifying baby health
                                    record management. Since 2025, we've been
                                    providing parents and healthcare providers
                                    with a secure, user-friendly platform to
                                    easily track, store, and share medical
                                    milestones.
                                </p>
                            </div>
                            <hr className="md:hidden" />
                            <div id="box2" className="my-6">
                                <h1 className="text-center text-2xl font-bold">
                                    Clinics
                                </h1>
                                <div className="max-w-2xl mx-auto px-6 flex flex-col gap-2">
                                    {clinics.map((clinic, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col text-start">
                                            <h3 className="mt-2 text-md font-semibold">
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
                            <hr className="md:hidden" />
                            <div id="box3" className="mx-auto my-6">
                                <h1 className="text-center text-2xl font-bold">
                                    Connect with us
                                </h1>
                                <div
                                    id="link"
                                    className="grid grid-cols-2 gap-20 mx-auto pt-4 text-center lg:text-start">
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
                            <hr className="md:hidden" />
                            <div
                                id="box4"
                                className="my-6 mx-auto text-center md:text-start lg:text-start">
                                <h1 className="text-xl font-bold">Email us</h1>
                                <p className="text-sm">support@keepsake.com</p>

                                <h1 className="text-xl font-bold mt-8">
                                    Address
                                </h1>
                                <p className="text-sm">
                                    123 Fatima St., Bulacao, Cebu City, 6000
                                    Cebu
                                </p>
                            </div>
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
