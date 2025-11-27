import React from 'react'

/**
 * Loading skeleton component for DataReports page
 * Displays placeholder content while data is being fetched
 */
const ReportsSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Stat boxes skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-200 rounded-lg h-24"
                    />
                ))}
            </div>

            {/* Filters skeleton */}
            <div className="bg-gray-200 rounded-xl h-32" />

            {/* Report type selector skeleton */}
            <div className="bg-gray-200 rounded-xl h-16" />

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-200 rounded-xl h-80" />
                <div className="bg-gray-200 rounded-xl h-80" />
            </div>

            {/* Additional charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-200 rounded-xl h-80" />
                <div className="bg-gray-200 rounded-xl h-80" />
            </div>

            {/* Table skeleton */}
            <div className="bg-gray-200 rounded-xl h-96" />
        </div>
    )
}

/**
 * Skeleton for individual stat box
 */
export const StatBoxSkeleton = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
            </div>
        </div>
    )
}

/**
 * Skeleton for chart component
 */
export const ChartSkeleton = ({ height = 300 }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
            <div
                className="bg-gray-200 rounded"
                style={{ height: `${height}px` }}
            />
        </div>
    )
}

/**
 * Skeleton for table component
 */
export const TableSkeleton = ({ rows = 5 }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
            {/* Table header */}
            <div className="bg-gray-100 px-6 py-4 border-b">
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded" />
                    ))}
                </div>
            </div>

            {/* Table rows */}
            <div className="divide-y">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="px-6 py-4">
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ReportsSkeleton
