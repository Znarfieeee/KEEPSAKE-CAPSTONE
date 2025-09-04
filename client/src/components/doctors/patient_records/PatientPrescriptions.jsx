import React, { useState, lazy, Suspense } from 'react'

// UI Components
import { TooltipHelper } from '@/util/TooltipHelper'
import { Button } from '@/components/ui/button'
import { Eye, Search, PlusCircle } from 'lucide-react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'

const AddPatientPrescriptionModal = lazy(() => import('./AddPatientPrescriptionModal'))

const PatientPrescription = ({
    patient,
    onView,
    search,
    onSearchChange,
    isLoading,
    prescription,
}) => {
    const [isOpen, setIsOpen] = useState()

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
                                    prescription={prescription}
                                    // onCreateInvitation={onCreateInvitation}
                                    isLoading={isLoading}
                                    setIsOpen={setIsOpen}
                                />
                            </Suspense>
                        </Dialog>
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead className="border-b border-b-gray-300 text-xs uppercase text-muted-foreground">
                        <tr className="text-left">
                            <th className="py-3 px-2 w-[20%]">Date</th>
                            <th className="py-3 px-2 w-[55%]">Findings</th>
                            <th className="py-3 px-2 w-[15%]">Status</th>
                            <th className="py-3 px-2 w-[10%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patient?.related_records?.prescriptions?.length > 0 ? (
                            patient.related_records.prescriptions.map((rx) => (
                                <tr
                                    key={rx.rx_id}
                                    className="border-b border-gray-200 last:border-none"
                                >
                                    <td className="p-2 whitespace-nowrap">
                                        {rx.prescription_date}
                                    </td>
                                    <td className="p-2 whitespace-nowrap">{rx.findings}</td>
                                    <td className="p-2 whitespace-nowrap">{rx.status}</td>
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
                            <tr>
                                <td colSpan="4" className="p-2 text-center text-gray-500 italic">
                                    No prescriptions
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* <Suspense fallback={null}>
        {showAddModal && (
          <AddPatientPrescriptionModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleAddPrescription}
          />
        )}
      </Suspense> */}
        </div>
    )
}

export default PatientPrescription
