import React from 'react'

// UI Components
import { Button } from '@/components/ui/button'
import {
  MoreVertical,
  Eye,
  FileEdit,
  Archive,
  Trash2,
  ArrowRightLeft,
  UserPen,
  Ban,
} from 'lucide-react'
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

const PatientRecordsTable = ({
  records = [],
  page,
  setPage,
  itemsPerPage,
  // setItemsPerPage,
  onView,
  onEdit,
  onArchive,
  onDelete,
  loading = false,
}) => {
  const totalPages = Math.ceil(records.length / itemsPerPage) || 1
  const startIdx = (page - 1) * itemsPerPage
  const currentData = records.slice(startIdx, startIdx + itemsPerPage)

  const handlePrev = () => setPage((p) => Math.max(1, p - 1))
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1))

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
          <tr className="text-left">
            <th className="py-3 px-2">Name</th>
            <th className="py-3 px-2">Sex</th>
            <th className="py-3 px-2">Age</th>
            <th className="py-3 px-2">Doctor</th>
            <th className="py-3 px-2">
              Birthdate <span className="text-xs font-medium text-gray-400">(YYYY-MM-DD)</span>
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
            currentData.map((user) => (
              <tr key={user.id} className="border-b border-gray-200 last:border-none">
                <td className="p-2 whitespace-nowrap">{`${user.firstname} ${user.lastname}`}</td>
                <td className="p-2 whitespace-nowrap">{user.sex}</td>
                <td className="p-2 whitespace-nowrap capitalize">{user.age}</td>
                <td className="p-2 whitespace-nowrap">
                  {user.doctor ? user.doctor : 'Unassigned'}
                </td>
                <td className="p-2 whitespace-nowrap">{user.birthdate}</td>
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

                    <TooltipHelper content="Archive">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-yellow-600 hover:bg-yellow-100"
                        onClick={() => onArchive(user)}
                      >
                        <Archive className="size-4" />
                      </Button>
                    </TooltipHelper>

                    <TooltipHelper content="Edit">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-green-600 hover:bg-green-100"
                        onClick={() => onEdit(user)}
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
    </div>
  )
}

export default PatientRecordsTable
