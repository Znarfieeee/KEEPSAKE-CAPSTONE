import React, { useState } from 'react'

// UI Components
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
    Eye,
    Trash2,
    ChevronLeft,
    ChevronRight,
    UserPen,
    Building2,
    UserCheck,
    UserX,
} from 'lucide-react'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'

// Helper
import { TooltipHelper } from '@/util/TooltipHelper'
import { cn, getUserStatusBadgeColor, formatUserStatus } from '@/util/utils'

// Status Badge Component
const StatusBadge = ({ status }) => {
    const badgeColor = getUserStatusBadgeColor(status)
    return (
        <Badge
            variant="outline"
            className={cn('gap-1.5 px-2.5 py-0.5 border font-medium capitalize', badgeColor)}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full animate-pulse',
                    status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                )}
            />
            {formatUserStatus(status)}
        </Badge>
    )
}

const FacilityUsersTable = ({
    facilityUsers = [],
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    onView,
    onGoto,
    onEdit,
    onActivateDeactivate,
    onDelete,
    loading = false,
}) => {
    const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
    const [isDeleting, setIsDeleting] = useState(false)

    const totalPages = Math.ceil(facilityUsers.length / itemsPerPage) || 1
    const startIdx = (page - 1) * itemsPerPage
    const currentData = facilityUsers.slice(startIdx, startIdx + itemsPerPage)

    const handleDeleteClick = (user) => {
        setDeleteDialog({ open: true, user })
    }

    const handleConfirmDelete = async () => {
        try {
            setIsDeleting(true)
            await onDelete(deleteDialog.user)
            setDeleteDialog({ open: false, user: null })
        } catch (error) {
            console.error('Error deleting user from facility:', error)
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
                    <tr className="text-left text-black">
                        <th className="py-3 px-2">Full Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Role</th>
                        <th className="py-3 px-2">Department</th>
                        <th className="py-3 px-2">Specialty</th>
                        <th className="py-3 px-2">Contact Number</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading
                        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
                              <tr key={idx} className="border-b last:border-none animate-pulse">
                                  {Array.from({ length: 10 }).map((__, cIdx) => (
                                      <td key={cIdx} className="p-2 whitespace-nowrap">
                                          <div className="h-4 bg-gray-300 rounded w-full" />
                                      </td>
                                  ))}
                              </tr>
                          ))
                        : currentData.map((user) => (
                              <tr
                                  key={user.user_id}
                                  className="border-b border-gray-200 last:border-none"
                              >
                                  <td className="p-2 whitespace-nowrap">
                                      {user.firstname} {user.lastname}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">{user.email}</td>
                                  <td className="p-2 whitespace-nowrap capitalize">{user.role}</td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.department || '—'}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">{user.specialty || '—'}</td>
                                  <td className="p-2 whitespace-nowrap">
                                      {user.phone_number || '—'}
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <StatusBadge
                                          status={user.is_active ? 'active' : 'inactive'}
                                      />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                      <div className="flex gap-1">
                                          <TooltipHelper content="View User Details">
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
                                          <TooltipHelper
                                              content={
                                                  user.is_active
                                                      ? 'Deactivate User'
                                                      : 'Activate User'
                                              }
                                          >
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className={
                                                      user.is_active
                                                          ? 'hover:text-orange-600 hover:bg-orange-100'
                                                          : 'hover:text-green-600 hover:bg-green-100'
                                                  }
                                                  onClick={() => onActivateDeactivate(user)}
                                              >
                                                  {user.is_active ? (
                                                      <UserX className="size-4" />
                                                  ) : (
                                                      <UserCheck className="size-4" />
                                                  )}
                                              </Button>
                                          </TooltipHelper>
                                          <TooltipHelper content="Edit User Assignment">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-purple-600 hover:bg-purple-100"
                                                  onClick={() => onEdit(user)}
                                              >
                                                  <UserPen className="size-4" />
                                              </Button>
                                          </TooltipHelper>
                                          <TooltipHelper content="Remove from facility">
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="hover:text-red-600 hover:bg-red-100"
                                                  onClick={() => handleDeleteClick(user)}
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
                        {startIdx + 1}-{Math.min(startIdx + itemsPerPage, facilityUsers.length)} of{' '}
                        {facilityUsers.length}
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

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
                title="Remove User from Facility"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <strong>
                            "{deleteDialog.user?.firstname} {deleteDialog.user?.lastname}"
                        </strong>{' '}
                        from <strong>"{deleteDialog.user?.facility_name}"</strong>?
                        <br />
                        <br />
                        This action will:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                            <li>Remove user's access to this facility</li>
                            <li>Revoke facility-specific permissions</li>
                            <li>Maintain audit trail for compliance</li>
                        </ul>
                        <br />
                        <span className="font-semibold text-red-600">
                            This action can be reversed by re-assigning the user.
                        </span>
                    </>
                }
                confirmText="REMOVE"
                onConfirm={handleConfirmDelete}
                requireTyping={true}
                destructive={true}
                loading={isDeleting}
            />
        </div>
    )
}

export default FacilityUsersTable
