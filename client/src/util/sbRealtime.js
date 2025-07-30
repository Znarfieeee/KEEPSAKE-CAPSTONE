import { supabase } from "../lib/supabaseClient"

/**
 * Subscribe to realtime changes on a specific table.
 * Like having a live wire connected to your database - when something changes,
 * you get notified immediately instead of having to constantly check.
 *
 * @param {string} table - The table name to subscribe to
 * @param {(payload) => void} onChange - Callback for INSERT, UPDATE, DELETE events
 * @param {Object} options - Additional options for the subscription
 * @param {string} options.filter - Optional filter for specific records
 * @param {boolean} options.enablePresence - Enable presence tracking
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToSupabaseRealtime(table, onChange, options = {}) {
    const { filter, enablePresence = false } = options

    // Create a unique channel name to avoid conflicts
    const channelName = `realtime:${table}:${Date.now()}`

    let channel = supabase.channel(channelName)

    // Add postgres changes listener
    let changeConfig = {
        event: "*",
        schema: "public",
        table: table,
    }

    // Add filter if provided (e.g., "user_id=eq.123")
    if (filter) {
        changeConfig.filter = filter
    }

    channel = channel.on("postgres_changes", changeConfig, payload => {
        console.log(`Realtime change on ${table}:`, payload)

        try {
            onChange(payload)
        } catch (error) {
            console.error(`Error handling realtime change for ${table}:`, error)
        }
    })

    // Add presence tracking if enabled
    if (enablePresence) {
        channel = channel.on("presence", { event: "*" }, payload => {
            console.log(`Presence change on ${table}:`, payload)
        })
    }

    // Subscribe to the channel
    channel.subscribe(status => {
        console.log(`Subscription status for ${table}:`, status)

        if (status === "SUBSCRIBED") {
            console.log(
                `✅ Successfully subscribed to ${table} realtime changes`
            )
        } else if (status === "CLOSED") {
            console.log(`❌ Subscription to ${table} was closed`)
        } else if (status === "CHANNEL_ERROR") {
            console.error(`💥 Channel error for ${table}`)
        }
    })

    // Return cleanup function
    return () => {
        console.log(`🧹 Unsubscribing from ${table} realtime changes`)
        supabase.removeChannel(channel)
    }
}

/**
 * Subscribe to multiple tables at once.
 * Like setting up multiple live wires - useful when you need to monitor several tables.
 *
 * @param {Array<{table: string, onChange: function, options?: Object}>} subscriptions
 * @returns {() => void} Unsubscribe function for all subscriptions
 */
export function subscribeToMultipleTables(subscriptions) {
    const unsubscribeFunctions = subscriptions.map(
        ({ table, onChange, options }) =>
            subscribeToSupabaseRealtime(table, onChange, options)
    )

    // Return function that unsubscribes from all
    return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
}

/**
 * Subscribe with automatic reconnection logic.
 * Like having a persistent connection that tries to reconnect if it drops.
 *
 * @param {string} table
 * @param {function} onChange
 * @param {Object} options
 * @returns {() => void} Unsubscribe function
 */
export function subscribeWithReconnect(table, onChange, options = {}) {
    let unsubscribe = null
    let shouldReconnect = true
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 1000 // Start with 1 second

    const connect = () => {
        if (!shouldReconnect) return

        unsubscribe = subscribeToSupabaseRealtime(table, onChange, {
            ...options,
            onError: () => {
                if (
                    shouldReconnect &&
                    reconnectAttempts < maxReconnectAttempts
                ) {
                    reconnectAttempts++
                    const delay =
                        reconnectDelay * Math.pow(2, reconnectAttempts - 1) // Exponential backoff

                    console.log(
                        `Attempting to reconnect to ${table} in ${delay}ms (attempt ${reconnectAttempts})`
                    )

                    setTimeout(() => {
                        if (unsubscribe) unsubscribe()
                        connect()
                    }, delay)
                }
            },
        })
    }

    connect()

    return () => {
        shouldReconnect = false
        if (unsubscribe) unsubscribe()
    }
}

/**
 * Utility to handle common realtime patterns for user management.
 * This is like having a pre-configured setup specifically for user-related tables.
 *
 * @param {Object} handlers - Object containing handler functions
 * @param {function} handlers.onUserChange - Handler for users table changes
 * @param {function} handlers.onFacilityUserChange - Handler for facility_users changes
 * @param {function} handlers.onFacilityChange - Handler for healthcare_facilities changes
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToUserManagement(handlers) {
    const subscriptions = []

    if (handlers.onUserChange) {
        subscriptions.push({
            table: "users",
            onChange: handlers.onUserChange,
        })
    }

    if (handlers.onFacilityUserChange) {
        subscriptions.push({
            table: "facility_users",
            onChange: handlers.onFacilityUserChange,
        })
    }

    if (handlers.onFacilityChange) {
        subscriptions.push({
            table: "healthcare_facilities",
            onChange: handlers.onFacilityChange,
        })
    }

    return subscribeToMultipleTables(subscriptions)
}
