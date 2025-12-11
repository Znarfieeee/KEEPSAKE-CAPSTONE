import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { generateInvoice } from '@/api/admin/subscription'
import { getFacilities } from '@/api/admin/facility'

const GenerateInvoiceModal = ({ open, onClose, onGenerated }) => {
    const [facilities, setFacilities] = useState([])
    const [facilityId, setFacilityId] = useState('')
    const [periodStart, setPeriodStart] = useState('')
    const [periodEnd, setPeriodEnd] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (open) {
            fetchFacilities()
            // Set default dates (current month)
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            setPeriodStart(start.toISOString().split('T')[0])
            setPeriodEnd(end.toISOString().split('T')[0])
        }
    }, [open])

    const fetchFacilities = async () => {
        try {
            const response = await getFacilities()
            if (response?.status === 'success') {
                setFacilities(response.data || [])
            }
        } catch (err) {
            console.error('Failed to fetch facilities:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!facilityId || !periodStart || !periodEnd) {
            setError('Please fill in all required fields')
            return
        }

        try {
            setLoading(true)
            const response = await generateInvoice(facilityId, periodStart, periodEnd, notes)

            if (response?.status === 'success') {
                // Dispatch custom event for immediate real-time update
                if (response.data) {
                    console.log('[GenerateInvoiceModal] Dispatching invoice-created event:', response.data)
                    window.dispatchEvent(
                        new CustomEvent('invoice-created', {
                            detail: response.data,
                        })
                    )
                }
                onGenerated()
            } else {
                setError(response?.message || 'Failed to generate invoice')
            }
        } catch (err) {
            console.error('[GenerateInvoiceModal] Error generating invoice:', err)
            setError('Failed to generate invoice')
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 space-y-4 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Generate Invoice</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Facility *
                        </label>
                        <select
                            value={facilityId}
                            onChange={(e) => setFacilityId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a facility</option>
                            {facilities.map((f) => (
                                <option key={f.facility_id} value={f.facility_id}>
                                    {f.facility_name} - {f.plan} Plan
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Period Start *
                            </label>
                            <input
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Period End *
                            </label>
                            <input
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
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
                            placeholder="Additional notes for this invoice..."
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Generating...' : 'Generate Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default GenerateInvoiceModal
