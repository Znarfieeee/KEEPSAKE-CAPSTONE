import React, {
    useEffect,
    useMemo,
    useState,
    lazy,
    Suspense,
    useCallback,
} from "react"
import { useAuth } from "../../context/auth"
import { getUsers, getUserById } from "../../api/admin/users"

// Components
import UserRegistryHeader from "../../components/sysAdmin_users/UserRegistryHeader"
import UserFilters from "../../components/sysAdmin_users/UserFilters"
import UserTable from "../../components/sysAdmin_users/UserTable"
import Unauthorized from "../../components/Unauthorized"

// Helper
import { showToast } from "../../util/alertHelper"
import { displayRoles } from "../../util/roleHelper"
import { subscribeToUserManagement } from "../../util/sbRealtime"

// Lazy-loaded components (modals are heavy and used conditionally)
const RegisterUserModal = lazy(() =>
    import("../../components/sysAdmin_users/RegisterUserModal")
)
const UserDetailModal = lazy(() =>
    import("../../components/sysAdmin_users/UserDetailModal")
)

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

    // Helper to normalize user records coming from API
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
            created_at: new Date(raw.created_at).toLocaleDateString(),
            updated_at: raw.updated_at
                ? new Date(raw.updated_at).toLocaleDateString()
                : "—",
            // Enhanced facility information handling
            assigned_facility:
                raw.facility_assignment?.facility_name ||
                raw.facility_users?.[0]?.healthcare_facilities?.facility_name ||
                "Not Assigned",
            facility_role: displayRoles(
                raw.facility_assignment?.facility_role ||
                    raw.facility_users?.[0]?.role ||
                    ""
            ),
            facility_id:
                raw.facility_assignment?.facility_id ||
                raw.facility_users?.[0]?.healthcare_facilities?.id ||
                null,
        }),
        []
    )

    const updateSpecificUser = useCallback(
        async userId => {
            try {
                const res = await getUserById(userId)
                if (res.status === "success") {
                    const updatedUserData = formatUser(res.data)
                    setUsers(prev =>
                        prev.map(u => (u.id === userId ? updatedUserData : u))
                    )
                    return updatedUserData
                }
            } catch (err) {
                console.error("Failed to fetch updated user data:", err)
                return null
            }
        },
        [formatUser]
    )

    const updateUserFacilityInfo = useCallback((userId, facilityInfo) => {
        setUsers(prev =>
            prev.map(u =>
                u.id === userId
                    ? {
                          ...u,
                          assigned_facility:
                              facilityInfo.facility_name || "Not Assigned",
                          facility_role: facilityInfo.facility_role || "—",
                          facility_id: facilityInfo.facility_id || null,
                      }
                    : u
            )
        )
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await getUsers()
                if (res.status === "success") {
                    setUsers(res.data.map(formatUser))
                } else {
                    showToast("error", res.message || "Failed to load users")
                }
            } catch (err) {
                console.error(err)
                showToast("error", "Failed to load users")
            } finally {
                setLoading(false)
            }
        }
        fetchData()

        // Use the enhanced realtime utility with specific handlers
        const unsubscribeRealtime = subscribeToUserManagement({
            // Handle users table changes
            onUserChange: payload => {
                console.log("Users table change:", payload)

                if (payload.eventType === "INSERT") {
                    // For new users, fetch complete data including facility info
                    updateSpecificUser(payload.new.user_id)
                } else if (payload.eventType === "UPDATE") {
                    // Update user data but preserve facility info if not included
                    setUsers(prev =>
                        prev.map(u => {
                            if (u.id === payload.new.user_id) {
                                const updatedUser = formatUser(payload.new)
                                // Preserve existing facility info if new data doesn't have it
                                return {
                                    ...updatedUser,
                                    assigned_facility:
                                        payload.new.facility_assignment
                                            ?.facility_name ||
                                        u.assigned_facility,
                                    facility_role:
                                        payload.new.facility_assignment
                                            ?.facility_role || u.facility_role,
                                    facility_id:
                                        payload.new.facility_assignment
                                            ?.facility_id || u.facility_id,
                                }
                            }
                            return u
                        })
                    )
                } else if (payload.eventType === "DELETE") {
                    setUsers(prev =>
                        prev.filter(u => u.id !== payload.old.user_id)
                    )
                }
            },

            // Handle facility_users table changes
            onFacilityUserChange: payload => {
                console.log("Facility users table change:", payload)

                const userId = payload.new?.user_id || payload.old?.user_id

                if (payload.eventType === "INSERT") {
                    // User assigned to facility - fetch fresh data to get facility details
                    updateSpecificUser(userId)
                } else if (payload.eventType === "UPDATE") {
                    // Facility assignment updated - fetch fresh data
                    updateSpecificUser(userId)
                } else if (payload.eventType === "DELETE") {
                    // User unassigned from facility - reset facility fields
                    updateUserFacilityInfo(userId, {
                        facility_name: "Not Assigned",
                        facility_role: "—",
                        facility_id: null,
                    })
                }
            },

            // Handle healthcare_facilities table changes (if facility names change)
            onFacilityChange: payload => {
                console.log("Healthcare facilities table change:", payload)

                if (payload.eventType === "UPDATE") {
                    const facilityId = payload.new.id
                    const newFacilityName = payload.new.facility_name
                    const oldFacilityName = payload.old.facility_name

                    // Update all users assigned to this facility
                    setUsers(prev =>
                        prev.map(u => {
                            if (
                                u.facility_id === facilityId ||
                                u.assigned_facility === oldFacilityName
                            ) {
                                return {
                                    ...u,
                                    assigned_facility: newFacilityName,
                                }
                            }
                            return u
                        })
                    )
                }
            },
        })

        return () => {
            unsubscribeRealtime()
        }
    }, [formatUser, updateSpecificUser, updateUserFacilityInfo])

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
                ? [
                      u.firstname,
                      u.lastname,
                      u.email,
                      u.specialty,
                      u.assigned_facility,
                  ].some(field =>
                      String(field).toLowerCase().includes(search.toLowerCase())
                  )
                : true
            const matchesStatus = statusFilter
                ? u.status === statusFilter
                : true
            const matchesType = typeFilter
                ? u.role.toLowerCase() === typeFilter.toLowerCase()
                : true
            return matchesSearch && matchesStatus && matchesType
        })
    }, [users, search, statusFilter, typeFilter])

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
            "Email",
            "Role",
            "Specialty",
            "License Number",
            "Contact",
            "Status",
            "Assigned Facility",
            "Facility Role",
            "Created At",
            "Last Updated",
        ]
        const rows = users.map(u => [
            `${u.firstname} ${u.lastname}`,
            u.email,
            u.role,
            u.specialty,
            u.license_number,
            u.contact,
            u.status,
            u.assigned_facility,
            u.facility_role,
            u.created_at,
            u.updated_at,
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
