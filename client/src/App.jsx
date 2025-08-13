import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./context/AuthContext"

// Pages
import Landing_page from "@/pages/Landing_page"
import Login from "@/pages/Login"
import NotFound from "@/pages/NotFound"
import AuthSuccess from "@/pages/AuthSuccess"
import AuthError from "@/pages/AuthError"

// Admin
import AdminDashboard from "@/pages/systemAdmin/AdminDashboard"
import FacilitiesRegistry from "@/pages/systemAdmin/FacilitiesRegistry"
import UsersRegistry from "@/pages/systemAdmin/UsersRegistry"
import SubscriptionPage from "@/pages/systemAdmin/SubscriptionPage"
import TokenInvitations from "@/pages/systemAdmin/TokenInvitations"
import AuditLogsPage from "@/pages/systemAdmin/AuditLogsPage"
import ApiWebhooksPage from "@/pages/systemAdmin/ApiWebhooksPage"
import SystemConfigPage from "@/pages/systemAdmin/SystemConfigPage"
import MaintenancePage from "@/pages/systemAdmin/MaintenancePage"

// Facility_admin
import FacilityAdminDashboard from "@/pages/facilityAdmin/FacilityAdminDashboard"

import AdminLayout from "@/layout/AdminLayout"
import FacilityAdminLayout from "@/layout/FacilityAdminLayout"
import PediaproLayout from "@/layout/PediaproLayout"

const AuthWrapper = () => (
    <AuthProvider>
        <Outlet />
    </AuthProvider>
)

function App() {
    const router = createBrowserRouter([
        {
            element: <AuthWrapper />, // Provides auth to all child routes within router context
            children: [
                {
                    path: "/",
                    element: <Landing_page />,
                },
                {
                    path: "/login",
                    element: <Login />,
                },
                {
                    path: "/auth/success",
                    element: <AuthSuccess />,
                },
                {
                    path: "/auth/error",
                    element: <AuthError />,
                },
                {
                    path: "/admin",
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
                            path: "facilities",
                            element: <FacilitiesRegistry />,
                        },
                        {
                            path: "users",
                            element: <UsersRegistry />,
                        },
                        {
                            path: "sub_billing",
                            element: <SubscriptionPage />,
                        },
                        {
                            path: "tokinv_system",
                            element: <TokenInvitations />,
                        },
                        {
                            path: "audit_logs",
                            element: <AuditLogsPage />,
                        },
                        {
                            path: "api_webhooks",
                            element: <ApiWebhooksPage />,
                        },
                        {
                            path: "system_config",
                            element: <SystemConfigPage />,
                        },
                        {
                            path: "maintenance_mode",
                            element: <MaintenancePage />,
                        },
                    ],
                },
                {
                    path: "/facility_admin",
                    element: (
                        <ProtectedRoute requiredRole="facility_admin">
                            <FacilityAdminLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <FacilityAdminDashboard />,
                        },
                    ],
                },
                {
                    path: "/pediapro",
                    element: (
                        <ProtectedRoute requiredRole="doctor">
                            <PediaproLayout />
                        </ProtectedRoute>
                    ),
                    children: [
                        {
                            index: true,
                            element: <FacilityAdminDashboard />,
                        },
                        {
                            index: "appointments",
                            element: <FacilityAdminDashboard />,
                        },
                        {
                            index: "patient_records",
                            element: <FacilityAdminDashboard />,
                        },
                        {
                            index: "reports",
                            element: <FacilityAdminDashboard />,
                        },
                        {
                            index: "qr_scanner",
                            element: <FacilityAdminDashboard />,
                        },
                        {
                            index: "settings",
                            element: <FacilityAdminDashboard />,
                        },
                        {
                            index: "help_support",
                            element: <FacilityAdminDashboard />,
                        },
                    ],
                },
                {
                    path: "*",
                    element: <NotFound />,
                },
            ],
        },
    ])

    return <RouterProvider router={router} />
}

export default App
