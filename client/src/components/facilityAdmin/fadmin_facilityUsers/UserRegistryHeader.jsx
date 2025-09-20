import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw, BarChart3 } from 'lucide-react';

const UserRegistryHeader = ({
  onOpenRegister,
  onExportCSV,
  onOpenReports,
  onRefresh,
  isLoading = false,
  totalUsers = 0
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-white rounded-lg shadow-sm border">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Facility Users Registry
        </h1>
        <p className="text-gray-600 mt-1">
          Manage users in your healthcare facility ({totalUsers} total)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button
          onClick={onOpenReports}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Reports
        </Button>

        <Button
          onClick={onExportCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>

        <Button
          onClick={onOpenRegister}
          size="sm"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>
  );
};

export default UserRegistryHeader;