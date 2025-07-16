import React from "react"
import StatusBadge from "./StatusBadge"
import { Button } from "../ui/Button"
import {
    Eye,
    Ban,
    CheckCircle,
    FileClock,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"

const FacilityTable = ({
    facilities = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    onView,
    onToggleStatus,
    onAuditLogs,
    onDelete,
}) => {
    const totalPages = Math.ceil(facilities.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = facilities.slice(startIdx, startIdx + itemsPerPage)

    const handlePrev = () => setPage(p => Math.max(1, p - 1))
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1))

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr className="text-left">
                        <th className="py-3 px-2">Facility Name</th>
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-2">Location</th>
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2">Subscription Expiry</th>
                        <th className="py-3 px-2">Assigned Admin</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentData.map(facility => (
                        <tr
                            key={facility.id}
                            className="border-b last:border-none">
                            <td className="p-2 whitespace-nowrap">
                                {facility.name}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                {facility.id}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                {facility.location}
                            </td>
                            <td className="p-2 whitespace-nowrap capitalize">
                                {facility.type}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                {facility.expiry}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                {facility.admin}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                <StatusBadge status={facility.status} />
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onView(facility)}
                                        title="View">
                                        <Eye className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleStatus(facility)}
                                        title={
                                            facility.status === "suspended"
                                                ? "Activate"
                                                : "Suspend"
                                        }>
                                        {facility.status === "suspended" ? (
                                            <CheckCircle className="size-4" />
                                        ) : (
                                            <Ban className="size-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onAuditLogs(facility)}
                                        title="Audit Logs">
                                        <FileClock className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(facility)}
                                        title="Delete">
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={e => setItemsPerPage(Number(e.target.value))}
                        className="border rounded-md px-2 py-1 text-sm dark:bg-input/30 dark:border-input">
                        {[10, 25, 50].map(n => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span>
                        {startIdx + 1}-
                        {Math.min(startIdx + itemsPerPage, facilities.length)}{" "}
                        of {facilities.length}
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handlePrev}
                        disabled={page === 1}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleNext}
                        disabled={page === totalPages}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default FacilityTable
