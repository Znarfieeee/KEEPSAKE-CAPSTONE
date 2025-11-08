import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { QrScannerProvider } from './context/QrScannerContext'

// Pages
import Landing_page from '@/pages/Landing_page'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import AuthSuccess from '@/pages/AuthSuccess'
import AuthError from '@/pages/AuthError'
import QrScanner from '@/pages/QrScanner'
import QrCodeGeneratorTest from '@/pages/QrCodeGeneratorTest'
import ForgotPassword from '@/pages/ForgotPassword'
import Settings from '@/pages/Settings'

// Admin
import AdminDashboard from '@/pages/systemAdmin/AdminDashboard'
import FacilitiesRegistry from '@/pages/systemAdmin/FacilitiesRegistry'
import FacilityUsersRegistry from '@/pages/systemAdmin/FacilityUsersRegistry'
import UsersRegistry from '@/pages/systemAdmin/UsersRegistry'
import SubscriptionPage from '@/pages/systemAdmin/SubscriptionPage'
import TokenInvitations from '@/pages/systemAdmin/TokenInvitations'
import AuditLogsPage from '@/pages/systemAdmin/AuditLogsPage'
import ApiWebhooksPage from '@/pages/systemAdmin/ApiWebhooksPage'
import SystemConfigPage from '@/pages/systemAdmin/SystemConfigPage'
import MaintenancePage from '@/pages/systemAdmin/MaintenancePage'

// Facility_admin
import FadminDashboard from '@/pages/facilityAdmin/FadminDashboard'
import FadminFacilityUsersRegistry from './pages/facilityAdmin/FadminFacilityUsersRegistry'

// Doctor
import DoctorDashboard from '@/pages/pediapro/DoctorDashboard'
import DoctorAppointments from '@/pages/pediapro/DoctorAppointments'
import DoctorPatientRecords from '@/pages/pediapro/DoctorPatientRecords'
import DoctorReports from '@/pages/pediapro/DoctorReports'
import DoctorSettings from '@/pages/pediapro/DoctorSettings'
import DoctorSupport from '@/pages/pediapro/DoctorSupport'
import DoctorPatientInfo from './pages/pediapro/DoctorPatientInfo'

// Parent (Keepsaker)
import ParentDashboard from '@/pages/parent/ParentDashboard'
import ParentChildrenList from '@/pages/parent/ParentChildrenList'
import ChildProfile from '@/pages/parent/ChildProfile'

import AdminLayout from '@/layout/AdminLayout'
import FacilityAdminLayout from '@/layout/FacilityAdminLayout'
import PediaproLayout from '@/layout/PediaproLayout'
import ParentLayout from '@/layout/ParentLayout'

const AuthWrapper = () => (
    <AuthProvider>
        <QrScannerProvider>
            <Outlet />
        </QrScannerProvider>
    </AuthProvider>
)

function App() {
    const router = createBrowserRouter([
        {
            element: <AuthWrapper />, // Provides auth to all child routes within router context
            children: [
                {
                    path: '/',
                    element: <Landing_page />,
                },
                {
                    path: '/qr_scanner',
                    element: <QrScanner />,
                },
                {
                    path: '/qr_generator_test',
                    element: <QrCodeGeneratorTest />,
                },
                {
                    path: '/login',
                    element: <Login />,
                },
                {
                    path: '/forgot-password',
                    element: <ForgotPassword />,
                },
                {
                    path: '/auth/success',
                    element: <AuthSuccess />,
                },
                {
                    path: '/auth/error',
                    element: <AuthError />,
                },
                {
                    path: '/admin',
                    element: (
                        <ProtectedRoute requiredRole="admin">
                            <AdminLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <AdminDashboard />,
                        },
                        {
                            path: 'facilities',
                            element: <FacilitiesRegistry />,
                        },
                        {
                            path: 'facility-users',
                            element: <FacilityUsersRegistry />,
                        },
                        {
                            path: 'users',
                            element: <UsersRegistry />,
                        },
                        {
                            path: 'sub_billing',
                            element: <SubscriptionPage />,
                        },
                        {
                            path: 'tokinv_system',
                            element: <TokenInvitations />,
                        },
                        {
                            path: 'audit_logs',
                            element: <AuditLogsPage />,
                        },
                        {
                            path: 'api_webhooks',
                            element: <ApiWebhooksPage />,
                        },
                        {
                            path: 'system_config',
                            element: <SystemConfigPage />,
                        },
                        {
                            path: 'maintenance_mode',
                            element: <MaintenancePage />,
                        },
                        {
                            path: 'settings',
                            element: <Settings />,
                        },
                    ],
                },
                {
                    path: '/facility_admin',
                    element: (
                        <ProtectedRoute requiredRole="facility_admin">
                            <FacilityAdminLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <FadminDashboard />,
                        },
                        // Main Navigation (from mainSideNavLinks)
                        {
                            path: 'facility_users',
                            element: <FadminFacilityUsersRegistry />,
                        },
                        {
                            path: 'appointments',
                            element: <div>Appointments Page</div>,
                        },
                        {
                            path: 'invitations',
                            element: <div>User Invitations Page</div>,
                        },
                        // Health Records (from healthRecordsLinks - shown when Patient Records is expanded)
                        {
                            path: 'patients',
                            element: <div>Patient Records Page</div>,
                        },
                        {
                            path: 'vaccinations',
                            element: <div>Vaccinations Page</div>,
                        },
                        {
                            path: 'screening',
                            element: <div>Screening Tests Page</div>,
                        },
                        {
                            path: 'allergies',
                            element: <div>Allergies Page</div>,
                        },
                        // Monitoring (from monitoringSideNavLinks)
                        {
                            path: 'parent-access',
                            element: <div>Parent Access Page</div>,
                        },
                        {
                            path: 'reports',
                            element: <div>Reports Page</div>,
                        },
                        {
                            path: 'audit',
                            element: <div>Audit & Logs Page</div>,
                        },
                        {
                            path: 'api_webhooks',
                            element: <div>API & Webhooks Page</div>,
                        },
                        // System (from systemSideNavLinks)
                        {
                            path: 'system_config',
                            element: <div>System Configuration Page</div>,
                        },
                        {
                            path: 'maintenance_mode',
                            element: <div>Maintenance Mode Page</div>,
                        },
                        {
                            path: 'settings',
                            element: <Settings />,
                        },
                    ],
                },
                {
                    path: '/pediapro',
                    element: (
                        <ProtectedRoute requiredRole="doctor">
                            <PediaproLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <DoctorDashboard />,
                        },
                        {
                            path: 'appointments',
                            element: <DoctorAppointments />,
                        },
                        {
                            path: 'patient_records',
                            element: <DoctorPatientRecords />,
                        },
                        {
                            path: 'patient_records/:patientId',
                            element: <DoctorPatientInfo />,
                        },
                        {
                            path: 'reports',
                            element: <DoctorReports />,
                        },
                        {
                            path: 'settings',
                            element: <Settings />,
                        },
                        {
                            path: 'help_support',
                            element: <DoctorSupport />,
                        },
                    ],
                },
                {
                    path: '/parent',
                    element: (
                        <ProtectedRoute requiredRole="parent">
                            <ParentLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <ParentDashboard />,
                        },
                        {
                            path: 'children',
                            element: <ParentChildrenList />,
                        },
                        {
                            path: 'child/:patientId',
                            element: <ChildProfile />,
                        },
                        {
                            path: 'appointments',
                            element: <div>Parent Appointments Page - Coming Soon</div>,
                        },
                        {
                            path: 'settings',
                            element: <Settings />,
                        },
                        {
                            path: 'help_support',
                            element: <div>Parent Help & Support Page - Coming Soon</div>,
                        },
                    ],
                },
                {
                    path: '*',
                    element: <NotFound />,
                },
            ],
        },
    ])

    return <RouterProvider router={router} />
}

export default App
