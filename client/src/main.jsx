import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext"
import { ChakraProvider } from "@chakra-ui/react"

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ChakraProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ChakraProvider>
    </StrictMode>
)
