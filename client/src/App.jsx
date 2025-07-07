import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Landing_page from "./pages/Landing_page"
// import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./layout/Layout"

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
    ])
    return <RouterProvider router={router} />
}

export default App
