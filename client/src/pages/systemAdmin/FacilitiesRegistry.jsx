import React, { useEffect, useMemo, useState } from "react"
import FacilityRegistryHeader from "../../components/facilities/FacilityRegistryHeader"
import FacilityFilters from "../../components/facilities/FacilityFilters"
import FacilityTable from "../../components/facilities/FacilityTable"
import RegisterFacilityModal from "../../components/facilities/RegisterFacilityModal"
import FacilityDetailModal from "../../components/facilities/FacilityDetailModal"
import { useAuth } from "../../context/auth"
import { showToast } from "../../util/alertHelper"
import { getFacilities, createFacility } from "../../api/facility"
import Unauthorized from "../../components/Unauthorized"

const FacilitiesRegistry = () => {
    const { user } = useAuth()
    const [facilities, setFacilities] = useState([])

    // UI state
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [planFilter, setPlanFilter] = useState("")
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals
    const [showRegister, setShowRegister] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [detailFacility, setDetailFacility] = useState(null)

    // Helper to normalize facility records coming from API
    const formatFacility = raw => ({
        id: raw.facility_id,
        name: raw.facility_name,
        location: raw.address + ", " + raw.city + ", " + raw.zip_code,
        type: raw.type,
        plan: raw.plan,
        expiry: raw.subscription_expires,
        admin: raw.admin || raw.email || "—",
        status:
            raw.subscription_status === "suspended" ? "suspended" : "active",
        contact: raw.contact_number,
        email: raw.email,
        website: raw.website,
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getFacilities()
                if (res.status === "success") {
                    setFacilities(res.data.map(formatFacility))
                } else {
                    showToast(
                        "error",
                        res.message || "Failed to load facilities"
                    )
                }
            } catch (err) {
                console.error(err)
                showToast("error", "Failed to load facilities")
            }
        }
        fetchData()
    }, [])

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
            const matchesPlan = planFilter ? f.plan === planFilter : true
            const matchesType = typeFilter ? f.type === typeFilter : true
            return matchesSearch && matchesStatus && matchesPlan && matchesType
        })
    }, [facilities, search, statusFilter, typeFilter, planFilter])

    // Role-based guard
    if (user.role !== "SystemAdmin" && user.role !== "admin") {
        return <Unauthorized />
    }

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

    const handleRegisterSubmit = async newFacility => {
        try {
            const res = await createFacility({
                facility_name: newFacility.name,
                contact_number: newFacility.contact,
                email: newFacility.adminEmail,
                subscription_status: newFacility.plan,
                subscription_expires: newFacility.expiry,
                // Provide placeholders for now – these fields are NOT NULL in DB
                address: newFacility.address || "N/A",
                city: newFacility.city || "N/A",
                zip_code: newFacility.zip_code || "N/A",
            })

            if (res.status === "success") {
                setFacilities(prev => [...prev, formatFacility(res.data)])
                showToast("success", "Facility registered")
            } else {
                showToast("error", res.message || "Failed to register facility")
            }
        } catch (err) {
            console.error(err)
            showToast("error", "Failed to register facility")
        }
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
                planFilter={planFilter}
                onPlanChange={val => {
                    setPlanFilter(val)
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
