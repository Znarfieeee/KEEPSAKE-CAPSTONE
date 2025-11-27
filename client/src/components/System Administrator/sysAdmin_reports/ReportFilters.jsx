import React from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Filter, X, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const ReportFilters = ({
    // Filter values
    datePreset,
    onDatePresetChange,
    dateRange,
    onDateRangeChange,
    roleFilter,
    onRoleFilterChange,
    exportFormat,
    onExportFormatChange,

    // Actions
    onExport,
    onRefresh,
    isRefreshing,

    // Cache info
    cacheInfo,
}) => {
    const hasActiveFilters =
        roleFilter !== 'all' ||
        datePreset !== 'last-30-days' ||
        dateRange.startDate ||
        dateRange.endDate

    const clearFilters = () => {
        onRoleFilterChange('all')
        onDatePresetChange('last-30-days')
        onDateRangeChange({ startDate: '', endDate: '' })
        onExportFormatChange(null)
    }

    // Date preset options
    const datePresets = [
        { value: 'last-7-days', label: 'Last 7 Days' },
        { value: 'last-30-days', label: 'Last 30 Days' },
        { value: 'last-90-days', label: 'Last 90 Days' },
        { value: 'year-to-date', label: 'Year to Date' },
        { value: 'custom', label: 'Custom Range' },
    ]

    // Role filter options
    const roleOptions = [
        { value: 'all', label: 'All Roles' },
        { value: 'doctor', label: 'Doctors' },
        { value: 'facility_admin', label: 'Facility Admins' },
        { value: 'nurse', label: 'Nurses' },
        { value: 'parent', label: 'Parents' },
        { value: 'staff', label: 'Staff' },
    ]

    // Export format options
    const exportFormats = [
        { value: 'xlsx', label: 'Excel (XLSX)', icon: '📊' },
        { value: 'csv', label: 'CSV', icon: '📄' },
        { value: 'json', label: 'JSON', icon: '{ }' },
        { value: 'txt', label: 'Text', icon: '📝' },
    ]

    return (
        <div className="bg-white rounded-xl shadow-sm ">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Report Filters</h3>
                        {hasActiveFilters && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Active
                            </span>
                        )}
                        {cacheInfo?.cached && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Cached ({Math.floor(cacheInfo.cache_expires_in / 60)}m)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg inline-flex items-center gap-1 transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Options Grid */}
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Preset Selector */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Date Range
                        </label>
                        <Select value={datePreset} onValueChange={onDatePresetChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {datePresets.map((preset) => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* User Role Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            User Role
                        </label>
                        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {roleOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Export Format Selector */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Export Format
                        </label>
                        <Select value={exportFormat || ''} onValueChange={onExportFormatChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {exportFormats.map((format) => (
                                        <SelectItem key={format.value} value={format.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{format.icon}</span>
                                                <span>{format.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-end">
                        <Button
                            onClick={onExport}
                            disabled={!exportFormat}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Custom Date Range (shown when preset is 'custom') */}
                {datePreset === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate || ''}
                                onChange={(e) =>
                                    onDateRangeChange({
                                        ...dateRange,
                                        startDate: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate || ''}
                                onChange={(e) =>
                                    onDateRangeChange({
                                        ...dateRange,
                                        endDate: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReportFilters
