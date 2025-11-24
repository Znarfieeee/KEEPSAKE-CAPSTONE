import React, { useState } from 'react'
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
    AlertTriangle,
    DollarSign,
    TrendingUp,
    Activity,
    Users2,
    Heart,
} from 'lucide-react'
import TotalFacilities from '@/components/System Administrator/sysAdmin_dashboard/TotalFacilities'
import ActiveUsers from '@/components/System Administrator/sysAdmin_dashboard/ActiveUsers'
import SystemHealth from '@/components/System Administrator/sysAdmin_dashboard/SystemHealth'
import MonthlyRevenue from '@/components/System Administrator/sysAdmin_dashboard/MonthlyRevenue'
import ActiveUsersByRole from '@/components/System Administrator/sysAdmin_dashboard/ActiveUsersByRole'
import SystemMonitoring from '@/components/System Administrator/sysAdmin_dashboard/SystemMonitoring'
import FacilitySubscriptions from '@/components/System Administrator/sysAdmin_dashboard/FacilitySubscriptions'
import ParentSubscriptions from '@/components/System Administrator/sysAdmin_dashboard/ParentSubscriptions'
import RevenueSources from '@/components/System Administrator/sysAdmin_dashboard/RevenueSources'

const AdminDashboard = () => {
    const [dashboardData] = useState({
        totalFacilities: 1247,
        activeUsers: 5840,
        systemHealth: 98.7,
        monthlyRevenue: 125000,
        facilitiesGrowth: 12,
        usersGrowth: 8,
        healthTrend: 2.3,
        revenueGrowth: 15,
    })

    // Monthly revenue data
    const monthlyRevenueData = [
        { month: 'Jan', revenue: 98000, target: 100000 },
        { month: 'Feb', revenue: 102000, target: 100000 },
        { month: 'Mar', revenue: 108000, target: 110000 },
        { month: 'Apr', revenue: 115000, target: 115000 },
        { month: 'May', revenue: 120000, target: 120000 },
        { month: 'Jun', revenue: 125000, target: 125000 },
    ]

    // Subscription data
    const subscriptionData = [
        { name: 'Premium', value: 450, color: '#3b82f6' },
        { name: 'Basic', value: 320, color: '#f59e0b' },
    ]

    // System monitoring data
    const systemMonitoringData = [
        { time: '12:00 AM', uptime: 99.9, performance: 98 },
        { time: '3:00 AM', uptime: 99.8, performance: 97.5 },
        { time: '6:00 AM', uptime: 99.95, performance: 98.5 },
        { time: '9:00 AM', uptime: 99.7, performance: 96.8 },
        { time: '12:00 PM', uptime: 99.85, performance: 98 },
        { time: '3:00 PM', uptime: 99.9, performance: 98.2 },
        { time: '6:00 PM', uptime: 99.88, performance: 97.9 },
    ]

    // Parent subscriptions growth
    const parentSubscriptionsGrowth = [
        { month: 'Week 1', parents: 2400 },
        { month: 'Week 2', parents: 2700 },
        { month: 'Week 3', parents: 3200 },
        { month: 'Week 4', parents: 3800 },
    ]

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
                } border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 h-full`}
            >
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                        {growth && (
                            <p className="text-xs text-gray-600 mt-2">
                                {growth > 0 ? '↑' : '↓'} {Math.abs(growth)}% from last month
                            </p>
                        )}
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    </div>
                    {Icon && (
                        <div
                            className={`${
                                iconColors[colorClass] || iconColors.blue
                            } p-3 rounded-lg flex items-center justify-center`}
                        >
                            <Icon className="h-6 w-6" />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">System overview and analytics</p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 grid-rows-auto gap-6">
                {/* Row 1: Stat Cards - 12 cols */}
                <div className="col-span-12 grid grid-cols-4 gap-6">
                    <StatCard
                        icon={Building2}
                        title="Total Facilities"
                        value={dashboardData.totalFacilities.toLocaleString()}
                        growth={dashboardData.facilitiesGrowth}
                        colorClass="blue"
                    />
                    <StatCard
                        icon={Users}
                        title="Active Users"
                        value={dashboardData.activeUsers.toLocaleString()}
                        growth={dashboardData.usersGrowth}
                        colorClass="green"
                    />
                    <StatCard
                        icon={Heart}
                        title="System Health"
                        value={`${dashboardData.systemHealth}%`}
                        growth={dashboardData.healthTrend}
                        colorClass="purple"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="Monthly Revenue"
                        value={`$${(dashboardData.monthlyRevenue / 1000).toFixed(0)}K`}
                        growth={dashboardData.revenueGrowth}
                        colorClass="orange"
                    />
                </div>

                {/* Row 2-3: Charts */}
                {/* Monthly Revenue Chart - 6 cols, 3 rows */}
                <div className="col-span-6 row-span-3 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Monthly Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyRevenueData}>
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
                                dot={{ fill: '#3b82f6', r: 5 }}
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
                <div className="col-span-3 row-span-3 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Subscription Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={subscriptionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name} (${value})`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {subscriptionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* System Monitoring - 3 cols, 3 rows */}
                <div className="col-span-3 row-span-3 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Monitoring</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={systemMonitoringData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                            <YAxis domain={[95, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="uptime"
                                stroke="#10b981"
                                name="Uptime %"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="performance"
                                stroke="#3b82f6"
                                name="Performance %"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Row 4: Parent Subscriptions Growth - 6 cols */}
                <div className="col-span-6 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Parent Subscriptions Growth
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={parentSubscriptionsGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="parents"
                                fill="#8b5cf6"
                                radius={[8, 8, 0, 0]}
                                name="Active Parents"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Active Users by Role - 6 cols */}
                <div className="col-span-6">
                    <ActiveUsersByRole />
                </div>

                {/* Bottom Section - Component Cards */}
                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Facilities
                        </h3>
                        <TotalFacilities />
                    </div>
                </div>

                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            Active Users
                        </h3>
                        <ActiveUsers />
                    </div>
                </div>

                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-purple-600" />
                            System Health
                        </h3>
                        <SystemHealth />
                    </div>
                </div>

                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-orange-600" />
                            Revenue
                        </h3>
                        <MonthlyRevenue />
                    </div>
                </div>

                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users2 className="w-5 h-5 text-indigo-600" />
                            Facility Subscriptions
                        </h3>
                        <FacilitySubscriptions />
                    </div>
                </div>

                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-pink-600" />
                            Parent Subscriptions
                        </h3>
                        <ParentSubscriptions />
                    </div>
                </div>

                <div className="col-span-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                            Revenue Sources
                        </h3>
                        <RevenueSources />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
