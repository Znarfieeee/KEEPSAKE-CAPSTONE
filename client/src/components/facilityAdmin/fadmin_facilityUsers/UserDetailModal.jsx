import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    User,
    Mail,
    Phone,
    Building,
    Shield,
    Calendar,
    Edit2,
    UserCheck,
    UserX,
} from 'lucide-react'

const UserDetailModal = ({ open, user, onClose, onEdit, currentUserRole = 'facility_admin' }) => {
    if (!user) return null

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

    const canManageUser = (userRole) => {
        if (currentUserRole === 'facility_admin') {
            return userRole !== 'facility_admin'
        }
        return false
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* User Header */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {user.full_name || 'Unknown Name'}
                            </h3>
                            <p className="text-gray-600">ID: {user.id}</p>

                            <div className="flex items-center space-x-2 mt-2">
                                <Badge className={getRoleColor(user.role)}>
                                    {formatRole(user.role)}
                                </Badge>
                                <Badge className={getStatusColor(user.status)}>
                                    {user.status || 'Unknown'}
                                </Badge>
                            </div>
                        </div>

                        {canManageUser(user.role) && (
                            <Button
                                onClick={() => onEdit(user)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </Button>
                        )}
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Contact Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium">{user.email || 'Not provided'}</p>
                                </div>
                            </div>

                            {user.phone && (
                                <div className="flex items-center space-x-3">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-medium">{user.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Professional Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Department</p>
                                <p className="font-medium">{user.department || 'Not assigned'}</p>
                            </div>

                            {user.license_number && (
                                <div>
                                    <p className="text-sm text-gray-600">License Number</p>
                                    <p className="font-medium">{user.license_number}</p>
                                </div>
                            )}

                            {user.specialization && (
                                <div>
                                    <p className="text-sm text-gray-600">Specialization</p>
                                    <p className="font-medium">{user.specialization}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-600">Employee ID</p>
                                <p className="font-medium">{user.employee_id || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Account Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">Created</p>
                                    <p className="font-medium">{formatDate(user.created_at)}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <UserCheck className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">Last Login</p>
                                    <p className="font-medium">{user.last_login}</p>
                                </div>
                            </div>

                            {user.updated_at && (
                                <div className="flex items-center space-x-3">
                                    <Edit2 className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Last Updated</p>
                                        <p className="font-medium">{formatDate(user.updated_at)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-3">
                                <UserX className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">Status Changed</p>
                                    <p className="font-medium">
                                        {user.status_changed_at
                                            ? formatDate(user.status_changed_at)
                                            : 'Never'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    {user.notes && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium">Notes</h4>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-700">{user.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Permissions Summary */}
                    {user.permissions && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium">Permissions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {user.permissions.map((permission, index) => (
                                    <Badge key={index} variant="outline" className="justify-center">
                                        {permission}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {canManageUser(user.role) && (
                        <Button onClick={() => onEdit(user)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit User
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default UserDetailModal
