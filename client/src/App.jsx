import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"

// Pages
import Landing_page from "./pages/Landing_page"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

import AdminDashboard from "./pages/systemAdmin/AdminDashboard"

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
                    path: "/system_admin",
                    element: <AdminLayout />,
                    children: [
                        {
                            index: true,
                            element: <AdminDashboard />,
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
