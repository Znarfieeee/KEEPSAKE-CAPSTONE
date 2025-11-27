import React from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { X, Filter } from 'lucide-react'

const SubscriptionFilters = ({
    dateRange,
    onDateRangeChange,
    statusFilter,
    onStatusChange,
    planFilter,
    onPlanChange,
}) => {
    const hasActiveFilters =
        statusFilter !== 'all' ||
        planFilter !== 'all' ||
        dateRange.start ||
        dateRange.end

    const clearFilters = () => {
        onStatusChange('all')
        onPlanChange('all')
        onDateRangeChange({ start: null, end: null })
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                        {hasActiveFilters && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Active
                            </span>
                        )}
                    </div>
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

            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Status
                        </label>
                        <Select value={statusFilter} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Plan
                        </label>
                        <Select value={planFilter} onValueChange={onPlanChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Plans" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    <SelectItem value="standard">
                                        Standard (₱5,544/mo)
                                    </SelectItem>
                                    <SelectItem value="premium">
                                        Premium (₱11,144/mo)
                                    </SelectItem>
                                    <SelectItem value="enterprise">
                                        Enterprise (₱22,344/mo)
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.start || ''}
                            onChange={(e) =>
                                onDateRangeChange({ ...dateRange, start: e.target.value })
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
                            value={dateRange.end || ''}
                            onChange={(e) =>
                                onDateRangeChange({ ...dateRange, end: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SubscriptionFilters
