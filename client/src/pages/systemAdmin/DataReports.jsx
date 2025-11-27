import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
    AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/util/alertHelper'
import ReportFilters from '@/components/System Administrator/sysAdmin_reports/ReportFilters'
import ReportsSkeleton from '@/components/System Administrator/sysAdmin_reports/ReportsSkeleton'
import { getAllReports } from '@/api/admin/reports'
import { calculateDateRange } from '@/util/dateRangeHelper'

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

const DataReports = () => {
    const [selectedReport, setSelectedReport] = useState('user-activity')

    // Filter state
    const [filters, setFilters] = useState({
        datePreset: 'last-30-days',
        dateRange: { startDate: '', endDate: '' },
        roleFilter: 'all',
        exportFormat: null,
    })

    // Data state
    const [reportData, setReportData] = useState({
        userActivity: [],
        facilityStats: [],
        systemUsage: [],
        userRoleDistribution: [],
    })
    const [summaryMetrics, setSummaryMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cacheInfo, setCacheInfo] = useState({ cached: false, cache_expires_in: 0 })

    // Data fetching function - Fetches ALL data once, filtering happens on frontend
    const fetchReportData = useCallback(async (bustCache = false) => {
        setLoading(true)
        setError(null)
        try {
            // Fetch ALL report data without filters (filters applied on frontend)
            const params = { bust_cache: bustCache }
            const response = await getAllReports(params)

            // Store raw data (we'll filter it on frontend)
            setReportData({
                userActivity: response.data.userActivity || [],
                facilityStats: response.data.facilityStats || [],
                systemUsage: response.data.systemUsage || [],
                userRoleDistribution: response.data.userRoleDistribution || [],
            })

            setSummaryMetrics(response.data.summaryMetrics)
            setCacheInfo({
                cached: response.cached || false,
                cache_expires_in: response.cache_expires_in || 0,
            })
        } catch (error) {
            console.error('Error fetching report data:', error)
            setError(error.message || 'Failed to load report data')
            showToast('error', 'Failed to load report data')
        } finally {
            setLoading(false)
        }
    }, []) // No dependencies - only fetch once on mount

    // Fetch data only on mount or manual refresh
    useEffect(() => {
        fetchReportData()
    }, [fetchReportData])

    // FRONTEND FILTERING - Apply filters to data without hitting backend
    const filteredData = useMemo(() => {
        const { startDate, endDate } = calculateDateRange(filters.datePreset, filters.dateRange)

        // Filter user activity by date range
        const filteredUserActivity = reportData.userActivity.filter((item) => {
            if (!startDate || !endDate) return true
            return item.date >= startDate && item.date <= endDate
        })

        // Filter by role if not 'all'
        const filteredRoleDistribution =
            filters.roleFilter === 'all'
                ? reportData.userRoleDistribution
                : reportData.userRoleDistribution.filter((item) =>
                      item.name.toLowerCase().includes(filters.roleFilter.toLowerCase())
                  )

        return {
            userActivity: filteredUserActivity,
            facilityStats: reportData.facilityStats,
            systemUsage: reportData.systemUsage,
            userRoleDistribution: filteredRoleDistribution,
        }
    }, [reportData, filters.datePreset, filters.dateRange, filters.roleFilter])

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

    const exportToExcel = async (data, filename) => {
        try {
            // Create a new workbook and worksheet
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Report Data')

            // Calculate date range for export metadata
            const { startDate, endDate } = calculateDateRange(filters.datePreset, filters.dateRange)

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
                `Date Range: ${startDate || 'All'} to ${endDate || 'All'}`,
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
                return filteredData.userActivity
            case 'facility-stats':
                return filteredData.facilityStats
            case 'system-usage':
                return filteredData.systemUsage
            default:
                return []
        }
    }

    const handleExport = async () => {
        if (!filters.exportFormat) return

        const data = getReportData(selectedReport)
        if (!data || data.length === 0) {
            showToast('error', 'No data available to export')
            return
        }

        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `${selectedReport}-report-${timestamp}`

        try {
            switch (filters.exportFormat) {
                case 'xlsx':
                    await exportToExcel(data, filename)
                    break
                case 'csv':
                    exportToCSV(data, filename)
                    break
                case 'json':
                    exportToJSON(data, filename)
                    break
                case 'txt':
                    exportToTXT(data, filename)
                    break
                default:
                    break
            }

            showToast('success', `Report exported as ${filters.exportFormat.toUpperCase()}`)
            setFilters({ ...filters, exportFormat: null })
        } catch (error) {
            console.error('Export error:', error)
            showToast('error', 'Export failed')
        }
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

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-gray-700 text-lg mb-4">{error}</p>
                    <Button
                        onClick={() => fetchReportData(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Summary Metrics - Always visible, never shows skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatBox
                    icon={Users}
                    label="Total Users"
                    value={summaryMetrics?.totalUsers || 0}
                    color="blue"
                />
                <StatBox
                    icon={Building2}
                    label="Active Facilities"
                    value={summaryMetrics?.activeFacilities || 0}
                    color="green"
                />
                <StatBox
                    icon={Calendar}
                    label="Total Appointments"
                    value={summaryMetrics?.totalAppointments || 0}
                    color="purple"
                />
                <StatBox
                    icon={Activity}
                    label="System Health"
                    value={`${summaryMetrics?.systemHealth || 0}%`}
                    color="orange"
                />
                <StatBox
                    icon={TrendingUp}
                    label="Recent Activity"
                    value={summaryMetrics?.recentActivity || 0}
                    color="blue"
                />
                <StatBox
                    icon={Settings}
                    label="API Calls"
                    value={summaryMetrics?.apiCalls || 0}
                    color="green"
                />
            </div>

            {/* Report Filters */}
            <div className="mb-8">
                <ReportFilters
                    datePreset={filters.datePreset}
                    onDatePresetChange={(value) => setFilters({ ...filters, datePreset: value })}
                    dateRange={filters.dateRange}
                    onDateRangeChange={(value) => setFilters({ ...filters, dateRange: value })}
                    roleFilter={filters.roleFilter}
                    onRoleFilterChange={(value) => setFilters({ ...filters, roleFilter: value })}
                    exportFormat={filters.exportFormat}
                    onExportFormatChange={(value) =>
                        setFilters({ ...filters, exportFormat: value })
                    }
                    onExport={handleExport}
                    onRefresh={() => fetchReportData(true)}
                    isRefreshing={loading}
                    cacheInfo={cacheInfo}
                />
            </div>

            {/* Report Selection - Analytics & Reports */}
            <Card className="border border-gray-200 shadow-sm mb-8">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Analytics & Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4">
                        <ReportCard
                            icon={Activity}
                            title="User Activity Analytics"
                            description="Login trends, user registrations, and active user metrics"
                            reportKey="user-activity"
                            isSelected={selectedReport === 'user-activity'}
                        />
                        <ReportCard
                            icon={Building2}
                            title="Facility Performance Report"
                            description="Patient counts by facility, appointment metrics, staff overview"
                            reportKey="facility-stats"
                            isSelected={selectedReport === 'facility-stats'}
                        />
                        <ReportCard
                            icon={TrendingUp}
                            title="System Usage Analytics"
                            description="Dashboard activity, report generation, API usage, data exports"
                            reportKey="system-usage"
                            isSelected={selectedReport === 'system-usage'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Infrastructure Health Section */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Infrastructure Health Card */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            Infrastructure Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {/* Overall Health Score */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Overall Health</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {summaryMetrics?.infrastructureHealth?.overall?.toFixed(1) || '0.0'}%
                                    </span>
                                </div>
                            </div>

                            {/* Individual Service Health */}
                            <div className="space-y-2">
                                <ServiceHealthBar
                                    label="Database"
                                    value={summaryMetrics?.infrastructureHealth?.database || 0}
                                    color="blue"
                                />
                                <ServiceHealthBar
                                    label="Auth"
                                    value={summaryMetrics?.infrastructureHealth?.auth || 0}
                                    color="green"
                                />
                                <ServiceHealthBar
                                    label="Storage"
                                    value={summaryMetrics?.infrastructureHealth?.storage || 0}
                                    color="purple"
                                />
                                <ServiceHealthBar
                                    label="Realtime"
                                    value={summaryMetrics?.infrastructureHealth?.realtime || 0}
                                    color="orange"
                                />
                                <ServiceHealthBar
                                    label="Edge Functions"
                                    value={summaryMetrics?.infrastructureHealth?.edge_functions || 0}
                                    color="indigo"
                                />
                            </div>

                            {/* Issues Display */}
                            {summaryMetrics?.infrastructureHealth?.issues?.length > 0 && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs font-semibold text-red-700 mb-1">Active Issues:</p>
                                    <div className="space-y-1">
                                        {summaryMetrics.infrastructureHealth.issues.map((issue, idx) => (
                                            <p key={idx} className="text-xs text-red-600">
                                                • {issue.service}: {issue.message}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
                        {filteredData.userRoleDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={filteredData.userRoleDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {filteredData.userRoleDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                No data available for selected filters
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* System Health Breakdown */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            System Health Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-600 mb-2">Overall System Health</p>
                                    <p className="text-4xl font-bold text-green-600">
                                        {summaryMetrics?.systemHealth?.toFixed(1) || '0.0'}%
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600">Business Metrics</p>
                                        <p className="text-sm text-gray-700 mt-1">Users & Facilities</p>
                                    </div>
                                    <p className="text-lg font-bold text-blue-600">40%</p>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600">Infrastructure</p>
                                        <p className="text-sm text-gray-700 mt-1">Database, Auth, Storage</p>
                                    </div>
                                    <p className="text-lg font-bold text-purple-600">60%</p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">
                                    <strong>Formula:</strong> System Health = (Active Users × 20%) + (Active Facilities × 20%) + (Infrastructure × 60%)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
                        {loading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <div className="animate-pulse text-gray-400">Loading chart data...</div>
                            </div>
                        ) : (
                            <>
                                {selectedReport === 'user-activity' &&
                                    filteredData.userActivity.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={filteredData.userActivity}>
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

                                {selectedReport === 'user-activity' &&
                                    filteredData.userActivity.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}

                                {selectedReport === 'facility-stats' &&
                                    filteredData.facilityStats.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={filteredData.facilityStats}>
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

                                {selectedReport === 'facility-stats' &&
                                    filteredData.facilityStats.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}

                                {selectedReport === 'system-usage' &&
                                    filteredData.systemUsage.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={filteredData.systemUsage}>
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

                                {selectedReport === 'system-usage' &&
                                    filteredData.systemUsage.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Database Performance Monitoring */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            Database Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-xs font-medium text-gray-600 mb-1">Connection Status</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {summaryMetrics?.infrastructureHealth?.database >= 100 ? 'Healthy' :
                                         summaryMetrics?.infrastructureHealth?.database >= 50 ? 'Degraded' : 'Down'}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="text-xs font-medium text-gray-600 mb-1">Auth Service</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {summaryMetrics?.infrastructureHealth?.auth >= 100 ? 'Healthy' :
                                         summaryMetrics?.infrastructureHealth?.auth >= 50 ? 'Degraded' : 'Down'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-3">Service Availability</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Uptime (Last 24h)</span>
                                        <span className="text-sm font-semibold text-green-600">99.9%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Avg Response Time</span>
                                        <span className="text-sm font-semibold text-blue-600">&lt;100ms</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Active Connections</span>
                                        <span className="text-sm font-semibold text-purple-600">
                                            {summaryMetrics?.totalUsers || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    All services operational. No incidents reported.
                                </p>
                            </div>
                        </div>
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
