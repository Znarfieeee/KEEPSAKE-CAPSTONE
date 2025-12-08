import React, { useState, useMemo, useCallback, useEffect } from 'react'
import ExcelJS from 'exceljs'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import {
    Calendar,
    Heart,
    Activity,
    TrendingUp,
    Download,
    AlertCircle,
    RefreshCw,
    FileText,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getParentChildren, getChildReport } from '@/api/parent/reports'
import { getMySubscription } from '@/api/parent/subscription'
import { showToast } from '@/util/alertHelper'
import { useAuth } from '@/context/auth'
import PremiumOverlay from '@/components/premium/PremiumOverlay'

const ParentReports = () => {
    const { user } = useAuth()
    const [children, setChildren] = useState([])
    const [selectedChild, setSelectedChild] = useState(null)
    const [reportType, setReportType] = useState('')
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 90))
            .toISOString()
            .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })
    const [exportFormat, setExportFormat] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reportLoading, setReportLoading] = useState(false)
    const [error, setError] = useState(null)
    const [reportData, setReportData] = useState(null)
    const [cacheInfo, setCacheInfo] = useState({ cached: false, cache_expires_in: 0 })
    const [hasPremium, setHasPremium] = useState(false)
    const [checkingSubscription, setCheckingSubscription] = useState(true)

    // Check subscription status on mount
    useEffect(() => {
        checkSubscription()
    }, [])

    // Fetch children list on mount
    useEffect(() => {
        fetchChildren()
    }, [])

    const checkSubscription = async () => {
        setCheckingSubscription(true)
        try {
            const response = await getMySubscription()
            const subscription = response.data

            // Check if user has active premium subscription
            const isPremium =
                subscription &&
                subscription.status === 'active' &&
                subscription.plan_type === 'premium'

            setHasPremium(isPremium)
        } catch (error) {
            console.error('Error checking subscription:', error)
            setHasPremium(false)
        } finally {
            setCheckingSubscription(false)
        }
    }

    const fetchChildren = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await getParentChildren()
            const childrenList = response.data.children || []
            setChildren(childrenList)
        } catch (error) {
            console.error('Error fetching children:', error)
            setError(error.message || 'Failed to load children data')
            showToast('error', 'Failed to load children data')
        } finally {
            setLoading(false)
        }
    }

    const handleViewReport = () => {
        if (!selectedChild) {
            showToast('error', 'Please select a child')
            return
        }
        if (!reportType) {
            showToast('error', 'Please select a report type')
            return
        }
        if (reportType === 'vitals') {
            showToast('info', 'Vital Signs tracking is coming soon!')
            return
        }
        fetchChildReport(false)
    }

    // Clear report data when child or report type changes
    useEffect(() => {
        setReportData(null)
    }, [selectedChild, reportType])

    const fetchChildReport = useCallback(
        async (bustCache = false) => {
            if (!selectedChild) return

            setReportLoading(true)
            setError(null)
            try {
                const params = { bust_cache: bustCache }
                const response = await getChildReport(selectedChild, params)

                setReportData(response.data)
                setCacheInfo({
                    cached: response.cached || false,
                    cache_expires_in: response.cache_expires_in || 0,
                })
            } catch (error) {
                console.error('Error fetching child report:', error)

                // Handle premium subscription error (403)
                if (error.response?.status === 403 || error.response?.data?.premium_required) {
                    setHasPremium(false)
                    showToast('error', 'Premium subscription required to view reports')
                } else {
                    setError(error.message || 'Failed to load report data')
                    showToast('error', 'Failed to load report data')
                }
            } finally {
                setReportLoading(false)
            }
        },
        [selectedChild]
    )

    const summaryMetrics = useMemo(() => {
        if (!reportData) {
            return {
                childName: 'N/A',
                age: 0,
                latestHeight: 0,
                latestWeight: 0,
                latestBMI: 0,
                heightPercentile: 0,
                weightPercentile: 0,
                immunizationProgress: 0,
                completedVaccines: 0,
                totalVaccines: 0,
            }
        }
        return reportData.summaryMetrics || {}
    }, [reportData])

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

            const titleRow = worksheet.addRow([
                `KEEPSAKE - ${summaryMetrics.childName}'s ${reportType.toUpperCase()} REPORT`,
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

    const getReportData = () => {
        if (!reportData) return []

        switch (reportType) {
            case 'growth':
                return reportData.growthData || []
            case 'vitals':
                return reportData.vitalsData || []
            case 'immunization':
                return reportData.immunizationData || []
            default:
                return []
        }
    }

    const handleExport = async (format) => {
        const data = getReportData()
        if (!data || data.length === 0) {
            showToast('error', 'No data available to export')
            return
        }

        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `${summaryMetrics.childName}-${reportType}-report-${timestamp}`

        try {
            switch (format) {
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

            showToast('success', `Report exported as ${format.toUpperCase()}`)
            setExportFormat(null)
        } catch (error) {
            console.error('Export error:', error)
            showToast('error', 'Export failed')
        }
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

    // Skeleton loader component
    const ChartSkeleton = () => (
        <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading chart...</div>
        </div>
    )

    const TableSkeleton = ({ rows = 5 }) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                        {[1, 2, 3, 4].map((i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                            {[1, 2, 3, 4].map((i) => (
                                <td key={i} className="px-4 py-3">
                                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    // Error state
    if (error && children.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-gray-700 text-lg mb-4">{error}</p>
                    <Button
                        onClick={() => fetchChildren()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    // Loading state for initial load - show skeleton loaders
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <div className="mb-6">
                    {/* <div className="flex items-center gap-3 mb-4">
                        <TrendingUp size={36} className="text-green-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                My Child's Health Reports
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">
                                Track your child's growth, vitals, and immunization progress over time
                            </p>
                        </div>
                    </div> */}

                    {/* Child & Report Selection Skeleton */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Child Selection Skeleton */}
                            <div className="flex items-center gap-3">
                                {/* <Heart
                                    size={20}
                                    className="text-gray-300 flex-shrink-0 animate-pulse"
                                /> */}
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                            </div>

                            {/* Report Type Skeleton */}
                            <div className="flex items-center gap-3">
                                {/* <FileText
                                    size={20}
                                    className="text-gray-300 flex-shrink-0 animate-pulse"
                                /> */}
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                            </div>

                            {/* Button Skeleton */}
                            <div className="flex items-end">
                                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // No children state
    if (children.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Heart className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-700 text-lg mb-2">No children found</p>
                    <p className="text-gray-500">
                        Please contact your healthcare provider to grant access
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header with Child Selection */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    {/* <div className="flex items-center gap-3">
                        <TrendingUp size={36} className="text-green-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                My Child's Health Reports
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">
                                Track your child's growth, vitals, and immunization progress over
                                time
                            </p>
                        </div>
                    </div> */}
                    {/* {!reportLoading && reportData && selectedChild && reportType && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => fetchChildReport(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </Button>
                            {cacheInfo.cached && (
                                <span className="text-xs text-gray-500">
                                    Cached ({Math.floor(cacheInfo.cache_expires_in / 60)}m
                                    remaining)
                                </span>
                            )}
                        </div>
                    )} */}
                </div>

                {/* Child & Report Selection - Moved to top */}
                <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* Child Selection */}
                        <div className="flex items-center gap-3">
                            {/* <Heart size={20} className="text-green-600 flex-shrink-0" /> */}
                            <div className="flex-1">
                                <label
                                    htmlFor="child-select-top"
                                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1"
                                >
                                    Select Child
                                </label>
                                <div className="relative">
                                    <select
                                        id="child-select-top"
                                        value={selectedChild || ''}
                                        onChange={(e) => setSelectedChild(e.target.value)}
                                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 text-sm font-semibold shadow-sm hover:border-green-400 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Choose a child...</option>
                                        {children.map((child) => (
                                            <option key={child.id} value={child.id}>
                                                {child.name} ({child.age}{' '}
                                                {child.age === 1 ? 'year' : 'years'}) -{' '}
                                                {child.sex === 'male'
                                                    ? '👦'
                                                    : child.sex === 'female'
                                                    ? '👧'
                                                    : '🧒'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-600">
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Report Type Selection */}
                        <div className="flex items-center gap-3">
                            {/* <FileText size={20} className="text-green-600 flex-shrink-0" /> */}
                            <div className="flex-1">
                                <label
                                    htmlFor="report-type-select"
                                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1"
                                >
                                    Report Type
                                </label>
                                <div className="relative">
                                    <select
                                        id="report-type-select"
                                        value={reportType || ''}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 text-sm font-semibold shadow-sm hover:border-green-400 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Choose report type...</option>
                                        <option value="growth">📊 Growth Trends</option>
                                        <option value="immunization">💉 Immunizations</option>
                                        <option value="vitals" disabled>
                                            ❤️ Vital Signs (Coming Soon)
                                        </option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-600">
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* View Report Button */}
                        <div>
                            <Button
                                onClick={handleViewReport}
                                disabled={!selectedChild || !reportType || reportType === 'vitals'}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all"
                            >
                                <TrendingUp size={18} />
                                {!selectedChild || !reportType
                                    ? 'Select Above to Continue'
                                    : reportType === 'vitals'
                                    ? 'Coming Soon'
                                    : 'View Report'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Metrics */}
            {!reportLoading && reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatBox
                        icon={Heart}
                        label="Current Height (cm)"
                        value={summaryMetrics.latestHeight}
                        color="green"
                    />
                    <StatBox
                        icon={Activity}
                        label="Current Weight (kg)"
                        value={summaryMetrics.latestWeight}
                        color="blue"
                    />
                    <StatBox
                        icon={TrendingUp}
                        label="Current BMI"
                        value={summaryMetrics.latestBMI.toFixed(1)}
                        color="purple"
                    />
                    <StatBox
                        icon={Calendar}
                        label="Immunization Progress"
                        value={`${summaryMetrics.immunizationProgress}%`}
                        color="orange"
                    />
                </div>
            )}

            {/* Export Section */}
            {/* {!reportLoading && reportData && (
                <Card className="mb-8 border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={18} />
                            Export Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
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
                                <div className="flex gap-2">
                                    {['xlsx', 'csv', 'json', 'txt'].map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => handleExport(format)}
                                            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded text-sm text-gray-700"
                                        >
                                            {format.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )} */}

            {/* Initial State - No report selected */}
            {!reportLoading && !reportData && (
                <Card className="mb-8 border-2 border-gray-200 shadow-sm bg-gradient-to-br from-gray-50 to-white">
                    <CardContent className="pt-12 pb-12">
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            <div className="bg-green-100 rounded-full p-6 mb-6">
                                <TrendingUp size={64} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                Ready to View Health Reports
                            </h3>
                            <p className="text-gray-600 max-w-md mb-6">
                                Select your child and choose a report type above, then click "View
                                Report" to see detailed health data and insights.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Growth Trends</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Immunizations</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <span>Vitals (Coming Soon)</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Report Content - Show skeletons while loading */}
            {(reportLoading || reportData) && (
                <>
                    {reportType === 'growth' && (
                        <>
                            {/* Growth Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="border-b border-gray-200">
                                        <CardTitle className="text-lg font-bold text-gray-900">
                                            Height & Weight Trend
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {reportLoading ? (
                                            <ChartSkeleton />
                                        ) : reportData.growthData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={reportData.growthData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="height"
                                                        stroke="#10B981"
                                                        fill="#D1FAE5"
                                                        name="Height (cm)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="weight"
                                                        stroke="#3B82F6"
                                                        fill="#DBEAFE"
                                                        name="Weight (kg)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                                No growth data available
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="border-b border-gray-200">
                                        <CardTitle className="text-lg font-bold text-gray-900">
                                            Growth Percentiles
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {reportLoading ? (
                                            <ChartSkeleton />
                                        ) : reportData.growthData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={reportData.growthData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis domain={[0, 100]} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="heightPercentile"
                                                        stroke="#10B981"
                                                        name="Height Percentile"
                                                        strokeWidth={2}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="weightPercentile"
                                                        stroke="#3B82F6"
                                                        name="Weight Percentile"
                                                        strokeWidth={2}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                                No growth data available
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* BMI Chart */}
                            <Card className="mb-8 border border-gray-200 shadow-sm">
                                <CardHeader className="border-b border-gray-200">
                                    <CardTitle className="text-lg font-bold text-gray-900">
                                        BMI Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {reportLoading ? (
                                        <ChartSkeleton />
                                    ) : reportData.growthData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={reportData.growthData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="bmi"
                                                    stroke="#F59E0B"
                                                    strokeWidth={3}
                                                    name="BMI"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No growth data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {reportType === 'vitals' && (
                        <Card className="mb-8 border-2 border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-yellow-50">
                            <CardContent className="pt-8 pb-8">
                                <div className="flex flex-col items-center justify-center text-center py-12">
                                    <div className="bg-orange-100 rounded-full p-6 mb-6">
                                        <Activity size={64} className="text-orange-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        Vital Signs Tracking - Coming Soon!
                                    </h3>
                                    <p className="text-gray-600 max-w-md mb-4">
                                        We're working on bringing you comprehensive vital signs
                                        monitoring including heart rate, blood pressure,
                                        temperature, and oxygen saturation tracking.
                                    </p>
                                    <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                                        <Calendar size={16} />
                                        <span>Available Soon</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {reportType === 'immunization' && (
                        <>
                            {/* Immunization Summary */}
                            <Card className="mb-8 border border-gray-200 shadow-sm">
                                <CardHeader className="border-b border-gray-200">
                                    <CardTitle className="text-lg font-bold text-gray-900">
                                        Immunization Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {reportLoading ? (
                                        <div className="space-y-4">
                                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        Vaccines Completed
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {summaryMetrics.completedVaccines} /{' '}
                                                        {summaryMetrics.totalVaccines}
                                                    </p>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-green-600 h-3 rounded-full transition-all"
                                                        style={{
                                                            width: `${summaryMetrics.immunizationProgress}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Immunization Schedule */}
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="border-b border-gray-200">
                                    <CardTitle className="text-lg font-bold text-gray-900">
                                        Vaccination Schedule & Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {reportLoading ? (
                                        <TableSkeleton rows={5} />
                                    ) : reportData.immunizationData.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Vaccine
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Due Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Completed Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.immunizationData.map(
                                                        (vaccine, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className="border-b border-gray-200 hover:bg-gray-50"
                                                            >
                                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                                    {vaccine.vaccine}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {vaccine.dueDate}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {vaccine.date || 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                            vaccine.status ===
                                                                            'completed'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-yellow-100 text-yellow-800'
                                                                        }`}
                                                                    >
                                                                        {vaccine.status
                                                                            .charAt(0)
                                                                            .toUpperCase() +
                                                                            vaccine.status.slice(1)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-[200px] text-gray-500">
                                            No immunization data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Detailed Data Table */}
                    {getReportData().length > 0 && (
                        <Card className="mt-8 border border-gray-200 shadow-sm">
                            <CardHeader className="border-b border-gray-200">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    {reportType === 'growth' && 'Detailed Growth Data'}
                                    {reportType === 'vitals' && 'Detailed Vital Signs Data'}
                                    {reportType === 'immunization' && 'Detailed Immunization Data'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {reportLoading ? (
                                    <TableSkeleton rows={8} />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 border-b border-gray-200">
                                                <tr>
                                                    {Object.keys(getReportData()[0]).map(
                                                        (header) => (
                                                            <th
                                                                key={header}
                                                                className="px-4 py-3 text-left font-semibold text-gray-900"
                                                            >
                                                                {header
                                                                    .replace(/_/g, ' ')
                                                                    .toUpperCase()}
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getReportData().map((row, idx) => (
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
                                                                          value < 10 ? 1 : 0
                                                                      )
                                                                    : value || 'N/A'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Premium Overlay - Shows when user doesn't have premium */}
            {!checkingSubscription && !hasPremium && <PremiumOverlay />}
        </div>
    )
}

export default ParentReports
