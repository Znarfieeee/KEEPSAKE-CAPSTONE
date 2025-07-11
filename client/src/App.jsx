import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import Landing_page from "./pages/Landing_page"
import Layout from "./layout/PediaproLayout"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import { AuthProvider } from "./context/AuthContext"

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
                    element: <Layout />,
                    children: [
                        {
                            index: true,
                            element: <Landing_page />,
                        },
                    ],
                },
                {
                    path: "/login",
                    element: <Login />,
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
