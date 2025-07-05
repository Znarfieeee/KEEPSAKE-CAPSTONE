import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Landing_page from "./pages/Landing_page"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./layout/Layout"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: (
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Landing_page />,
                },
            ],
        },
    ])
    return (
        <AppProvider>
            <RouterProvider router={router} />
            <h1>hays</h1>
        </AppProvider>
    )
}

export default App
