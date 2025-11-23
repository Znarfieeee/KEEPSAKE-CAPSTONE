import React, { useState } from 'react'
import { useAuth } from '@/context/auth'

// UI Components
import { Button } from '@/components/ui/button'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { Eye, Archive, Trash2, UserPen } from 'lucide-react'
import DoctorParentQRShareButton from '@/components/qr/DoctorParentQRShareButton'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

// Helper
import { TooltipHelper } from '@/util/TooltipHelper'
import { NoResults } from '@/components/ui/no-results'
import { getSexBadgeColor } from '@/util/utils'

const PatientRecordsTable = ({
    records = [],
    page,
    setPage,
    itemsPerPage,
    // setItemsPerPage,
    onView,
    onEdit,
    onEditHover,
    onArchive,
    onDelete,
    loading = false,
}) => {
    const [deleteDialog, setDeleteDialog] = useState({ open: false, patient: null })
    const [isDeleting, setIsDeleting] = useState(false)

    const totalPages = Math.ceil(records.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = records.slice(startIdx, startIdx + itemsPerPage)

    const { user } = useAuth()

    const handleDeleteClick = (patient) => {
        setDeleteDialog({ open: true, patient })
    }

    const handleConfirmDelete = async () => {
        if (!deleteDialog.patient) return

        setIsDeleting(true)
        try {
            await onDelete(deleteDialog.patient)
            setDeleteDialog({ open: false, patient: null })
        } catch (error) {
            console.error('Error deleting patient:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handlePrev = () => setPage((p) => Math.max(1, p - 1))
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1))

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                    <tr className="text-left">
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2 text-center">Sex</th>
                        <th className="py-3 px-2 text-center">Age</th>
                        <th className="py-3 px-2">
                            Birthdate{' '}
                            <span className="text-xs font-medium text-gray-400">(YYYY-MM-DD)</span>
                        </th>
                        <th className="py-3 px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: itemsPerPage }).map((_, idx) => (
                            <tr key={idx} className="border-b last:border-none animate-pulse">
                                {Array.from({ length: 8 }).map((__, cIdx) => (
                                    <td key={cIdx} className="p-2 whitespace-nowrap">
                                        <div className="h-4 bg-gray-300 rounded w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : currentData.length === 0 ? (
                        <NoResults
                            message="No records found"
                            suggestion="Try adjusting your search or filter criteria"
                        />
                    ) : (
                        currentData.map((patient) => (
                            <tr
                                key={patient.id}
                                className="border-b border-gray-200 last:border-none"
                            >
                                <td className="p-2 whitespace-nowrap">{`${patient.firstname} ${patient.lastname}`}</td>
                                <td className="p-2 whitespace-nowrap text-center">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getSexBadgeColor(
                                            patient.sex
                                        )}`}
                                    >
                                        {patient.sex.charAt(0).toUpperCase() +
                                            patient.sex.slice(1).toLowerCase()}
                                    </span>
                                </td>
                                <td className="p-2 whitespace-nowrap capitalize  text-center">
                                    {patient.age}
                                </td>
                                <td className="p-2 whitespace-nowrap">{patient.birthdate}</td>
                                <td className="p-2 whitespace-nowrap">
                                    <div className="flex gap-1">
                                        <TooltipHelper content="View Details">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-blue-600 hover:bg-blue-100"
                                                onClick={() => onView(patient)}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </TooltipHelper>

                                        {/* Share with Parent Button */}
                                        {user?.role === 'doctor' && (
                                            <TooltipHelper content="Share with Parent">
                                                <DoctorParentQRShareButton
                                                    patient={patient}
                                                    iconOnly={true}
                                                />
                                            </TooltipHelper>
                                        )}

                                        <TooltipHelper content="Archive">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-yellow-600 hover:bg-yellow-100"
                                                onClick={() => onArchive(patient)}
                                            >
                                                <Archive className="size-4" />
                                            </Button>
                                        </TooltipHelper>

                                        <TooltipHelper content="Edit Patient">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-green-600 hover:bg-green-100"
                                                onClick={() => onEdit(patient)}
                                                onMouseEnter={onEditHover}
                                            >
                                                <UserPen className="size-4" />
                                            </Button>
                                        </TooltipHelper>

                                        {user?.role === 'doctor' ? (
                                            <TooltipHelper content="Delete Patient">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:text-red-600 hover:bg-red-100"
                                                    onClick={() => handleDeleteClick(patient)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TooltipHelper>
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="w-full flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, records.length)} of{' '}
                    {records.length} records
                </div>
                <Pagination>
                    <PaginationContent>
                        <TooltipHelper content="Previous">
                            <PaginationItem>
                                <PaginationPrevious onClick={handlePrev} />
                            </PaginationItem>
                        </TooltipHelper>
                        <PaginationItem>
                            Page {page} of {totalPages}
                        </PaginationItem>
                        <TooltipHelper content="Next">
                            <PaginationItem>
                                <PaginationNext onClick={handleNext} />
                            </PaginationItem>
                        </TooltipHelper>
                    </PaginationContent>
                </Pagination>
            </div>

            {/* Delete confirmation dialog */}
            {deleteDialog.patient && (
                <ConfirmationDialog
                    open={deleteDialog.open}
                    onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
                    title="Delete Patient Record"
                    description={
                        <>
                            Are you sure you want to delete{' '}
                            <strong>
                                {deleteDialog.patient.firstname} {deleteDialog.patient.lastname}
                            </strong>
                            ?
                            <br />
                            <br />
                            This action will:
                            <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                                <li>Permanently delete the patient record</li>
                                <li>Remove all associated medical records</li>
                                <li>This action cannot be undone</li>
                            </ul>
                            <br />
                            <span className="font-semibold text-red-600">
                                Type the patient's full name to confirm deletion
                            </span>
                        </>
                    }
                    confirmText={`${deleteDialog.patient.firstname} ${deleteDialog.patient.lastname}`}
                    onConfirm={handleConfirmDelete}
                    requireTyping={true}
                    destructive={true}
                    loading={isDeleting}
                />
            )}
        </div>
    )
}

export default PatientRecordsTable
