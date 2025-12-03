import React, { useState } from 'react'
import { useAuth } from '@/context/auth'

// UI Components
import { Button } from '@/components/ui/button'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import {
    Eye,
    Archive,
    Trash2,
    UserPen,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
} from 'lucide-react'
import DoctorParentQRShareButton from '@/components/qr/DoctorParentQRShareButton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Helper
import { TooltipHelper } from '@/util/TooltipHelper'
import { NoResults } from '@/components/ui/no-results'
import { getSexBadgeColor } from '@/util/utils'

const PatientRecordsTable = ({
    records = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
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
            <table className="w-full text-xs sm:text-sm">
                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                    <tr className="text-left">
                        <th className="py-3 px-2 sm:px-3">Name</th>
                        <th className="py-3 px-2 sm:px-3 text-center">Sex</th>
                        <th className="py-3 px-2 sm:px-3 text-center">Age</th>
                        <th className="py-3 px-2 sm:px-3">
                            Birthdate{' '}
                            <span className="text-xs font-medium text-gray-400">(YYYY-MM-DD)</span>
                        </th>
                        <th className="py-3 px-2 sm:px-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: itemsPerPage }).map((_, idx) => (
                            <tr key={idx} className="border-b last:border-none animate-pulse">
                                {Array.from({ length: 5 }).map((__, cIdx) => (
                                    <td key={cIdx} className="p-2 sm:p-3 whitespace-nowrap">
                                        <div className="h-4 bg-gray-300 rounded w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : currentData.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="p-8 text-center sm:col-span-5">
                                <NoResults
                                    message="No records found"
                                    suggestion="Try adjusting your search or filter criteria"
                                />
                            </td>
                        </tr>
                    ) : (
                        currentData.map((patient) => (
                            <tr
                                key={patient.id}
                                className="border-b border-gray-200 last:border-none"
                            >
                                <td className="p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm">{`${patient.firstname} ${patient.lastname}`}</td>
                                <td className="p-2 sm:p-3 whitespace-nowrap text-center">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getSexBadgeColor(
                                            patient.sex
                                        )}`}
                                    >
                                        {patient.sex.charAt(0).toUpperCase() +
                                            patient.sex.slice(1).toLowerCase()}
                                    </span>
                                </td>
                                <td className="p-2 sm:p-3 whitespace-nowrap capitalize text-center text-xs sm:text-sm">
                                    {patient.age}
                                </td>
                                <td className="p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm">
                                    {patient.birthdate}
                                </td>
                                <td className="p-2 sm:p-3 whitespace-nowrap">
                                    {/* Desktop: Individual buttons */}
                                    <div className="hidden sm:flex gap-0.5 sm:gap-1 flex-wrap">
                                        <TooltipHelper content="View Details">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="hover:text-blue-600 hover:bg-blue-100 h-8 w-8 p-0"
                                                onClick={() => onView(patient)}
                                            >
                                                <Eye className="size-3 sm:size-4" />
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
                                                size="sm"
                                                className="hover:text-yellow-600 hover:bg-yellow-100 h-8 w-8 p-0"
                                                onClick={() => onArchive(patient)}
                                            >
                                                <Archive className="size-3 sm:size-4" />
                                            </Button>
                                        </TooltipHelper>

                                        <TooltipHelper content="Edit Patient">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="hover:text-green-600 hover:bg-green-100 h-8 w-8 p-0"
                                                onClick={() => onEdit(patient)}
                                                onMouseEnter={onEditHover}
                                            >
                                                <UserPen className="size-3 sm:size-4" />
                                            </Button>
                                        </TooltipHelper>

                                        {user?.role === 'doctor' ? (
                                            <TooltipHelper content="Delete Patient">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:text-red-600 hover:bg-red-100 h-8 w-8 p-0"
                                                    onClick={() => handleDeleteClick(patient)}
                                                >
                                                    <Trash2 className="size-3 sm:size-4" />
                                                </Button>
                                            </TooltipHelper>
                                        ) : (
                                            ''
                                        )}
                                    </div>

                                    {/* Mobile: Dropdown menu */}
                                    <div className="sm:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onView(patient)}>
                                                    <Eye className="size-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>

                                                {user?.role === 'doctor' && (
                                                    <DropdownMenuItem>
                                                        <DoctorParentQRShareButton
                                                            patient={patient}
                                                            iconOnly={false}
                                                        />
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() => onArchive(patient)}
                                                >
                                                    <Archive className="size-4 mr-2" />
                                                    Archive
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => onEdit(patient)}>
                                                    <UserPen className="size-4 mr-2" />
                                                    Edit Patient
                                                </DropdownMenuItem>

                                                {user?.role === 'doctor' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(patient)}
                                                    >
                                                        <Trash2 className="size-4 mr-2" />
                                                        Delete Patient
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex flex-col gap-3 mt-4">
                {/* Mobile: Rows per page and pagination on same row */}
                <div className="sm:hidden flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <label className="whitespace-nowrap">Rows:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="border rounded px-1.5 py-0.5 text-xs dark:bg-input/30 dark:border-input"
                        >
                            {[10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className="whitespace-nowrap">
                        {startIdx + 1}-{Math.min(startIdx + itemsPerPage, records.length)} of{' '}
                        {records.length}
                    </span>
                    <div className="flex gap-0.5">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handlePrev}
                            disabled={page === 1}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleNext}
                            disabled={page === totalPages}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Desktop: Original layout */}
                <div className="hidden sm:flex sm:items-center sm:justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Rows per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="border rounded-md px-2 py-1 text-sm dark:bg-input/30 dark:border-input"
                        >
                            {[10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>
                            {startIdx + 1}-{Math.min(startIdx + itemsPerPage, records.length)} of{' '}
                            {records.length}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handlePrev}
                                disabled={page === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleNext}
                                disabled={page === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
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
