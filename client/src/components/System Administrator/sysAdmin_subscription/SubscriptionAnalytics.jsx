import React from 'react'
import {
    LineChart,
    BarChart,
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

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']

const SubscriptionAnalytics = ({ data, filters, detailed = false }) => {
    if (!data) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        )
    }

    // Plan distribution chart data
    const planData = Object.entries(data.plan_distribution || {}).map(([plan, count]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count,
    }))

    // Status distribution chart data
    const statusData = Object.entries(data.status_distribution || {}).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
    }))

    // Revenue by plan
    const revenueByPlanData = Object.entries(data.revenue_by_plan || {}).map(([plan, revenue]) => ({
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        revenue,
    }))

    return (
        <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Monthly Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.monthly_revenue_trend || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₱${value.toLocaleString('en-PH')}`} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Revenue"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Plan Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={planData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {planData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Plan */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={revenueByPlanData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="revenue"
                                nameKey="plan"
                            >
                                {revenueByPlanData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) =>
                                    `₱${value.toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`
                                }
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry) =>
                                    `${value}: ₱${entry.payload.revenue.toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Subscription Status
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expiring Soon List */}
            {data.expiring_soon && data.expiring_soon.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Subscriptions Expiring Soon
                    </h3>
                    <div className="space-y-2">
                        {data.expiring_soon.map((facility) => (
                            <div
                                key={facility.facility_id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {facility.facility_name}
                                    </p>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {facility.plan} Plan
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-red-600">
                                        Expires:{' '}
                                        {new Date(
                                            facility.subscription_expires
                                        ).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {Math.ceil(
                                            (new Date(facility.subscription_expires) - new Date()) /
                                                (1000 * 60 * 60 * 24)
                                        )}{' '}
                                        days left
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SubscriptionAnalytics
