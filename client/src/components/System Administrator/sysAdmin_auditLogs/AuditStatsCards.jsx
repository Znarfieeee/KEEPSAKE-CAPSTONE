import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuditStatsCardsSkeleton } from './AuditLogsSkeleton'

const AuditStatsCards = ({ stats, statsLoading }) => {
    // Use backend-calculated total if available, otherwise calculate from action_stats
    const totalActions = stats?.total_actions !== undefined
        ? stats.total_actions
        : (stats?.action_stats?.create || 0) +
          (stats?.action_stats?.update || 0) +
          (stats?.action_stats?.delete || 0) +
          (stats?.action_stats?.view || 0)

    // Show skeleton while loading
    if (statsLoading) {
        return <AuditStatsCardsSkeleton />
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalActions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Creates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {(stats?.action_stats?.create || 0).toLocaleString()}
                    </div>
                    <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                        CREATE
                    </Badge>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Updates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {(stats?.action_stats?.update || 0).toLocaleString()}
                    </div>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-300">
                        UPDATE
                    </Badge>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Deletes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {(stats?.action_stats?.delete || 0).toLocaleString()}
                    </div>
                    <Badge className="mt-1 bg-red-100 text-red-800 border-red-300">DELETE</Badge>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Last 24h
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {(stats?.recent_activity_24h || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
                </CardContent>
            </Card>
        </div>
    )
}

export default AuditStatsCards
