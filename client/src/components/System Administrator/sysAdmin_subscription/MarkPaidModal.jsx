import React, { useState } from 'react'
import { X } from 'lucide-react'
import { markInvoicePaid } from '@/api/admin/subscription'

const MarkPaidModal = ({ open, invoice, onClose, onPaid }) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [amount, setAmount] = useState(invoice?.total_amount || 0)
    const [paymentMethod, setPaymentMethod] = useState('manual')
    const [transactionRef, setTransactionRef] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!amount || amount <= 0) {
            setError('Please enter a valid payment amount')
            return
        }

        try {
            setLoading(true)
            const response = await markInvoicePaid(invoice.invoice_id, {
                payment_date: paymentDate,
                amount: parseFloat(amount),
                payment_method: paymentMethod,
                transaction_reference: transactionRef,
                notes,
            })

            if (response?.status === 'success') {
                onPaid()
            } else {
                setError(response?.message || 'Failed to record payment')
            }
        } catch (err) {
            setError('Failed to record payment')
        } finally {
            setLoading(false)
        }
    }

    if (!open || !invoice) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 space-y-4 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Record Payment</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                        Invoice: <span className="font-medium">{invoice.invoice_number}</span>
                    </p>
                    <p className="text-sm text-blue-900">
                        Facility:{' '}
                        <span className="font-medium">
                            {invoice.healthcare_facilities?.facility_name}
                        </span>
                    </p>
                    <p className="text-sm text-blue-900">
                        Amount Due: <span className="font-medium">₱{invoice.total_amount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Date *
                            </label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount Received *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method *
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="manual">Manual</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="check">Check</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Reference
                        </label>
                        <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Check number, transaction ID, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional payment details..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default MarkPaidModal
