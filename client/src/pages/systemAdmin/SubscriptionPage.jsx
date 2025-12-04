import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from '@/context/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getSubscriptionAnalytics } from '@/api/admin/subscription'
import Unauthorized from '@/components/Unauthorized'

// Direct imports for critical components
import SubscriptionMetrics from '@/components/System Administrator/sysAdmin_subscription/SubscriptionMetrics'
import SubscriptionFilters from '@/components/System Administrator/sysAdmin_subscription/SubscriptionFilters'

// Lazy load heavy components
const InvoiceManagement = lazy(() =>
    import('@/components/System Administrator/sysAdmin_subscription/InvoiceManagement')
)
const PaymentHistory = lazy(() =>
    import('@/components/System Administrator/sysAdmin_subscription/PaymentHistory')
)
const SubscriptionAnalytics = lazy(() =>
    import('@/components/System Administrator/sysAdmin_subscription/SubscriptionAnalytics')
)
const EmailNotifications = lazy(() =>
    import('@/components/System Administrator/sysAdmin_subscription/EmailNotifications')
)
const ParentSubscriptionsManagement = lazy(() =>
    import('@/components/System Administrator/sysAdmin_subscription/ParentSubscriptionsManagement')
)

const SubscriptionPage = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [analyticsData, setAnalyticsData] = useState(null)

    // Filters
    const [dateRange, setDateRange] = useState({ start: null, end: null })
    const [statusFilter, setStatusFilter] = useState('all')
    const [planFilter, setPlanFilter] = useState('all')

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async (bustCache = false) => {
        try {
            setLoading(true)
            setError(null)
            const response = await getSubscriptionAnalytics(bustCache)

            if (response?.status === 'success') {
                setAnalyticsData(response.data)
            } else {
                setError('Failed to load subscription data')
            }
        } catch (err) {
            console.error('Error fetching analytics:', err)
            setError('Failed to load subscription data')
        } finally {
            setLoading(false)
        }
    }

    // Role guard
    if (user.role !== 'admin') {
        return <Unauthorized />
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 px-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
                    <p className="text-gray-600 mt-1">
                        Manage facility subscriptions, invoices, and payments
                    </p>
                </div>
                <button
                    onClick={() => fetchAnalytics(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-white rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchAnalytics(true)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Metrics Overview */}
            <SubscriptionMetrics data={analyticsData} loading={loading} />

            {/* Filters */}
            <SubscriptionFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                planFilter={planFilter}
                onPlanChange={setPlanFilter}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white border border-gray-200">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="payments">Payment History</TabsTrigger>
                    <TabsTrigger value="parent-subscriptions">Parent Subscriptions</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <Suspense
                    fallback={
                        <div className="bg-white rounded-xl p-6">
                            <Skeleton className="h-96" />
                        </div>
                    }
                >
                    <TabsContent value="overview">
                        <SubscriptionAnalytics
                            data={analyticsData}
                            filters={{ statusFilter, planFilter }}
                        />
                    </TabsContent>

                    <TabsContent value="invoices">
                        <InvoiceManagement filters={{ dateRange, statusFilter }} />
                    </TabsContent>

                    <TabsContent value="payments">
                        <PaymentHistory filters={{ dateRange, statusFilter }} />
                    </TabsContent>

                    <TabsContent value="parent-subscriptions">
                        <ParentSubscriptionsManagement />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <SubscriptionAnalytics
                            data={analyticsData}
                            filters={{ statusFilter, planFilter }}
                            detailed
                        />
                    </TabsContent>

                    <TabsContent value="notifications">
                        <EmailNotifications />
                    </TabsContent>
                </Suspense>
            </Tabs>
        </div>
    )
}

export default SubscriptionPage
