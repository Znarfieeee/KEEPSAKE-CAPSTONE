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
import TokenInviteHeader from "@/components/System Administrator/sysAdmin_tokenInvitation/TokenInviteHeader"
import TokenFilters from "@/components/System Administrator/sysAdmin_tokenInvitation/TokenFilters"
import InvitationTable from "@/components/System Administrator/sysAdmin_tokenInvitation/InvitationTable"

// Helper
import { showToast } from "@/util/alertHelper"
import { displayRoles } from "@/util/roleHelper"

const InviteUserModal = lazy(() =>
    import(
        "../../components/System Administrator/sysAdmin_tokenInvitation/InviteUserModal"
    )
)

const TokenInvitations = () => {
    const { user } = useAuth()
    const [invitations, setInvitations] = useState([])
    const [loading, setLoading] = useState(true)
    const [facilities, setFacilities] = useState([])

    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState(null)
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
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
        setLoading(true)
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
            setLoading(false)
        }
    }

    // Revoke invitation
    const handleRevokeInvitation = async invId => {
        setLoading(true)
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
            setLoading(false)
        }
    }

    // Filter invitations
    const filteredInvitations = invitations.filter(inv => {
        const matchesSearch = search
            ? [inv.email, inv.facility, inv.expires, inv.role].some(field =>
                  String(field).toLowerCase().includes(search.toLowerCase())
              )
            : true
        const matchesRole = roleFilter === "all" || inv.role === roleFilter
        const matchesStatus =
            statusFilter === "all" ||
            (() => {
                const now = new Date()
                const expiryDate = new Date(inv.expires_at)
                if (statusFilter === "active") {
                    return !inv.revoked_at && expiryDate > now
                }
                if (statusFilter === "expired") {
                    return !inv.revoked_at && expiryDate <= now
                }
                if (statusFilter === "revoked") {
                    return inv.revoked_at
                }
                return true
            })()

        // Date range filtering
        const matchesDateRange =
            !dateFilter?.from ||
            !dateFilter?.to ||
            (new Date(inv.created_at) >= new Date(dateFilter.from) &&
                new Date(inv.created_at) <= new Date(dateFilter.to))

        return matchesSearch && matchesRole && matchesStatus && matchesDateRange
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

    const handleView = invitation => {
        // Implement view functionality
        console.log("Viewing invitation:", invitation)
    }

    const handleToggleStatus = async invitation => {
        // Implement toggle status functionality
        if (invitation.revoked_at) {
            // If already revoked, can't toggle
            showToast("error", "Cannot modify a revoked invitation")
            return
        }

        try {
            setLoading(true)
            // Implement your toggle status logic here
            showToast("success", "Status updated successfully")
        } catch (error) {
            console.error("Error toggling status:", error)
            showToast("error", "Failed to update status")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async invitation => {
        // Implement delete functionality
        try {
            setLoading(true)
            // Add your delete logic here
            showToast("success", "Invitation deleted successfully")
            await fetchInvitations() // Refresh the list
        } catch (error) {
            console.error("Error deleting invitation:", error)
            showToast("error", "Failed to delete invitation")
        } finally {
            setLoading(false)
        }
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
                roleFilter={roleFilter}
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

            {/* Lazy loaded modals */}
            <Suspense fallback={null}></Suspense>
        </div>
    )
}

export default TokenInvitations
