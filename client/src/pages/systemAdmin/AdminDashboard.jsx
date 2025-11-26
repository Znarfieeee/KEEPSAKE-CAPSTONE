import React, { useState, useEffect, useMemo } from 'react'
import {
    BarChart,
    LineChart,
    PieChart,
    Line,
    Bar,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import {
    Building2,
    Users,
    DollarSign,
    Heart,
    AlertCircle,
    RefreshCw,
    UserCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import ActiveUsersByRole from '@/components/System Administrator/sysAdmin_dashboard/ActiveUsersByRole'
import { getAdminDashboardMetrics } from '@/api/admin/dashboard'

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [subscriptionView, setSubscriptionView] = useState('facility') // 'facility' or 'parent'

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await getAdminDashboardMetrics()

            if (response?.status === 'success') {
                setDashboardData(response.data)
            }
        } catch {
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    // Calculate subscription data based on selected view
    const subscriptionData = useMemo(() => {
        if (!dashboardData) return []

        if (subscriptionView === 'facility') {
            // Facility subscription distribution by plan type
            if (!dashboardData?.facility_subscriptions) return []
            return [
                {
                    name: 'Standard',
                    value: dashboardData.facility_subscriptions.standard,
                    color: '#3b82f6', // Blue
                },
                {
                    name: 'Premium',
                    value: dashboardData.facility_subscriptions.premium,
                    color: '#8b5cf6', // Purple
                },
                {
                    name: 'Enterprise',
                    value: dashboardData.facility_subscriptions.enterprise,
                    color: '#f59e0b', // Orange
                },
            ].filter((item) => item.value > 0)
        } else {
            // Parent subscription distribution
            if (!dashboardData?.parent_subscriptions) return []
            const total = dashboardData.parent_subscriptions.total || 0
            const subscribed = dashboardData.parent_subscriptions.subscribed || 0
            const notSubscribed = total - subscribed

            return [
                {
                    name: 'Subscribed',
                    value: subscribed,
                    color: '#10b981',
                },
                {
                    name: 'Not Subscribed',
                    value: notSubscribed,
                    color: '#ef4444',
                },
            ].filter((item) => item.value > 0)
        }
    }, [dashboardData, subscriptionView])

    const StatCard = ({ icon: Icon, title, value, growth, subtitle, colorClass }) => {
        const colorStyles = {
            blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
            green: 'border-green-200 bg-gradient-to-br from-green-50 to-white',
            purple: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white',
            orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
        }
        const iconColors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
        }

        return (
            <div
                className={`${
                    colorStyles[colorClass] || colorStyles.blue
                } border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 h-full`}
            >
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                        {growth !== undefined && growth !== null && (
                            <p className="text-xs text-gray-600">
                                {growth > 0 ? '↑' : growth < 0 ? '↓' : ''}{' '}
                                {Math.abs(growth).toFixed(1)}% from last month
                            </p>
                        )}
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    </div>
                    {Icon && (
                        <div
                            className={`${
                                iconColors[colorClass] || iconColors.blue
                            } p-2 rounded-lg flex items-center justify-center`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="grid grid-cols-12 gap-4">
                    <Skeleton className="col-span-6 h-64" />
                    <Skeleton className="col-span-3 h-64" />
                    <Skeleton className="col-span-3 h-64" />
                    <Skeleton className="col-span-6 h-56" />
                    <Skeleton className="col-span-6 h-56" />
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg text-gray-700 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 grid-rows-auto gap-4">
                {/* Row 1: Stat Cards - 12 cols */}
                <div className="col-span-12 grid grid-cols-4 gap-4">
                    <StatCard
                        icon={Building2}
                        title="Total Facilities"
                        value={
                            dashboardData?.core_metrics?.total_facilities?.toLocaleString() || '0'
                        }
                        growth={dashboardData?.core_metrics?.facilities_growth}
                        colorClass="blue"
                    />
                    <StatCard
                        icon={Users}
                        title="Active Users"
                        value={dashboardData?.core_metrics?.active_users?.toLocaleString() || '0'}
                        growth={dashboardData?.core_metrics?.users_growth}
                        colorClass="green"
                    />
                    <StatCard
                        icon={Heart}
                        title="System Health"
                        value={`${
                            dashboardData?.core_metrics?.system_health?.toFixed(1) || '0.0'
                        }%`}
                        growth={dashboardData?.core_metrics?.health_trend}
                        colorClass="purple"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="Monthly Revenue"
                        value={`$${
                            dashboardData?.core_metrics?.monthly_revenue?.toLocaleString() || '0'
                        }`}
                        growth={dashboardData?.core_metrics?.revenue_growth}
                        colorClass="orange"
                    />
                </div>

                {/* Row 2-3: Charts */}
                {/* Monthly Revenue Chart - 6 cols, 3 rows */}
                <div className="col-span-6 row-span-3 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Monthly Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dashboardData?.monthly_revenue_trend || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                name="Actual Revenue"
                            />
                            <Line
                                type="monotone"
                                dataKey="target"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Target"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Subscription Distribution - 3 cols, 3 rows */}
                <div className="col-span-3 row-span-3 bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900">
                            Subscription Distribution
                        </h3>
                        {/* Icon Toggle Buttons */}
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setSubscriptionView('facility')}
                                className={`p-1.5 rounded transition-colors ${
                                    subscriptionView === 'facility'
                                        ? 'bg-primary text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Facilities"
                            >
                                <Building2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setSubscriptionView('parent')}
                                className={`p-1.5 rounded transition-colors ${
                                    subscriptionView === 'parent'
                                        ? 'bg-primary text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Parents"
                            >
                                <UserCircle className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {subscriptionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={subscriptionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {subscriptionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-lg">
                                                    <p className="text-xs font-medium text-gray-900">
                                                        {payload[0].name}: {payload[0].value}
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value, entry) => (
                                        <span className="text-xs text-gray-700">
                                            {value} ({entry.payload.value})
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[180px]">
                            <p className="text-sm text-gray-500">No data available</p>
                        </div>
                    )}
                </div>

                {/* System Monitoring - 3 cols, 3 rows */}
                <div className="col-span-3 row-span-3 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Database Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dashboardData?.system_monitoring || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" angle={-45} textAnchor="end" height={70} />
                            <YAxis domain={[90, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avg_query_time"
                                stroke="#3b82f6"
                                name="Avg Query %"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="p95_query_time"
                                stroke="#10b981"
                                name="P95 Query %"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Row 4: Weekly Active Users - 6 cols */}
                <div className="col-span-6 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Weekly Active Users
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dashboardData?.weekly_active_users || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="active_users"
                                fill="#3b82f6"
                                radius={[8, 8, 0, 0]}
                                name="Active Users"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Active Users by Role - 6 cols */}
                <div className="col-span-6">
                    <ActiveUsersByRole usersByRole={dashboardData?.users_by_role || {}} />
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
