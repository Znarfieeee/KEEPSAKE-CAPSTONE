function backendConnection() {
    // Use environment variable if available, otherwise fallback to default development URL
    return import.meta.env.VITE_API_URL || "http://localhost:5000"
}

export default backendConnection
