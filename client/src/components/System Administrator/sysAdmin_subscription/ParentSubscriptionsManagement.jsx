import React, { useState, useEffect } from 'react'
import {
    getParentSubscriptions,
    getParentSubscriptionAnalytics,
} from '@/api/admin/parentSubscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, DollarSign, Activity, Filter, Download } from 'lucide-react'

const ParentSubscriptionsManagement = () => {
    const [subscriptions, setSubscriptions] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        status: '',
        plan_type: '',
        page: 1,
        per_page: 50,
    })
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        fetchData()
    }, [filters])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch subscriptions and analytics in parallel
            const [subsResp, analyticsResp] = await Promise.all([
                getParentSubscriptions(filters),
                getParentSubscriptionAnalytics(),
            ])

            if (subsResp.status === 'success') {
                setSubscriptions(subsResp.data || [])
                setPagination(subsResp.pagination)
            }

            if (analyticsResp.status === 'success') {
                setAnalytics(analyticsResp.data)
            }
        } catch (error) {
            console.error('Error fetching parent subscriptions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: 1, // Reset to first page when filters change
        }))
    }

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }))
    }

    const getStatusBadge = (status) => {
        const variants = {
            active: 'default',
            cancelled: 'secondary',
            past_due: 'destructive',
            trialing: 'outline',
            incomplete: 'outline',
        }
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
    }

    const getPlanBadge = (planType) => {
        return planType === 'premium' ? (
            <Badge className="bg-blue-600 hover:bg-blue-700">Premium</Badge>
        ) : (
            <Badge variant="secondary">Free</Badge>
        )
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const formatCurrency = (amount) => {
        return `₱${parseFloat(amount).toFixed(2)}`
    }

    if (loading && !analytics) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading parent subscriptions...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Subscriptions
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {analytics.total_subscriptions}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {analytics.free_subscribers} free, {analytics.premium_subscribers}{' '}
                                premium
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Premium Subscribers
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {analytics.premium_subscribers}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {analytics.conversion_rate}% conversion rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(analytics.monthly_revenue)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                ARPU: {formatCurrency(analytics.arpu)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Subscriptions
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {analytics.active_subscriptions}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {analytics.past_due_subscriptions} past due,{' '}
                                {analytics.expiring_soon} expiring soon
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Actions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Parent Subscriptions</CardTitle>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchData}
                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Refresh
                            </button>
                            <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="past_due">Past Due</option>
                            <option value="trialing">Trialing</option>
                        </select>

                        <select
                            value={filters.plan_type}
                            onChange={(e) => handleFilterChange('plan_type', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Plans</option>
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                        </select>

                        {(filters.status || filters.plan_type) && (
                            <button
                                onClick={() =>
                                    setFilters({ status: '', plan_type: '', page: 1, per_page: 50 })
                                }
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Subscriptions Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-4 font-medium text-gray-700">
                                        Parent Name
                                    </th>
                                    <th className="text-left p-4 font-medium text-gray-700">
                                        Email
                                    </th>
                                    <th className="text-left p-4 font-medium text-gray-700">
                                        Plan
                                    </th>
                                    <th className="text-left p-4 font-medium text-gray-700">
                                        Status
                                    </th>
                                    <th className="text-left p-4 font-medium text-gray-700">
                                        Current Period
                                    </th>
                                    <th className="text-left p-4 font-medium text-gray-700">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.length > 0 ? (
                                    subscriptions.map((sub) => (
                                        <tr
                                            key={sub.subscription_id}
                                            className="border-b hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">
                                                    {sub.users?.first_name} {sub.users?.last_name}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-600">
                                                    {sub.users?.email}
                                                </div>
                                            </td>
                                            <td className="p-4">{getPlanBadge(sub.plan_type)}</td>
                                            <td className="p-4">{getStatusBadge(sub.status)}</td>
                                            <td className="p-4">
                                                {sub.current_period_start &&
                                                sub.current_period_end ? (
                                                    <div className="text-sm text-gray-600">
                                                        {formatDate(sub.current_period_start)} -{' '}
                                                        {formatDate(sub.current_period_end)}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        N/A
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-600">
                                                    {formatDate(sub.created_at)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            {loading ? 'Loading...' : 'No subscriptions found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total_pages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <div className="text-sm text-gray-600">
                                Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
                                {Math.min(pagination.page * pagination.per_page, pagination.total)}{' '}
                                of {pagination.total} subscriptions
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="px-4 py-1.5 text-sm text-gray-700">
                                    Page {pagination.page} of {pagination.total_pages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.total_pages}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ParentSubscriptionsManagement
