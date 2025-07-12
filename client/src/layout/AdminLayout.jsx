import React, { useState } from "react"
import { Outlet, Link } from "react-router-dom"

// UI Components
import { BiTachometer, BiCalendar } from "react-icons/bi"
import { TbHeartbeat } from "react-icons/tb"
import { AiOutlineUser } from "react-icons/ai"
import { IoMdAnalytics } from "react-icons/io"
import { MdQrCodeScanner } from "react-icons/md"
import Hamburger from "../components/ui/Hamburger"
import { Avatar, Menu, Portal } from "@chakra-ui/react"

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
                    <div className="flex items-center gap-2">
                        <Menu.Root positioning={{ placement: "right-end" }}>
                            <Menu.Trigger rounded="full" focusRing="outside">
                                <Avatar.Root size="sm">
                                    <Avatar.Fallback name="Segun Adebayo" />
                                    <Avatar.Image src="https://bit.ly/sage-adebayo" />
                                </Avatar.Root>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content>
                                        <Menu.Item value="account">
                                            Account
                                        </Menu.Item>
                                        <Menu.Item value="settings">
                                            Settings
                                        </Menu.Item>
                                        <Menu.Item value="logout">
                                            Logout
                                        </Menu.Item>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out transform ${
                    drawerOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                <nav className="h-full py-6">
                    <div className="space-y-2">
                        {sideNavLinks.map((link, index) => (
                            <Link
                                key={index}
                                to={link.to}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors">
                                {link.icon}
                                <span className="text-sm font-medium">
                                    {link.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main
                className={`pt-16 min-h-screen transition-all duration-300 ${
                    drawerOpen ? "ml-64" : "ml-0"
                }`}>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default AdminLayout
