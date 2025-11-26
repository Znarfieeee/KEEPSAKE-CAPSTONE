import React, { useState, useMemo } from 'react'
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
import { Calendar, Heart, Activity, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const ParentReports = () => {
    const [selectedChild, setSelectedChild] = useState('child-1')
    const [reportType, setReportType] = useState('growth')
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 90))
            .toISOString()
            .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })
    // const [exportFormat, setExportFormat] = useState(null)

    // Sample child data
    const children = [
        { id: 'child-1', name: 'John Doe', age: 8, dob: '2017-03-15' },
        { id: 'child-2', name: 'Jane Doe', age: 6, dob: '2019-07-22' },
    ]

    // Growth Data
    const growthData = {
        'child-1': [
            {
                month: 'July',
                height: 126,
                weight: 27,
                bmi: 17.0,
                heightPercentile: 65,
                weightPercentile: 62,
            },
            {
                month: 'August',
                height: 127,
                weight: 27.5,
                bmi: 17.1,
                heightPercentile: 66,
                weightPercentile: 63,
            },
            {
                month: 'September',
                height: 128,
                weight: 28,
                bmi: 17.1,
                heightPercentile: 68,
                weightPercentile: 64,
            },
            {
                month: 'October',
                height: 129,
                weight: 28.5,
                bmi: 17.2,
                heightPercentile: 69,
                weightPercentile: 65,
            },
            {
                month: 'November',
                height: 130,
                weight: 29,
                bmi: 17.2,
                heightPercentile: 70,
                weightPercentile: 66,
            },
        ],
        'child-2': [
            {
                month: 'July',
                height: 114,
                weight: 20.5,
                bmi: 15.7,
                heightPercentile: 68,
                weightPercentile: 70,
            },
            {
                month: 'August',
                height: 114.5,
                weight: 21,
                bmi: 15.8,
                heightPercentile: 69,
                weightPercentile: 71,
            },
            {
                month: 'September',
                height: 115,
                weight: 21.5,
                bmi: 16.0,
                heightPercentile: 70,
                weightPercentile: 71,
            },
            {
                month: 'October',
                height: 115.5,
                weight: 22,
                bmi: 16.1,
                heightPercentile: 71,
                weightPercentile: 72,
            },
            {
                month: 'November',
                height: 116,
                weight: 22.5,
                bmi: 16.2,
                heightPercentile: 72,
                weightPercentile: 73,
            },
        ],
    }

    // Vitals Data
    const vitalsData = {
        'child-1': [
            {
                date: '2025-10-25',
                bloodPressure: '110/70',
                heartRate: 82,
                temperature: 98.6,
                oxygenSat: 98,
            },
            {
                date: '2025-10-26',
                bloodPressure: '110/71',
                heartRate: 80,
                temperature: 98.4,
                oxygenSat: 98,
            },
            {
                date: '2025-10-27',
                bloodPressure: '109/70',
                heartRate: 83,
                temperature: 98.5,
                oxygenSat: 99,
            },
            {
                date: '2025-10-28',
                bloodPressure: '111/71',
                heartRate: 81,
                temperature: 98.6,
                oxygenSat: 98,
            },
            {
                date: '2025-10-29',
                bloodPressure: '110/70',
                heartRate: 84,
                temperature: 98.4,
                oxygenSat: 99,
            },
            {
                date: '2025-10-30',
                bloodPressure: '110/72',
                heartRate: 82,
                temperature: 98.5,
                oxygenSat: 98,
            },
        ],
        'child-2': [
            {
                date: '2025-10-25',
                bloodPressure: '105/68',
                heartRate: 88,
                temperature: 98.6,
                oxygenSat: 99,
            },
            {
                date: '2025-10-26',
                bloodPressure: '105/67',
                heartRate: 90,
                temperature: 98.4,
                oxygenSat: 99,
            },
            {
                date: '2025-10-27',
                bloodPressure: '104/68',
                heartRate: 89,
                temperature: 98.5,
                oxygenSat: 99,
            },
            {
                date: '2025-10-28',
                bloodPressure: '106/68',
                heartRate: 87,
                temperature: 98.6,
                oxygenSat: 99,
            },
            {
                date: '2025-10-29',
                bloodPressure: '105/69',
                heartRate: 88,
                temperature: 98.4,
                oxygenSat: 99,
            },
            {
                date: '2025-10-30',
                bloodPressure: '105/67',
                heartRate: 86,
                temperature: 98.5,
                oxygenSat: 99,
            },
        ],
    }

    // Immunization Data
    const immunizationData = {
        'child-1': [
            { vaccine: 'MMR', dueDate: '2025-09-15', status: 'completed', date: '2025-08-20' },
            { vaccine: 'Polio', dueDate: '2025-09-15', status: 'completed', date: '2025-08-15' },
            { vaccine: 'DPT', dueDate: '2025-10-15', status: 'completed', date: '2025-09-20' },
            {
                vaccine: 'Hepatitis B',
                dueDate: '2025-11-15',
                status: 'completed',
                date: '2025-10-25',
            },
            { vaccine: 'Varicella', dueDate: '2025-12-15', status: 'pending', date: null },
        ],
        'child-2': [
            { vaccine: 'MMR', dueDate: '2025-09-22', status: 'completed', date: '2025-08-22' },
            { vaccine: 'Polio', dueDate: '2025-09-22', status: 'completed', date: '2025-08-18' },
            { vaccine: 'DPT', dueDate: '2025-10-22', status: 'completed', date: '2025-09-25' },
            { vaccine: 'Hepatitis B', dueDate: '2025-11-22', status: 'pending', date: null },
            { vaccine: 'Varicella', dueDate: '2025-12-22', status: 'pending', date: null },
        ],
    }

    const summaryMetrics = useMemo(() => {
        const selectedChildData = children.find((c) => c.id === selectedChild)
        const childGrowth = growthData[selectedChild]
        const childImmunizations = immunizationData[selectedChild]

        const latestGrowth = childGrowth[childGrowth.length - 1]
        const completedVaccines = childImmunizations.filter((v) => v.status === 'completed').length
        const totalVaccines = childImmunizations.length

        return {
            childName: selectedChildData?.name || 'N/A',
            age: selectedChildData?.age || 0,
            latestHeight: latestGrowth?.height || 0,
            latestWeight: latestGrowth?.weight || 0,
            latestBMI: latestGrowth?.bmi || 0,
            heightPercentile: latestGrowth?.heightPercentile || 0,
            weightPercentile: latestGrowth?.weightPercentile || 0,
            immunizationProgress: ((completedVaccines / totalVaccines) * 100).toFixed(1),
            completedVaccines,
            totalVaccines,
        }
    }, [selectedChild])

    // Export functions - to be added soon
    // const exportToCSV = (data, filename) => { ... }
    // const exportToJSON = (data, filename) => { ... }
    // const exportToExcel = async (data, filename) => { ... }
    // const downloadFile = (blob, filename) => { ... }

    const getReportData = () => {
        switch (reportType) {
            case 'growth':
                return growthData[selectedChild]
            case 'vitals':
                return vitalsData[selectedChild]
            case 'immunization':
                return immunizationData[selectedChild]
            default:
                return []
        }
    }

    // const handleExport = async (format) => { ... }

    const StatBox = ({ icon: Icon, label, value, color = 'primary' }) => {
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={36} className="text-green-600" />
                    <h1 className="text-3xl font-bold text-gray-900">My Child's Health Reports</h1>
                </div>
                <p className="text-gray-600">
                    Track your child's growth, vitals, and immunization progress over time
                </p>
            </div>

            {/* Summary Metrics */}
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

            {/* Child Selection & Report Type */}
            <Card className="mb-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900">
                        Select Child & Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Child Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                👨‍👩‍👧 Choose Your Child
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {children.map((child) => (
                                    <button
                                        key={child.id}
                                        onClick={() => setSelectedChild(child.id)}
                                        className={`px-4 py-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                                            selectedChild === child.id
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-[var(--primary)]/30 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 text-base">
                                                    {child.name}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Age: {child.age} years old
                                                </p>
                                            </div>
                                            {selectedChild === child.id && (
                                                <span className="text-lg">✓</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Report Type Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                📋 Report Type
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    {
                                        key: 'growth',
                                        label: 'Growth Trends',
                                        icon: '📊',
                                        desc: 'Height, Weight & BMI',
                                    },
                                    {
                                        key: 'vitals',
                                        label: 'Vital Signs',
                                        icon: '❤️',
                                        desc: 'Heart Rate & Temperature',
                                    },
                                    {
                                        key: 'immunization',
                                        label: 'Immunizations',
                                        icon: '💉',
                                        desc: 'Vaccination Status',
                                    },
                                ].map((type) => (
                                    <button
                                        key={type.key}
                                        onClick={() => setReportType(type.key)}
                                        className={`px-4 py-4 rounded-lg border-2 transition-all transform hover:scale-105 text-center ${
                                            reportType === type.key
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-[var(--primary)]/30 shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-2xl mb-2">{type.icon}</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {type.label}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {type.desc}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Date Range Filter */}
            <Card className="mb-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        📅 Date Range Filter
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] text-sm"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] text-sm"
                            />
                        </div>
                    </div>
                    {/* Export feature coming soon */}
                    <p className="text-xs text-gray-500 mt-4 italic">
                        📊 Export feature will be added soon
                    </p>
                </CardContent>
            </Card>

            {/* Report Content */}
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
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={growthData[selectedChild]}>
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
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="border-b border-gray-200">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Growth Percentiles
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={growthData[selectedChild]}>
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
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={growthData[selectedChild]}>
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
                        </CardContent>
                    </Card>
                </>
            )}

            {reportType === 'vitals' && (
                <>
                    {/* Vitals Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="border-b border-gray-200">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Heart Rate Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={vitalsData[selectedChild]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="heartRate"
                                            stroke="#EF4444"
                                            strokeWidth={2}
                                            name="Heart Rate (bpm)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="border-b border-gray-200">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Temperature & Oxygen
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={vitalsData[selectedChild]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[95, 100]}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="temperature"
                                            stroke="#F59E0B"
                                            name="Temperature (°F)"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="oxygenSat"
                                            stroke="#10B981"
                                            name="O₂ Saturation (%)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Blood Pressure Chart */}
                    <Card className="mb-8 border border-gray-200 shadow-sm">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-lg font-bold text-gray-900">
                                Blood Pressure Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                Blood Pressure
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vitalsData[selectedChild].map((vital, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-b border-gray-200 hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 text-gray-700">
                                                    {vital.date}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {vital.bloodPressure}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Normal
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
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
                                            className="h-3 rounded-full transition-all"
                                            style={{
                                                width: `${summaryMetrics.immunizationProgress}%`,
                                                backgroundColor: 'var(--primary)',
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
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
                                        {immunizationData[selectedChild].map((vaccine, idx) => (
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
                                                            vaccine.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {vaccine.status.charAt(0).toUpperCase() +
                                                            vaccine.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Detailed Data Table */}
            <Card className="mt-8 border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900">
                        {reportType === 'growth' && 'Detailed Growth Data'}
                        {reportType === 'vitals' && 'Detailed Vital Signs Data'}
                        {reportType === 'immunization' && 'Detailed Immunization Data'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    {Object.keys(getReportData()[0]).map((header) => (
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
                                {getReportData().map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-gray-200 hover:bg-gray-50"
                                    >
                                        {Object.values(row).map((value, valIdx) => (
                                            <td key={valIdx} className="px-4 py-3 text-gray-700">
                                                {typeof value === 'number'
                                                    ? value.toFixed(value < 10 ? 1 : 0)
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
        </div>
    )
}

export default ParentReports
