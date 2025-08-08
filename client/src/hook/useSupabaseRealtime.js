import { useEffect, useCallback } from "react"
import { supabase } from "../lib/supabaseClient"
import { displayRoles } from "../util/roleHelper"

/**
 * Custom hook for Supabase real-time subscriptions
 *
 * @param {string} table - The table name to listen to
 * @param {function} onInsert - Callback for INSERT operations
 * @param {function} onUpdate - Callback for UPDATE operations
 * @param {function} onDelete - Callback for DELETE operations
 * @param {object} filter - Optional filter conditions
 * @param {array} dependencies - Dependencies array for useEffect
 */

export const useSupabaseRealtime = ({
    table,
    onInsert,
    onUpdate,
    onDelete,
    filter = null,
    dependencies = [],
}) => {
    const handleInsert = useCallback(
        payload => {
            if (onInsert) onInsert(payload.new)
        },
        [onInsert]
    )

    const handleUpdate = useCallback(
        payload => {
            if (onUpdate) onUpdate(payload.new, payload.old)
        },
        [onUpdate]
    )

    const handleDelete = useCallback(
        payload => {
            if (onDelete) onDelete(payload.old)
        },
        [onDelete]
    )

    useEffect(() => {
        let subscription = supabase
            .channel(`${table}_changes`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: table,
                    ...(filter && { filter }),
                },
                handleInsert
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: table,
                    ...(filter && { filter }),
                },
                handleUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: table,
                    ...(filter && { filter }),
                },
                handleDelete
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [
        table,
        handleInsert,
        handleUpdate,
        handleDelete,
        filter,
        ...dependencies,
    ])

    return { supabase }
}

export const useFacilitiesRealtime = ({ onFacilityChange }) => {
    const formatFacility = useCallback(
        raw => ({
            id: raw.facility_id,
            name: raw.facility_name,
            location: `${raw.address}, ${raw.city}, ${raw.zip_code}`,
            type: raw.type,
            plan: raw.plan,
            expiry: raw.subscription_expires,
            admin: raw.admin || raw.email || "—",
            status: raw.subscription_status,
            contact: raw.contact_number,
            email: raw.email,
            website: raw.website,
        }),
        []
    )

    const handleInsert = useCallback(
        newFacility => {
            const formatted = formatFacility(newFacility)
            onFacilityChange({
                type: "INSERT",
                facility: formatted,
                raw: newFacility,
            })
        },
        [formatFacility, onFacilityChange]
    )

    const handleUpdate = useCallback(
        (updatedFacility, oldFacility) => {
            const formatted = formatFacility(updatedFacility)
            onFacilityChange({
                type: "UPDATE",
                facility: formatted,
                raw: updatedFacility,
                oldRaw: oldFacility,
            })
        },
        [formatFacility, onFacilityChange]
    )

    const handleDelete = useCallback(
        deletedFacility => {
            const formatted = formatFacility(deletedFacility)
            onFacilityChange({
                type: "DELETE",
                facility: formatted,
                raw: deletedFacility,
            })
        },
        [formatFacility, onFacilityChange]
    )

    return useSupabaseRealtime({
        table: "healthcare_facilities",
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: "deleted_at=is.null",
        dependencies: [onFacilityChange],
    })
}

export const useUsersRealtime = ({ onUserChange }) => {
    const formatLastLogin = lastLoginTime => {
        try {
            if (!lastLoginTime || lastLoginTime === "null") return "Never"

            const lastLogin = new Date(lastLoginTime)
            const now = new Date()
            const diffInHours = Math.floor((now - lastLogin) / (1000 * 60 * 60))

            if (diffInHours < 24) {
                return `${diffInHours} ${
                    diffInHours === 1 ? "hour" : "hours"
                } ago`
            } else {
                const days = Math.floor(diffInHours / 24)
                const remainingHours = diffInHours % 24

                if (remainingHours === 0) {
                    return `${days} ${days === 1 ? "day" : "days"} ago`
                } else {
                    return `${days} ${
                        days === 1 ? "day" : "days"
                    } and ${remainingHours} ${
                        remainingHours === 1 ? "hour" : "hours"
                    } ago`
                }
            }
        } catch {
            return "Never"
        }
    }

    const formatUser = useCallback(
        raw => ({
            id: raw.user_id,
            email: raw.email,
            firstname: raw.firstname,
            lastname: raw.lastname,
            role: displayRoles(raw.role),
            specialty: raw.specialty || "—",
            license_number: raw.license_number || "—",
            contact: raw.phone_number || "—",
            plan: raw.is_subscribed === "true" ? "Premium" : "Freemium",
            status: raw.is_active ? "active" : "inactive",
            sub_exp: raw.subscription_expires,
            created_at: new Date(raw.created_at).toLocaleDateString(),
            updated_at: raw.updated_at
                ? new Date(raw.updated_at).toLocaleDateString()
                : "—",
            last_login:
                raw.last_sign_in_at && raw.last_sign_in_at !== "null"
                    ? formatLastLogin(raw.last_sign_in_at)
                    : "Never",
        }),
        []
    )

    const fetUserFacilityInfo = useCallback(async userId => {
        try {
            const { data, error } = await supabase
                .from("facility_users")
                .select(
                    `
                    role,
                    healthcare_facilities (
                        id,
                        facility_name
                    )
                `
                )
                .eq("user_id", userId)
                .single()

            if (error || !data) {
                return {
                    assigned_facility: "Not Assigned",
                    facility_role: "—",
                    facility_id: null,
                }
            }

            return {
                assigned_facility:
                    data.healthcare_facilities?.facility_name || "Not Assigned",
                facility_role: displayRoles(data.role || ""),
                facility_id: data.healthcare_facilities?.id || null,
            }
        } catch (error) {
            console.error("Error fetching facility info:", error)
            return {
                assigned_facility: "Not Assigned",
                facility_role: "—",
                facility_id: null,
            }
        }
    }, [])

    const handleInsert = useCallback(
        async newUser => {
            const formatted = formatUser(newUser)

            // Fetch facility info separately
            const facilityInfo = await fetchUserFacilityInfo(newUser.user_id)
            const completeUser = { ...formatted, ...facilityInfo }

            onUserChange({
                type: "INSERT",
                user: completeUser,
                raw: newUser,
            })
        },
        [formatUser, onUserChange]
    )

    const handleUpdate = useCallback(
        async (updatedUser, oldUser) => {
            const formatted = formatUser(updatedUser)

            // Fetch facility info separately
            const facilityInfo = await fetchUserFacilityInfo(
                updatedUser.user_id
            )
            const completeUser = { ...formatted, ...facilityInfo }

            onUserChange({
                type: "UPDATE",
                user: completeUser,
                raw: updatedUser,
                oldRaw: oldUser,
            })
        },
        [formatUser, onUserChange]
    )

    const handleDelete = useCallback(
        deletedUser => {
            const formatted = formatUser(deletedUser)
            onUserChange({
                type: "DELETE",
                user: formatted,
                raw: deletedUser,
            })
        },
        [formatUser, onUserChange]
    )

    return useSupabaseRealtime({
        table: "users",
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onUserChange],
    })
}

// NEW: Separate hook for facility_users table changes
export const useFacilityUsersRealtime = ({ onFacilityUserChange }) => {
    const handleInsert = useCallback(
        newFacilityUser => {
            onFacilityUserChange({
                type: "INSERT",
                facilityUser: newFacilityUser,
            })
        },
        [onFacilityUserChange]
    )

    const handleUpdate = useCallback(
        (updatedFacilityUser, oldFacilityUser) => {
            onFacilityUserChange({
                type: "UPDATE",
                facilityUser: updatedFacilityUser,
                oldFacilityUser: oldFacilityUser,
            })
        },
        [onFacilityUserChange]
    )

    const handleDelete = useCallback(
        deletedFacilityUser => {
            onFacilityUserChange({
                type: "DELETE",
                facilityUser: deletedFacilityUser,
            })
        },
        [onFacilityUserChange]
    )

    return useSupabaseRealtime({
        table: "facility_users",
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onFacilityUserChange],
    })
}

export { supabase }
