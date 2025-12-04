import { AiOutlineTool } from 'react-icons/ai'
import { BiCog, BiHelpCircle, BiMessageSquareDetail } from 'react-icons/bi'
import React, { useState, useEffect, useRef } from 'react'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { Outlet, Link, useLocation } from 'react-router-dom'

// UI Components
import { FiKey } from 'react-icons/fi'
import { AiOutlineCreditCard } from 'react-icons/ai'
import { TbActivityHeartbeat } from 'react-icons/tb'
import { BsBuilding } from 'react-icons/bs'
import { CgFileDocument } from 'react-icons/cg'
import { RiDashboardLine } from 'react-icons/ri'
import { Users, MessageSquarePlus, ChartNoAxesCombined } from 'lucide-react'
import Hamburger from '../components/ui/Hamburger'
import AccountPlaceholder from '../components/AccountPlaceholder'
import NotificationBell from '../components/notifications/NotificationBell'

const mainSideNavLinks = [
    {
        icon: <RiDashboardLine className="text-xl" />,
        title: 'Dashboard',
        to: '/admin',
    },
    {
        icon: <BsBuilding className="text-xl" />,
        title: 'Facilities Registry',
        to: '/admin/facilities',
    },
    {
        icon: <Users className="text-xl" />,
        title: 'Users Registry',
        to: '/admin/users',
    },
    {
        icon: <AiOutlineCreditCard className="text-xl" />,
        title: 'Subscription & Billing',
        to: '/admin/sub_billing',
    },
    // {
    //     icon: <FiKey className="text-xl" />,
    //     title: 'Token & Invite System',
    //     to: '/admin/tokinv_system',
    // },
]

const monitoringSideNavLinks = [
    {
        icon: <CgFileDocument className="text-xl" />,
        title: 'Audit & Logs',
        to: '/admin/audit_logs',
    },
    {
        icon: <ChartNoAxesCombined className="text-xl" />,
        title: 'Reports & Analytics',
        to: '/admin/reports',
    },
]

const systemSideNavLinks = [
    {
        icon: <BiCog className="text-xl" />,
        title: 'System Configuration',
        to: '/admin/system_config',
    },
    {
        icon: <AiOutlineTool className="text-xl" />,
        title: 'Maintenance Mode',
        to: '/admin/maintenance_mode',
    },
    {
        icon: <BiHelpCircle className="text-xl" />,
        title: 'Help & Support',
        to: '/admin/help-support',
    },
    // {
    //     icon: <MessageSquarePlus className="text-xl" />,
    //     title: 'Send Feedback',
    //     to: '/admin/feedback',
    // },
    {
        icon: <BiMessageSquareDetail className="text-xl" />,
        title: 'Feedback Management',
        to: '/admin/feedback_dashboard',
    },
]

function AdminLayout() {
    const location = useLocation()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const sidebarRef = useRef(null)
    const hamburgerRef = useRef(null)

    const toggleDrawer = () => setDrawerOpen((open) => !open)

    // Pages that have their own custom breadcrumbs and don't need the generic one
    const pagesWithCustomBreadcrumbs = ['/admin/facility-users']
    const shouldShowGenericBreadcrumbs = !pagesWithCustomBreadcrumbs.includes(location.pathname)

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
                                aria-label="Toggle Menu"
                            />
                        </div>
                        <img
                            src="/KEEPSAKE.png"
                            alt="KEEPSAKE smart beginnings"
                            className="h-10 w-auto"
                        />
                    </div>
                    <div className="flex items-center gap-2 mr-6">
                        <NotificationBell className=" text-black" />
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
                    {shouldShowGenericBreadcrumbs && <Breadcrumbs />}
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default AdminLayout
