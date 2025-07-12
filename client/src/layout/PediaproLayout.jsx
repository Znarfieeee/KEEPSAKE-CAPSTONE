import React from "react"
import { Outlet, Link, Navigate } from "react-router-dom"

// UI Components
import { BiTachometer, BiCalendar } from "react-icons/bi"
import { TbHeartbeat } from "react-icons/tb"
import { IoMdAnalytics } from "react-icons/io"
import { MdQrCodeScanner } from "react-icons/md"
import Hamburger from "../components/ui/Hamburger"

function Layout() {
    return (
        <div>
            {/* <header className="absolute inset-0 z-50 shadow border-b-2 border-gray-100">
                <div className="flex justify-between items-center px-6 py-2">
                    <div className="box1">
                        <div id="menu-btn-container">
                            <Hamburger />
                        </div>
                        <img
                            src="../assets/KEEPSAKE.png"
                            alt="KEEPSAKE smart beginnings"
                            className="h-20 w-auto"
                        />
                    </div>
                    <div className="box2">
                        <button>
                            <img
                                src="../assets/account-logo.png"
                                alt="Account"
                                className="h-35 w-auto cursor-pointer hover:scale-110 transition duration-300 delay-50"
                            />
                        </button>
                    </div>
                </div>
                <nav id="sidenav" className="relative inset-0 w-120 h-full">
                    <Link
                        to="/pediapro/dashboard"
                        className="flex flex-row w-full p-4 justify-between text-black hover:bg-white/40 hover:text-gray-500 hover:scale-105 transition duration-300 delay-50">
                        <BiTachometer />
                        <BiCalendar />
                        <span>DASHBOARD</span>
                    </Link>
                    <Link
                        to="/pediapro/appointments"
                        className="flex flex-row w-full p-4 justify-between text-black hover:bg-white/40 hover:text-gray-500 hover:scale-105 transition duration-300 delay-50">
                        <BiCalendar />
                        <span>APPOINTMENTS</span>
                    </Link>
                    <Link
                        to="/pediapro/patient_records"
                        className="flex flex-row w-full p-4 justify-between text-black hover:bg-white/40 hover:text-gray-500 hover:scale-105 transition duration-300 delay-50">
                        <TbHeartbeat />
                        <span>PATIENT RECORDS</span>
                    </Link>
                    <Link
                        to="/pediapro/reports"
                        className="flex flex-row w-full p-4 justify-between text-black hover:bg-white/40 hover:text-gray-500 hover:scale-105 transition duration-300 delay-50">
                        <IoMdAnalytics />
                        <span>REPORTS</span>
                    </Link>
                    <Link
                        to="/pediapro/qr_scanner"
                        className="flex flex-row w-full p-4 justify-between text-black hover:bg-white/40 hover:text-gray-500 hover:scale-105 transition duration-300 delay-50">
                        <MdQrCodeScanner />
                        <span>QR CDE SCANNER</span>
                    </Link>
                </nav>
            </header>
            <footer className="bg-primary w-screen text-center p-2 text-white font-semibold">
            © 2025 KEEPSAKE, All Rights Reserved
            </footer> */}
            <Outlet />
        </div>
    )
}

export default Layout
