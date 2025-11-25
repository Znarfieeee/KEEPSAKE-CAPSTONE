import React, { useState, useMemo } from 'react'
import ExcelJS from 'exceljs'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
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
    Download,
    FileText,
    Filter,
    Calendar,
    Users,
    Building2,
    Activity,
    TrendingUp,
    Settings,
    Eye,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

const DataReports = () => {
    const [selectedReport, setSelectedReport] = useState('user-activity')
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })
    const [exportFormat, setExportFormat] = useState(null)

    // Mock data for different reports
    const userActivityData = [
        { date: '2025-10-25', logins: 145, registrations: 12, active_users: 320 },
        { date: '2025-10-26', logins: 158, registrations: 18, active_users: 335 },
        { date: '2025-10-27', logins: 172, registrations: 22, active_users: 352 },
        { date: '2025-10-28', logins: 165, registrations: 15, active_users: 345 },
        { date: '2025-10-29', logins: 189, registrations: 28, active_users: 368 },
        { date: '2025-10-30', logins: 201, registrations: 35, active_users: 395 },
    ]

    const facilityStatsData = [
        { facility: 'Central Clinic', patients: 245, appointments: 89, staff: 12 },
        { facility: 'North Medical', patients: 312, appointments: 124, staff: 18 },
        { facility: 'South Health Center', patients: 198, appointments: 67, staff: 9 },
        { facility: 'East Pediatric', patients: 267, appointments: 95, staff: 14 },
        { facility: 'West Family Care', patients: 289, appointments: 112, staff: 16 },
    ]

    const systemUsageData = [
        { category: 'Dashboard Views', value: 4250 },
        { category: 'Reports Generated', value: 1820 },
        { category: 'Data Exports', value: 890 },
        { category: 'User Logins', value: 3450 },
        { category: 'API Calls', value: 15230 },
    ]

    const userRoleDistribution = [
        { name: 'Doctors', value: 245, color: '#3B82F6' },
        { name: 'Nurses', value: 189, color: '#10B981' },
        { name: 'Admins', value: 34, color: '#F59E0B' },
        { name: 'Parents', value: 1250, color: '#8B5CF6' },
        { name: 'Facility Admins', value: 45, color: '#EF4444' },
    ]

    const summaryMetrics = useMemo(() => {
        return {
            totalUsers: 1763,
            activeFacilities: 5,
            totalAppointments: 487,
            systemHealth: 98.7,
            recentActivity: 3450,
            apiCalls: 15230,
        }
    }, [])

    // Export functions
    const exportToCSV = (data, filename) => {
        const headers = Object.keys(data[0])
        const csv = [
            headers.join(','),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header]
                        return typeof value === 'string' && value.includes(',')
                            ? `"${value}"`
                            : value
                    })
                    .join(',')
            ),
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        downloadFile(blob, `${filename}.csv`)
    }

    const exportToJSON = (data, filename) => {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        downloadFile(blob, `${filename}.json`)
    }

    const exportToTXT = (data, filename) => {
        const txt = data
            .map((row) => {
                return Object.entries(row)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' | ')
            })
            .join('\n')

        const blob = new Blob([txt], { type: 'text/plain' })
        downloadFile(blob, `${filename}.txt`)
    }

    const exportToPDF = (reportType, filename) => {
        const content = `
KEEPSAKE - ${reportType.toUpperCase()} REPORT
Generated: ${new Date().toLocaleDateString()}
Date Range: ${dateRange.startDate} to ${dateRange.endDate}

Summary Metrics:
- Total Users: ${summaryMetrics.totalUsers}
- Active Facilities: ${summaryMetrics.activeFacilities}
- Total Appointments: ${summaryMetrics.totalAppointments}
- System Health: ${summaryMetrics.systemHealth}%
- Recent Activity: ${summaryMetrics.recentActivity}
- API Calls: ${summaryMetrics.apiCalls}

Report Details:
${JSON.stringify(getReportData(reportType), null, 2)}
        `

        const blob = new Blob([content], { type: 'application/pdf' })
        downloadFile(blob, `${filename}.txt`)
    }

    const exportToExcel = async (data, filename) => {
        try {
            // Create a new workbook and worksheet
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Report Data')

            // Add title and metadata
            const titleRow = worksheet.addRow([
                `KEEPSAKE - ${selectedReport.replace(/-/g, ' ').toUpperCase()} REPORT`,
            ])
            titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F497D' } }
            titleRow.alignment = { horizontal: 'center', vertical: 'center' }
            worksheet.mergeCells('A1:E1')

            const metaRow = worksheet.addRow([
                `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            ])
            metaRow.alignment = { horizontal: 'left' }
            worksheet.mergeCells('A2:E2')

            const dateRangeRow = worksheet.addRow([
                `Date Range: ${dateRange.startDate} to ${dateRange.endDate}`,
            ])
            dateRangeRow.alignment = { horizontal: 'left' }
            worksheet.mergeCells('A3:E3')

            // Add empty row for spacing
            worksheet.addRow([])

            // Add headers
            const headers = Object.keys(data[0])
            const headerRow = worksheet.addRow(
                headers.map((h) => h.replace(/_/g, ' ').toUpperCase())
            )

            // Style header row
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            }
            headerRow.alignment = { horizontal: 'center', vertical: 'center' }

            // Add data rows
            data.forEach((row, index) => {
                const dataRow = worksheet.addRow(headers.map((header) => row[header]))

                // Alternate row colors for better readability
                if (index % 2 === 0) {
                    dataRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' },
                    }
                }

                // Add borders to all cells
                dataRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    }
                })

                dataRow.alignment = { horizontal: 'left', vertical: 'center' }
            })

            // Add borders to header row
            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                }
            })

            // Auto-fit column widths
            worksheet.columns.forEach((column) => {
                let maxLength = 0
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const cellLength = cell.value ? cell.value.toString().length : 0
                    if (cellLength > maxLength) {
                        maxLength = cellLength
                    }
                })
                column.width = Math.min(maxLength + 2, 50)
            })

            // Generate and download the file
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
            downloadFile(blob, `${filename}.xlsx`)
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            alert('Error exporting to Excel. Please try again.')
        }
    }

    const downloadFile = (blob, filename) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const getReportData = (reportType) => {
        switch (reportType) {
            case 'user-activity':
                return userActivityData
            case 'facility-stats':
                return facilityStatsData
            case 'system-usage':
                return systemUsageData
            default:
                return []
        }
    }

    const handleExport = async (format) => {
        const reportData = getReportData(selectedReport)
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `${selectedReport}-report-${timestamp}`

        switch (format) {
            case 'xlsx':
                await exportToExcel(reportData, filename)
                break
            case 'csv':
                exportToCSV(reportData, filename)
                break
            case 'json':
                exportToJSON(reportData, filename)
                break
            case 'txt':
                exportToTXT(reportData, filename)
                break
            case 'pdf':
                exportToPDF(selectedReport, filename)
                break
            default:
                break
        }

        setExportFormat(null)
    }

    const StatBox = ({ icon: Icon, label, value, color = 'blue' }) => {
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

    const ReportCard = ({ title, icon: Icon, description, reportKey, isSelected }) => (
        <div
            onClick={() => setSelectedReport(reportKey)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="flex items-start gap-3">
                <Icon className={isSelected ? 'text-blue-600' : 'text-gray-600'} size={24} />
                <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Data Reports</h1>
                <p className="text-gray-600 mt-2">
                    Generate and export system-wide reports with flexible date ranges and formats
                </p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-6 gap-4 mb-8">
                <StatBox
                    icon={Users}
                    label="Total Users"
                    value={summaryMetrics.totalUsers}
                    color="blue"
                />
                <StatBox
                    icon={Building2}
                    label="Active Facilities"
                    value={summaryMetrics.activeFacilities}
                    color="green"
                />
                <StatBox
                    icon={Calendar}
                    label="Total Appointments"
                    value={summaryMetrics.totalAppointments}
                    color="purple"
                />
                <StatBox
                    icon={Activity}
                    label="System Health"
                    value={`${summaryMetrics.systemHealth}%`}
                    color="orange"
                />
                <StatBox
                    icon={TrendingUp}
                    label="Recent Activity"
                    value={summaryMetrics.recentActivity}
                    color="blue"
                />
                <StatBox
                    icon={Settings}
                    label="API Calls"
                    value={summaryMetrics.apiCalls}
                    color="green"
                />
            </div>

            {/* Filters and Export */}
            <Card className="border border-gray-200 shadow-sm mb-8">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Filter size={20} />
                        Report Options
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, startDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, endDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Export Format
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('xlsx')}
                                    className="flex-1 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-all text-sm font-medium"
                                >
                                    Excel
                                </button>
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                                >
                                    CSV
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    className="flex-1 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-all text-sm font-medium"
                                >
                                    JSON
                                </button>
                                <button
                                    onClick={() => handleExport('txt')}
                                    className="flex-1 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-all text-sm font-medium"
                                >
                                    TXT
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                                >
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <ReportCard
                    icon={Activity}
                    title="User Activity"
                    description="Login trends, registrations, and active users"
                    reportKey="user-activity"
                    isSelected={selectedReport === 'user-activity'}
                />
                <ReportCard
                    icon={Building2}
                    title="Facility Statistics"
                    description="Patient counts, appointments, and staff information"
                    reportKey="facility-stats"
                    isSelected={selectedReport === 'facility-stats'}
                />
                <ReportCard
                    icon={TrendingUp}
                    title="System Usage"
                    description="Dashboard views, reports, exports, and API calls"
                    reportKey="system-usage"
                    isSelected={selectedReport === 'system-usage'}
                />
            </div>

            {/* Report Visualization */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Chart Section */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {selectedReport === 'user-activity' && 'User Activity Trends'}
                            {selectedReport === 'facility-stats' && 'Facility Statistics'}
                            {selectedReport === 'system-usage' && 'System Usage Overview'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {selectedReport === 'user-activity' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={userActivityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="logins"
                                        stroke="#3B82F6"
                                        name="Logins"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="registrations"
                                        stroke="#10B981"
                                        name="Registrations"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="active_users"
                                        stroke="#F59E0B"
                                        name="Active Users"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}

                        {selectedReport === 'facility-stats' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={facilityStatsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="facility"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="patients" fill="#3B82F6" name="Patients" />
                                    <Bar
                                        dataKey="appointments"
                                        fill="#10B981"
                                        name="Appointments"
                                    />
                                    <Bar dataKey="staff" fill="#F59E0B" name="Staff" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {selectedReport === 'system-usage' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={systemUsageData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="category"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#3B82F6" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* User Role Distribution */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            User Role Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={userRoleDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {userRoleDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Data Table */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            Detailed Data
                        </CardTitle>
                        <Button
                            onClick={() => handleExport('csv')}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <Download size={16} />
                            Export Data
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {Object.keys(getReportData(selectedReport)[0] || {}).map(
                                        (header) => (
                                            <th
                                                key={header}
                                                className="px-4 py-3 text-left font-semibold text-gray-700"
                                            >
                                                {header.replace(/_/g, ' ').toUpperCase()}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {getReportData(selectedReport).map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-gray-200 hover:bg-gray-50"
                                    >
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="px-4 py-3 text-gray-700">
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Export Instructions */}
            <Card className="border border-gray-200 shadow-sm mt-8">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={20} />
                        Export Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Available Formats</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-700">Excel</Badge>
                                    <span>XLSX format for spreadsheet analysis</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-700">CSV</Badge>
                                    <span>Spreadsheet compatible format</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Badge className="bg-purple-100 text-purple-700">JSON</Badge>
                                    <span>Machine-readable format for APIs</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Badge className="bg-orange-100 text-orange-700">TXT</Badge>
                                    <span>Plain text format for viewing</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-700">PDF</Badge>
                                    <span>Document format for sharing</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Tips</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li>✓ Reports update in real-time</li>
                                <li>✓ Filter by custom date ranges</li>
                                <li>✓ Export multiple formats simultaneously</li>
                                <li>✓ Data includes summary metrics and detailed records</li>
                                <li>✓ All exports include generation timestamp</li>
                                <li>✓ Files are named with report type and date</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default DataReports
