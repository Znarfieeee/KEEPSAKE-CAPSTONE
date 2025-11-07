import React, { useState, useRef, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'

// UI Components
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { FiCalendar } from 'react-icons/fi'
import { AiOutlineTool } from 'react-icons/ai'
import { TbActivityHeartbeat, TbHeartbeat, TbBrandGoogleAnalytics } from 'react-icons/tb'
import { BsClipboardData } from 'react-icons/bs'
import { HiOutlineIdentification, HiOutlineUserGroup } from 'react-icons/hi'
import { MdQrCodeScanner, MdOutlineVaccines, MdOutlineHealthAndSafety } from 'react-icons/md'
import { CgFileDocument } from 'react-icons/cg'
import { RiDashboardLine, RiUserAddLine } from 'react-icons/ri'
import { BiCog } from 'react-icons/bi'
import Hamburger from '../components/ui/Hamburger'
import AccountPlaceholder from '../components/AccountPlaceholder'
import NotificationBell from '../components/notifications/NotificationBell'

const mainSideNavLinks = [
    {
        icon: <RiDashboardLine className="text-xl" />,
        title: 'Dashboard',
        to: '/facility_admin',
    },
    {
        icon: <HiOutlineIdentification className="text-xl" />,
        title: 'Facility Users',
        to: '/facility_admin/facility_users',
    },
    {
        icon: <FiCalendar className="text-xl" />,
        title: 'Appointments',
        to: '/facility_admin/appointments',
    },
    {
        icon: <RiUserAddLine className="text-xl" />,
        title: 'User Invitations',
        to: '/facility_admin/invitations',
    },
    {
        icon: <MdQrCodeScanner className="text-xl" />,
        title: 'QR Code Scanner',
        to: '/qr_scanner',
    },
]

const healthRecordsLinks = [
    {
        icon: <TbHeartbeat className="text-xl" />,
        title: 'Patient Records',
        to: '/facility_admin/patients',
    },
    {
        icon: <MdOutlineVaccines className="text-xl" />,
        title: 'Vaccinations',
        to: '/facility_admin/vaccinations',
    },
    {
        icon: <BsClipboardData className="text-xl" />,
        title: 'Screening Tests',
        to: '/facility_admin/screening',
    },
    {
        icon: <MdOutlineHealthAndSafety className="text-xl" />,
        title: 'Allergies',
        to: '/facility_admin/allergies',
    },
]

const monitoringSideNavLinks = [
    {
        icon: <HiOutlineUserGroup className="text-xl" />,
        title: 'Parent Access',
        to: '/facility_admin/parent-access',
    },
    {
        icon: <TbBrandGoogleAnalytics className="text-xl" />,
        title: 'Reports',
        to: '/facility_admin/reports',
    },
    {
        icon: <CgFileDocument className="text-xl" />,
        title: 'Audit & Logs',
        to: '/facility_admin/audit',
    },
    {
        icon: <TbActivityHeartbeat className="text-xl" />,
        title: 'Api & Webhooks',
        to: '/facility_admin/api_webhooks',
    },
]

const systemSideNavLinks = [
    {
        icon: <BiCog className="text-xl" />,
        title: 'System Configuration',
        to: '/facility_admin/system_config',
    },
    {
        icon: <AiOutlineTool className="text-xl" />,
        title: 'Maintenance Mode',
        to: '/facility_admin/maintenance_mode',
    },
]

function FacilityAdminLayout() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const sidebarRef = useRef(null)
    const hamburgerRef = useRef(null)
    const [expandedSections, setExpandedSections] = useState({
        patients: false,
    })

    const toggleDrawer = () => setDrawerOpen((open) => !open)

    useEffect(() => {
        function handleClickOutside(event) {
            // If clicking the sidebar or hamburger button, do nothing
            if (
                sidebarRef.current?.contains(event.target) ||
                hamburgerRef.current?.contains(event.target)
            ) {
                return
            }

            // If drawer is open and clicking outside, close it
            if (drawerOpen) {
                setDrawerOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [drawerOpen])

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
                <div className="flex justify-between items-center h-full px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <div ref={hamburgerRef}>
                            <Hamburger
                                open={drawerOpen}
                                toggle={toggleDrawer}
                                className="text-gray-700"
                            />
                        </div>
                        <img
                            src="/KEEPSAKE.png"
                            alt="KEEPSAKE smart beginnings"
                            className="h-10 w-auto"
                        />
                    </div>
                    <div className="flex items-center gap-2 mr-6">
                        <NotificationBell />
                        <AccountPlaceholder className=" text-black" />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 text-black bg-secondary/80 backdrop-blur-sm z-50 shadow-lg transition-transform duration-400 ease-in-out transform ${
                    drawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <nav className="h-full py-6">
                    <div className="mt-5">
                        <span className="text-sm font-semibold text-tertiary px-8">Main</span>
                        {mainSideNavLinks.map((link, index) => (
                            <Link
                                key={index}
                                to={link.to}
                                className="flex items-center gap-4 px-8 py-3 text-black hover:bg-gray-100 duration-300 delay-30 transition-colors"
                            >
                                {link.icon}
                                <span className="text-sm">{link.title}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Patient Records Section with Toggle */}
                    <div className="mt-5">
                        <button
                            onClick={() => toggleSection('patients')}
                            className="w-full flex items-center justify-between px-8 py-2 text-sm font-semibold text-tertiary hover:bg-gray-50"
                        >
                            <span>Patient Records</span>
                            <span className="text-xs">{expandedSections.patients ? '−' : '+'}</span>
                        </button>
                        {expandedSections.patients && (
                            <div className="mt-1">
                                {healthRecordsLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-4 px-8 py-3 text-black hover:bg-gray-100 duration-300 delay-30 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-5">
                        <span className="text-sm font-semibold text-tertiary px-8">Monitoring</span>
                        {monitoringSideNavLinks.map((link, index) => (
                            <Link
                                key={index}
                                to={link.to}
                                className="flex items-center gap-4 px-8 py-3 text-black hover:bg-gray-100 duration-300 delay-30 transition-colors"
                            >
                                {link.icon}
                                <span className="text-sm">{link.title}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-5">
                        <span className="text-sm font-semibold text-tertiary px-8">System</span>
                        {systemSideNavLinks.map((link, index) => (
                            <Link
                                key={index}
                                to={link.to}
                                className="flex items-center gap-4 px-8 py-3 text-black hover:bg-gray-100 duration-300 delay-30 transition-colors"
                            >
                                {link.icon}
                                <span className="text-sm">{link.title}</span>
                            </Link>
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="pt-16 min-h-screen">
                <div className="p-6">
                    <Breadcrumbs />
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default FacilityAdminLayout
