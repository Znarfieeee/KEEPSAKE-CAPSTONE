import React, { useState, useMemo, useCallback, useEffect } from 'react'
import ExcelJS from 'exceljs'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
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
    Calendar,
    Users,
    Activity,
    TrendingUp,
    Heart,
    Building2,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { getDoctorReports } from '@/api/doctor/reports'
import { calculateDateRange } from '@/util/dateRangeHelper'
import { showToast } from '@/util/alertHelper'
import ReportFilters from '@/components/System Administrator/sysAdmin_reports/ReportFilters'

const DoctorReports = () => {
    const [selectedReport, setSelectedReport] = useState('patient-health')

    // Filter state
    const [filters, setFilters] = useState({
        datePreset: 'last-30-days',
        dateRange: { startDate: '', endDate: '' },
        roleFilter: 'all', // Not used for doctors, but required by ReportFilters
        exportFormat: null,
    })

    // Data state
    const [reportData, setReportData] = useState({
        patientGrowthData: [],
        patientImmunizationData: [],
        appointmentRateData: [],
        recordUpdateFrequencyData: [],
        growthTrendData: [],
        immunizationDistribution: [],
    })
    const [summaryMetrics, setSummaryMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cacheInfo, setCacheInfo] = useState({ cached: false, cache_expires_in: 0 })

    // Data fetching function
    const fetchReportData = useCallback(async (bustCache = false) => {
        setLoading(true)
        setError(null)
        try {
            const params = { bust_cache: bustCache }
            const response = await getDoctorReports(params)

            setReportData({
                patientGrowthData: response.data.patientGrowthData || [],
                patientImmunizationData: response.data.patientImmunizationData || [],
                appointmentRateData: response.data.appointmentRateData || [],
                recordUpdateFrequencyData: response.data.recordUpdateFrequencyData || [],
                growthTrendData: response.data.growthTrendData || [],
                immunizationDistribution: response.data.immunizationDistribution || [],
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
    }, [])

    // Fetch data on mount
    useEffect(() => {
        fetchReportData()
    }, [fetchReportData])

    // Frontend filtering
    const filteredData = useMemo(() => {
        const { startDate, endDate } = calculateDateRange(filters.datePreset, filters.dateRange)

        // Filter appointment data by date range
        const filteredAppointments = reportData.appointmentRateData.filter((item) => {
            if (!startDate || !endDate) return true
            return item.date >= startDate && item.date <= endDate
        })

        return {
            patientGrowthData: reportData.patientGrowthData,
            patientImmunizationData: reportData.patientImmunizationData,
            appointmentRateData: filteredAppointments,
            recordUpdateFrequencyData: reportData.recordUpdateFrequencyData,
            growthTrendData: reportData.growthTrendData,
            immunizationDistribution: reportData.immunizationDistribution,
        }
    }, [reportData, filters.datePreset, filters.dateRange])

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
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Report Data')

            // Calculate date range for export metadata
            const { startDate, endDate } = calculateDateRange(filters.datePreset, filters.dateRange)

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

            worksheet.addRow([])

            const headers = Object.keys(data[0])
            const headerRow = worksheet.addRow(
                headers.map((h) => h.replace(/_/g, ' ').toUpperCase())
            )

            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            }
            headerRow.alignment = { horizontal: 'center', vertical: 'center' }

            data.forEach((row, index) => {
                const dataRow = worksheet.addRow(headers.map((header) => row[header]))

                if (index % 2 === 0) {
                    dataRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' },
                    }
                }

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

            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                }
            })

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

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
            downloadFile(blob, `${filename}.xlsx`)
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            showToast('error', 'Error exporting to Excel. Please try again.')
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
            case 'patient-health':
                return filteredData.patientGrowthData
            case 'appointment-rate':
                return filteredData.appointmentRateData
            case 'record-update':
                return filteredData.recordUpdateFrequencyData
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
        const filename = `doctor-${selectedReport}-report-${timestamp}`

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
            red: 'bg-red-50 border-red-200 text-red-700',
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

    // Error state
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
            {/* Summary Metrics - Always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <StatBox
                    icon={Users}
                    label="Total Patients"
                    value={summaryMetrics?.totalPatients || 0}
                    color="blue"
                />
                <StatBox
                    icon={Calendar}
                    label="Appointments"
                    value={summaryMetrics?.totalAppointments || 0}
                    color="purple"
                />
                <StatBox
                    icon={CheckCircle2}
                    label="Completion Rate"
                    value={`${summaryMetrics?.avgCompletionRate?.toFixed(1) || 0}%`}
                    color="green"
                />
                <StatBox
                    icon={Activity}
                    label="Records Updated"
                    value={summaryMetrics?.recordsUpdatedToday || 0}
                    color="orange"
                />
                <StatBox
                    icon={Heart}
                    label="Fully Immunized"
                    value={summaryMetrics?.fullyImmunizedCount || 0}
                    color="red"
                />
                <StatBox
                    icon={Clock}
                    label="Update Frequency"
                    value={`${summaryMetrics?.avgUpdateFrequency?.toFixed(1) || 0}%`}
                    color="blue"
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
                    onRoleFilterChange={() => {}} // No-op for doctors
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

            {/* Reports Selection */}
            <Card className="mb-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={24} className="text-blue-600" />
                        Doctor Reports & Analytics
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ReportCard
                            title="Patient Health Trends"
                            icon={Heart}
                            description="Growth metrics and immunization status for your patients"
                            reportKey="patient-health"
                            isSelected={selectedReport === 'patient-health'}
                        />
                        <ReportCard
                            title="Appointment Rate Analytics"
                            icon={Calendar}
                            description="Scheduled vs completed appointments, cancellations, and completion rates"
                            reportKey="appointment-rate"
                            isSelected={selectedReport === 'appointment-rate'}
                        />
                        <ReportCard
                            title="Record Update Frequency"
                            icon={Activity}
                            description="Daily, weekly, and monthly record updates"
                            reportKey="record-update"
                            isSelected={selectedReport === 'record-update'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Charts and Data Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Chart 1 */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {selectedReport === 'patient-health' &&
                                'Patient Growth Percentile Trends'}
                            {selectedReport === 'appointment-rate' &&
                                'Daily Appointment Completion Trends'}
                            {selectedReport === 'record-update' && 'Record Update Frequency'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <div className="animate-pulse text-gray-400">
                                    Loading chart data...
                                </div>
                            </div>
                        ) : (
                            <>
                                {selectedReport === 'patient-health' &&
                                    filteredData.growthTrendData.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={filteredData.growthTrendData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="heightPercentile"
                                                    stroke="#3B82F6"
                                                    name="Height Percentile"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="weightPercentile"
                                                    stroke="#10B981"
                                                    name="Weight Percentile"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="bmiPercentile"
                                                    stroke="#F59E0B"
                                                    name="BMI Percentile"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}

                                {selectedReport === 'patient-health' &&
                                    filteredData.growthTrendData.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}

                                {selectedReport === 'appointment-rate' &&
                                    filteredData.appointmentRateData.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={filteredData.appointmentRateData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="completed"
                                                    stroke="#10B981"
                                                    name="Completed"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="scheduled"
                                                    stroke="#3B82F6"
                                                    name="Scheduled"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="cancelled"
                                                    stroke="#EF4444"
                                                    name="Cancelled"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}

                                {selectedReport === 'appointment-rate' &&
                                    filteredData.appointmentRateData.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}

                                {selectedReport === 'record-update' &&
                                    filteredData.recordUpdateFrequencyData.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={filteredData.recordUpdateFrequencyData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="category" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar
                                                    dataKey="count"
                                                    fill="#3B82F6"
                                                    name="Update Count"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}

                                {selectedReport === 'record-update' &&
                                    filteredData.recordUpdateFrequencyData.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Chart 2 */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {selectedReport === 'patient-health' &&
                                'Immunization Status Distribution'}
                            {selectedReport === 'appointment-rate' && 'Completion Rate %'}
                            {selectedReport === 'record-update' && 'Update Breakdown'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <div className="animate-pulse text-gray-400">
                                    Loading chart data...
                                </div>
                            </div>
                        ) : (
                            <>
                                {selectedReport === 'patient-health' &&
                                    filteredData.immunizationDistribution.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={filteredData.immunizationDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {filteredData.immunizationDistribution.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.color}
                                                            />
                                                        )
                                                    )}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}

                                {selectedReport === 'patient-health' &&
                                    filteredData.immunizationDistribution.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}

                                {selectedReport === 'appointment-rate' &&
                                    filteredData.appointmentRateData.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={filteredData.appointmentRateData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="rate"
                                                    stroke="#10B981"
                                                    name="Completion Rate %"
                                                    strokeWidth={2}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}

                                {selectedReport === 'appointment-rate' &&
                                    filteredData.appointmentRateData.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}

                                {selectedReport === 'record-update' &&
                                    filteredData.recordUpdateFrequencyData.length > 0 && (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={filteredData.recordUpdateFrequencyData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="category" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar
                                                    dataKey="count"
                                                    fill="#10B981"
                                                    name="Updates"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}

                                {selectedReport === 'record-update' &&
                                    filteredData.recordUpdateFrequencyData.length === 0 && (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No data available for selected filters
                                        </div>
                                    )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Patient Health Chart */}
            {selectedReport === 'patient-health' && (
                <Card className="mb-8 border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            Patient BMI & Growth Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <div className="animate-pulse text-gray-400">
                                    Loading chart data...
                                </div>
                            </div>
                        ) : filteredData.patientGrowthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={filteredData.patientGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="patient"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="bmi" fill="#3B82F6" name="BMI" />
                                    <Bar
                                        dataKey="growthPercentile"
                                        fill="#10B981"
                                        name="Growth Percentile"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                No data available for selected filters
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Detailed Data Table */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900">
                        {selectedReport === 'patient-health' && 'Detailed Patient Health Data'}
                        {selectedReport === 'appointment-rate' && 'Appointment Details'}
                        {selectedReport === 'record-update' && 'Record Update Details'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-[200px]">
                            <div className="animate-pulse text-gray-400">Loading table data...</div>
                        </div>
                    ) : getReportData(selectedReport).length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        {Object.keys(getReportData(selectedReport)[0]).map(
                                            (header) => (
                                                <th
                                                    key={header}
                                                    className="px-4 py-3 text-left font-semibold text-gray-900"
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
                                            {Object.values(row).map((value, valIdx) => (
                                                <td
                                                    key={valIdx}
                                                    className="px-4 py-3 text-gray-700"
                                                >
                                                    {typeof value === 'number'
                                                        ? value.toFixed(
                                                              typeof value === 'number' &&
                                                                  value < 10
                                                                  ? 1
                                                                  : 0
                                                          )
                                                        : value}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-gray-500">
                            No data available for selected filters
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Export Guide */}
            <Card className="mt-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={18} />
                        Export Format Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                format: 'Excel',
                                desc: 'Professional spreadsheets with styling and formatting',
                                tip: 'Best for detailed analysis and presentations',
                            },
                            {
                                format: 'CSV',
                                desc: 'Comma-separated values for universal compatibility',
                                tip: 'Compatible with all spreadsheet applications',
                            },
                            {
                                format: 'JSON',
                                desc: 'Structured data format for technical integration',
                                tip: 'Ideal for API and system integrations',
                            },
                            {
                                format: 'TXT',
                                desc: 'Plain text key-value format',
                                tip: 'Simple format for quick reviews',
                            },
                        ].map((item) => (
                            <div
                                key={item.format}
                                className="p-3 border border-gray-200 rounded-lg"
                            >
                                <p className="font-semibold text-gray-900 text-sm">{item.format}</p>
                                <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                                <p className="text-xs text-blue-600 mt-2 italic">{item.tip}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default DoctorReports
