import React, {
    useEffect,
    useState,
    useMemo,
    lazy,
    Suspense,
    useCallback,
} from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/context/auth"

// UI Components
import { TokenInviteHeader } from "@/components/System Administrator/sysAdmin_tokenInvitation"
import { TokenFilters } from "@/components/System Administrator/sysAdmin_tokenInvitation"
import InvitationTable from "@/components/System Administrator/sysAdmin_tokenInvitation/InvitationTable"

// Helper
import { showToast } from "@/util/alertHelper"
import { displayRoles } from "@/util/roleHelper"

const TokenInvitations = () => {
    const { user } = useAuth()
    const [invitations, setInvitations] = useState([])
    const [facilities, setFacilities] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        search: "",
        role: "all",
        status: "all",
        facility: "all",
        dateRange: { from: undefined, to: undefined },
    })

    const [showInvitation, setShowInvitation] = useState(false)

    // Fetch invitations
    const fetchInvitations = async () => {
        try {
            const { data, error } = await supabase
                .from("invite_tokens")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setInvitations(data)
        } catch (error) {
            console.error("Error fetching invitations:", error)
            showToast("error", "Failed to fetch invitations")
        }
    }

    // Fetch facilities for dropdown
    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase
                .from("healthcare_facilities")
                .select("facility_id, facility_name")
                .eq("subscription_status", "active")

            if (error) throw error
            setFacilities(data)
        } catch (error) {
            console.error("Error fetching facilities:", error)
            showToast("error", "Failed to fetch facilities")
        }
    }

    useEffect(() => {
        fetchInvitations()
        fetchFacilities()
    }, [])

    // Create invitation
    const handleCreateInvitation = async formData => {
        setIsLoading(true)
        try {
            const token = console.log("Ey")
            const invitation = {
                ...formData,
                token,
                created_by: user.id,
                created_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from("invite_tokens")
                .insert([invitation])

            if (error) throw error

            showToast("success", "Invitation created successfully!")
            fetchInvitations()
        } catch (error) {
            console.error("Error creating invitation:", error)
            showToast("error", "Failed to create invitation")
        } finally {
            setIsLoading(false)
        }
    }

    // Revoke invitation
    const handleRevokeInvitation = async invId => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from("invite_tokens")
                .update({ revoked_at: new Date().toISOString() })
                .eq("inv_id", invId)

            if (error) throw error

            showToast("success", "Invitation revoked successfully!")
            fetchInvitations()
        } catch (error) {
            console.error("Error revoking invitation:", error)
            showToast("error", "Failed to revoke invitation")
        } finally {
            setIsLoading(false)
        }
    }

    // Filter invitations
    const filteredInvitations = invitations.filter(inv => {
        const matchesSearch = inv.email
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        const matchesRole = filters.role === "all" || inv.role === filters.role
        const matchesFacility =
            filters.facility === "all" || inv.facility_id === filters.facility
        const matchesStatus =
            filters.status === "all" ||
            (() => {
                const now = new Date()
                const expiryDate = new Date(inv.expires_at)
                if (filters.status === "active") {
                    return !inv.revoked_at && expiryDate > now
                }
                if (filters.status === "expired") {
                    return !inv.revoked_at && expiryDate <= now
                }
                if (filters.status === "revoked") {
                    return inv.revoked_at
                }
                return true
            })()

        // Date range filtering
        const matchesDateRange =
            !filters.dateRange.from ||
            !filters.dateRange.to ||
            (new Date(inv.created_at) >= filters.dateRange.from &&
                new Date(inv.created_at) <= filters.dateRange.to)

        return (
            matchesSearch &&
            matchesRole &&
            matchesFacility &&
            matchesStatus &&
            matchesDateRange
        )
    })

    // Export to CSV
    const handleExport = () => {
        const csvContent = [
            ["Email", "Role", "Facility", "Status", "Expires At", "Created At"],
            ...filteredInvitations.map(inv => [
                inv.email,
                inv.role,
                facilities.find(f => f.facility_id === inv.facility_id)
                    ?.facility_name || "N/A",
                inv.revoked_at
                    ? "Revoked"
                    : new Date(inv.expires_at) <= new Date()
                    ? "Expired"
                    : "Active",
                new Date(inv.expires_at).toLocaleString(),
                new Date(inv.created_at).toLocaleString(),
            ]),
        ]
            .map(row => row.join(","))
            .join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invitations-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    const handleReports = () => {
        showToast("info", "Showing reports...")
    }

    return (
        <div className="p-6 px-20 space-y-6">
            <TokenInviteHeader
                onOpenInvite={() => setShowInvitation(true)}
                onExportCSV={handleExport}
                onOpenReports={handleReports}
                onRefresh={fetchInvitations}
            />
            <TokenFilters
                search={search}
                onSearchChange={setSearch}
                roleChange={roleFilter}
                onRoleChange={val => {
                    setRoleFilter(val)
                    setPage(1)
                }}
                statusFilter={statusFilter}
                onStatusChange={val => {
                    setStatusFilter(val)
                    setPage(1)
                }}
                dateRange={dateFilter}
                onDateRangeChange={val => {
                    setDateFilter(val)
                    setPage(1)
                }}
            />
            <InvitationTable
                invitations={filteredInvitations}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onToggleStatus={handleToggleStatus}
                onRevokeInvitation={handleRevokeInvitation}
                onDelete={handleDelete}
            />
        </div>
    )
}

export default TokenInvitations
