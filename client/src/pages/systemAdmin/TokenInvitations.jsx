import React, { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select"
import { Button } from "../../components/ui/Button"
import { Download } from "lucide-react"
import InvitationForm from "../../components/sysAdmin_tokenInvitation/InvitationForm"
import InvitationTable from "../../components/sysAdmin_tokenInvitation/InvitationTable"
import { showToast } from "../../util/alertHelper"
import { supabase } from "../../lib/supabaseClient"
import { useAuth } from "../../context/auth"
// import { v4 as uuidv4 } from "uuid"

const TokenInvitations = () => {
    const [invitations, setInvitations] = useState([])
    const [facilities, setFacilities] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [filters, setFilters] = useState({
        search: "",
        role: "all",
        status: "all",
        facility: "all",
    })
    const { user } = useAuth()

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

        return matchesSearch && matchesRole && matchesFacility && matchesStatus
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

    return (
        <div className="container mx-auto py-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Token Invitations</CardTitle>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                        <InvitationForm
                            facilities={facilities}
                            onCreateInvitation={handleCreateInvitation}
                            isLoading={isLoading}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-wrap gap-4">
                        <Input
                            placeholder="Search by email..."
                            value={filters.search}
                            onChange={e =>
                                setFilters(prev => ({
                                    ...prev,
                                    search: e.target.value,
                                }))
                            }
                            className="max-w-xs"
                        />
                        <Select
                            value={filters.role}
                            onValueChange={value =>
                                setFilters(prev => ({ ...prev, role: value }))
                            }>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="facility_admin">
                                    Facility Admin
                                </SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.status}
                            onValueChange={value =>
                                setFilters(prev => ({ ...prev, status: value }))
                            }>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="revoked">Revoked</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.facility}
                            onValueChange={value =>
                                setFilters(prev => ({
                                    ...prev,
                                    facility: value,
                                }))
                            }>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by facility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Facilities
                                </SelectItem>
                                {facilities.map(facility => (
                                    <SelectItem
                                        key={facility.facility_id}
                                        value={facility.facility_id}>
                                        {facility.facility_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <InvitationTable
                        invitations={filteredInvitations}
                        facilities={facilities}
                        onRevokeInvitation={handleRevokeInvitation}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default TokenInvitations
