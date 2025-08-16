import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, FileEdit, Archive, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

const PatientRecordsTable = ({
    records = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    onView,
    onEdit,
    onArchive,
    onDelete,
    loading = false,
}) => {
    const totalPages = Math.ceil(records.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = records.slice(startIdx, startIdx + itemsPerPage)

    const handlePrev = () => setPage(p => Math.max(1, p - 1))
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1))

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">
                                Patient Name
                            </TableHead>
                            <TableHead className="w-[100px]">
                                Category
                            </TableHead>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[100px]">Doctor</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[100px] text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.map(record => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                    {record.patientName}
                                </TableCell>
                                <TableCell>{record.category}</TableCell>
                                <TableCell>
                                    {new Date(record.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{record.doctor}</TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            record.status === "active"
                                                ? "bg-green-50 text-green-700"
                                                : "bg-gray-100 text-gray-700"
                                        }`}>
                                        {record.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => onView(record)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onEdit(record)}>
                                                <FileEdit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onArchive(record)
                                                }>
                                                <Archive className="mr-2 h-4 w-4" />
                                                Archive
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() =>
                                                    onDelete(record)
                                                }>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Showing {startIdx + 1} to{" "}
                    {Math.min(startIdx + itemsPerPage, records.length)} of{" "}
                    {records.length} records
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={handlePrev} />
                        </PaginationItem>
                        <PaginationItem>
                            Page {page} of {totalPages}
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext onClick={handleNext} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}

export default PatientRecordsTable
