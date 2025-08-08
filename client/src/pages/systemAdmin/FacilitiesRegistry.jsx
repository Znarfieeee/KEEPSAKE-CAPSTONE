import React, {
    useEffect,
    useMemo,
    useCallback,
    useState,
    lazy,
    Suspense,
} from "react"
import FacilityRegistryHeader from "../../components/sysAdmin_facilities/FacilityRegistryHeader"
import FacilityFilters from "../../components/sysAdmin_facilities/FacilityFilters"
import FacilityTable from "../../components/sysAdmin_facilities/FacilityTable"

// Lazy-loaded components (modals are heavy and used conditionally)
const RegisterFacilityModal = lazy(() =>
    import("../../components/sysAdmin_facilities/RegisterFacilityModal")
)
const FacilityDetailModal = lazy(() =>
    import("../../components/sysAdmin_facilities/FacilityDetailModal")
)
import { useAuth } from "../../context/auth"
import { showToast } from "../../util/alertHelper"
import { useFacilitiesRealtime, supabase } from "../../hook/useSupabaseRealtime"
import Unauthorized from "../../components/Unauthorized"

const FacilitiesRegistry = () => {
    const { user } = useAuth()
    const [facilities, setFacilities] = useState([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [planFilter, setPlanFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals state
    const [showRegister, setShowRegister] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [detailFacility, setDetailFacility] = useState(null)

    // Helper to normalize facility records coming from API
    const formatFacility = useCallback(
        raw => ({
            id: raw.facility_id,
            name: raw.facility_name,
            location: raw.address + ", " + raw.city + ", " + raw.zip_code,
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

    const handleFacilityChange = useCallback(
        ({ type, facility }) => {
            console.log(`Real-time ${type} received:`, facility)

            switch (type) {
                case "INSERT":
                    setFacilities(prev => {
                        const exists = prev.some(f => f.id === facility.id)
                        if (exists) return prev

                        showToast(
                            "success",
                            `New facility "${facility.name}" added`
                        )
                        return [...prev, facility]
                    })
                    break

                case "UPDATE":
                    setFacilities(prev =>
                        prev.map(f =>
                            f.id === facility.id ? { ...facility } : f
                        )
                    )
                    showToast("info", `Facility "${facility.name}" updated!`)

                    if (showDetail && detailFacility?.id === facility.id) {
                        setDetailFacility(facility)
                    }
                    break

                case "DELETE":
                    setFacilities(prev =>
                        prev.filter(f => f.id !== facility.id)
                    )
                    showToast("warning", `Facility "${facility.name}" removed`)

                    if (showDetail && detailFacility?.id === facility.id) {
                        setShowDetail(false)
                        setDetailFacility(null)
                    }
                    break

                default:
                    console.warn("Unknown real-time event type: ", type)
            }
        },
        [showDetail, detailFacility]
    )

    useFacilitiesRealtime({
        onFacilityChange: handleFacilityChange,
    })

    // Initial data load using Supabase directly
    const fetchFacilities = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("healthcare_facilities")
                .select("*")
                .is("deleted_at", null)

            if (error) {
                showToast("error", "Failed to load facilities")
                console.error("Supabase error:", error)
                return
            }

            setFacilities(data.map(formatFacility))
        } catch (error) {
            showToast("error", "Failed to load facilities")
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }, [formatFacility])

    useEffect(() => {
        fetchFacilities()
    }, [fetchFacilities])

    const filteredFacilities = useMemo(() => {
        return facilities.filter(f => {
            const matchesSearch = search
                ? [f.name, f.location, f.id, f.plan, f.contact].some(field =>
                      String(field).toLowerCase().includes(search.toLowerCase())
                  )
                : true
            const matchesStatus =
                statusFilter && statusFilter !== "all"
                    ? f.status === statusFilter.toLowerCase()
                    : true
            const matchesPlan =
                planFilter && planFilter !== "all"
                    ? f.plan === planFilter.toLowerCase()
                    : true
            const matchesType =
                typeFilter && typeFilter !== "all"
                    ? f.type === typeFilter.toLowerCase()
                    : true
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

    const handleGoto = () => {
        alert("Going to facility")
    }

    // Testing purposes && might change to edit facility later
    const handleAuditLogs = facility => {
        // Placeholder – navigate or open logs route
        showToast(
            "info",
            `Audit logs for ${facility.name} not available in demo`
        )
    }

    // Testing purposes
    const handleDelete = facility => {
        if (window.confirm(`Delete facility ${facility.name}?`)) {
            setFacilities(prev => prev.filter(f => f.id !== facility.id))
            showToast("success", "Facility deleted")
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
        <div className="p-6 px-20 space-y-6">
            <FacilityRegistryHeader
                onOpenRegister={() => setShowRegister(true)}
                onExportCSV={handleExportCSV}
                onOpenReports={handleReports}
                onRefresh={fetchFacilities}
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
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onGoto={handleGoto}
                onAuditLogs={handleAuditLogs}
                onDelete={handleDelete}
            />

            {/* Modals – lazily loaded */}
            <Suspense fallback={null}>
                {showRegister && (
                    <RegisterFacilityModal
                        open={showRegister}
                        onClose={() => setShowRegister(false)}
                    />
                )}
                {showDetail && (
                    <FacilityDetailModal
                        open={showDetail}
                        facility={detailFacility}
                        onClose={() => setShowDetail(false)}
                        onAuditLogs={handleAuditLogs}
                    />
                )}
            </Suspense>
        </div>
    )
}

export default FacilitiesRegistry
