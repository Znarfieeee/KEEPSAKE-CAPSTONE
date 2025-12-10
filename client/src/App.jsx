import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { QrScannerProvider } from './context/QrScannerContext'

// Pages
import Landing_page from '@/pages/Landing_page'
import PricingPage from '@/pages/PricingPage'
import ServicesPage from '@/pages/ServicesPage'
import AboutPage from '@/pages/AboutPage'
import ClinicsPage from '@/pages/ClinicsPage'
import Login from '@/pages/Login'
import FirstLogin from '@/pages/FirstLogin'
import NotFound from '@/pages/NotFound'
import AuthSuccess from '@/pages/AuthSuccess'
import AuthError from '@/pages/AuthError'
import QrScanner from '@/pages/QrScanner'
import PrescriptionViewPage from '@/pages/PrescriptionViewPage'
import QrCodeGeneratorTest from '@/pages/QrCodeGeneratorTest'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Settings from '@/pages/Settings'
import Notifications from '@/pages/Notifications'
import PaymentSuccess from '@/pages/PaymentSuccess'
import PaymentCancel from '@/pages/PaymentCancel'
import CheckoutPage from '@/pages/CheckoutPage'

// Admin
import AdminDashboard from '@/pages/systemAdmin/AdminDashboard'
import FacilitiesRegistry from '@/pages/systemAdmin/FacilitiesRegistry'
import FacilityUsersRegistry from '@/pages/systemAdmin/FacilityUsersRegistry'
import UsersRegistry from '@/pages/systemAdmin/UsersRegistry'
import SubscriptionPage from '@/pages/systemAdmin/SubscriptionPage'
import AuditLogsPage from '@/pages/systemAdmin/AuditLogsPage'
import DataReports from '@/pages/systemAdmin/DataReports'
import SystemConfigPage from '@/pages/systemAdmin/SystemConfigPage'
import MaintenancePage from '@/pages/systemAdmin/MaintenancePage'

// Facility_admin
import FadminDashboard from '@/pages/facility_admin/FadminDashboard'
import FadminFacilityUsersRegistry from './pages/facility_admin/FadminFacilityUsersRegistry'

// Doctor
import DoctorDashboard from '@/pages/pediapro/DoctorDashboard'
import DoctorAppointments from '@/pages/pediapro/DoctorAppointments'
import DoctorPatientRecords from '@/pages/pediapro/DoctorPatientRecords'
import DoctorReports from '@/pages/pediapro/DoctorReports'
import DoctorSettings from '@/pages/pediapro/DoctorSettings'
import DoctorSupport from '@/pages/pediapro/DoctorSupport'
import DoctorPatientInfo from './pages/pediapro/DoctorPatientInfo'
import DoctorQrScanner from '@/pages/pediapro/DoctorQrScanner'

// Nurse/Staff (Vital Custodian)
import NurseQrScanner from '@/pages/vital_custodian/NurseQrScanner'
import NurseAppointments from '@/pages/vital_custodian/NurseAppointments'

// Parent (Keepsaker)
import ParentDashboard from '@/pages/parent/ParentDashboard'
import ParentChildrenList from '@/pages/parent/ParentChildrenList'
import ParentChildInfo from '@/pages/parent/ParentChildInfo'
import ParentAppointments from '@/pages/parent/ParentAppointments'
import ParentQrScanner from '@/pages/parent/ParentQrScanner'

// Facility Admin QR Scanner
import FacilityAdminQrScanner from '@/pages/facility_admin/FacilityAdminQrScanner'

// Help & Feedback Pages (Shared)
import HelpSupport from '@/pages/shared/HelpSupport'
import Feedback from '@/pages/shared/Feedback'

// Admin Feedback Management
import FeedbackDashboard from '@/components/systemAdmin/FeedbackDashboard'

import AdminLayout from '@/layout/AdminLayout'
import FacilityAdminLayout from '@/layout/FacilityAdminLayout'
import PediaproLayout from '@/layout/PediaproLayout'
import ParentLayout from '@/layout/ParentLayout'
import NurseLayout from '@/layout/NurseLayout'
import LandingLayout from '@/layout/LandingLayout'
import NurseDashboard from './pages/vital_custodian/NurseDashboard'
import NurseReports from './pages/vital_custodian/NurseReports'
import ParentReports from './pages/parent/ParentReports'

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
                    element: <LandingLayout />, // Landing page layout with navbar
                    children: [
                        {
                            path: '/',
                            element: <Landing_page />,
                        },
                        {
                            path: '/pricing',
                            element: <PricingPage />,
                        },
                        {
                            path: '/services',
                            element: <ServicesPage />,
                        },
                        {
                            path: '/about',
                            element: <AboutPage />,
                        },
                        {
                            path: '/clinics',
                            element: <ClinicsPage />,
                        },
                    ],
                },
                {
                    path: '/qr_scanner',
                    element: <QrScanner />,
                },
                {
                    path: '/prescription/view',
                    element: <PrescriptionViewPage />,
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
                    path: '/first-login',
                    element: (
                        <ProtectedRoute>
                            <FirstLogin />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: '/forgot-password',
                    element: <ForgotPassword />,
                },
                {
                    path: '/reset-password',
                    element: <ResetPassword />,
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
                    path: '/notifications',
                    element: (
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: '/checkout',
                    element: (
                        <ProtectedRoute>
                            <CheckoutPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: '/payment/success',
                    element: (
                        <ProtectedRoute>
                            <PaymentSuccess />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: '/payment/cancel',
                    element: (
                        <ProtectedRoute>
                            <PaymentCancel />
                        </ProtectedRoute>
                    ),
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
                            path: 'audit_logs',
                            element: <AuditLogsPage />,
                        },
                        {
                            path: 'reports',
                            element: <DataReports />,
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
                        {
                            path: 'help_support',
                            element: <HelpSupport />,
                        },
                        {
                            path: 'feedback',
                            element: <Feedback />,
                        },
                        {
                            path: 'feedback_dashboard',
                            element: <FeedbackDashboard />,
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
                        {
                            path: 'qr_scanner',
                            element: <FacilityAdminQrScanner />,
                        },
                        {
                            path: 'help-support',
                            element: <HelpSupport />,
                        },
                        {
                            path: 'feedback',
                            element: <Feedback />,
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
                            path: 'help-support',
                            element: <HelpSupport />,
                        },
                        {
                            path: 'feedback',
                            element: <Feedback />,
                        },
                        {
                            path: 'qr_scanner',
                            element: <DoctorQrScanner />,
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
                            element: <ParentChildInfo />,
                        },
                        {
                            path: 'appointments',
                            element: <ParentAppointments />,
                        },
                        {
                            path: 'reports',
                            element: <ParentReports />,
                        },
                        {
                            path: 'settings',
                            element: <Settings />,
                        },
                        {
                            path: 'help-support',
                            element: <HelpSupport />,
                        },
                        {
                            path: 'feedback',
                            element: <Feedback />,
                        },
                        {
                            path: 'qr_scanner',
                            element: <ParentQrScanner />,
                        },
                    ],
                },
                {
                    path: '/nurse',
                    element: (
                        <ProtectedRoute requiredRole="nurse">
                            <NurseLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <NurseDashboard />,
                        },
                        {
                            path: 'qr_scanner',
                            element: <NurseQrScanner />,
                        },
                        {
                            path: 'appointments',
                            element: <NurseAppointments />,
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
                            element: <NurseReports />,
                        },
                        {
                            path: 'settings',
                            element: <Settings />,
                        },
                        {
                            path: 'help-support',
                            element: <HelpSupport />,
                        },
                        {
                            path: 'feedback',
                            element: <Feedback />,
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
