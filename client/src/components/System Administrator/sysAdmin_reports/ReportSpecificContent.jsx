import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
    Activity,
    UserPlus,
    Users,
    TrendingUp,
    Building2,
    Calendar,
    Award,
    Eye,
    Clock,
    Zap,
} from 'lucide-react'

const ReportSpecificContent = ({ reportType, metrics }) => {
    const MetricCard = ({ icon: Icon, label, value, color }) => {
        const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            green: 'bg-green-50 border-green-200 text-green-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700',
            orange: 'bg-orange-50 border-orange-200 text-orange-700',
        }

        return (
            <div className={`${colorClasses[color]} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">{label}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    <Icon size={32} className="opacity-50" />
                </div>
            </div>
        )
    }

    const getMetricCards = () => {
        switch (reportType) {
            case 'user-activity':
                return (
                    <>
                        <MetricCard
                            icon={Activity}
                            label="Total Logins"
                            value={metrics.totalLogins || 0}
                            color="blue"
                        />
                        <MetricCard
                            icon={UserPlus}
                            label="New Registrations"
                            value={metrics.totalRegistrations || 0}
                            color="green"
                        />
                        <MetricCard
                            icon={Users}
                            label="Avg Daily Active"
                            value={metrics.avgDailyActive || 0}
                            color="purple"
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label="Peak Activity Date"
                            value={metrics.peakActivityDate || 'N/A'}
                            color="orange"
                        />
                    </>
                )

            case 'facility-stats':
                return (
                    <>
                        <MetricCard
                            icon={Building2}
                            label="Total Patients"
                            value={metrics.totalPatients || 0}
                            color="blue"
                        />
                        <MetricCard
                            icon={Calendar}
                            label="Total Appointments"
                            value={metrics.totalAppointments || 0}
                            color="green"
                        />
                        <MetricCard
                            icon={Users}
                            label="Avg Patients/Facility"
                            value={metrics.avgPatientsPerFacility || 0}
                            color="purple"
                        />
                        <MetricCard
                            icon={Award}
                            label="Top Facility"
                            value={metrics.topPerformingFacility || 'N/A'}
                            color="orange"
                        />
                    </>
                )

            case 'system-usage':
                return (
                    <>
                        <MetricCard
                            icon={Activity}
                            label="Total API Calls"
                            value={metrics.totalApiCalls || 0}
                            color="blue"
                        />
                        <MetricCard
                            icon={Eye}
                            label="Most Common Action"
                            value={metrics.mostCommonAction || 'N/A'}
                            color="green"
                        />
                        <MetricCard
                            icon={Clock}
                            label="Avg Calls/Hour"
                            value={`${metrics.avgCallsPerHour || 0}`}
                            color="purple"
                        />
                        <MetricCard
                            icon={Zap}
                            label="System Load"
                            value={metrics.systemLoad || 'Low'}
                            color="orange"
                        />
                    </>
                )

            default:
                return null
        }
    }

    const getTitle = () => {
        switch (reportType) {
            case 'user-activity':
                return 'User Activity Metrics'
            case 'facility-stats':
                return 'Facility Performance Metrics'
            case 'system-usage':
                return 'System Usage Metrics'
            default:
                return 'Report Metrics'
        }
    }

    if (!metrics) {
        return null
    }

    return (
        <Card className="border border-gray-200 shadow-sm mb-8">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">{getTitle()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-4">{getMetricCards()}</div>
            </CardContent>
        </Card>
    )
}

export default ReportSpecificContent
