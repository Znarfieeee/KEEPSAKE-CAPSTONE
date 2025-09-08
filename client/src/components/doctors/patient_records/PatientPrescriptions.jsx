import React, { useState, lazy, Suspense } from 'react'

// UI Components
import { NoResults } from '@/components/ui/no-results'
import { TooltipHelper } from '@/util/TooltipHelper'
import { Button } from '@/components/ui/button'
import { Eye, Search, PlusCircle } from 'lucide-react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'

const AddPatientPrescriptionModal = lazy(() => import('./AddPatientPrescriptionModal'))

const PatientPrescription = ({
    onView,
    search,
    onSearchChange,
    isLoading,
    prescription = [],
    patient,
    onPrescriptionAdded,
}) => {
    const [isOpen, setIsOpen] = useState()

    // Enhanced date formatter with error handling
    const formatDate = (dateString) => {
        if (!dateString) return '—'
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return '—' // Invalid date
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        } catch (error) {
            console.error('Error formatting date:', error)
            return '—'
        }
    }

    // Ensure prescriptions is always an array
    const prescriptionArray = Array.isArray(prescription) ? prescription : []

    return (
        <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
            <div className="w-full overflow-x-auto">
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center my-4">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search prescription..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="relative flex-1 lg:flex-none">
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Prescription
                                </Button>
                            </DialogTrigger>
                            <Suspense fallback={null}>
                                <AddPatientPrescriptionModal
                                    prescription={{ patient_id: patient?.patient_id }}
                                    isLoading={isLoading}
                                    setIsOpen={setIsOpen}
                                    onSuccess={(newPrescription) => {
                                        // Add the new prescription to the existing list
                                        onPrescriptionAdded?.(newPrescription)
                                    }}
                                />
                            </Suspense>
                        </Dialog>
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead className="border-b border-b-gray-300 text-xs uppercase text-muted-foreground">
                        <tr className="text-left">
                            <th className="py-3 px-2 w-[20%]">Date</th>
                            <th className="py-3 px-2 w-[35%]">Findings</th>
                            <th className="py-3 px-2 w-[20%]">Return Date</th>
                            <th className="py-3 px-2 w-[15%]">Status</th>
                            <th className="py-3 px-2 w-[10%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="4" className="p-2 text-center">
                                    Loading prescriptions...
                                </td>
                            </tr>
                        ) : prescriptionArray.length > 0 ? (
                            prescriptionArray.map((rx) => (
                                <tr
                                    key={rx.rx_id}
                                    className="border-b border-gray-200 last:border-none hover:bg-gray-50"
                                >
                                    <td className="p-2 whitespace-nowrap">
                                        {formatDate(rx.prescription_date)}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <div className="max-w-md overflow-hidden text-ellipsis">
                                            {rx.findings || '—'}
                                        </div>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        {formatDate(rx.return_date)}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs 
                                            ${
                                                rx.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {rx.status || '—'}
                                        </span>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <TooltipHelper content="View Details">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-blue-600 hover:bg-blue-100"
                                                onClick={() => onView(rx)}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </TooltipHelper>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <NoResults
                                message={search ? 'No prescriptions found' : 'No prescriptions yet'}
                                suggestion={
                                    search
                                        ? 'Try adjusting your search criteria'
                                        : 'Add a prescription using the button above'
                                }
                            />
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PatientPrescription
