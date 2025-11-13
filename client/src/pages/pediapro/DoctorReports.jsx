import React from 'react'
import { mockData } from './mockdata'

// UI Components
import {
    Users,
    Calendar,
    Activity,
    CheckCircle,
    AlertCircle,
    Clock,
    Download,
    FileText,
} from 'lucide-react'

const DoctorReports = () => {
    const StatCard = ({ title, value, subtitle, icon: Icon, change }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                </div>
            </div>
        </div>
    )

    const VaccinationChart = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vaccination Completion by Type
            </h3>
            <div className="space-y-4">
                {['MMR', 'Hepatitis B', 'Polio', 'DPT'].map((vaccine, idx) => {
                    const completion = [95, 88, 92, 85][idx]
                    return (
                        <div key={vaccine}>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{vaccine}</span>
                                <span className="text-sm text-gray-500">{completion}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${completion}%` }}
                                ></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const ComplianceTable = () => (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                    Immunization Schedule Compliance
                </h3>
                <p className="text-sm text-gray-500">
                    Detailed breakdown of vaccination compliance
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Vaccine
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Age Group
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Completed
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Pending
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Overdue
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Compliance Rate
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            {
                                vaccine: 'MMR',
                                age: '12-15 months',
                                completed: 86,
                                pending: 8,
                                overdue: 4,
                                rate: 85,
                            },
                            {
                                vaccine: 'DPT',
                                age: '2-4-6 months',
                                completed: 74,
                                pending: 4,
                                overdue: 2,
                                rate: 92,
                            },
                            {
                                vaccine: 'Polio',
                                age: '2-4-6 months',
                                completed: 70,
                                pending: 0,
                                overdue: 4,
                                rate: 88,
                            },
                            {
                                vaccine: 'Hepatitis B',
                                age: 'Birth-2 months',
                                completed: 72,
                                pending: 5,
                                overdue: 3,
                                rate: 90,
                            },
                        ].map((row, idx) => (
                            <tr key={idx} className="border-t">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {row.vaccine}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{row.age}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{row.completed}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{row.pending}</td>
                                <td className="px-6 py-4 text-sm text-red-600">{row.overdue}</td>
                                <td className="px-6 py-4 text-sm font-medium text-green-600">
                                    {row.rate}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-500">View and generate reports for your practice</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b">
                <nav className="flex space-x-8">
                    <button className="border-b-2 border-blue-600 pb-2 px-1 text-blue-600 font-medium">
                        Overview
                    </button>
                    <button className="border-b-2 border-transparent pb-2 px-1 text-gray-500 hover:text-gray-700">
                        Growth Charts
                    </button>
                    <button className="border-b-2 border-transparent pb-2 px-1 text-gray-500 hover:text-gray-700">
                        Immunization Reports
                    </button>
                </nav>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Patients"
                    value="127"
                    subtitle="+3% from last month"
                    icon={Users}
                />
                <StatCard title="Appointments" value="34" subtitle="This week" icon={Calendar} />
                <StatCard
                    title="Vaccinations"
                    value="89%"
                    subtitle="Completion rate"
                    icon={Activity}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatCard
                    title="Vaccination Rate"
                    value="87%"
                    subtitle="On track completion rate"
                    icon={CheckCircle}
                />
                <StatCard
                    title="Overdue Vaccinations"
                    value="19"
                    subtitle="Require immediate attention"
                    icon={AlertCircle}
                />
                <StatCard
                    title="Upcoming Vaccines"
                    value="13"
                    subtitle="Scheduled this month"
                    icon={Clock}
                />
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Overall Vaccination Status
                    </h3>
                    <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#10b981"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${87 * 3.51} 351.86`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900">87%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VaccinationChart />
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                    <div className="space-y-4">
                        {mockData.reports.map((report, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">{report.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {report.date} • {report.author}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-gray-100 rounded">
                                    <Download className="h-4 w-4 text-gray-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ComplianceTable />
        </div>
    )
}

export default DoctorReports
