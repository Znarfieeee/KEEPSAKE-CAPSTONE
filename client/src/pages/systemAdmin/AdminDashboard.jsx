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
    PhilippinePesoIcon,
    Heart,
    AlertCircle,
    RefreshCw,
    UserCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import ActiveUsersByRole from '@/components/System Administrator/sysAdmin_dashboard/ActiveUsersByRole'
import { getAdminDashboardMetrics } from '@/api/admin/dashboard'

// Service Health Bar Component
const ServiceHealthBar = ({ label, value, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
        indigo: 'bg-indigo-500',
    }

    const getHealthColor = (val) => {
        if (val >= 90) return colorClasses[color] || 'bg-green-500'
        if (val >= 70) return 'bg-yellow-500'
        if (val >= 50) return 'bg-orange-500'
        return 'bg-red-500'
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-semibold text-gray-900">{value.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(value)}`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    )
}

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

    // Helper component for loading state within stat cards
    const StatCardSkeleton = ({ icon: Icon, title, colorClass }) => {
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
                } border rounded-xl p-4 shadow-sm h-full`}
            >
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <p className="text-xs font-medium text-gray-600">{title}</p>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-32" />
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
                    {loading ? (
                        <>
                            <StatCardSkeleton
                                icon={Building2}
                                title="Total Facilities"
                                colorClass="blue"
                            />
                            <StatCardSkeleton
                                icon={Users}
                                title="Active Users"
                                colorClass="green"
                            />
                            <StatCardSkeleton
                                icon={Heart}
                                title="System Health"
                                colorClass="purple"
                            />
                            <StatCardSkeleton
                                icon={PhilippinePesoIcon}
                                title="Monthly Revenue"
                                colorClass="orange"
                            />
                        </>
                    ) : (
                        <>
                            <StatCard
                                icon={Building2}
                                title="Total Facilities"
                                value={
                                    dashboardData?.core_metrics?.total_facilities?.toLocaleString() ||
                                    '0'
                                }
                                growth={dashboardData?.core_metrics?.facilities_growth}
                                colorClass="blue"
                            />
                            <StatCard
                                icon={Users}
                                title="Active Users"
                                value={
                                    dashboardData?.core_metrics?.active_users?.toLocaleString() || '0'
                                }
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
                                icon={PhilippinePesoIcon}
                                title="Monthly Revenue"
                                value={`₱${
                                    dashboardData?.core_metrics?.monthly_revenue?.toLocaleString() ||
                                    '0'
                                }`}
                                growth={dashboardData?.core_metrics?.revenue_growth}
                                colorClass="orange"
                            />
                        </>
                    )}
                </div>

                {/* Row 2-3: Charts */}
                {/* Monthly Revenue Chart - 6 cols, 3 rows */}
                <div className="col-span-6 row-span-3 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Monthly Revenue Trend
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-[250px] w-full" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={dashboardData?.monthly_revenue_trend || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#d1d5db' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickFormatter={(value) =>
                                        `₱${(value / 1000).toFixed(0)}k`
                                    }
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                    formatter={(value, name) => [
                                        `₱${value.toLocaleString()}`,
                                        name,
                                    ]}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '10px' }}
                                    iconType="line"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 7 }}
                                    name="Actual Revenue"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                    name="Target"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
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
                                disabled={loading}
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
                                disabled={loading}
                            >
                                <UserCircle className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-[180px] w-full" />
                        </div>
                    ) : subscriptionData.length > 0 ? (
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

                {/* Supabase Infrastructure Health - 3 cols, 3 rows */}
                <div className="col-span-3 row-span-3 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Infrastructure Health
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-[250px] w-full" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Overall Health Score */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Overall Health</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {dashboardData?.infrastructure_health?.overall?.toFixed(1) || '0.0'}%
                                    </span>
                                </div>
                            </div>

                            {/* Individual Service Health */}
                            <div className="space-y-2">
                                <ServiceHealthBar
                                    label="Database"
                                    value={dashboardData?.infrastructure_health?.database || 0}
                                    color="blue"
                                />
                                <ServiceHealthBar
                                    label="Auth"
                                    value={dashboardData?.infrastructure_health?.auth || 0}
                                    color="green"
                                />
                                <ServiceHealthBar
                                    label="Storage"
                                    value={dashboardData?.infrastructure_health?.storage || 0}
                                    color="purple"
                                />
                                <ServiceHealthBar
                                    label="Realtime"
                                    value={dashboardData?.infrastructure_health?.realtime || 0}
                                    color="orange"
                                />
                                <ServiceHealthBar
                                    label="Edge Functions"
                                    value={dashboardData?.infrastructure_health?.edge_functions || 0}
                                    color="indigo"
                                />
                            </div>

                            {/* Issues Display */}
                            {dashboardData?.infrastructure_health?.issues?.length > 0 && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs font-semibold text-red-700 mb-1">Active Issues:</p>
                                    <div className="space-y-1">
                                        {dashboardData.infrastructure_health.issues.map((issue, idx) => (
                                            <p key={idx} className="text-xs text-red-600">
                                                • {issue.service}: {issue.message}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* System Monitoring - 6 cols */}
                <div className="col-span-6 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Database Performance
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-[250px] w-full" />
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Row 4: Weekly Active Users - 6 cols */}
                <div className="col-span-6 bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Weekly Active Users
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-[220px] w-full" />
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Active Users by Role - 6 cols */}
                <div className="col-span-6">
                    {loading ? (
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <Skeleton className="h-8 w-48 mb-3" />
                            <Skeleton className="h-[220px] w-full" />
                        </div>
                    ) : (
                        <ActiveUsersByRole usersByRole={dashboardData?.users_by_role || {}} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
