import React, { useState, useEffect, useCallback } from 'react'
import { Search, Mail, AlertCircle } from 'lucide-react'
import { getEmailNotifications } from '@/api/admin/subscription'
import { Badge } from '@/components/ui/badge'
import { useEmailNotificationsRealtime } from '@/hook/useSubscriptionRealtime'

const StatusBadge = ({ status }) => {
    const styles = {
        queued: 'bg-blue-100 text-blue-800 border-blue-300',
        sent: 'bg-green-100 text-green-800 border-green-300',
        failed: 'bg-red-100 text-red-800 border-red-300',
        bounced: 'bg-orange-100 text-orange-800 border-orange-300',
    }

    return (
        <Badge
            variant="outline"
            className={`capitalize px-2 py-0.5 border border-gray-200 ${
                styles[status] || styles.queued
            }`}
        >
            {status}
        </Badge>
    )
}

const EmailNotifications = () => {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)

    useEffect(() => {
        fetchNotifications()
    }, [typeFilter, statusFilter])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            setError(null) // Clear previous errors
            console.log('[EmailNotifications] Fetching notifications with filters:', { typeFilter, statusFilter })
            const response = await getEmailNotifications({
                type: typeFilter !== 'all' ? typeFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                page,
                per_page: itemsPerPage,
            })

            console.log('[EmailNotifications] API Response:', response)
            if (response?.status === 'success') {
                console.log('[EmailNotifications] Data received:', response.data?.length, 'notifications')
                setNotifications(response.data || [])
            } else {
                setError(response?.message || 'Failed to load notifications')
            }
        } catch (error) {
            console.error('[EmailNotifications] Fetch error:', error)
            console.error('[EmailNotifications] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            setError(error.response?.data?.message || error.message || 'Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    // Real-time notification updates
    const handleNotificationChange = useCallback(({ type, notification, raw }) => {
        const formattedNotif = raw || notification

        console.log('[EmailNotifications] Real-time event:', type, formattedNotif)

        switch (type) {
            case 'INSERT':
                setNotifications(prev => {
                    const exists = prev.some(n => n.notification_id === formattedNotif.notification_id)
                    if (exists) return prev
                    return [formattedNotif, ...prev]
                })
                break

            case 'UPDATE':
                setNotifications(prev => prev.map(n =>
                    n.notification_id === formattedNotif.notification_id
                        ? { ...n, ...formattedNotif }
                        : n
                ))
                break

            case 'DELETE':
                setNotifications(prev => prev.filter(n => n.notification_id !== formattedNotif.notification_id))
                break
        }
    }, [])

    // Subscribe to real-time updates
    useEmailNotificationsRealtime({ onNotificationChange: handleNotificationChange })

    const filteredNotifications = notifications.filter((notif) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            notif.recipient_email?.toLowerCase().includes(searchLower) ||
            notif.subject?.toLowerCase().includes(searchLower)
        )
    })

    const startIdx = (page - 1) * itemsPerPage
    const currentData = filteredNotifications.slice(startIdx, startIdx + itemsPerPage)
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {notifications.filter((n) => n.status === 'queued').length} queued
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchNotifications()}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by email or subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Types</option>
                    <option value="invoice_generated">Invoice Generated</option>
                    <option value="payment_reminder">Payment Reminder</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="subscription_expiring">Expiring</option>
                    <option value="subscription_expired">Expired</option>
                    <option value="subscription_upgraded">Upgraded</option>
                    <option value="subscription_downgraded">Downgraded</option>
                    <option value="subscription_cancelled">Cancelled</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Statuses</option>
                    <option value="queued">Queued</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                    <option value="bounced">Bounced</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 text-xs uppercase text-gray-600">
                        <tr className="text-left">
                            <th className="py-3 px-2">Date</th>
                            <th className="py-3 px-2">Type</th>
                            <th className="py-3 px-2">Recipient</th>
                            <th className="py-3 px-2">Subject</th>
                            <th className="py-3 px-2">Status</th>
                            <th className="py-3 px-2">Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <tr key={idx} className="border-b border-gray-200 animate-pulse">
                                    {Array.from({ length: 6 }).map((__, cIdx) => (
                                        <td key={cIdx} className="p-2">
                                            <div className="h-4 bg-gray-300 rounded w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-gray-500">
                                    No notifications found
                                </td>
                            </tr>
                        ) : (
                            currentData.map((notif) => (
                                <tr
                                    key={notif.notification_id}
                                    className="border-b border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="p-2">
                                        {new Date(notif.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-2">
                                        <span className="text-xs capitalize">
                                            {notif.notification_type?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-2 font-medium">{notif.recipient_email}</td>
                                    <td className="p-2">{notif.subject}</td>
                                    <td className="p-2">
                                        <StatusBadge status={notif.status} />
                                    </td>
                                    <td className="p-2">
                                        {notif.error_message ? (
                                            <div className="flex items-center gap-1 text-red-600">
                                                <AlertCircle className="h-3 w-3" />
                                                <span className="text-xs truncate max-w-[200px]">
                                                    {notif.error_message}
                                                </span>
                                            </div>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setPage(1)
                        }}
                        className="border border-gray-200 rounded px-2 py-1"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <span className="text-gray-600">
                    Showing {startIdx + 1}-
                    {Math.min(startIdx + itemsPerPage, filteredNotifications.length)} of{' '}
                    {filteredNotifications.length}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EmailNotifications
