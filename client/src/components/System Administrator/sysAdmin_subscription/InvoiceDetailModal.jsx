import React from 'react'
import { X, Download } from 'lucide-react'

const InvoiceDetailModal = ({ open, invoice, onClose }) => {
    if (!open || !invoice) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6 space-y-4 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Invoice Details</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => alert('PDF download coming soon!')}
                            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center gap-2 text-sm"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Invoice Header */}
                <div className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold">{invoice.invoice_number}</h3>
                            <p className="text-gray-600 mt-1">
                                Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Due Date</p>
                            <p className="font-medium">
                                {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Facility Information */}
                <div>
                    <h4 className="font-semibold mb-2">Billed To</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">
                            {invoice.healthcare_facilities?.facility_name}
                        </p>
                        <p className="text-sm text-gray-600">
                            {invoice.healthcare_facilities?.address}
                        </p>
                        <p className="text-sm text-gray-600">
                            {invoice.healthcare_facilities?.city}
                        </p>
                        <p className="text-sm text-gray-600">
                            {invoice.healthcare_facilities?.email}
                        </p>
                    </div>
                </div>

                {/* Billing Period */}
                <div>
                    <h4 className="font-semibold mb-2">Billing Period</h4>
                    <p className="text-sm text-gray-600">
                        {new Date(invoice.billing_period_start).toLocaleDateString()} -{' '}
                        {new Date(invoice.billing_period_end).toLocaleDateString()}
                    </p>
                </div>

                {/* Line Items */}
                <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr>
                                <th className="text-left py-2">Description</th>
                                <th className="text-right py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-2">{invoice.plan_type} Subscription Plan</td>
                                <td className="text-right">₱{invoice.subtotal?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">Tax (12%)</td>
                                <td className="text-right">₱{invoice.tax_amount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-semibold">Total</td>
                                <td className="text-right text-lg font-bold">
                                    ₱{invoice.total_amount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {invoice.notes}
                        </p>
                    </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium capitalize">{invoice.status}</p>
                    </div>
                    {invoice.paid_at && (
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Paid On</p>
                            <p className="font-medium">
                                {new Date(invoice.paid_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default InvoiceDetailModal
