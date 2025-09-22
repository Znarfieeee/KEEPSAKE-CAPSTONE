import React from 'react'

// UI Components
import { Button } from '@/components/ui/Button'
import { TooltipHelper } from '@/util/TooltipHelper'
import { UserStatusBadge } from '@/components/ui/StatusBadge'
import {
    Eye,
    Ban,
    CheckCircle,
    ArrowRightLeft,
    Trash2,
    ChevronLeft,
    ChevronRight,
    UserPen,
} from 'lucide-react'

const UserTable = ({
    users = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    onView,
    onToggleStatus,
    onTransfer,
    onDelete,
    loading = false,
}) => {
    const totalPages = Math.ceil(users.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = users.slice(startIdx, startIdx + itemsPerPage)

    const handlePrev = () => setPage((p) => Math.max(1, p - 1))
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1))

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                    <tr className="text-left">
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Role</th>
                        <th className="py-3 px-2">Plan</th>
                        <th className="py-3 px-2">Subscription Expiry</th>
                        <th className="py-3 px-2">Last Login</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading
                        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
                              <tr key={idx} className="border-b last:border-none animate-pulse">
                                  {Array.from({ length: 8 }).map((__, cIdx) => (
                                      <td key={cIdx} className="p-2 whitespace-nowrap">
                                          <div className="h-4 bg-gray-300 rounded w-full" />
                                      </td>
                                  ))}
                              </tr>
                          ))
                        : currentData.map((user) => (
                              <tr
                                  key={user.id}
                                  className="border-b border-gray-200 last:border-none"
                              >
                                  <td className="p-2 whitespace-nowrap">
                                      {`${user.firstname} ${user.middlename} ${user.lastname}`}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">{user.role}</td>
                                  <td className="p-2 whitespace-nowrap capitalize">{user.plan}</td>
                                  <td className="p-2 whitespace-nowrap">{user.sub_exp || '—'}</td>
                                  <td className="p-2 whitespace-nowrap">{user.last_login}</td>
                                  <td className="p-2 whitespace-nowrap">
                                      <UserStatusBadge status={user.status} />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <div className="flex gap-1">
                                          <TooltipHelper content="View Details">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-blue-600 hover:bg-blue-100"
                                                  onClick={() => onView(user)}
                                              >
                                                  <Eye className="size-4" />
                                              </Button>
                                          </TooltipHelper>

                                          <TooltipHelper content="Assign/Transfer Facility">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-yellow-600 hover:bg-yellow-100"
                                                  onClick={() => onTransfer(user)}
                                              >
                                                  <ArrowRightLeft className="size-4" />
                                              </Button>
                                          </TooltipHelper>

                                          <TooltipHelper
                                              content={
                                                  user.status === 'inactive'
                                                      ? 'Activate User'
                                                      : 'Deactivate User'
                                              }
                                          >
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => onToggleStatus(user)}
                                              >
                                                  {user.status === 'inactive' ? (
                                                      <CheckCircle className="size-4" />
                                                  ) : (
                                                      <Ban className="size-4" />
                                                  )}
                                              </Button>
                                          </TooltipHelper>

                                          <TooltipHelper content="Edit User">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-green-600 hover:bg-green-100"
                                                  onClick={() => onDelete(user)}
                                              >
                                                  <UserPen className="size-4" />
                                              </Button>
                                          </TooltipHelper>

                                          <TooltipHelper content="Delete User">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-red-600 hover:bg-red-100"
                                                  onClick={() => onDelete(user)}
                                              >
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
                <div className="flex items-center gap-2 text-sm">
                    <span>
                        {startIdx + 1}-{Math.min(startIdx + itemsPerPage, users.length)} of{' '}
                        {users.length}
                    </span>
                    <Button size="icon" variant="ghost" onClick={handlePrev} disabled={page === 1}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleNext}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UserTable
