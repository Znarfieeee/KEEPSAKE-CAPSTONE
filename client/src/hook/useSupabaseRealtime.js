import { useEffect, useCallback } from "react"
import { supabase } from "../lib/supabaseClient"

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
        dependencies: [onFacilityChange],
    })
}

export { supabase }
