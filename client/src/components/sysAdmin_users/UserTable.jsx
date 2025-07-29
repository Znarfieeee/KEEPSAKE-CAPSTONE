import React from "react"
import StatusBadge from "./UserStatusBadge"
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

const UserTable = ({
    users = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    onView,
    onToggleStatus,
    onAuditLogs,
    onDelete,
    loading = false,
}) => {
    const totalPages = Math.ceil(users.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = users.slice(startIdx, startIdx + itemsPerPage)

    const handlePrev = () => setPage(p => Math.max(1, p - 1))
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1))
    const planClasses = {
        freemium: "bg-green-100 text-green-700",
        premium: "bg-blue-100 text-blue-700",
        default: "bg-gray-100 text-gray-700",
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                    <tr className="text-left">
                        <th className="py-3 px-2">Full Name</th>
                        <th className="py-3 px-2">Role</th>
                        <th className="py-3 px-2">Plan</th>
                        <th className="py-3 px-2">Subscription Expiry</th>
                        <th className="py-3 px-2">Assigned Facility</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
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
                        : currentData.map(user => (
                              <tr
                                  key={user.id}
                                  className="border-b border-gray-200 last:border-none">
                                  <td className="p-2 whitespace-nowrap">
                                      {`${user.firstname} ${user.lastname}`}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.role}
                                  </td>
                                  <td className="p-2 whitespace-nowrap capitalize">
                                      <span
                                          className={`(
                                                      "inline-flex items-center justify-center px-2.5 py-0.5",
                                                      "text-xs font-medium rounded-full w-24",
                                                      planClasses[user.plan]
                                                  )`}>
                                          {user.plan}
                                      </span>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.subscription_expiry || "—"}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.assigned_facility}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <StatusBadge status={user.status} />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <div className="flex gap-1">
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => onView(user)}
                                              title="View Details">
                                              <Eye className="size-4" />
                                          </Button>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                  onToggleStatus(user)
                                              }
                                              title={
                                                  user.status === "inactive"
                                                      ? "Activate"
                                                      : "Deactivate"
                                              }>
                                              {user.status === "inactive" ? (
                                                  <CheckCircle className="size-4" />
                                              ) : (
                                                  <Ban className="size-4" />
                                              )}
                                          </Button>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => onAuditLogs(user)}
                                              title="View Audit Logs">
                                              <FileClock className="size-4" />
                                          </Button>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => onDelete(user)}
                                              title="Delete User">
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
                        {Math.min(startIdx + itemsPerPage, users.length)} of{" "}
                        {users.length}
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

export default UserTable
