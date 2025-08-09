import React from "react"

// UI Components
import { FacilityStatusBadge } from "../ui/StatusBadge"
import { Button } from "../ui/Button"
import { TooltipHelper } from "../../util/TooltipHelper"
import {
    Eye,
    CheckCircle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    UserPen,
    TableOfContents,
} from "lucide-react"

const FacilityTable = ({
    facilities = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    onView,
    onGoto,
    onEdit,
    onDelete,
    loading = false,
}) => {
    const totalPages = Math.ceil(facilities.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = facilities.slice(startIdx, startIdx + itemsPerPage)

    const handlePrev = () => setPage(p => Math.max(1, p - 1))
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1))

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                    <tr className="text-left text-black">
                        <th className="py-3 px-2">Facility Name</th>
                        <th className="py-3 px-2">Address</th>
                        <th className="py-3 px-2">Plan</th>
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2">Subscription Expiry</th>
                        <th className="py-3 px-2">Assigned Admin</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading
                        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
                              <tr
                                  key={idx}
                                  className="border-b last:border-none animate-pulse">
                                  {Array.from({ length: 8 }).map((__, cIdx) => (
                                      <td
                                          key={cIdx}
                                          className="p-2 whitespace-nowrap">
                                          <div className="h-4 bg-gray-300 rounded w-full" />
                                      </td>
                                  ))}
                              </tr>
                          ))
                        : currentData.map(facility => (
                              <tr
                                  key={facility.id}
                                  className="border-b border-gray-200 last:border-none">
                                  <td className="p-2 whitespace-nowrap">
                                      {facility.name}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      {facility.location.length > 30
                                          ? `${facility.location.substring(
                                                0,
                                                30
                                            )}...`
                                          : facility.location}
                                  </td>
                                  <td className="p-2 whitespace-nowrap capitalize">
                                      {facility.plan}
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
                                      <FacilityStatusBadge
                                          status={facility.status}
                                      />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <div className="flex gap-1">
                                          <TooltipHelper content="View Facility">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-blue-600 hover:bg-blue-100"
                                                  onClick={() =>
                                                      onView(facility)
                                                  }
                                                  title="View">
                                                  <Eye className="size-4" />
                                              </Button>
                                          </TooltipHelper>
                                          <TooltipHelper content="Go-to Facility">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => onGoto()}>
                                                  <TableOfContents className="size-4" />
                                              </Button>
                                          </TooltipHelper>
                                          <TooltipHelper content="Edit Facility">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-green-600 hover:bg-green-100"
                                                  onClick={() =>
                                                      onEdit(facility)
                                                  }>
                                                  <UserPen className="size-4" />
                                              </Button>
                                          </TooltipHelper>
                                          <TooltipHelper content="Delete facility">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-red-600 hover:bg-red-100"
                                                  onClick={() =>
                                                      onDelete(facility)
                                                  }>
                                                  <Trash2 className="size-4" />
                                              </Button>
                                          </TooltipHelper>
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
