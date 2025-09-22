import React, { memo, useMemo, useCallback } from 'react'

// UI Components
import { Search } from 'lucide-react'
import { BrushCleaning } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/Button'

const UserFilters = memo(
    ({
        search,
        onSearchChange,
        roleFilter,
        onRoleChange,
        statusFilter,
        onStatusChange,
        departmentFilter,
        onDepartmentChange,
        onClearFilters,
    }) => {
        const clearAllFilters = useCallback(() => {
            onClearFilters()
        }, [onClearFilters])

        const filterOptions = useMemo(
            () => ({
                role: [
                    { value: 'all', label: 'All Roles' },
                    { value: 'facility_admin', label: 'Facility Admin' },
                    { value: 'doctor', label: 'Doctor' },
                    { value: 'nurse', label: 'Nurse' },
                    { value: 'vital_custodian', label: 'Vital Custodian' },
                    { value: 'keepsaker', label: 'Keepsaker' },
                ],
                status: [
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'suspended', label: 'Suspended' },
                ],
                department: [
                    { value: 'all', label: 'All Departments' },
                    { value: 'pediatrics', label: 'Pediatrics' },
                    { value: 'cardiology', label: 'Cardiology' },
                    { value: 'emergency', label: 'Emergency' },
                    { value: 'surgery', label: 'Surgery' },
                    { value: 'administration', label: 'Administration' },
                ],
            }),
            []
        )

        const {
            role: roleOptions,
            status: statusOptions,
            department: departmentOptions,
        } = filterOptions

        const activeFiltersCount = [roleFilter, statusFilter, departmentFilter].filter(
            (filter) => filter && filter !== 'all'
        ).length

        return (
            <div className="flex justify-between items-center">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex gap-4">
                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" onClick={clearAllFilters}>
                            <BrushCleaning className="size-4" />
                        </Button>
                    )}
                    {/* Role Filter */}
                    <Select value={roleFilter} onValueChange={onRoleChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {roleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Department Filter */}
                    <Select value={departmentFilter} onValueChange={onDepartmentChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {departmentOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        )
    }
)

export default UserFilters
