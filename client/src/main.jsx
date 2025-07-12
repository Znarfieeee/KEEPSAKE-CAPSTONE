import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext"
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react"

const system = createSystem({
    ...defaultConfig,
    globalCss: {}, // This disables Chakra's global CSS reset
    preflight: false, // This also helps prevent style conflicts
})

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ChakraProvider value={system}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ChakraProvider>
    </StrictMode>
)
