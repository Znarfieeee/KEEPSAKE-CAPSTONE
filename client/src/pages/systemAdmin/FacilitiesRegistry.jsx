import React, { useEffect, useMemo, useState } from "react"
import FacilityRegistryHeader from "../../components/facilities/FacilityRegistryHeader"
import FacilityFilters from "../../components/facilities/FacilityFilters"
import FacilityTable from "../../components/facilities/FacilityTable"
import RegisterFacilityModal from "../../components/facilities/RegisterFacilityModal"
import FacilityDetailModal from "../../components/facilities/FacilityDetailModal"
import { useAuth } from "../../context/auth"
import { showToast } from "../../util/alertHelper"

// Placeholder data – replace with Supabase fetch
const dummyFacilities = [
    {
        id: "FAC-001",
        name: "St. Mary's Hospital",
        location: "Cebu City",
        type: "hospital",
        plan: "premium",
        expiry: "2025-12-31",
        admin: "chad@maryhospital.com",
        status: "active",
        contact: "(032) 555-1234",
    },
    {
        id: "FAC-002",
        name: "HealthFirst Clinic",
        location: "Makati",
        type: "clinic",
        plan: "standard",
        expiry: "2024-03-15",
        admin: "rolly@healthfirstclinic.com",
        status: "pending",
        contact: "(02) 888-5678",
    },
    {
        id: "FAC-003",
        name: "Sunrise BHS",
        location: "Davao",
        type: "bhs",
        plan: "enterprise",
        expiry: "2026-01-10",
        admin: "eldrin@sunrisebhs.com",
        status: "suspended",
        contact: "(082) 333-9999",
    },
]

const FacilitiesRegistry = () => {
    const { role } = useAuth()
    const [facilities, setFacilities] = useState([])

    // UI state
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals
    const [showRegister, setShowRegister] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [detailFacility, setDetailFacility] = useState(null)

    /* ------------------------------------------------------------
     * Fetch facilities – using dummy for now
     * ----------------------------------------------------------*/
    useEffect(() => {
        // Replace with Supabase fetch
        setFacilities(dummyFacilities)
    }, [])

    /* ------------------------------------------------------------
     * Filter & search logic (memoised)
     * ----------------------------------------------------------*/
    const filteredFacilities = useMemo(() => {
        return facilities.filter(f => {
            const matchesSearch = search
                ? [f.name, f.location, f.id].some(field =>
                      field.toLowerCase().includes(search.toLowerCase())
                  )
                : true
            const matchesStatus = statusFilter
                ? f.status === statusFilter
                : true
            const matchesType = typeFilter ? f.type === typeFilter : true
            return matchesSearch && matchesStatus && matchesType
        })
    }, [facilities, search, statusFilter, typeFilter])

    // Role-based guard
    if (role !== "SystemAdmin" && role !== "admin") {
        return (
            <div className="p-6 text-red-600 dark:text-red-400">
                You are not authorized to view this page.
            </div>
        )
    }

    /* ------------------------------------------------------------
     * Action handlers
     * ----------------------------------------------------------*/
    const handleView = facility => {
        setDetailFacility(facility)
        setShowDetail(true)
    }

    const handleToggleStatus = facility => {
        const updatedStatus =
            facility.status === "suspended" ? "active" : "suspended"
        setFacilities(prev =>
            prev.map(f =>
                f.id === facility.id ? { ...f, status: updatedStatus } : f
            )
        )
        showToast(
            "success",
            `Facility ${updatedStatus === "active" ? "activated" : "suspended"}`
        )
    }

    const handleAuditLogs = facility => {
        // Placeholder – navigate or open logs route
        showToast(
            "info",
            `Audit logs for ${facility.name} not available in demo`
        )
    }

    const handleDelete = facility => {
        if (window.confirm(`Delete facility ${facility.name}?`)) {
            setFacilities(prev => prev.filter(f => f.id !== facility.id))
            showToast("success", "Facility deleted")
        }
    }

    const handleRegisterSubmit = newFacility => {
        const newEntry = {
            ...newFacility,
            id: `FAC-${String(facilities.length + 1).padStart(3, "0")}`,
            location: "—",
            status: "pending",
        }
        setFacilities(prev => [...prev, newEntry])
    }

    const handleExportCSV = () => {
        const headers = [
            "Facility Name",
            "ID",
            "Location",
            "Type",
            "Plan",
            "Subscription Expiry",
            "Admin",
            "Status",
        ]
        const rows = facilities.map(f => [
            f.name,
            f.id,
            f.location,
            f.type,
            f.plan,
            f.expiry,
            f.admin,
            f.status,
        ])
        const csvContent = [headers, ...rows]
            .map(row => row.join(","))
            .join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "facilities.csv"
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleReports = () => {
        showToast("info", "Reports dashboard coming soon")
    }

    /* ------------------------------------------------------------ */
    return (
        <div className="p-6 space-y-6">
            <FacilityRegistryHeader
                onOpenRegister={() => setShowRegister(true)}
                onExportCSV={handleExportCSV}
                onOpenReports={handleReports}
            />

            <FacilityFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={val => {
                    setStatusFilter(val)
                    setPage(1)
                }}
                typeFilter={typeFilter}
                onTypeChange={val => {
                    setTypeFilter(val)
                    setPage(1)
                }}
            />

            <FacilityTable
                facilities={filteredFacilities}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onToggleStatus={handleToggleStatus}
                onAuditLogs={handleAuditLogs}
                onDelete={handleDelete}
            />

            {/* Modals */}
            <RegisterFacilityModal
                open={showRegister}
                onClose={() => setShowRegister(false)}
                onSubmit={handleRegisterSubmit}
            />
            <FacilityDetailModal
                open={showDetail}
                facility={detailFacility}
                onClose={() => setShowDetail(false)}
                onAuditLogs={handleAuditLogs}
            />
        </div>
    )
}

export default FacilitiesRegistry
