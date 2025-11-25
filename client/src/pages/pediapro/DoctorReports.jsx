import React, { useState, useMemo } from 'react'
import ExcelJS from 'exceljs'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
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
    Zap,
    Building2,
    Filter,
    FileText,
    CheckCircle2,
    Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

const DoctorReports = () => {
    const [selectedReport, setSelectedReport] = useState('patient-health')
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })
    const [exportFormat, setExportFormat] = useState(null)

    // Patient Health Trend Data - Growth
    const patientGrowthData = [
        { patient: 'John Doe', age: 8, height: 128, weight: 28, bmi: 17.1, growthPercentile: 68 },
        { patient: 'Jane Smith', age: 6, height: 116, weight: 21, bmi: 15.6, growthPercentile: 72 },
        {
            patient: 'Michael Johnson',
            age: 10,
            height: 142,
            weight: 38,
            bmi: 18.8,
            growthPercentile: 65,
        },
        {
            patient: 'Sarah Williams',
            age: 5,
            height: 109,
            weight: 19,
            bmi: 16.0,
            growthPercentile: 70,
        },
        {
            patient: 'David Brown',
            age: 9,
            height: 135,
            weight: 32,
            bmi: 17.5,
            growthPercentile: 69,
        },
    ]

    // Patient Health Trend Data - Vitals
    const patientVitalsData = [
        {
            patient: 'John Doe',
            bloodPressure: '110/70',
            heartRate: 82,
            temperature: 98.6,
            oxygenSaturation: 98,
        },
        {
            patient: 'Jane Smith',
            bloodPressure: '105/68',
            heartRate: 88,
            temperature: 98.4,
            oxygenSaturation: 99,
        },
        {
            patient: 'Michael Johnson',
            bloodPressure: '112/72',
            heartRate: 80,
            temperature: 98.7,
            oxygenSaturation: 98,
        },
        {
            patient: 'Sarah Williams',
            bloodPressure: '103/66',
            heartRate: 90,
            temperature: 98.5,
            oxygenSaturation: 99,
        },
        {
            patient: 'David Brown',
            bloodPressure: '108/69',
            heartRate: 84,
            temperature: 98.6,
            oxygenSaturation: 98,
        },
    ]

    // Patient Health Trend Data - Immunizations
    const patientImmunizationData = [
        { patient: 'John Doe', mmr: true, polio: true, dpt: true, hepatitisB: true, completed: 4 },
        {
            patient: 'Jane Smith',
            mmr: true,
            polio: true,
            dpt: false,
            hepatitisB: true,
            completed: 3,
        },
        {
            patient: 'Michael Johnson',
            mmr: true,
            polio: true,
            dpt: true,
            hepatitisB: true,
            completed: 4,
        },
        {
            patient: 'Sarah Williams',
            mmr: false,
            polio: true,
            dpt: true,
            hepatitisB: true,
            completed: 3,
        },
        {
            patient: 'David Brown',
            mmr: true,
            polio: true,
            dpt: true,
            hepatitisB: true,
            completed: 4,
        },
    ]

    // Appointment Rate Data
    const appointmentRateData = [
        { date: '2025-10-25', scheduled: 24, completed: 22, cancelled: 2, noshow: 0, rate: 91.7 },
        { date: '2025-10-26', scheduled: 28, completed: 26, cancelled: 1, noshow: 1, rate: 92.9 },
        { date: '2025-10-27', scheduled: 26, completed: 25, cancelled: 1, noshow: 0, rate: 96.2 },
        { date: '2025-10-28', scheduled: 32, completed: 30, cancelled: 2, noshow: 0, rate: 93.8 },
        { date: '2025-10-29', scheduled: 29, completed: 28, cancelled: 1, noshow: 0, rate: 96.6 },
        { date: '2025-10-30', scheduled: 31, completed: 30, cancelled: 0, noshow: 1, rate: 96.8 },
    ]

    // Record Update Frequency Data
    const recordUpdateFrequencyData = [
        { facility: 'Central Clinic', daily: 89, weekly: 34, monthly: 12, updateRate: 98.2 },
        { facility: 'North Medical', daily: 102, weekly: 41, monthly: 8, updateRate: 98.8 },
        { facility: 'South Health Center', daily: 76, weekly: 48, monthly: 24, updateRate: 97.1 },
        { facility: 'East Pediatric', daily: 95, weekly: 60, monthly: 10, updateRate: 98.6 },
        { facility: 'West Family Care', daily: 108, weekly: 70, monthly: 8, updateRate: 99.1 },
    ]

    // Growth Trend Over Time
    const growthTrendData = [
        { month: 'June', heightPercentile: 62, weightPercentile: 58, bmiPercentile: 60 },
        { month: 'July', heightPercentile: 64, weightPercentile: 61, bmiPercentile: 62 },
        { month: 'August', heightPercentile: 66, weightPercentile: 64, bmiPercentile: 64 },
        { month: 'September', heightPercentile: 68, weightPercentile: 66, bmiPercentile: 65 },
        { month: 'October', heightPercentile: 69, weightPercentile: 68, bmiPercentile: 67 },
    ]

    // Immunization Status Distribution
    const immunizationDistribution = [
        { name: 'Fully Immunized', value: 45, color: '#10B981' },
        { name: 'Partially Immunized', value: 28, color: '#F59E0B' },
        { name: 'Not Immunized', value: 7, color: '#EF4444' },
    ]

    const summaryMetrics = useMemo(() => {
        return {
            totalPatients: 127,
            totalAppointments: 170,
            avgCompletionRate: 94.65,
            recordsUpdatedToday: 423,
            avgUpdateFrequency: 98.36,
            fullyImmunizedCount: 45,
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
KEEPSAKE - DOCTOR REPORTS - ${reportType.replace(/-/g, ' ').toUpperCase()}
Generated: ${new Date().toLocaleDateString()}
Date Range: ${dateRange.startDate} to ${dateRange.endDate}

Summary Metrics:
- Total Patients: ${summaryMetrics.totalPatients}
- Total Appointments: ${summaryMetrics.totalAppointments}
- Average Completion Rate: ${summaryMetrics.avgCompletionRate}%
- Records Updated Today: ${summaryMetrics.recordsUpdatedToday}
- Average Update Frequency: ${summaryMetrics.avgUpdateFrequency}%
- Fully Immunized: ${summaryMetrics.fullyImmunizedCount}

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

            const titleRow = worksheet.addRow([
                `KEEPSAKE - DOCTOR REPORTS - ${selectedReport.replace(/-/g, ' ').toUpperCase()}`,
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

            worksheet.addRow([])

            const headers = Object.keys(data[0])
            const headerRow = worksheet.addRow(
                headers.map((h) => h.replace(/_/g, ' ').toUpperCase())
            )

            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF3B82F6' },
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
            case 'patient-health':
                return patientGrowthData
            case 'appointment-rate':
                return appointmentRateData
            case 'record-update':
                return recordUpdateFrequencyData
            default:
                return []
        }
    }

    const handleExport = async (format) => {
        const reportData = getReportData(selectedReport)
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `doctor-${selectedReport}-report-${timestamp}`

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
            {/* <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={36} className="text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Reports & Analytics</h1>
                </div>
                <p className="text-gray-600">
                    Comprehensive patient health analytics, clinic performance metrics, and
                    exportable reports
                </p>
            </div> */}

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
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
                    icon={Heart}
                    label="Fully Immunized"
                    value={summaryMetrics.fullyImmunizedCount}
                    color="red"
                />
                <StatBox
                    icon={Clock}
                    label="Update Frequency"
                    value={`${summaryMetrics.avgUpdateFrequency.toFixed(1)}%`}
                    color="blue"
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
                            description="Growth metrics, vital signs, and immunization status for your patients"
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
                            description="Daily, weekly, and monthly record updates across all facilities"
                            reportKey="record-update"
                            isSelected={selectedReport === 'record-update'}
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Button
                                    onClick={() =>
                                        setExportFormat(exportFormat === null ? 'csv' : null)
                                    }
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                                >
                                    <Download size={18} />
                                    Export
                                </Button>
                                {exportFormat !== null && (
                                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg p-2 z-10 w-40">
                                        <button
                                            onClick={() => handleExport('xlsx')}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            Excel
                                        </button>
                                        <button
                                            onClick={() => handleExport('csv')}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            CSV
                                        </button>
                                        {/* <button
                                            onClick={() => handleExport('json')}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            JSON
                                        </button> */}
                                        <button
                                            onClick={() => handleExport('txt')}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            TXT
                                        </button>
                                        <button
                                            onClick={() => handleExport('pdf')}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm text-gray-700 flex items-center gap-2"
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
                            {selectedReport === 'patient-health' &&
                                'Patient Growth Percentile Trends'}
                            {selectedReport === 'appointment-rate' &&
                                'Daily Appointment Completion Trends'}
                            {selectedReport === 'record-update' &&
                                'Record Update Frequency by Facility'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {selectedReport === 'patient-health' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={growthTrendData}>
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
                                        dataKey="facility"
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
                    </CardContent>
                </Card>

                {/* Chart 2 */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {selectedReport === 'patient-health' &&
                                'Immunization Status Distribution'}
                            {selectedReport === 'appointment-rate' && 'Completion Rate %'}
                            {selectedReport === 'record-update' && 'Facility Update Rate Summary'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {selectedReport === 'patient-health' && (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={immunizationDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {immunizationDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
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
                                <BarChart data={recordUpdateFrequencyData}>
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
                                    <Bar dataKey="updateRate" fill="#3B82F6" name="Update Rate %" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Insights Chart for Patient Health */}
            {selectedReport === 'patient-health' && (
                <Card className="mb-8 border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900">
                            Patient BMI & Growth Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={patientGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="patient" angle={-45} textAnchor="end" height={80} />
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
                    </CardContent>
                </Card>
            )}

            {/* Detailed Data Table */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900">
                        {selectedReport === 'patient-health' && 'Detailed Patient Health Data'}
                        {selectedReport === 'appointment-rate' && 'Appointment Details'}
                        {selectedReport === 'record-update' && 'Record Update Details by Facility'}
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
