import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Landing_page from "./pages/Landing_page"
// import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./layout/Layout"
import Login from "./pages/Login"

function App() {
    const router = createBrowserRouter([
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
    ])
    return <RouterProvider router={router} />
}

export default App
