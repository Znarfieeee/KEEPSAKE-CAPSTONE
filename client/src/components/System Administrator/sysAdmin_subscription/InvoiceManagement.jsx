import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Eye, Download, DollarSign, Plus, Search, AlertCircle } from 'lucide-react'
import { getInvoices } from '@/api/admin/subscription'
import { Badge } from '@/components/ui/badge'
import { useInvoicesRealtime } from '@/hook/useSubscriptionRealtime'

const GenerateInvoiceModal = lazy(() => import('./GenerateInvoiceModal'))
const InvoiceDetailModal = lazy(() => import('./InvoiceDetailModal'))
const MarkPaidModal = lazy(() => import('./MarkPaidModal'))

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        paid: 'bg-green-100 text-green-800 border-green-300',
        overdue: 'bg-red-100 text-red-800 border-red-300',
        cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
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

const InvoiceManagement = ({ filters }) => {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showDetail, setShowDetail] = useState(false)
    const [showGenerate, setShowGenerate] = useState(false)
    const [showMarkPaid, setShowMarkPaid] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)

    useEffect(() => {
        fetchInvoices()
    }, [filters])

    const fetchInvoices = async () => {
        try {
            setLoading(true)
            setError(null) // Clear previous errors
            console.log('[InvoiceManagement] Fetching invoices with filters:', filters)
            const response = await getInvoices({
                ...filters,
                start_date: filters.dateRange?.start,
                end_date: filters.dateRange?.end,
                status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
                page,
                per_page: itemsPerPage,
            })

            console.log('[InvoiceManagement] API Response:', response)
            if (response?.status === 'success') {
                console.log('[InvoiceManagement] Data received:', response.data?.length, 'invoices')
                setInvoices(response.data || [])
            } else {
                setError(response?.message || 'Failed to load invoices')
            }
        } catch (error) {
            console.error('[InvoiceManagement] Fetch error:', error)
            console.error('[InvoiceManagement] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            setError(error.response?.data?.message || error.message || 'Failed to load invoices')
        } finally {
            setLoading(false)
        }
    }

    // Real-time invoice updates
    const handleInvoiceChange = useCallback(({ type, invoice, raw }) => {
        const formattedInvoice = raw || invoice

        console.log('[InvoiceManagement] Real-time event:', type, formattedInvoice)

        switch (type) {
            case 'INSERT':
                setInvoices(prev => {
                    const exists = prev.some(inv => inv.invoice_id === formattedInvoice.invoice_id)
                    if (exists) return prev
                    return [formattedInvoice, ...prev]
                })
                break

            case 'UPDATE':
                setInvoices(prev => prev.map(inv =>
                    inv.invoice_id === formattedInvoice.invoice_id
                        ? { ...inv, ...formattedInvoice }
                        : inv
                ))
                // Update selectedInvoice if detail modal is open
                if (selectedInvoice?.invoice_id === formattedInvoice.invoice_id) {
                    setSelectedInvoice({ ...selectedInvoice, ...formattedInvoice })
                }
                break

            case 'DELETE':
                setInvoices(prev => prev.filter(inv => inv.invoice_id !== formattedInvoice.invoice_id))
                // Close modals if showing deleted invoice
                if (selectedInvoice?.invoice_id === formattedInvoice.invoice_id) {
                    setShowDetail(false)
                    setShowMarkPaid(false)
                    setSelectedInvoice(null)
                }
                break
        }
    }, [selectedInvoice])

    // Subscribe to real-time updates
    useInvoicesRealtime({ onInvoiceChange: handleInvoiceChange })

    // Listen for custom events from modals
    useEffect(() => {
        const handleInvoiceCreated = (event) => {
            console.log('[InvoiceManagement] Custom event: invoice-created', event.detail)
            if (event.detail) {
                handleInvoiceChange({ type: 'INSERT', invoice: event.detail, raw: event.detail })
            }
        }

        const handleInvoiceUpdated = (event) => {
            console.log('[InvoiceManagement] Custom event: invoice-updated', event.detail)
            if (event.detail) {
                handleInvoiceChange({ type: 'UPDATE', invoice: event.detail, raw: event.detail })
            }
        }

        window.addEventListener('invoice-created', handleInvoiceCreated)
        window.addEventListener('invoice-updated', handleInvoiceUpdated)

        return () => {
            window.removeEventListener('invoice-created', handleInvoiceCreated)
            window.removeEventListener('invoice-updated', handleInvoiceUpdated)
        }
    }, [handleInvoiceChange])

    const handleView = (invoice) => {
        setSelectedInvoice(invoice)
        setShowDetail(true)
    }

    const handleMarkPaid = (invoice) => {
        setSelectedInvoice(invoice)
        setShowMarkPaid(true)
    }

    const handleDownload = async (invoice) => {
        // Placeholder for PDF download
        console.log('Download invoice:', invoice.invoice_number)
        alert('PDF download feature coming soon!')
    }

    const filteredInvoices = invoices.filter((inv) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            inv.invoice_number?.toLowerCase().includes(searchLower) ||
            inv.healthcare_facilities?.facility_name?.toLowerCase().includes(searchLower)
        )
    })

    const startIdx = (page - 1) * itemsPerPage
    const currentData = filteredInvoices.slice(startIdx, startIdx + itemsPerPage)
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Invoice Management</h2>
                <button
                    onClick={() => setShowGenerate(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent inline-flex items-center gap-2 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Generate Invoice
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchInvoices()}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by invoice number or facility..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-gray-200 border-b text-xs uppercase text-gray-600">
                        <tr className="text-left">
                            <th className="py-3 px-2">Invoice #</th>
                            <th className="py-3 px-2">Facility</th>
                            <th className="py-3 px-2">Issue Date</th>
                            <th className="py-3 px-2">Due Date</th>
                            <th className="py-3 px-2">Amount</th>
                            <th className="py-3 px-2">Status</th>
                            <th className="py-3 px-2">Actions</th>
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
                                    No invoices found
                                </td>
                            </tr>
                        ) : (
                            currentData.map((invoice) => (
                                <tr
                                    key={invoice.invoice_id}
                                    className="border-gray-200 border-b hover:bg-gray-50"
                                >
                                    <td className="p-2 font-medium">{invoice.invoice_number}</td>
                                    <td className="p-2">
                                        {invoice.healthcare_facilities?.facility_name || '—'}
                                    </td>
                                    <td className="p-2">
                                        {new Date(invoice.issue_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-2">
                                        {new Date(invoice.due_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-2 font-semibold">
                                        ₱
                                        {invoice.total_amount?.toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="p-2">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="p-2">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleView(invoice)}
                                                className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(invoice)}
                                                className="p-2 hover:bg-green-100 hover:text-green-600 rounded transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {invoice.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkPaid(invoice)}
                                                    className="p-2 hover:bg-purple-100 hover:text-purple-600 rounded transition-colors"
                                                    title="Mark as Paid"
                                                >
                                                    <DollarSign className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
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
                        className=" border-gray-200 rounded px-2 py-1"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <span className="text-gray-600">
                    Showing {startIdx + 1}-
                    {Math.min(startIdx + itemsPerPage, filteredInvoices.length)} of{' '}
                    {filteredInvoices.length}
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

            {/* Modals */}
            <Suspense fallback={null}>
                {showDetail && (
                    <InvoiceDetailModal
                        open={showDetail}
                        invoice={selectedInvoice}
                        onClose={() => {
                            setShowDetail(false)
                            setSelectedInvoice(null)
                        }}
                    />
                )}
                {showGenerate && (
                    <GenerateInvoiceModal
                        open={showGenerate}
                        onClose={() => setShowGenerate(false)}
                        onGenerated={() => {
                            setShowGenerate(false)
                            fetchInvoices()
                        }}
                    />
                )}
                {showMarkPaid && (
                    <MarkPaidModal
                        open={showMarkPaid}
                        invoice={selectedInvoice}
                        onClose={() => {
                            setShowMarkPaid(false)
                            setSelectedInvoice(null)
                        }}
                        onPaid={() => {
                            setShowMarkPaid(false)
                            setSelectedInvoice(null)
                            fetchInvoices()
                        }}
                    />
                )}
            </Suspense>
        </div>
    )
}

export default InvoiceManagement
