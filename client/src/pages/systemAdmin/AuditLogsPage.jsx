import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    getAuditLogs,
    getAuditStats,
    clearAuditLogs,
    exportAuditLogs,
    getAuditedTables,
} from '@/api/admin/auditLogs'
import { useAuditLogsRealtime } from '@/hook/useSupabaseRealtime'

// Components
import { Button } from '@/components/ui/Button'
import AuditStatsCards from '@/components/System Administrator/sysAdmin_auditLogs/AuditStatsCards'
import AuditFilters from '@/components/System Administrator/sysAdmin_auditLogs/AuditFilters'
import AuditLogsTable from '@/components/System Administrator/sysAdmin_auditLogs/AuditLogsTable'
import AuditLogDetailsDialog from '@/components/System Administrator/sysAdmin_auditLogs/AuditLogDetailsDialog'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { TooltipHelper } from '@/util/TooltipHelper'
import { AuditLogsPageSkeleton } from '@/components/System Administrator/sysAdmin_auditLogs/AuditLogsSkeleton'

import { showToast } from '@/util/alertHelper'

// Icons
import { RefreshCw, Trash2, Download, AlertCircle } from 'lucide-react'

// Debounce utility
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * AuditLogsPage Component
 *
 * Key implementation details to prevent race conditions:
 * 1. Uses isInitialMount ref to prevent debounced search effect from triggering on first render
 * 2. Initial load explicitly passes empty string for search to avoid dependency issues
 * 3. Abort controllers cancel previous requests to prevent stale data
 * 4. Real-time updates use optimistic state updates instead of refetching
 */
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
    const [retryCount, setRetryCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState(null)
    const [initialLoading, setInitialLoading] = useState(true)
    const [tablesList, setTablesList] = useState([])
    const isInitialMount = useRef(true)

    // Refs for abort controllers
    const logsAbortController = useRef(null)
    const statsAbortController = useRef(null)
    const exportAbortController = useRef(null)

    // Debounced search
    const debouncedSearch = useDebounce(filters.search, 500)

    // Cleanup abort controllers on unmount
    useEffect(() => {
        return () => {
            logsAbortController.current?.abort()
            statsAbortController.current?.abort()
            exportAbortController.current?.abort()
        }
    }, [])

    // Fetch audit logs with retry logic and request cancellation
    const fetchAuditLogs = useCallback(
        async (page = 1, shouldRetry = true, customSearch = null) => {
            // Cancel any ongoing request
            logsAbortController.current?.abort()
            logsAbortController.current = new AbortController()

            setLoading(true)
            setErrorMessage(null)

            try {
                const params = {
                    page,
                    limit: pagination.limit,
                    ...filters,
                    search: customSearch !== null ? customSearch : debouncedSearch, // Use debounced search
                }

                const response = await getAuditLogs(params, logsAbortController.current.signal)

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
                    setRetryCount(0) // Reset retry count on success
                } else {
                    console.error('Response status not success:', responseData)
                    setErrorMessage(responseData.message || 'Failed to fetch audit logs')
                }
            } catch (error) {
                // Ignore abort errors
                if (error.name === 'AbortError' || error.name === 'CanceledError') {
                    console.log('Request was cancelled')
                    return
                }

                console.error('Error fetching audit logs:', error)
                const errorMsg =
                    error.response?.data?.message || error.message || 'Failed to fetch audit logs'

                // Handle specific error cases
                if (error.response?.status === 401) {
                    showToast('error', 'Session expired. Please log in again.')
                    setErrorMessage('Session expired. Please refresh the page and log in again.')
                } else if (error.response?.status === 403) {
                    showToast('error', 'You do not have permission to access audit logs.')
                    setErrorMessage('Access denied. Please contact your administrator.')
                } else if (error.response?.status >= 500) {
                    setErrorMessage('Server error. Retrying...')
                    // Retry logic for server errors
                    if (shouldRetry && retryCount < 3) {
                        setRetryCount((prev) => prev + 1)
                        setTimeout(() => {
                            fetchAuditLogs(page, true, customSearch)
                        }, 1000 * (retryCount + 1)) // Exponential backoff
                    } else {
                        showToast('error', 'Failed to fetch audit logs after multiple attempts.')
                    }
                } else {
                    showToast('error', errorMsg)
                    setErrorMessage(errorMsg)
                }
            } finally {
                setLoading(false)
            }
        },
        [filters, pagination.limit, debouncedSearch, retryCount]
    )

    // Fetch audit statistics with request cancellation
    const fetchStats = useCallback(async () => {
        // Cancel any ongoing request
        statsAbortController.current?.abort()
        statsAbortController.current = new AbortController()

        setStatsLoading(true)
        try {
            const responseData = await getAuditStats(statsAbortController.current.signal)

            if (responseData.status === 'success') {
                setStats(responseData.data)
            }
        } catch (error) {
            // Ignore abort errors
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('Stats request was cancelled')
                return
            }
            console.error('Error fetching audit stats:', error)
        } finally {
            setStatsLoading(false)
        }
    }, [])

    // Fetch list of audited tables
    const fetchTablesList = useCallback(async () => {
        try {
            const responseData = await getAuditedTables()
            if (responseData.status === 'success') {
                setTablesList(responseData.data || [])
            }
        } catch (error) {
            console.error('Error fetching tables list:', error)
            // Fail silently - not critical for functionality
        }
    }, [])

    // Real-time handler - updates local state without refetching
    const handleAuditLogChange = useCallback(
        ({ type, auditLog }) => {
            console.log('Audit log change received:', { type, auditLog })

            switch (type) {
                case 'INSERT':
                    setLogs((prevLogs) => [auditLog, ...prevLogs])
                    // Update stats optimistically
                    setStats((prevStats) => {
                        if (!prevStats) return prevStats
                        return {
                            ...prevStats,
                            total_logs: (prevStats.total_logs || 0) + 1
                        }
                    })
                    break
                case 'UPDATE':
                    setLogs((prevLogs) =>
                        prevLogs.map((log) => (log.log_id === auditLog.log_id ? auditLog : log))
                    )
                    break
                case 'DELETE':
                    setLogs((prevLogs) => prevLogs.filter((log) => log.log_id !== auditLog.log_id))
                    // Update stats optimistically
                    setStats((prevStats) => {
                        if (!prevStats) return prevStats
                        return {
                            ...prevStats,
                            total_logs: Math.max(0, (prevStats.total_logs || 0) - 1)
                        }
                    })
                    break
                default:
                    break
            }
        },
        []
    )

    // Set up real-time subscription
    useAuditLogsRealtime({ onAuditLogChange: handleAuditLogChange })

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            setInitialLoading(true)
            try {
                await Promise.all([
                    fetchAuditLogs(1, true, ''), // Pass empty string explicitly for initial load
                    fetchStats(),
                    fetchTablesList()
                ])
            } catch (error) {
                console.error('Error during initial load:', error)
            } finally {
                setInitialLoading(false)
                // Mark that initial mount is complete
                isInitialMount.current = false
            }
        }
        loadInitialData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Refetch when debounced search changes (but not on initial mount)
    useEffect(() => {
        // Skip on initial mount to prevent race condition with initial load
        if (isInitialMount.current) {
            return
        }

        // Only fetch if debounced search has actually changed
        fetchAuditLogs(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch])

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

    // Handle clear all audit logs with automatic export backup
    const handleClearLogs = async () => {
        setIsClearing(true)
        try {
            // First, export the logs as a backup
            showToast('info', 'Creating backup before clearing...')

            try {
                exportAbortController.current?.abort()
                exportAbortController.current = new AbortController()

                const exportResponse = await exportAuditLogs(filters, exportAbortController.current.signal)

                // Create blob and download backup
                const blob = new Blob([exportResponse.data], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute(
                    'download',
                    `audit_logs_backup_${new Date().toISOString().split('T')[0]}.csv`
                )
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)

                showToast('success', 'Backup created successfully')
            } catch (exportError) {
                if (exportError.name !== 'AbortError' && exportError.name !== 'CanceledError') {
                    console.error('Error creating backup:', exportError)
                    showToast(
                        'warning',
                        'Could not create backup, but will proceed with clearing. Please export manually if needed.'
                    )
                }
            }

            // Wait a moment for the backup to complete
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Now clear the logs
            const response = await clearAuditLogs()
            if (response.status === 'success') {
                showToast('success', response.message || 'Audit logs cleared successfully')
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
            // Cancel any ongoing export request
            exportAbortController.current?.abort()
            exportAbortController.current = new AbortController()

            const response = await exportAuditLogs(filters, exportAbortController.current.signal)

            // Validate response
            if (!response || !response.data) {
                throw new Error('Invalid response from server')
            }

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
            // Ignore abort errors
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('Export was cancelled')
                return
            }

            console.error('Error exporting audit logs:', error)
            const errorMessage =
                error.response?.data?.message || error.message || 'Failed to export audit logs'
            showToast('error', errorMessage)
        } finally {
            setIsExporting(false)
        }
    }

    // Show full page skeleton on initial load
    if (initialLoading) {
        return <AuditLogsPageSkeleton />
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Audit Logs</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track all system activities and changes
                    </p>
                </div>
                <div className="flex gap-2">
                    <TooltipHelper content={isExporting ? 'Exporting...' : 'Export to CSV'}>
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
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </TooltipHelper>
                    <TooltipHelper content="Clear All Logs (Creates backup first)">
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

            {/* Error Message Banner */}
            {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setErrorMessage(null)
                            fetchAuditLogs(pagination.page)
                        }}
                    >
                        Retry
                    </Button>
                </div>
            )}

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
                tablesList={tablesList}
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
                description="This action cannot be undone. A backup CSV file will be automatically downloaded before clearing. This will permanently delete all audit log entries from the database."
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
