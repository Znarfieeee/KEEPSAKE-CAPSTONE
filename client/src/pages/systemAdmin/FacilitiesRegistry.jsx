import React, { useEffect, useMemo, useCallback, useState } from 'react'
import { useAuth } from '@/context/auth'
import { useNavigate } from 'react-router-dom'
import { useFacilitiesRealtime } from '@/hook/useSupabaseRealtime'
import { showToast } from '@/util/alertHelper'
import { getFacilities, updateFacility, deactivateFacility } from '@/api/admin/facility'

// UI Components
import FacilityRegistryHeader from '@/components/System Administrator/sysAdmin_facilities/FacilityRegistryHeader'
import FacilityFilters from '@/components/System Administrator/sysAdmin_facilities/FacilityFilters'
import FacilityTable from '@/components/System Administrator/sysAdmin_facilities/FacilityTable'
import EditFacility from '@/components/System Administrator/sysAdmin_facilities/EditFacility'
import Unauthorized from '@/components/Unauthorized'

// Modal Components
import RegisterFacilityModal from '@/components/System Administrator/sysAdmin_facilities/RegisterFacilityModal'
import FacilityDetailModal from '@/components/System Administrator/sysAdmin_facilities/FacilityDetailModal'

const FacilitiesRegistry = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [facilities, setFacilities] = useState([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [planFilter, setPlanFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Modals state
    const [showRegister, setShowRegister] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [detailFacility, setDetailFacility] = useState(null)
    const [editingFacility, setEditingFacility] = useState(null)

    // Helper to normalize facility records coming from API
    const formatFacility = useCallback((raw) => {
        if (!raw) return null

        // Handle different data formats (raw DB vs formatted)
        const id = raw.facility_id || raw.id
        const name = raw.facility_name || raw.name
        const address = raw.address || ''
        const city = raw.city || ''
        const zipCode = raw.zip_code || ''

        // Build location string safely
        const locationParts = [address, city, zipCode].filter((part) => part && part.trim())
        const location = locationParts.length > 0 ? locationParts.join(', ') : '—'

        return {
            id: id,
            name: name || '—',
            location: location,
            type: raw.type || '—',
            plan: raw.plan || 'basic',
            expiry: raw.subscription_expires || raw.expiry || '—',
            admin: raw.admin || raw.email || '—',
            status: raw.subscription_status || raw.status || 'inactive',
            contact: raw.contact_number || raw.contact || '—',
            email: raw.email || '—',
            website: raw.website || '',
        }
    }, [])

    const handleFacilityChange = useCallback(
        ({ type, facility, raw }) => {
            try {
                // Format the facility data consistently - prioritize raw data if available
                let formattedFacility

                if (raw) {
                    // Handle raw database record
                    formattedFacility = formatFacility(raw)
                } else if (facility) {
                    // Handle pre-formatted facility object
                    if (facility.facility_id || facility.id) {
                        // If it looks like raw data but not marked as such
                        formattedFacility = facility.facility_id
                            ? formatFacility(facility)
                            : facility
                    } else {
                        formattedFacility = facility
                    }
                } else {
                    return
                }

                // Ensure facility has required properties
                if (!formattedFacility.id && !formattedFacility.facility_id) {
                    return
                }

                const facilityId = formattedFacility.id || formattedFacility.facility_id

                switch (type) {
                    case 'INSERT':
                        setFacilities((prev) => {
                            const exists = prev.some((f) => f.id === facilityId)
                            if (exists) return prev
                            return [formattedFacility, ...prev]
                        })
                        break

                    case 'UPDATE':
                    case 'PUT':
                        setFacilities((prev) => {
                            const updated = prev.map((f) =>
                                f.id === facilityId ? { ...f, ...formattedFacility } : f
                            )
                            return updated
                        })

                        // Update detail modal if it's showing this facility
                        if (showDetail && detailFacility?.id === facilityId) {
                            setDetailFacility({ ...detailFacility, ...formattedFacility })
                        }

                        // Update editing modal if it's showing this facility
                        if (showEdit && editingFacility?.id === facilityId) {
                            setEditingFacility({ ...editingFacility, ...formattedFacility })
                        }
                        break

                    case 'DELETE':
                        setFacilities((prev) => {
                            const filtered = prev.filter((f) => f.id !== facilityId)
                            return filtered
                        })

                        // Close modals if showing deleted facility
                        if (showDetail && detailFacility?.id === facilityId) {
                            setShowDetail(false)
                            setDetailFacility(null)
                        }
                        if (showEdit && editingFacility?.id === facilityId) {
                            setShowEdit(false)
                            setEditingFacility(null)
                        }
                        break

                    default:
                        break
                }
            } catch {
                // Silent fail for real-time updates
            }
        },
        [formatFacility, showDetail, detailFacility, showEdit, editingFacility]
    )

    useFacilitiesRealtime({
        onFacilityChange: handleFacilityChange,
    })

    // Initial data load using Flask API
    const fetchFacilities = useCallback(async () => {
        try {
            setLoading(true)
            const response = await getFacilities({ bust_cache: false })

            if (response && response.status === 'success' && response.data) {
                const formattedFacilities = response.data.map(formatFacility)
                setFacilities(formattedFacilities)
            } else {
                showToast('error', 'Failed to load facilities')
            }
        } catch {
            showToast('error', 'Failed to load facilities')
        } finally {
            setLoading(false)
        }
    }, [formatFacility])

    useEffect(() => {
        fetchFacilities()
    }, [fetchFacilities])

    // Listen for facility creation and deletion events
    useEffect(() => {
        const handleFacilityCreated = (event) => {
            const newFacility = formatFacility(event.detail)
            setFacilities((prev) => {
                const exists = prev.some((f) => f.id === newFacility.id)
                if (exists) return prev
                return [newFacility, ...prev]
            })
        }

        const handleFacilityDeleted = (event) => {
            const { id, name } = event.detail
            setFacilities((prev) => prev.filter((f) => f.id !== id))
            showToast('info', `Facility "${name}" has been deactivated`)

            // Close modals if they're showing the deleted facility
            if (showDetail && detailFacility?.id === id) {
                setShowDetail(false)
                setDetailFacility(null)
            }
            if (showEdit && editingFacility?.id === id) {
                setShowEdit(false)
                setEditingFacility(null)
            }
        }

        window.addEventListener('facility-created', handleFacilityCreated)
        window.addEventListener('facility-deleted', handleFacilityDeleted)

        return () => {
            window.removeEventListener('facility-created', handleFacilityCreated)
            window.removeEventListener('facility-deleted', handleFacilityDeleted)
        }
    }, [formatFacility, showDetail, detailFacility, showEdit, editingFacility])

    const filteredFacilities = useMemo(() => {
        return facilities.filter((f) => {
            const matchesSearch = search
                ? [f.name, f.location, f.id, f.plan, f.contact].some((field) =>
                      String(field).toLowerCase().includes(search.toLowerCase())
                  )
                : true
            const matchesStatus =
                statusFilter && statusFilter !== 'all'
                    ? f.status === statusFilter.toLowerCase()
                    : true
            const matchesPlan =
                planFilter && planFilter !== 'all' ? f.plan === planFilter.toLowerCase() : true
            const matchesType =
                typeFilter && typeFilter !== 'all' ? f.type === typeFilter.toLowerCase() : true
            return matchesSearch && matchesStatus && matchesPlan && matchesType
        })
    }, [facilities, search, statusFilter, typeFilter, planFilter])

    // Role-based guard
    if (user.role !== 'SystemAdmin' && user.role !== 'admin') {
        return <Unauthorized />
    }

    const handleView = (facility) => {
        setDetailFacility(facility)
        setShowDetail(true)
    }

    const handleEditFacility = (facility) => {
        setEditingFacility(facility)
        setShowEdit(true)
    }

    const handleUpdateFacility = async (facility) => {
        try {
            const response = await updateFacility(facility)

            if (!response || response.error) {
                showToast('error', response?.error || 'Failed to update facility. Try again.')
                return
            }

            showToast('success', 'Facility updated successfully.')
            setShowEdit(false)

            // Refresh facilities list to ensure consistency
            await fetchFacilities()
        } catch {
            showToast('error', 'Failed to update facility. Please try again.')
        }
    }

    const handleDelete = async (facility) => {
        try {
            const response = await deactivateFacility(facility.id)

            if (response && response.status === 'success') {
                showToast('success', 'Facility deleted successfully!')

                // The real-time subscription should handle the UI update,
                // but we can also dispatch a custom event for immediate feedback
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('facility-deleted', {
                            detail: { id: facility.id, name: facility.name },
                        })
                    )
                }
            } else {
                throw new Error(response?.message || 'Failed to delete facility')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to delete facility. Please try again.')
            throw error // Re-throw to let FacilityTable handle loading states
        }
    }

    const handleExportCSV = () => {
        const headers = [
            'Facility Name',
            'ID',
            'Location',
            'Type',
            'Plan',
            'Subscription Expiry',
            'Admin',
            'Status',
        ]
        const rows = facilities.map((f) => [
            f.name,
            f.id,
            f.location,
            f.type,
            f.plan,
            f.expiry,
            f.admin,
            f.status,
        ])
        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'facilities.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleReports = () => {
        showToast('info', 'Reports dashboard coming soon')
    }

    const handleGoto = (facility) => {
        // Navigate to facility users page with facility filter
        navigate(`/admin/facility-users?facility=${facility.id}`)
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
                onStatusChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                }}
                typeFilter={typeFilter}
                onTypeChange={(val) => {
                    setTypeFilter(val)
                    setPage(1)
                }}
                planFilter={planFilter}
                onPlanChange={(val) => {
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
                onEdit={handleEditFacility}
                onDelete={handleDelete}
            />

            {/* Modals */}
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
                    onEdit={handleEditFacility}
                />
            )}
            {showEdit && (
                <EditFacility
                    open={showEdit}
                    facility={editingFacility}
                    onSave={handleUpdateFacility}
                    onClose={() => setShowEdit(false)}
                    onUpdate={handleUpdateFacility}
                />
            )}
        </div>
    )
}

export default FacilitiesRegistry
