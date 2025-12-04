import React, { useState, useEffect } from 'react'
import { Search, Download } from 'lucide-react'
import { getPaymentHistory } from '@/api/admin/subscription'
import { Badge } from '@/components/ui/badge'

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        completed: 'bg-green-100 text-green-800 border-green-300',
        failed: 'bg-red-100 text-red-800 border-red-300',
        refunded: 'bg-purple-100 text-purple-800 border-purple-300',
    }

    return (
        <Badge
            variant="outline"
            className={`capitalize px-2 py-0.5 border border-gray-200 ${
                styles[status] || styles.pending
            }`}
        >
            {status}
        </Badge>
    )
}

const PaymentHistory = ({ filters }) => {
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)

    useEffect(() => {
        fetchPayments()
    }, [filters])

    const fetchPayments = async () => {
        try {
            setLoading(true)
            const response = await getPaymentHistory({
                ...filters,
                start_date: filters.dateRange?.start,
                end_date: filters.dateRange?.end,
                status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
                page,
                per_page: itemsPerPage,
            })

            if (response?.status === 'success') {
                setPayments(response.data || [])
            }
        } catch (error) {
            console.error('Failed to load payment history:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPayments = payments.filter((payment) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            payment.transaction_reference?.toLowerCase().includes(searchLower) ||
            payment.invoices?.invoice_number?.toLowerCase().includes(searchLower) ||
            payment.healthcare_facilities?.facility_name?.toLowerCase().includes(searchLower)
        )
    })

    const startIdx = (page - 1) * itemsPerPage
    const currentData = filteredPayments.slice(startIdx, startIdx + itemsPerPage)
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1

    const exportToCSV = () => {
        const headers = ['Date', 'Invoice #', 'Facility', 'Amount', 'Method', 'Reference', 'Status']
        const rows = filteredPayments.map((p) => [
            new Date(p.transaction_date).toLocaleDateString(),
            p.invoices?.invoice_number || '—',
            p.healthcare_facilities?.facility_name || '—',
            `₱${p.amount?.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`,
            p.payment_method,
            p.transaction_reference || '—',
            p.status,
        ])

        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2 transition-colors"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by invoice, facility, or reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 text-xs uppercase text-gray-600">
                        <tr className="text-left">
                            <th className="py-3 px-2">Date</th>
                            <th className="py-3 px-2">Invoice #</th>
                            <th className="py-3 px-2">Facility</th>
                            <th className="py-3 px-2">Amount</th>
                            <th className="py-3 px-2">Method</th>
                            <th className="py-3 px-2">Reference</th>
                            <th className="py-3 px-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <tr key={idx} className="border-b border-gray-200 animate-pulse">
                                    {Array.from({ length: 7 }).map((__, cIdx) => (
                                        <td key={cIdx} className="p-2">
                                            <div className="h-4 bg-gray-300 rounded w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-8 text-gray-500">
                                    No payment transactions found
                                </td>
                            </tr>
                        ) : (
                            currentData.map((payment) => (
                                <tr
                                    key={payment.transaction_id}
                                    className="border-b border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="p-2">
                                        {new Date(payment.transaction_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-2 font-medium">
                                        {payment.invoices?.invoice_number || '—'}
                                    </td>
                                    <td className="p-2">
                                        {payment.healthcare_facilities?.facility_name || '—'}
                                    </td>
                                    <td className="p-2 font-semibold">
                                        ₱
                                        {payment.amount?.toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="p-2 capitalize">{payment.payment_method}</td>
                                    <td className="p-2 text-gray-600">
                                        {payment.transaction_reference || '—'}
                                    </td>
                                    <td className="p-2">
                                        <StatusBadge status={payment.status} />
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
                    {Math.min(startIdx + itemsPerPage, filteredPayments.length)} of{' '}
                    {filteredPayments.length}
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

export default PaymentHistory
