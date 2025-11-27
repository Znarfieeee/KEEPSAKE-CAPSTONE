import React from 'react'
import { PhilippinePeso, Building2, TrendingUp, AlertCircle } from 'lucide-react'

const StatCard = ({ icon: Icon, title, value, subtitle, trend, colorClass, loading }) => {
    const colorStyles = {
        blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
        green: 'border-green-200 bg-gradient-to-br from-green-50 to-white',
        orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
        red: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
    }
    const iconColors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600',
    }

    return (
        <div
            className={`${
                colorStyles[colorClass] || colorStyles.blue
            } rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {loading ? (
                        <>
                            <div className="h-9 bg-gray-300 rounded animate-pulse w-3/4" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                        </>
                    ) : (
                        <>
                            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                            {trend && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {trend}
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div className={`${iconColors[colorClass] || iconColors.blue} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    )
}

const SubscriptionMetrics = ({ data, loading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={PhilippinePeso}
                title="Total Revenue (YTD)"
                value={loading ? null : `₱${(data?.total_revenue_ytd || 0).toLocaleString()}`}
                subtitle="Year to date earnings"
                colorClass="green"
                loading={loading}
            />
            <StatCard
                icon={Building2}
                title="Active Subscriptions"
                value={loading ? null : (data?.total_active_subscriptions || 0).toLocaleString()}
                subtitle="Currently subscribed facilities"
                colorClass="blue"
                loading={loading}
            />
            <StatCard
                icon={TrendingUp}
                title="Avg Revenue/Facility"
                value={
                    loading
                        ? null
                        : `₱${(data?.average_revenue_per_facility || 0).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          })}`
                }
                subtitle="Per facility average"
                colorClass="orange"
                loading={loading}
            />
            <StatCard
                icon={AlertCircle}
                title="Expiring Soon"
                value={loading ? null : data?.expiring_soon_count || '0'}
                subtitle="Next 30 days"
                colorClass="red"
                loading={loading}
            />
        </div>
    )
}

export default SubscriptionMetrics
