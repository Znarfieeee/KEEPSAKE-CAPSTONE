import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/skeleton'
import { Filter } from 'lucide-react'

/**
 * Skeleton loader for Audit Stats Cards
 * Shows 5 cards with animated loading state
 */
export const AuditStatsCardsSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, index) => (
                <Card key={index}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            <Skeleton className="h-4 w-24" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-5 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

/**
 * Skeleton loader for Audit Filters
 * Shows filter card with loading inputs
 */
export const AuditFiltersSkeleton = () => {
    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <CardTitle>
                            <Skeleton className="h-6 w-16" />
                        </CardTitle>
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Search field */}
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>

                        {/* Action Type */}
                        <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>

                        {/* Table Name */}
                        <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>

                        {/* Start Date */}
                        <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>

                        {/* End Date */}
                        <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="border-t pt-4 flex justify-end gap-2">
                        <Skeleton className="h-9 w-16" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton loader for Audit Logs Table
 * Shows table structure with loading rows
 */
export const AuditLogsTableSkeleton = ({ rows = 5 }) => {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-300 text-xs uppercase text-muted-foreground">
                            <tr className="text-left">
                                <th className="py-3 px-4">Timestamp</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Table</th>
                                <th className="py-3 px-4">IP Address</th>
                                <th className="py-3 px-4">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(rows)].map((_, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-200 last:border-none"
                                >
                                    {/* Timestamp */}
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </td>

                                    {/* User */}
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    </td>

                                    {/* Action */}
                                    <td className="py-3 px-4">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </td>

                                    {/* Table Name */}
                                    <td className="py-3 px-4">
                                        <Skeleton className="h-6 w-24 rounded" />
                                    </td>

                                    {/* IP Address */}
                                    <td className="py-3 px-4">
                                        <Skeleton className="h-4 w-28" />
                                    </td>

                                    {/* Details Button */}
                                    <td className="py-3 px-4">
                                        <Skeleton className="h-8 w-16 rounded" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Skeleton */}
                    <div className="flex justify-between items-center px-4 py-4 border-t border-gray-200">
                        <Skeleton className="h-4 w-40" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-9 w-20" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Complete page skeleton for Audit Logs
 * Combines all component skeletons for initial page load
 */
export const AuditLogsPageSkeleton = () => {
    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded" />
                    <Skeleton className="h-9 w-9 rounded" />
                    <Skeleton className="h-9 w-9 rounded" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <AuditStatsCardsSkeleton />

            {/* Filters Skeleton */}
            <AuditFiltersSkeleton />

            {/* Table Skeleton */}
            <AuditLogsTableSkeleton rows={10} />
        </div>
    )
}

/**
 * Compact skeleton for stats cards only
 * Useful when only refreshing stats
 */
export const StatsOnlySkeleton = () => {
    return <AuditStatsCardsSkeleton />
}

/**
 * Compact skeleton for table only
 * Useful when filtering/paginating
 */
export const TableOnlySkeleton = ({ rows = 5 }) => {
    return <AuditLogsTableSkeleton rows={rows} />
}
