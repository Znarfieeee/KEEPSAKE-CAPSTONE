import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react"

const system = createSystem({
    ...defaultConfig,
    globalCss: {},
    preflight: false,
})

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ChakraProvider value={system} resetCSS={false}>
            <App />
        </ChakraProvider>
    </StrictMode>
)
