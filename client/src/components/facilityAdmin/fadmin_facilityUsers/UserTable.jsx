import React from 'react'

// UI Components
import { UserStatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import {
    Eye,
    Trash2,
    ChevronLeft,
    ChevronRight,
    UserPen,
    UserX,
    UserCheck,
    Users,
} from 'lucide-react'

// Helper
import { TooltipHelper } from '@/util/TooltipHelper'

const UserTable = ({
    users = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    totalUsers,
    onView,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    loading = false,
    actionLoading = false,
}) => {
    const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = users

    const handlePrev = () => setPage((p) => Math.max(1, p - 1))
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1))

    const formatRole = (role) => {
        return role?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown'
    }

    // Show empty state when no users
    if (!loading && users.length === 0) {
        return (
            <div className="w-full">
                <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-4">
                            <Users className="size-16 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            No Users Found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            There are no facility users to display. Try adjusting your filters or
                            add new users to get started.
                        </p>
                        <div className="text-sm text-gray-500">Total users: {totalUsers}</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                    <tr className="text-left text-black">
                        <th className="py-3 px-2">User Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Role</th>
                        <th className="py-3 px-2">Department</th>
                        <th className="py-3 px-2">Phone</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Last Login</th>
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
                                      {user.full_name || 'Unknown Name'}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">{user.email}</td>
                                  <td className="p-2 whitespace-nowrap capitalize">
                                      {formatRole(user.role)}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.department || 'Not assigned'}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">{user.phone || '—'}</td>
                                  <td className="p-2 whitespace-nowrap">
                                      <UserStatusBadge status={user.status} />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.last_login
                                          ? new Date(user.last_login).toLocaleDateString()
                                          : 'Never'}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <div className="flex gap-1">
                                          <TooltipHelper content="View User">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-blue-600 hover:bg-blue-100"
                                                  onClick={() => onView(user)}
                                                  title="View"
                                              >
                                                  <Eye className="size-4" />
                                              </Button>
                                          </TooltipHelper>
                                          <TooltipHelper content="Edit User">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-green-600 hover:bg-green-100"
                                                  onClick={() => onEdit(user)}
                                              >
                                                  <UserPen className="size-4" />
                                              </Button>
                                          </TooltipHelper>
                                          {user.status === 'active' ? (
                                              <TooltipHelper content="Deactivate User">
                                                  <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="hover:text-orange-600 hover:bg-orange-100"
                                                      onClick={() => onDeactivate(user)}
                                                      disabled={actionLoading}
                                                  >
                                                      <UserX className="size-4" />
                                                  </Button>
                                              </TooltipHelper>
                                          ) : (
                                              <TooltipHelper content="Activate User">
                                                  <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="hover:text-green-600 hover:bg-green-100"
                                                      onClick={() => onActivate(user)}
                                                      disabled={actionLoading}
                                                  >
                                                      <UserCheck className="size-4" />
                                                  </Button>
                                              </TooltipHelper>
                                          )}
                                          <TooltipHelper content="Delete User">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-red-600 hover:bg-red-100"
                                                  onClick={() => onDelete(user)}
                                                  disabled={actionLoading}
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

            {/* Pagination - Only show if there are users */}
            {users.length > 0 && (
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
                            {startIdx + 1}-{Math.min(startIdx + itemsPerPage, totalUsers)} of{' '}
                            {totalUsers}
                        </span>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handlePrev}
                            disabled={page === 1}
                        >
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
            )}
        </div>
    )
}

export default UserTable
