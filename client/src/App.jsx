import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./context/AuthContext"

// Pages
import Landing_page from "./pages/Landing_page"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

import AdminDashboard from "./pages/systemAdmin/AdminDashboard"
import FacilitiesRegistry from "./pages/systemAdmin/FacilitiesRegistry"

import AdminLayout from "./layout/AdminLayout"
import Layout from "./layout/PediaproLayout"

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
