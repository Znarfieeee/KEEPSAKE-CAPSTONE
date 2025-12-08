import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/patient_record': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/patient_records': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/auth': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/facilities': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/users': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/appointments': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/prescriptions': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/vaccinations': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/notifications': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/qr': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/parents': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'patient-records': [
                        './src/components/doctors/patient_records/StepperAddPatientModal.jsx',
                        './src/components/doctors/patient_records/sections/BasicInfoSection.jsx',
                        './src/components/doctors/patient_records/sections/DeliverySection.jsx',
                        './src/components/doctors/patient_records/sections/ScreeningSection.jsx',
                        './src/components/doctors/patient_records/sections/AllergySection.jsx',
                        './src/components/doctors/patient_records/sections/AnthropometricSection.jsx',
                    ],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
})
