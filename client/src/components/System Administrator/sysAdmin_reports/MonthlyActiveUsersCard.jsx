import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Calendar, TrendingUp, Users } from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import MonthSelector from './MonthSelector'

const MonthlyActiveUsersCard = ({ mauData, selectedMonth, onMonthChange }) => {
    // Check if mauData exists and has required structure
    const hasData = mauData && mauData.currentMonth && typeof mauData.currentMonth.total !== 'undefined'

    if (!hasData) {
        return (
            <Card className="border border-gray-200 shadow-sm mb-8">
                <CardHeader className="border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users size={20} />
                            Monthly Active Users (MAU)
                        </CardTitle>
                        <MonthSelector value={selectedMonth} onChange={onMonthChange} />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                        <p className="text-lg font-medium mb-2">
                            No MAU data available for selected month
                        </p>
                        <p className="text-sm text-gray-400">
                            Try selecting a different month or check if the get_mau_by_week function
                            is configured
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const { currentMonth } = mauData
    const avgWeekly = Math.round(currentMonth.total / 4)
    const growthColor = currentMonth.growth > 0 ? 'text-green-600' : 'text-red-600'
    const growthBgColor = currentMonth.growth > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

    return (
        <Card className="border border-gray-200 shadow-sm mb-8">
            <CardHeader className="border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users size={20} />
                        Monthly Active Users (MAU)
                    </CardTitle>
                    <MonthSelector value={selectedMonth} onChange={onMonthChange} />
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Current Month Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total MAU</p>
                                <p className="text-2xl font-bold mt-1">{currentMonth.total}</p>
                            </div>
                            <Users size={32} className="text-blue-600 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Weekly Active</p>
                                <p className="text-2xl font-bold mt-1">{avgWeekly}</p>
                            </div>
                            <Calendar size={32} className="text-green-600 opacity-50" />
                        </div>
                    </div>
                    <div className={`${growthBgColor} border rounded-lg p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Month-over-Month</p>
                                <p className={`text-2xl font-bold mt-1 ${growthColor}`}>
                                    {currentMonth.growth > 0 ? '+' : ''}
                                    {currentMonth.growth}%
                                </p>
                            </div>
                            <TrendingUp size={32} className="text-purple-600 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Weekly Breakdown */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Weekly Breakdown - {currentMonth.year} Month {currentMonth.month}
                    </h4>
                    {currentMonth.weeklyBreakdown && currentMonth.weeklyBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={currentMonth.weeklyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3B82F6" name="Active Users" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-gray-500">
                            No weekly breakdown available
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    )
}

export default MonthlyActiveUsersCard
