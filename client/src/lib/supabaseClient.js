import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Auto-refresh tokens before they expire
        autoRefreshToken: true,
        // Persist session in localStorage (30-day expiry controlled by backend Redis)
        persistSession: true,
        // Detect session from URL (e.g., OAuth callbacks)
        detectSessionInUrl: true,
        // Use localStorage for persistent sessions
        storage: window.localStorage,
        // Custom storage key
        storageKey: 'keepsake-auth-token',
        // Flow type for auth
        flowType: 'pkce'
    },
    // Global fetch options
    global: {
        headers: {
            'X-Client-Info': 'keepsake-healthcare-v1'
        }
    },
    // Database options
    db: {
        schema: 'public'
    },
    // Realtime options
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})
