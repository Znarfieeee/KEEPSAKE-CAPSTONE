function backendConnection() {
    // Prefer explicit env var if provided (useful for production or containerised envs)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL

    // Otherwise, build a URL that matches the current host to avoid SameSite issues
    // This guarantees that, whether the frontend is running on 127.0.0.1 or localhost,
    // the backend request will target the same site and the browser will attach cookies.
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:5000`
}

export default backendConnection
