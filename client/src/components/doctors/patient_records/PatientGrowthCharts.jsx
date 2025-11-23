import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    ComposedChart,
} from 'recharts'
import {
    TrendingUp,
    Ruler,
    Weight,
    Activity,
    Brain,
    AlertCircle,
    Info,
    Plus,
    FileDown,
    Printer,
    Image,
    FileText,
} from 'lucide-react'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import AddMeasurementModal from './AddMeasurementModal'

// Utilities
import {
    formatPatientMeasurements,
    interpretZScore,
    getChartConfig,
    calculateAgeInMonths,
    generateWHOReferenceLines,
} from '@/utils/whoGrowthStandards'
import { exportChartToPDF, exportChartToPNG, printChart } from '@/utils/growthChartExport'
import { showToast } from '@/util/alertHelper'

// Hooks
import { useAuth } from '@/context/auth'
import { useAnthropometricMeasurementsRealtime } from '@/hook/useSupabaseRealtime'

const PatientGrowthCharts = ({ patient, onMeasurementAdded, readOnly = false }) => {
    const [selectedChart, setSelectedChart] = useState('wfa')
    const [showGuideLines, setShowGuideLines] = useState(true) // Always show WHO reference lines by default
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const { user } = useAuth()

    // Check if user can add measurements (doctors, nurses, facility_admin) and not in readOnly mode
    const canAddMeasurements = useMemo(() => {
        return !readOnly && user && ['doctor', 'nurse', 'facility_admin'].includes(user.role)
    }, [user, readOnly])

    // Real-time subscription for measurement changes
    const handleMeasurementChange = useCallback(
        ({ type, measurement }) => {
            console.log(`Measurement ${type}:`, measurement)
            setRefreshKey((prev) => prev + 1)
            onMeasurementAdded?.()
        },
        [onMeasurementAdded]
    )

    // Subscribe to real-time updates for this patient's measurements
    useAnthropometricMeasurementsRealtime({
        patientId: patient?.patient_id,
        onMeasurementChange: handleMeasurementChange,
    })

    // Also listen for custom events (fallback)
    useEffect(() => {
        const handleMilestoneAdded = (event) => {
            if (event.detail?.patient_id === patient?.patient_id) {
                setRefreshKey((prev) => prev + 1)
                onMeasurementAdded?.()
            }
        }

        window.addEventListener('growth-milestone-added', handleMilestoneAdded)

        return () => {
            window.removeEventListener('growth-milestone-added', handleMilestoneAdded)
        }
    }, [patient?.patient_id, onMeasurementAdded])

    const handleAddSuccess = useCallback(() => {
        setRefreshKey((prev) => prev + 1)
        onMeasurementAdded?.()
    }, [onMeasurementAdded])

    // Get current chart configuration (moved before export handlers to fix initialization error)
    const chartConfig = getChartConfig(selectedChart)

    // Export handlers
    const handleExportPDF = useCallback(async () => {
        try {
            const config = getChartConfig(selectedChart)
            await exportChartToPDF('growth-chart-container', patient, selectedChart, config.title)
            showToast('success', 'Chart exported to PDF successfully')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            showToast('error', 'Failed to export chart to PDF')
        }
    }, [patient, selectedChart])

    const handleExportPNG = useCallback(async () => {
        try {
            await exportChartToPNG('growth-chart-container', patient, selectedChart)
            showToast('success', 'Chart exported to PNG successfully')
        } catch (error) {
            console.error('Error exporting PNG:', error)
            showToast('error', 'Failed to export chart to PNG')
        }
    }, [patient, selectedChart])

    const handlePrint = useCallback(async () => {
        try {
            const config = getChartConfig(selectedChart)
            await printChart('growth-chart-container', patient, config.title)
        } catch (error) {
            console.error('Error printing chart:', error)
            showToast('error', 'Failed to print chart')
        }
    }, [patient, selectedChart])

    // Available chart types
    const chartTypes = [
        {
            id: 'wfa',
            label: 'Weight-for-Age',
            icon: Weight,
            description: 'Track weight development over time',
        },
        {
            id: 'lhfa',
            label: 'Length/Height-for-Age',
            icon: Ruler,
            description: 'Track height development over time',
        },
        {
            id: 'wfh',
            label: 'Weight-for-Height',
            icon: Activity,
            description: 'Assess body proportions',
        },
        {
            id: 'hcfa',
            label: 'Head Circumference',
            icon: Brain,
            description: 'Monitor head growth',
        },
        {
            id: 'bfa',
            label: 'BMI-for-Age',
            icon: TrendingUp,
            description: 'Track body mass index',
        },
    ]

    // Get patient measurements and calculate Z-scores
    const measurements = useMemo(() => {
        return formatPatientMeasurements(patient)
    }, [patient])

    // Get patient sex for WHO reference curves (default to male if not specified)
    const patientSex = useMemo(() => {
        if (!patient?.sex) return 'male' // Default to male for reference display
        return patient.sex.toLowerCase() === 'male' ? 'male' : 'female'
    }, [patient?.sex])

    // Generate WHO reference curves (always generate for display)
    const whoCurves = useMemo(() => {
        return generateWHOReferenceLines(selectedChart, patientSex)
    }, [selectedChart, patientSex])

    // Format data for the selected chart
    const chartData = useMemo(() => {
        if (!measurements || measurements.length === 0) return []

        return measurements
            .map((m) => ({
                age: m.ageMonths,
                value:
                    selectedChart === 'wfa'
                        ? m.weight
                        : selectedChart === 'lhfa'
                        ? m.height
                        : selectedChart === 'wfh'
                        ? m.weight
                        : selectedChart === 'hcfa'
                        ? m.headCircumference
                        : selectedChart === 'bfa'
                        ? m.weight && m.height
                            ? m.weight / Math.pow(m.height / 100, 2)
                            : null
                        : null,
                zScore: m.zScores[selectedChart],
                date: new Date(m.date).toLocaleDateString(),
            }))
            .filter((d) => d.value !== null)
    }, [measurements, selectedChart])

    // Merge patient data with WHO reference curves for chart display
    const mergedChartData = useMemo(() => {
        if (!whoCurves) {
            return chartData
        }

        // Create a map that can hold multiple patient measurements per age
        // Use an array for each age to preserve all measurements
        const patientDataByAge = new Map()
        chartData.forEach((d) => {
            if (!patientDataByAge.has(d.age)) {
                patientDataByAge.set(d.age, [])
            }
            patientDataByAge.get(d.age).push(d)
        })

        // Get all unique age points from WHO curves
        const allAgePoints = new Set()
        Object.values(whoCurves).forEach((curve) => {
            if (Array.isArray(curve)) {
                curve.forEach((point) => allAgePoints.add(point.age))
            }
        })

        // Add patient age points to ensure they're included
        chartData.forEach((d) => allAgePoints.add(d.age))

        // Build merged data array
        const merged = []

        // First, add all WHO curve points
        Array.from(allAgePoints)
            .sort((a, b) => a - b)
            .forEach((age) => {
                const dataPoint = { age }

                // Add WHO reference values
                Object.keys(whoCurves).forEach((key) => {
                    const curvePoint = whoCurves[key].find((p) => p.age === age)
                    if (curvePoint) {
                        dataPoint[key] = curvePoint.value
                    }
                })

                // If this age has patient data, add all measurements for this age
                if (patientDataByAge.has(age)) {
                    const patientPoints = patientDataByAge.get(age)

                    // For the first measurement at this age, add it to the current point
                    if (patientPoints.length > 0) {
                        const firstPoint = patientPoints[0]
                        dataPoint.patientValue = firstPoint.value
                        dataPoint.zScore = firstPoint.zScore
                        dataPoint.date = firstPoint.date
                        merged.push(dataPoint)

                        // For additional measurements at the same age, create separate points
                        // with slight age offset for visualization
                        for (let i = 1; i < patientPoints.length; i++) {
                            const point = patientPoints[i]
                            const offsetPoint = {
                                age: age + i * 0.01, // Tiny offset for visualization
                                ...dataPoint, // Copy WHO reference values
                                patientValue: point.value,
                                zScore: point.zScore,
                                date: point.date,
                            }
                            merged.push(offsetPoint)
                        }
                    }
                } else {
                    // No patient data at this age, just add WHO reference point
                    merged.push(dataPoint)
                }
            })

        return merged
    }, [chartData, whoCurves])

    // Get latest measurement and interpretation
    const latestMeasurement = useMemo(() => {
        if (chartData.length === 0) return null
        const latest = chartData[chartData.length - 1]
        return {
            ...latest,
            interpretation: interpretZScore(latest.zScore, selectedChart),
        }
    }, [chartData, selectedChart])

    // Calculate patient's current age
    const currentAge = useMemo(() => {
        const birthdate = patient?.birthdate || patient?.date_of_birth
        if (!birthdate) return null
        return calculateAgeInMonths(birthdate)
    }, [patient?.birthdate, patient?.date_of_birth])

    // Check if patient is in age range for WHO standards (0-60 months)
    const isInAgeRange = currentAge !== null && currentAge >= 0 && currentAge <= 60

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null

        const data = payload[0].payload

        // Only show tooltip for patient data points
        if (!data.patientValue) return null

        const interpretation = interpretZScore(data.zScore, selectedChart)

        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="font-semibold text-gray-900">{data.date}</p>
                <p className="text-sm text-gray-600">Age: {data.age} months</p>
                <p className="text-sm font-medium text-blue-600">
                    {chartConfig.yAxis}: {data.patientValue?.toFixed(2)}
                </p>
                {data.zScore !== null && (
                    <>
                        <p className="text-sm text-gray-700">Z-Score: {data.zScore?.toFixed(2)}</p>
                        <Badge
                            variant="outline"
                            className={`mt-1 ${
                                interpretation.color === 'red'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : interpretation.color === 'orange'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : interpretation.color === 'yellow'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : interpretation.color === 'green'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : interpretation.color === 'blue'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                        >
                            {interpretation.label}
                        </Badge>
                    </>
                )}
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">No patient data available</p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" id="growth-chart-container">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Growth Charts
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            WHO Child Growth Standards (Birth to 5 years)
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Export/Print Buttons - Hidden on very small screens */}
                        {chartData.length > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportPDF}
                                    className="border-gray-300 hover:bg-gray-50 hidden sm:flex"
                                >
                                    <FileDown className="h-4 w-4 mr-1" />
                                    PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportPNG}
                                    className="border-gray-300 hover:bg-gray-50 hidden sm:flex"
                                >
                                    <Image className="h-4 w-4 mr-1" />
                                    PNG
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrint}
                                    className="border-gray-300 hover:bg-gray-50 hidden sm:flex"
                                >
                                    <Printer className="h-4 w-4 mr-1" />
                                    Print
                                </Button>
                                {/* Mobile: Single export button with icon only */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportPDF}
                                    className="border-gray-300 hover:bg-gray-50 sm:hidden"
                                    title="Export to PDF"
                                >
                                    <FileDown className="h-4 w-4" />
                                </Button>
                            </>
                        )}

                        {/* Add Measurement Button */}
                        {canAddMeasurements && (
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add Measurement</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Chart Type Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                    {chartTypes.map((type) => {
                        const Icon = type.icon
                        const isActive = selectedChart === type.id
                        return (
                            <button
                                key={type.id}
                                onClick={() => setSelectedChart(type.id)}
                                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                                    isActive
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                    <Icon
                                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                            isActive ? 'text-blue-600' : 'text-gray-500'
                                        }`}
                                    />
                                    <span
                                        className={`font-medium text-xs sm:text-sm ${
                                            isActive ? 'text-blue-900' : 'text-gray-900'
                                        }`}
                                    >
                                        {type.label}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
                                    {type.description}
                                </p>
                            </button>
                        )
                    })}
                </div>

                {/* Current Status Card */}
                {latestMeasurement && (
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2 sm:pb-3">
                            <CardTitle className="text-base sm:text-lg">Current Status</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {chartConfig.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        {latestMeasurement.value?.toFixed(2)}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {chartConfig.yAxis} at {latestMeasurement.age} months
                                    </p>
                                </div>
                                <div className="sm:text-right">
                                    <Badge
                                        className={`text-xs sm:text-sm px-2 sm:px-3 py-1 ${
                                            latestMeasurement.interpretation.color === 'red'
                                                ? 'bg-red-100 text-red-800 border-red-300'
                                                : latestMeasurement.interpretation.color ===
                                                  'orange'
                                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                                : latestMeasurement.interpretation.color ===
                                                  'yellow'
                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                : latestMeasurement.interpretation.color === 'green'
                                                ? 'bg-green-100 text-green-800 border-green-300'
                                                : latestMeasurement.interpretation.color === 'blue'
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : 'bg-gray-100 text-gray-800 border-gray-300'
                                        }`}
                                    >
                                        {latestMeasurement.interpretation.label}
                                    </Badge>
                                    <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                                        Z-Score: {latestMeasurement.zScore?.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500">
                                        {latestMeasurement.interpretation.description}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Chart Display */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                            <div>
                                <CardTitle className="text-base sm:text-lg">
                                    {chartConfig.title}
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {chartConfig.subtitle}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={showGuideLines ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setShowGuideLines(!showGuideLines)}
                                    className="text-xs sm:text-sm"
                                >
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                        {showGuideLines ? 'Hide' : 'Show'} Guidelines
                                    </span>
                                    <span className="sm:hidden">
                                        {showGuideLines ? 'Hide' : 'Show'}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        {/* No data message */}
                        {chartData.length === 0 && (
                            <div className="mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-xs sm:text-sm text-blue-800">
                                    <strong>No patient measurements recorded yet.</strong> WHO
                                    reference curves for {patient?.sex || 'male'} children are
                                    displayed below.
                                    {!patient?.sex && (
                                        <span className="ml-1 hidden sm:inline">
                                            (Using default male reference curves - update patient
                                            sex for accurate charts)
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Always display the chart with WHO reference curves */}
                        <div className="h-[300px] sm:h-[400px] md:h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={mergedChartData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                                >
                                    {/* Darker grid lines like WHO charts */}
                                    <CartesianGrid
                                        strokeDasharray="0"
                                        stroke="#d1d5db"
                                        strokeWidth={0.5}
                                        horizontal={true}
                                        vertical={true}
                                    />
                                    <XAxis
                                        dataKey="age"
                                        label={{
                                            value: chartConfig.xAxis,
                                            position: 'insideBottom',
                                            offset: -10,
                                            style: { fontWeight: 500 },
                                        }}
                                        stroke="#374151"
                                        strokeWidth={1.5}
                                        tick={{ fontSize: 12, fill: '#374151' }}
                                        tickLine={{ stroke: '#374151' }}
                                    />
                                    <YAxis
                                        label={{
                                            value: chartConfig.yAxis,
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { fontWeight: 500 },
                                        }}
                                        stroke="#374151"
                                        strokeWidth={1.5}
                                        tick={{ fontSize: 12, fill: '#374151' }}
                                        tickLine={{ stroke: '#374151' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                        iconSize={10}
                                    />

                                    {/* WHO Standard Deviation Reference Curves - matching official WHO styling */}
                                    {showGuideLines && (
                                        <>
                                            {/* +3 SD - Black line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd3"
                                                stroke="#000000"
                                                strokeWidth={1.2}
                                                dot={false}
                                                name="+3 SD"
                                                isAnimationActive={false}
                                            />
                                            {/* +2 SD - Red line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd2"
                                                stroke="#dc2626"
                                                strokeWidth={1.2}
                                                dot={false}
                                                name="+2 SD"
                                                isAnimationActive={false}
                                            />
                                            {/* +1 SD - Orange line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd1"
                                                stroke="#f97316"
                                                strokeWidth={1}
                                                dot={false}
                                                name="+1 SD"
                                                isAnimationActive={false}
                                            />
                                            {/* Median (0 SD) - Green thick line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd0"
                                                stroke="#059669"
                                                strokeWidth={2}
                                                dot={false}
                                                name="Median (0 SD)"
                                                isAnimationActive={false}
                                            />
                                            {/* -1 SD - Orange line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd-1"
                                                stroke="#f97316"
                                                strokeWidth={1}
                                                dot={false}
                                                name="-1 SD"
                                                isAnimationActive={false}
                                            />
                                            {/* -2 SD - Red line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd-2"
                                                stroke="#dc2626"
                                                strokeWidth={1.2}
                                                dot={false}
                                                name="-2 SD"
                                                isAnimationActive={false}
                                            />
                                            {/* -3 SD - Black line */}
                                            <Line
                                                type="monotone"
                                                dataKey="sd-3"
                                                stroke="#000000"
                                                strokeWidth={1.2}
                                                dot={false}
                                                name="-3 SD"
                                                isAnimationActive={false}
                                            />
                                        </>
                                    )}

                                    {/* Patient's Growth Line - only shows if data exists */}
                                    {chartData.length > 0 && (
                                        <Line
                                            type="monotone"
                                            dataKey="patientValue"
                                            stroke="#2563eb"
                                            strokeWidth={2.5}
                                            dot={{
                                                fill: '#2563eb',
                                                r: 6,
                                                strokeWidth: 2,
                                                stroke: '#fff',
                                            }}
                                            activeDot={{
                                                r: 8,
                                                fill: '#2563eb',
                                                stroke: '#fff',
                                                strokeWidth: 2,
                                            }}
                                            name="Patient Data"
                                            connectNulls={true}
                                            isAnimationActive={true}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart Legend */}
                        {showGuideLines && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                    WHO Child Growth Standards Reference Lines
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-0.5 bg-green-600"
                                            style={{ height: '2px' }}
                                        ></div>
                                        <span className="text-gray-700 font-medium">
                                            Median (0 SD)
                                        </span>
                                        <span className="text-gray-500">- Normal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-0.5 bg-orange-500"></div>
                                        <span className="text-gray-700">±1 SD</span>
                                        <span className="text-gray-500">- Within range</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-0.5 bg-red-600"></div>
                                        <span className="text-gray-700">±2 SD</span>
                                        <span className="text-gray-500">- Moderate concern</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-0.5 bg-black"></div>
                                        <span className="text-gray-700">±3 SD</span>
                                        <span className="text-gray-500">- Severe concern</span>
                                    </div>
                                    {chartData.length > 0 && (
                                        <div className="flex items-center gap-2 md:col-span-2 lg:col-span-4 pt-2 border-t border-gray-200">
                                            <div className="flex items-center gap-1">
                                                <div
                                                    className="w-2 h-2 rounded-full bg-blue-600"
                                                    style={{
                                                        border: '2px solid white',
                                                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                                    }}
                                                ></div>
                                                <div className="w-6 h-0.5 bg-blue-600"></div>
                                            </div>
                                            <span className="text-gray-700 font-medium">
                                                Patient Measurements
                                            </span>
                                            <span className="text-gray-500">
                                                - Your child's growth data
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Measurement History Table */}
                {chartData.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2 sm:pb-3">
                            <CardTitle className="text-base sm:text-lg">
                                Measurement History
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Track all recorded measurements over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6">
                            <div className="overflow-x-auto -mx-2 sm:mx-0">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">
                                                Date
                                            </th>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700 hidden sm:table-cell">
                                                Age (months)
                                            </th>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">
                                                {chartConfig.yAxis}
                                            </th>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700 hidden md:table-cell">
                                                Z-Score
                                            </th>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {chartData.map((data, index) => {
                                            const interpretation = interpretZScore(
                                                data.zScore,
                                                selectedChart
                                            )
                                            return (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                                        {data.date}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                                                        {data.age}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">
                                                        {data.value?.toFixed(2)}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                                                        {data.zScore !== null
                                                            ? data.zScore.toFixed(2)
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] sm:text-xs ${
                                                                interpretation.color === 'red'
                                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                                    : interpretation.color ===
                                                                      'orange'
                                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                                    : interpretation.color ===
                                                                      'yellow'
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    : interpretation.color ===
                                                                      'green'
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : interpretation.color ===
                                                                      'blue'
                                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                                            }`}
                                                        >
                                                            {interpretation.label}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Age Range Warning (if applicable) */}
                {!isInAgeRange && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 sm:p-4">
                        <div className="flex">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                            <div className="text-xs sm:text-sm text-yellow-800">
                                <strong>Note:</strong> WHO growth standards are designed for
                                children aged 0-5 years (0-60 months).
                                {currentAge !== null && currentAge > 60 && (
                                    <span>
                                        {' '}
                                        This patient is {Math.floor(currentAge / 12)} years old and
                                        may require CDC growth charts for ages 2-20 years.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Information Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4">
                    <div className="flex">
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-xs sm:text-sm text-blue-800">
                            <strong>Note:</strong> These charts follow WHO Child Growth Standards
                            (2006) for children aged 0-5 years. Z-scores indicate how many standard
                            deviations a measurement is from the median for age and sex.
                            <span className="hidden sm:inline">
                                {' '}
                                For children over 5 years, CDC growth charts (2-20 years) should be
                                used.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Measurement Modal */}
            <AddMeasurementModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                patient={patient}
                onSuccess={handleAddSuccess}
            />
        </>
    )
}

export default PatientGrowthCharts
