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
    AreaChart,
    Area,
} from 'recharts'
import {
    Download,
    Calendar,
    Users,
    Building2,
    Activity,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Filter,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

const NurseReports = () => {
    const [selectedReport, setSelectedReport] = useState('appointment-rate')
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })
    const [exportFormat, setExportFormat] = useState(null)

    // Mock data for Appointment Rate Analysis
    const appointmentRateData = [
        { date: '2025-10-25', scheduled: 18, completed: 16, cancelled: 2, noshow: 0, rate: 88.9 },
        { date: '2025-10-26', scheduled: 22, completed: 20, cancelled: 1, noshow: 1, rate: 90.9 },
        { date: '2025-10-27', scheduled: 19, completed: 18, cancelled: 0, noshow: 1, rate: 94.7 },
        { date: '2025-10-28', scheduled: 25, completed: 23, cancelled: 2, noshow: 0, rate: 92.0 },
        { date: '2025-10-29', scheduled: 21, completed: 20, cancelled: 1, noshow: 0, rate: 95.2 },
        { date: '2025-10-30', scheduled: 24, completed: 23, cancelled: 0, noshow: 1, rate: 95.8 },
    ]

    // Mock data for Record Update Frequency (by patient for this facility)
    const recordUpdateFrequencyData = [
        {
            patientId: 'P001',
            patientName: 'John Doe',
            daily: 2,
            weekly: 1,
            monthly: 0,
            updated: 98.2,
        },
        {
            patientId: 'P002',
            patientName: 'Jane Smith',
            daily: 3,
            weekly: 0,
            monthly: 0,
            updated: 100.0,
        },
        {
            patientId: 'P003',
            patientName: 'Michael Johnson',
            daily: 1,
            weekly: 2,
            monthly: 1,
            updated: 97.1,
        },
        {
            patientId: 'P004',
            patientName: 'Sarah Williams',
            daily: 2,
            weekly: 1,
            monthly: 0,
            updated: 98.6,
        },
        {
            patientId: 'P005',
            patientName: 'David Brown',
            daily: 3,
            weekly: 0,
            monthly: 0,
            updated: 99.1,
        },
    ]

    // Mock data for Patient Performance Overview (this facility's patients)
    const facilityPerformanceData = [
        {
            patientId: 'P001',
            patientName: 'John Doe',
            age: 8,
            totalAppointments: 12,
            completedAppointments: 11,
            completionRate: 91.7,
            lastVisit: '2025-10-28',
            recordsUpdated: 45,
        },
        {
            patientId: 'P002',
            patientName: 'Jane Smith',
            age: 6,
            totalAppointments: 8,
            completedAppointments: 8,
            completionRate: 100.0,
            lastVisit: '2025-10-30',
            recordsUpdated: 62,
        },
        {
            patientId: 'P003',
            patientName: 'Michael Johnson',
            age: 10,
            totalAppointments: 14,
            completedAppointments: 13,
            completionRate: 92.9,
            lastVisit: '2025-10-27',
            recordsUpdated: 38,
        },
        {
            patientId: 'P004',
            patientName: 'Sarah Williams',
            age: 5,
            totalAppointments: 10,
            completedAppointments: 9,
            completionRate: 90.0,
            lastVisit: '2025-10-29',
            recordsUpdated: 51,
        },
        {
            patientId: 'P005',
            patientName: 'David Brown',
            age: 9,
            totalAppointments: 11,
            completedAppointments: 11,
            completionRate: 100.0,
            lastVisit: '2025-10-30',
            recordsUpdated: 58,
        },
    ]

    // Mock data for Record Update Types
    const recordUpdateTypesData = [
        { name: 'Medical Records', value: 340, color: '#3B82F6' },
        { name: 'Vital Signs', value: 280, color: '#10B981' },
        { name: 'Medications', value: 195, color: '#F59E0B' },
        { name: 'Immunizations', value: 165, color: '#8B5CF6' },
        { name: 'Notes & Observations', value: 220, color: '#EF4444' },
    ]

    // Mock data for Daily Appointment Status
    const dailyAppointmentStatusData = [
        { hour: '09:00', scheduled: 8, completed: 7, pending: 1 },
        { hour: '10:00', scheduled: 10, completed: 10, pending: 0 },
        { hour: '11:00', scheduled: 9, completed: 8, pending: 1 },
        { hour: '14:00', scheduled: 7, completed: 6, pending: 1 },
        { hour: '15:00', scheduled: 11, completed: 11, pending: 0 },
        { hour: '16:00', scheduled: 8, completed: 7, pending: 1 },
    ]

    const summaryMetrics = useMemo(() => {
        return {
            facilityName: 'Central Clinic',
            totalPatients: 55,
            totalAppointments: 55,
            avgCompletionRate: 94.92,
            recordsUpdatedToday: 254,
            avgRecordUpdateFrequency: 98.6,
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

    // const exportToJSON = (data, filename) => {
    //     const json = JSON.stringify(data, null, 2)
    //     const blob = new Blob([json], { type: 'application/json' })
    //     downloadFile(blob, `${filename}.json`)
    // }

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
KEEPSAKE - NURSE CLINIC REPORTS - ${reportType.replace(/-/g, ' ').toUpperCase()}
Generated: ${new Date().toLocaleDateString()}
Date Range: ${dateRange.startDate} to ${dateRange.endDate}

Summary Metrics:
- Total Facilities: ${summaryMetrics.totalFacilities}
- Total Patients: ${summaryMetrics.totalPatients}
- Total Appointments: ${summaryMetrics.totalAppointments}
- Average Completion Rate: ${summaryMetrics.avgCompletionRate}%
- Records Updated Today: ${summaryMetrics.recordsUpdatedToday}
- Average Record Update Frequency: ${summaryMetrics.avgRecordUpdateFrequency}%

Report Details:
${JSON.stringify(getReportData(reportType), null, 2)}
        `

        const blob = new Blob([content], { type: 'application/pdf' })
        downloadFile(blob, `${filename}.txt`)
    }

    const exportToExcel = async (data, filename) => {
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Report Data')

            // Add title and metadata
            const titleRow = worksheet.addRow([
                `KEEPSAKE - NURSE CLINIC REPORTS - ${selectedReport
                    .replace(/-/g, ' ')
                    .toUpperCase()}`,
            ])
            titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F497D' } }
            titleRow.alignment = { horizontal: 'center', vertical: 'center' }
            worksheet.mergeCells('A1:F1')

            const metaRow = worksheet.addRow([
                `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            ])
            metaRow.alignment = { horizontal: 'left' }
            worksheet.mergeCells('A2:F2')

            const dateRangeRow = worksheet.addRow([
                `Date Range: ${dateRange.startDate} to ${dateRange.endDate}`,
            ])
            dateRangeRow.alignment = { horizontal: 'left' }
            worksheet.mergeCells('A3:F3')

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
                fgColor: { argb: 'FF10B981' },
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
            case 'appointment-rate':
                return appointmentRateData
            case 'record-update':
                return recordUpdateFrequencyData
            case 'facility-performance':
                return facilityPerformanceData
            default:
                return []
        }
    }

    const handleExport = async (format) => {
        const reportData = getReportData(selectedReport)
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `nurse-${selectedReport}-report-${timestamp}`

        switch (format) {
            case 'xlsx':
                await exportToExcel(reportData, filename)
                break
            case 'csv':
                exportToCSV(reportData, filename)
                break
            // case 'json':
            //     exportToJSON(reportData, filename)
            //     break
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

    const StatBox = ({ icon: Icon, label, value, color = 'green' }) => {
        const colorClasses = {
            green: 'bg-green-50 border-green-200 text-green-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
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
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="flex items-start gap-3">
                <Icon className={isSelected ? 'text-green-600' : 'text-gray-600'} size={24} />
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
            {/* <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={36} className="text-green-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Clinic Reports & Analytics</h1>
                </div>
                <p className="text-gray-600">
                    Comprehensive facility analytics with appointment rates, record updates, and
                    performance metrics
                </p>
            </div> */}

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <div className="col-span-full lg:col-span-1">
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Current Facility</p>
                                <p className="text-2xl font-bold mt-1">
                                    {summaryMetrics.facilityName}
                                </p>
                            </div>
                            <Building2 size={32} className="opacity-50" />
                        </div>
                    </div>
                </div>
                <StatBox
                    icon={Users}
                    label="Total Patients"
                    value={summaryMetrics.totalPatients}
                    color="blue"
                />
                <StatBox
                    icon={Calendar}
                    label="Appointments"
                    value={summaryMetrics.totalAppointments}
                    color="purple"
                />
                <StatBox
                    icon={CheckCircle2}
                    label="Completion Rate"
                    value={`${summaryMetrics.avgCompletionRate.toFixed(1)}%`}
                    color="green"
                />
                <StatBox
                    icon={Activity}
                    label="Records Updated"
                    value={summaryMetrics.recordsUpdatedToday}
                    color="orange"
                />
                <StatBox
                    icon={Clock}
                    label="Update Frequency"
                    value={`${summaryMetrics.avgRecordUpdateFrequency.toFixed(1)}%`}
                    color="blue"
                />
            </div>

            {/* Reports Selection */}
            <Card className="mb-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={24} className="text-green-600" />
                        Clinic Reports & Analytics
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ReportCard
                            title="Appointment Rate Analytics"
                            icon={Calendar}
                            description="Daily appointment completion rates, cancellations, and no-shows for this facility"
                            reportKey="appointment-rate"
                            isSelected={selectedReport === 'appointment-rate'}
                        />
                        <ReportCard
                            title="Patient Record Updates"
                            icon={Activity}
                            description="Record update frequency by patient - daily, weekly, and monthly update tracking"
                            reportKey="record-update"
                            isSelected={selectedReport === 'record-update'}
                        />
                        <ReportCard
                            title="Patient Performance Report"
                            icon={Users}
                            description="Individual patient metrics including appointment completion, visit history, and record updates"
                            reportKey="facility-performance"
                            isSelected={selectedReport === 'facility-performance'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Filter and Export Section */}
            <Card className="mb-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Filter size={18} />
                        Filters & Export
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, startDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, endDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Button
                                    onClick={() =>
                                        setExportFormat(exportFormat === null ? 'csv' : null)
                                    }
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                                >
                                    <Download size={18} />
                                    Export
                                </Button>
                                {exportFormat !== null && (
                                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg p-2 z-10 w-40">
                                        <button
                                            onClick={() => handleExport('xlsx')}
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            Excel
                                        </button>
                                        <button
                                            onClick={() => handleExport('csv')}
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            CSV
                                        </button>
                                        {/* <button
                                            onClick={() => handleExport('json')}
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            JSON
                                        </button> */}
                                        <button
                                            onClick={() => handleExport('txt')}
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            TXT
                                        </button>
                                        <button
                                            onClick={() => handleExport('pdf')}
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts and Data Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Chart 1 */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {selectedReport === 'appointment-rate' &&
                                'Daily Appointment Completion Trends'}
                            {selectedReport === 'record-update' &&
                                'Patient Record Update Frequency'}
                            {selectedReport === 'facility-performance' &&
                                'Patient Appointment Summary'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {selectedReport === 'appointment-rate' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={appointmentRateData}>
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
                        {selectedReport === 'record-update' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={recordUpdateFrequencyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="patientName"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="daily" stackId="a" fill="#10B981" name="Daily" />
                                    <Bar
                                        dataKey="weekly"
                                        stackId="a"
                                        fill="#3B82F6"
                                        name="Weekly"
                                    />
                                    <Bar
                                        dataKey="monthly"
                                        stackId="a"
                                        fill="#F59E0B"
                                        name="Monthly"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {selectedReport === 'facility-performance' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={facilityPerformanceData}>
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
                                    <Bar
                                        dataKey="activeAppointments"
                                        fill="#10B981"
                                        name="Active Appointments"
                                    />
                                    <Bar
                                        dataKey="completionRate"
                                        fill="#3B82F6"
                                        name="Completion Rate"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Chart 2 */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {selectedReport === 'appointment-rate' && 'Daily Completion Rate %'}
                            {selectedReport === 'record-update' && 'Update Type Distribution'}
                            {selectedReport === 'facility-performance' && 'Patient Records Updated'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {selectedReport === 'appointment-rate' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={appointmentRateData}>
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
                        {selectedReport === 'record-update' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={recordUpdateTypesData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {recordUpdateTypesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {selectedReport === 'facility-performance' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={facilityPerformanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="patientName"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="completedAppointments"
                                        fill="#3B82F6"
                                        name="Completed Appointments"
                                    />
                                    <Bar
                                        dataKey="recordsUpdated"
                                        fill="#10B981"
                                        name="Records Updated"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Daily Appointment Status (Bonus Chart) */}
            {selectedReport === 'appointment-rate' && (
                <Card className="mb-8 border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            Today&apos;s Appointment Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dailyAppointmentStatusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    stackId="1"
                                    fill="#10B981"
                                    name="Completed"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="pending"
                                    stackId="1"
                                    fill="#F59E0B"
                                    name="Pending"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Data Table */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900">
                        {selectedReport === 'appointment-rate' && 'Daily Appointment Details'}
                        {selectedReport === 'record-update' && 'Patient Record Update Details'}
                        {selectedReport === 'facility-performance' && 'Patient Performance Details'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    {Object.keys(getReportData(selectedReport)[0]).map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 text-left font-semibold text-gray-900"
                                        >
                                            {header.replace(/_/g, ' ').toUpperCase()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {getReportData(selectedReport).map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-gray-200 hover:bg-gray-50"
                                    >
                                        {Object.values(row).map((value, valIdx) => (
                                            <td key={valIdx} className="px-4 py-3 text-gray-700">
                                                {typeof value === 'number'
                                                    ? value.toFixed(
                                                          typeof value === 'number' && value < 10
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            // {
                            //     format: 'JSON',
                            //     desc: 'Structured data format for technical integration',
                            //     tip: 'Ideal for API and system integrations',
                            // },
                            {
                                format: 'TXT',
                                desc: 'Plain text key-value format',
                                tip: 'Simple format for quick reviews',
                            },
                            {
                                format: 'PDF',
                                desc: 'Document format for archival and sharing',
                                tip: 'Best for formal reports and documentation',
                            },
                        ].map((item) => (
                            <div
                                key={item.format}
                                className="p-3 border border-gray-200 rounded-lg"
                            >
                                <p className="font-semibold text-gray-900 text-sm">{item.format}</p>
                                <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                                <p className="text-xs text-green-600 mt-2 italic">{item.tip}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default NurseReports
