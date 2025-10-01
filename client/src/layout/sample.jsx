import React, { useState } from 'react'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { Outlet, Link } from 'react-router-dom'

// UI Components
import { FiUsers, FiCalendar, FiMail, FiShield, FiUserPlus } from 'react-icons/fi'
import { AiOutlineSchedule, AiOutlineAudit, AiOutlineQrcode } from 'react-icons/ai'
import { BsBuilding, BsPeople, BsClipboardData, BsGraphUp } from 'react-icons/bs'
import { CgFileDocument } from 'react-icons/cg'
import { RiDashboardLine, RiUserAddLine, RiHeartPulseLine } from 'react-icons/ri'
import { BiCog, BiStats } from 'react-icons/bi'
import { MdOutlineChildCare, MdOutlineVaccines, MdOutlineHealthAndSafety } from 'react-icons/md'
import { HiOutlineDocumentText, HiOutlineUserGroup } from 'react-icons/hi'
import { IoMdNotificationsOutline } from 'react-icons/io'
import Hamburger from '../components/ui/Hamburger'
import AccountPlaceholder from '../components/AccountPlaceholder'
import NotificationPlaceholder from '../components/ui/NotificationPlaceholder'

// Dashboard & Overview
const dashboardLinks = [
    {
        icon: <RiDashboardLine className="text-xl" />,
        title: 'Dashboard',
        to: '/facility_admin',
    },
    {
        icon: <BiStats className="text-xl" />,
        title: 'Analytics & Reports',
        to: '/facility_admin/analytics',
    },
]

// User Management
const userManagementLinks = [
    {
        icon: <FiUsers className="text-xl" />,
        title: 'Staff Management',
        to: '/facility_admin/staff',
    },
    {
        icon: <RiUserAddLine className="text-xl" />,
        title: 'User Invitations',
        to: '/facility_admin/invitations',
    },
    {
        icon: <HiOutlineUserGroup className="text-xl" />,
        title: 'Parent Access',
        to: '/facility_admin/parent-access',
    },
    {
        icon: <FiShield className="text-xl" />,
        title: 'Roles & Permissions',
        to: '/facility_admin/roles',
    },
]

// Patient Management
const patientManagementLinks = [
    {
        icon: <MdOutlineChildCare className="text-xl" />,
        title: 'Patient Registry',
        to: '/facility_admin/patients',
    },
    {
        icon: <FiCalendar className="text-xl" />,
        title: 'Appointments',
        to: '/facility_admin/appointments',
    },
    {
        icon: <RiHeartPulseLine className="text-xl" />,
        title: 'Medical Visits',
        to: '/facility_admin/visits',
    },
    {
        icon: <HiOutlineDocumentText className="text-xl" />,
        title: 'Prescriptions',
        to: '/facility_admin/prescriptions',
    },
]

// Health Records
const healthRecordsLinks = [
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
    {
        icon: <BsGraphUp className="text-xl" />,
        title: 'Growth Tracking',
        to: '/facility_admin/growth',
    },
]

// Facility Operations
const facilityOperationsLinks = [
    {
        icon: <BsBuilding className="text-xl" />,
        title: 'Facility Profile',
        to: '/facility_admin/profile',
    },
    {
        icon: <AiOutlineSchedule className="text-xl" />,
        title: 'Schedule Management',
        to: '/facility_admin/schedule',
    },
    {
        icon: <AiOutlineQrcode className="text-xl" />,
        title: 'QR Code System',
        to: '/facility_admin/qr-codes',
    },
    {
        icon: <IoMdNotificationsOutline className="text-xl" />,
        title: 'Notifications',
        to: '/facility_admin/notifications',
    },
]

// Compliance & Monitoring
const complianceLinks = [
    {
        icon: <AiOutlineAudit className="text-xl" />,
        title: 'Audit Logs',
        to: '/facility_admin/audit',
    },
    {
        icon: <CgFileDocument className="text-xl" />,
        title: 'Reports',
        to: '/facility_admin/reports',
    },
    {
        icon: <BiCog className="text-xl" />,
        title: 'Settings',
        to: '/facility_admin/settings',
    },
]

function FacilityAdminLayout() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        dashboard: true,
        users: false,
        patients: false,
        health: false,
        operations: false,
        compliance: false,
    })

    const toggleDrawer = () => setDrawerOpen((open) => !open)

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
                        <NotificationPlaceholder className="text-black" />
                        <AccountPlaceholder className="text-black" />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 text-black bg-white border-r border-gray-200 z-40 shadow-lg transition-transform duration-300 ease-in-out transform ${
                    drawerOpen ? 'translate-x-0' : '-translate-x-full'
                } overflow-y-auto`}
            >
                <nav className="h-full py-4">
                    {/* Dashboard Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => toggleSection('dashboard')}
                            className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                        >
                            <span>Overview</span>
                            <span className="text-xs">
                                {expandedSections.dashboard ? '−' : '+'}
                            </span>
                        </button>
                        {expandedSections.dashboard && (
                            <div className="mt-1">
                                {dashboardLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-3 px-6 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User Management Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => toggleSection('users')}
                            className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                        >
                            <span>User Management</span>
                            <span className="text-xs">{expandedSections.users ? '−' : '+'}</span>
                        </button>
                        {expandedSections.users && (
                            <div className="mt-1">
                                {userManagementLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-3 px-6 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Patient Management Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => toggleSection('patients')}
                            className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                        >
                            <span>Patient Management</span>
                            <span className="text-xs">{expandedSections.patients ? '−' : '+'}</span>
                        </button>
                        {expandedSections.patients && (
                            <div className="mt-1">
                                {patientManagementLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-3 px-6 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Health Records Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => toggleSection('health')}
                            className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                        >
                            <span>Health Records</span>
                            <span className="text-xs">{expandedSections.health ? '−' : '+'}</span>
                        </button>
                        {expandedSections.health && (
                            <div className="mt-1">
                                {healthRecordsLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-3 px-6 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Facility Operations Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => toggleSection('operations')}
                            className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                        >
                            <span>Facility Operations</span>
                            <span className="text-xs">
                                {expandedSections.operations ? '−' : '+'}
                            </span>
                        </button>
                        {expandedSections.operations && (
                            <div className="mt-1">
                                {facilityOperationsLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-3 px-6 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Compliance & Monitoring Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => toggleSection('compliance')}
                            className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                        >
                            <span>Compliance & Monitoring</span>
                            <span className="text-xs">
                                {expandedSections.compliance ? '−' : '+'}
                            </span>
                        </button>
                        {expandedSections.compliance && (
                            <div className="mt-1">
                                {complianceLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.to}
                                        className="flex items-center gap-3 px-6 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={toggleDrawer}
                />
            )}

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
