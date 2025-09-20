import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

const UserFilters = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  clearFilters
}) => {
  const activeFiltersCount = [roleFilter, statusFilter, departmentFilter]
    .filter(filter => filter && filter !== 'all').length;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={onRoleChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="facility_admin">Facility Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="vital_custodian">Vital Custodian</SelectItem>
            <SelectItem value="keepsaker">Keepsaker</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select value={departmentFilter} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="pediatrics">Pediatrics</SelectItem>
            <SelectItem value="cardiology">Cardiology</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="surgery">Surgery</SelectItem>
            <SelectItem value="administration">Administration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Active filters:</span>

          {roleFilter && roleFilter !== 'all' && (
            <Badge variant="secondary" className="capitalize">
              Role: {roleFilter.replace('_', ' ')}
            </Badge>
          )}

          {statusFilter && statusFilter !== 'all' && (
            <Badge variant="secondary" className="capitalize">
              Status: {statusFilter}
            </Badge>
          )}

          {departmentFilter && departmentFilter !== 'all' && (
            <Badge variant="secondary" className="capitalize">
              Dept: {departmentFilter}
            </Badge>
          )}

          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default UserFilters;