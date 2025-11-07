import React, { useState, useEffect, useCallback } from 'react'
import { getAuditLogs, getAuditStats, clearAuditLogs, exportAuditLogs } from '@/api/admin/auditLogs'
import { useAuditLogsRealtime } from '@/hook/useSupabaseRealtime'
import { showToast } from '@/util/alertHelper'

// Components
import { Button } from '@/components/ui/Button'
import AuditStatsCards from '@/components/System Administrator/sysAdmin_auditLogs/AuditStatsCards'
import AuditFilters from '@/components/System Administrator/sysAdmin_auditLogs/AuditFilters'
import AuditLogsTable from '@/components/System Administrator/sysAdmin_auditLogs/AuditLogsTable'
import AuditLogDetailsDialog from '@/components/System Administrator/sysAdmin_auditLogs/AuditLogDetailsDialog'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { TooltipHelper } from '@/util/TooltipHelper'

// Icons
import { RefreshCw, Trash2, Download } from 'lucide-react'

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        total_pages: 0,
    })
    const [filters, setFilters] = useState({
        action_type: '',
        table_name: '',
        user_id: '',
        start_date: '',
        end_date: '',
        search: '',
    })
    const [selectedLog, setSelectedLog] = useState(null)
    const [showDetailDialog, setShowDetailDialog] = useState(false)
    const [showFilters, setShowFilters] = useState(true)
    const [showClearDialog, setShowClearDialog] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    // Fetch audit logs
    const fetchAuditLogs = useCallback(
        async (page = 1) => {
            setLoading(true)
            try {
                const params = {
                    page,
                    limit: pagination.limit,
                    ...filters,
                }

                const response = await getAuditLogs(params)

                // Extract data from axios response
                const responseData = response.data

                if (responseData.status === 'success') {
                    setLogs(Array.isArray(responseData.data) ? responseData.data : [])
                    setPagination({
                        page: responseData.pagination?.page || 1,
                        limit: responseData.pagination?.limit || 50,
                        total: responseData.pagination?.total || 0,
                        total_pages: responseData.pagination?.total_pages || 0,
                    })
                } else {
                    console.error('Response status not success:', responseData)
                }
            } catch (error) {
                console.error('Error fetching audit logs:', error)
                const errorMessage =
                    error.response?.data?.message || error.message || 'Failed to fetch audit logs'
                if (error.response?.status === 401) {
                    showToast('error', 'Session expired. Please log in again.')
                    // You might want to redirect to login here
                } else {
                    showToast('error', errorMessage)
                }
            } finally {
                setLoading(false)
            }
        },
        [filters, pagination.limit]
    )

    // Fetch audit statistics
    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const response = await getAuditStats()
            // The API client already returns response.data
            const responseData = response

            if (responseData.status === 'success') {
                setStats(responseData.data)
            }
        } catch (error) {
            console.error('Error fetching audit stats:', error)
        } finally {
            setStatsLoading(false)
        }
    }, [])

    // Real-time handler
    const handleAuditLogChange = useCallback(
        ({ type, auditLog }) => {
            console.log('Audit log change received:', { type, auditLog })

            switch (type) {
                case 'INSERT':
                    setLogs((prevLogs) => [auditLog, ...prevLogs])
                    fetchStats()
                    break
                case 'UPDATE':
                    setLogs((prevLogs) =>
                        prevLogs.map((log) => (log.log_id === auditLog.log_id ? auditLog : log))
                    )
                    break
                case 'DELETE':
                    setLogs((prevLogs) => prevLogs.filter((log) => log.log_id !== auditLog.log_id))
                    fetchStats()
                    break
                default:
                    break
            }
        },
        [fetchStats]
    )

    // Set up real-time subscription
    useAuditLogsRealtime({ onAuditLogChange: handleAuditLogChange })

    // Initial load
    useEffect(() => {
        fetchAuditLogs(1)
        fetchStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }))
    }

    // Apply filters
    const applyFilters = () => {
        fetchAuditLogs(1)
    }

    // Reset filters
    const resetFilters = () => {
        setFilters({
            action_type: '',
            table_name: '',
            user_id: '',
            start_date: '',
            end_date: '',
            search: '',
        })
        setTimeout(() => fetchAuditLogs(1), 0)
    }

    // View log details
    const viewLogDetails = (log) => {
        setSelectedLog(log)
        setShowDetailDialog(true)
    }

    // Pagination handlers
    const handlePrev = () => fetchAuditLogs(Math.max(1, pagination.page - 1))
    const handleNext = () => fetchAuditLogs(Math.min(pagination.total_pages, pagination.page + 1))

    // Toggle filters
    const toggleFilters = () => setShowFilters(!showFilters)

    // Handle clear all audit logs
    const handleClearLogs = async () => {
        setIsClearing(true)
        try {
            const response = await clearAuditLogs()
            if (response.status === 'success') {
                showToast('success', response.message)
                setLogs([])
                fetchStats()
                setShowClearDialog(false)
            } else {
                showToast('error', response.message || 'Failed to clear audit logs')
            }
        } catch (error) {
            console.error('Error clearing audit logs:', error)
            const errorMessage =
                error.response?.data?.message || error.message || 'Failed to clear audit logs'
            showToast('error', errorMessage)
        } finally {
            setIsClearing(false)
        }
    }

    // Handle export audit logs
    const handleExportLogs = async () => {
        setIsExporting(true)
        try {
            const response = await exportAuditLogs(filters)

            // Create blob and download
            const blob = new Blob([response.data], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // Get filename from content-disposition header or use default
            const contentDisposition = response.headers['content-disposition']
            let filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            showToast('success', 'Audit logs exported successfully')
        } catch (error) {
            console.error('Error exporting audit logs:', error)
            const errorMessage =
                error.response?.data?.message || error.message || 'Failed to export audit logs'
            showToast('error', errorMessage)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Audit Logs</h1>
                <div className="flex gap-2">
                    <TooltipHelper content={isExporting ? 'Exporting...' : 'Export CSV'}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportLogs}
                            disabled={isExporting || logs.length === 0}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </TooltipHelper>
                    <TooltipHelper content="Refresh">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                fetchAuditLogs(pagination.page)
                                fetchStats()
                            }}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </TooltipHelper>
                    <TooltipHelper content="Clear Audit Logs">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowClearDialog(true)}
                            disabled={isClearing || logs.length === 0}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </TooltipHelper>
                </div>
            </div>

            {/* Statistics Cards */}
            <AuditStatsCards stats={stats} statsLoading={statsLoading} />

            {/* Filters */}
            <AuditFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                showFilters={showFilters}
                onToggleFilters={toggleFilters}
            />

            {/* Audit Logs Table */}
            <AuditLogsTable
                logs={logs}
                loading={loading}
                pagination={pagination}
                onViewDetails={viewLogDetails}
                onPreviousPage={handlePrev}
                onNextPage={handleNext}
            />

            {/* Log Details Dialog */}
            <AuditLogDetailsDialog
                log={selectedLog}
                open={showDetailDialog}
                onOpenChange={setShowDetailDialog}
            />

            {/* Clear Logs Confirmation Dialog */}
            <ConfirmationDialog
                open={showClearDialog}
                onOpenChange={setShowClearDialog}
                title="Clear All Audit Logs"
                description="This action cannot be undone. This will permanently delete all audit log entries from the database. You may want to export the logs before clearing them."
                confirmText="clear all logs"
                requireTyping={true}
                destructive={true}
                loading={isClearing}
                onConfirm={handleClearLogs}
            />
        </div>
    )
}

export default AuditLogsPage
