import React, { useState } from "react"
import { Outlet, Link } from "react-router-dom"

// UI Components
import { BiTachometer, BiCalendar } from "react-icons/bi"
import { TbHeartbeat } from "react-icons/tb"
import { IoMdAnalytics } from "react-icons/io"
import { MdQrCodeScanner } from "react-icons/md"
import Hamburger from "../components/ui/Hamburger"
import AccountPlaceholder from "../components/AccountPlaceholder"
import NotificationPlaceholder from "../components/ui/NotificationPlaceholder"

const sideNavLinks = [
    {
        icon: <BiTachometer className="text-xl" />,
        title: "DASHBOARD",
        to: "/pediapro/dashboard",
    },
    {
        icon: <BiCalendar className="text-xl" />,
        title: "APPOINTMENTS",
        to: "/pediapro/appointments",
    },
    {
        icon: <TbHeartbeat className="text-xl" />,
        title: "PATIENT RECORDS",
        to: "/pediapro/patient_records",
    },
    {
        icon: <IoMdAnalytics className="text-xl" />,
        title: "REPORTS",
        to: "/pediapro/reports",
    },
    {
        icon: <MdQrCodeScanner className="text-xl" />,
        title: "QR CODE SCANNER",
        to: "/pediapro/qr_scanner",
    },
]

function AdminLayout() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const toggleDrawer = () => setDrawerOpen(open => !open)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
                <div className="flex justify-between items-center h-full px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <Hamburger
                            open={drawerOpen}
                            toggle={toggleDrawer}
                            className="text-gray-700"
                        />
                        <img
                            src="/KEEPSAKE.png"
                            alt="KEEPSAKE smart beginnings"
                            className="h-10 w-auto"
                        />
                    </div>
                    <div className="flex items-center gap-2 mr-6">
                        <NotificationPlaceholder className=" text-black" />
                        <AccountPlaceholder className=" text-black" />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-secondary/80 backdrop-blur-sm z-50 shadow-lg transition-transform duration-300 ease-in-out transform ${
                    drawerOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                <nav className="h-full py-6">
                    <div className="space-y-4 mt-10">
                        {sideNavLinks.map((link, index) => (
                            <Link
                                key={index}
                                to={link.to}
                                className="flex items-center gap-3 px-8 py-4 text-black hover:bg-gray-100 duration-300 delay-30 transition-colors">
                                {link.icon}
                                <span className="text-sm font-bold">
                                    {link.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="pt-16 min-h-screen">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default AdminLayout
