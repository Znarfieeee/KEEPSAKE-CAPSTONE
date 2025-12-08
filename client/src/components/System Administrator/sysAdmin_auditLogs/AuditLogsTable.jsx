import React from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/Card'
import {
    Database,
    Eye,
    Edit,
    Trash2,
    Plus,
    Activity,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/util/utils'
import { AuditLogsTableSkeleton } from './AuditLogsSkeleton'

const AuditLogsTable = ({
    logs,
    loading,
    pagination,
    onViewDetails,
    onPreviousPage,
    onNextPage,
}) => {
    // Get action badge color
    const getActionBadgeColor = (action) => {
        const colors = {
            CREATE: 'bg-green-100 text-green-800 border-green-300',
            UPDATE: 'bg-blue-100 text-blue-800 border-blue-300',
            DELETE: 'bg-red-100 text-red-800 border-red-300',
            VIEW: 'bg-purple-100 text-purple-800 border-purple-300',
        }
        return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300'
    }

    // Get action icon
    const getActionIcon = (action) => {
        const icons = {
            CREATE: Plus,
            UPDATE: Edit,
            DELETE: Trash2,
            VIEW: Eye,
        }
        return icons[action] || Activity
    }

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '—'
        const date = new Date(timestamp)
        return date.toLocaleString()
    }

    // Format relative time
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return '—'
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`

        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`

        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 7) return `${diffDays}d ago`

        return formatTimestamp(timestamp)
    }

    // Show skeleton while loading
    if (loading) {
        return <AuditLogsTableSkeleton rows={pagination.limit || 10} />
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    {logs.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <Database className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">No audit logs found</p>
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                                    <tr className="text-left">
                                        <th className="py-3 px-4">Timestamp</th>
                                        <th className="py-3 px-4">User</th>
                                        <th className="py-3 px-4">Action</th>
                                        <th className="py-3 px-4">Table</th>
                                        <th className="py-3 px-4">IP Address</th>
                                        <th className="py-3 px-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const ActionIcon = getActionIcon(log.action_type)
                                        return (
                                            <tr
                                                key={log.log_id}
                                                className="border-b border-gray-200 last:border-none hover:bg-gray-50"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {formatRelativeTime(
                                                                log.action_timestamp
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatTimestamp(log.action_timestamp)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {log.users?.firstname || 'Unknown'}{' '}
                                                            {log.users?.lastname || 'User'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {log.users?.email || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'flex items-center gap-1 w-fit',
                                                            getActionBadgeColor(log.action_type)
                                                        )}
                                                    >
                                                        <ActionIcon className="w-3 h-3" />
                                                        {log.action_type}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {log.table_name}
                                                    </code>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-mono">
                                                        {log.ip_address || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onViewDetails(log)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="flex justify-between items-center px-4 py-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Showing {logs.length} of {pagination.total} logs
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onPreviousPage}
                                        disabled={pagination.page === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {pagination.page} of {pagination.total_pages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onNextPage}
                                        disabled={pagination.page === pagination.total_pages}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default AuditLogsTable
