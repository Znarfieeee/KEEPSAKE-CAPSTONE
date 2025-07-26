import React, { useEffect, useMemo, useState, lazy, Suspense } from "react"

// Components
import UserRegistryHeader from "../../components/sysAdmin_users/UserRegistryHeader"
import UserFilters from "../../components/sysAdmin_users/UserFilters"
import UserTable from "../../components/sysAdmin_users/UserTable"

// Lazy-loaded components (modals are heavy and used conditionally)
const RegisterUserModal = lazy(() =>
    import("../../components/sysAdmin_users/RegisterUserModal")
)
const UserDetailModal = lazy(() =>
    import("../../components/sysAdmin_users/UserDetailModal")
)
import { useAuth } from "../../context/auth"
import { showToast } from "../../util/alertHelper"
import { getUsers } from "../../api/users"
import Unauthorized from "../../components/Unauthorized"

const UsersRegistry = () => {
    const { user } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [planFilter, setPlanFilter] = useState("")
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals state
    const [showRegister, setShowRegister] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [detailUser, setDetailUser] = useState(null)

    // Helper to normalize facility records coming from API
    const formatUser = raw => ({
        id: raw.user_id,
        email: raw.user_email,
        firstname: raw.user_firstname,
        lastname: raw.user_lastname,
        role: raw.role,
        specialty: raw.specialty,
        plan: raw.plan,
        expiry: raw.subscription_expires,
        // admin: raw.admin || raw.email || "—",
        status: raw.subscription_status === "suspended" ? "inactive" : "active",
        contact: raw.phone_number,
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await getUsers()
                if (res.status === "success") {
                    setUsers(res.data.map(formatUser))
                } else {
                    showToast(
                        "error",
                        res.message || "Failed to load facilities"
                    )
                }
            } catch (err) {
                console.error(err)
                showToast("error", "Failed to load facilities")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Listen for facility-created event from modal to append to list
    useEffect(() => {
        const handler = e => {
            if (e.detail) {
                setUsers(prev => [...prev, formatUser(e.detail)])
            }
        }
        window.addEventListener("user-created", handler)
        return () => window.removeEventListener("user-created", handler)
    }, [])

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = search
                ? [u.name, u.location, u.id].some(field =>
                      field.toLowerCase().includes(search.toLowerCase())
                  )
                : true
            const matchesStatus = statusFilter
                ? u.status === statusFilter
                : true
            const matchesPlan = planFilter ? u.plan === planFilter : true
            const matchesType = typeFilter ? u.type === typeFilter : true
            return matchesSearch && matchesStatus && matchesPlan && matchesType
        })
    }, [users, search, statusFilter, typeFilter, planFilter])

    // Role-based guard
    if (user.role !== "SystemAdmin" && user.role !== "admin") {
        return <Unauthorized />
    }

    const handleView = user => {
        setDetailUser(user)
        setShowDetail(true)
    }

    const handleToggleStatus = user => {
        const updatedStatus =
            user.status === "suspended" ? "active" : "inactive"
        setUsers(prev =>
            prev.map(u =>
                u.id === user.id ? { ...u, status: updatedStatus } : u
            )
        )
        showToast(
            "success",
            `User ${updatedStatus === "active" ? "activated" : "inactive"}`
        )
    }

    const handleAuditLogs = user => {
        // Placeholder – navigate or open logs route
        showToast("info", `Audit logs for ${user.name} not available in demo`)
    }

    const handleDelete = user => {
        if (window.confirm(`Delete user ${user.name}?`)) {
            setUsers(prev => prev.filter(f => f.id !== user.id))
            showToast("success", "User deleted")
        }
    }

    const handleExportCSV = () => {
        const headers = [
            "Full Name",
            "Role",
            "Plan",
            "Subscription Expiry",
            "Assigned Facility",
            "Status",
        ]
        const rows = users.map(u => [
            u.user_firstname + u.user_lastname,
            u.role,
            u.plan,
            u.expiry,
            // u.admin,
            u.status,
        ])
        const csvContent = [headers, ...rows]
            .map(row => row.join(","))
            .join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "users.csv"
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleReports = () => {
        showToast("info", "Reports dashboard coming soon")
    }

    /* ------------------------------------------------------------ */
    return (
        <div className="p-6 px-20 space-y-6">
            <UserRegistryHeader
                onOpenRegister={() => setShowRegister(true)}
                onExportCSV={handleExportCSV}
                onOpenReports={handleReports}
            />

            <UserFilters
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

            <UserTable
                users={filteredUsers}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onToggleStatus={handleToggleStatus}
                onAuditLogs={handleAuditLogs}
                onDelete={handleDelete}
            />

            {/* Modals – lazily loaded */}
            <Suspense fallback={null}>
                {showRegister && (
                    <RegisterUserModal
                        open={showRegister}
                        onClose={() => setShowRegister(false)}
                    />
                )}
                {showDetail && (
                    <UserDetailModal
                        open={showDetail}
                        user={detailUser}
                        onClose={() => setShowDetail(false)}
                        onAuditLogs={handleAuditLogs}
                    />
                )}
            </Suspense>
        </div>
    )
}

export default UsersRegistry
