import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, Edit2, Trash2, MoreHorizontal, UserX, UserCheck, Mail, Phone } from 'lucide-react'

const UserTable = ({
    users = [],
    loading = false,
    page = 1,
    setPage,
    itemsPerPage = 10,
    setItemsPerPage,
    onView,
    onEdit,
    onDelete,
    onActivateUser,
    onDeactivateUser,
    currentUserRole = 'facility_admin',
}) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'inactive':
                return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'suspended':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'facility_admin':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'doctor':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'nurse':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'vital_custodian':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'keepsaker':
                return 'bg-pink-100 text-pink-800 border-pink-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatRole = (role) => {
        return role?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown'
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const canManageUser = (userRole) => {
        // Facility admins can manage all users except other facility admins
        if (currentUserRole === 'facility_admin') {
            return userRole !== 'facility_admin'
        }
        return false
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-8 text-center">
                    <p className="text-gray-600">No users found.</p>
                </div>
            </div>
        )
    }

    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = users.slice(startIndex, endIndex)
    const totalPages = Math.ceil(users.length / itemsPerPage)

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <div className="flex items-center space-x-3">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {user.full_name || 'Unknown Name'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                ID: {user.id}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge className={getRoleColor(user.role)}>
                                        {formatRole(user.role)}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <span className="text-gray-900">
                                        {user.department || 'Not assigned'}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {user.email}
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Phone className="h-3 w-3 mr-1" />
                                                {user.phone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge className={getStatusColor(user.status)}>
                                        {user.status || 'Unknown'}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <span className="text-sm text-gray-600">
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleDateString()
                                            : 'Never'}
                                    </span>
                                </TableCell>

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onView(user)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </DropdownMenuItem>

                                            {canManageUser(user.role) && (
                                                <>
                                                    <DropdownMenuItem onClick={() => onEdit(user)}>
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        Edit User
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {user.status === 'active' ? (
                                                        <DropdownMenuItem
                                                            onClick={() => onDeactivateUser(user)}
                                                            className="text-orange-600"
                                                        >
                                                            <UserX className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => onActivateUser(user)}
                                                            className="text-green-600"
                                                        >
                                                            <UserCheck className="h-4 w-4 mr-2" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(user)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Rows per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setPage(1)
                            }}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            {startIndex + 1}–{Math.min(endIndex, users.length)} of {users.length}
                        </span>

                        <div className="flex space-x-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserTable
