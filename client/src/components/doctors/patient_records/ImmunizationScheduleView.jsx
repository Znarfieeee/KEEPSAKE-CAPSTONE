import React, { useState, useMemo } from 'react'
import {
    Calendar,
    Syringe,
    CheckCircle,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Info,
    Printer,
    FileDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import VaccineDoseProgress, { VaccineSummaryCard } from './VaccineDoseProgress'
import {
    VACCINES,
    VACCINE_CATEGORIES,
    getVaccinationSummary,
    getVaccinesByCategory,
} from '@/constants/vaccineData'

/**
 * ImmunizationScheduleView - WHO Baby Book Style Vaccination Schedule
 * Displays vaccination schedule with completion status organized by age milestones
 *
 * @param {Object} patient - Patient data including date_of_birth
 * @param {Array} vaccinations - Array of vaccination records
 * @param {boolean} showPrintButton - Show print/export buttons
 * @param {Function} onAddVaccine - Callback when add vaccine button is clicked
 */
const ImmunizationScheduleView = ({
    patient,
    vaccinations = [],
    showPrintButton = true,
    onAddVaccine,
    className = '',
}) => {
    const [expandedCategories, setExpandedCategories] = useState(
        VACCINE_CATEGORIES.map((c) => c.value)
    )
    const [viewMode, setViewMode] = useState('timeline') // 'timeline' or 'grid'

    // Calculate patient age
    const patientAge = useMemo(() => {
        if (!patient?.date_of_birth) return null
        const birth = new Date(patient.date_of_birth)
        const today = new Date()
        const ageInDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24))
        const years = Math.floor(ageInDays / 365)
        const months = Math.floor((ageInDays % 365) / 30)
        const weeks = Math.floor(ageInDays / 7)
        return { days: ageInDays, years, months, weeks }
    }, [patient?.date_of_birth])

    // Get vaccination summary
    const vaccinationSummary = useMemo(
        () => getVaccinationSummary(vaccinations),
        [vaccinations]
    )

    // Group by category with statistics
    const categoryStats = useMemo(() => {
        const grouped = {}
        vaccinationSummary.forEach((summary) => {
            if (!grouped[summary.category]) {
                grouped[summary.category] = {
                    vaccines: [],
                    completed: 0,
                    inProgress: 0,
                    overdue: 0,
                    notStarted: 0,
                    totalDoses: 0,
                    completedDoses: 0,
                }
            }
            grouped[summary.category].vaccines.push(summary)
            grouped[summary.category].totalDoses += summary.totalDoses || 1
            grouped[summary.category].completedDoses += summary.completedDoses

            switch (summary.status) {
                case 'complete':
                    grouped[summary.category].completed++
                    break
                case 'in_progress':
                    grouped[summary.category].inProgress++
                    break
                case 'overdue':
                    grouped[summary.category].overdue++
                    break
                default:
                    grouped[summary.category].notStarted++
            }
        })
        return grouped
    }, [vaccinationSummary])

    // Overall statistics
    const overallStats = useMemo(() => {
        return vaccinationSummary.reduce(
            (acc, v) => {
                acc.totalVaccines++
                acc.totalDoses += v.totalDoses || 1
                acc.completedDoses += v.completedDoses
                if (v.status === 'complete') acc.completed++
                if (v.status === 'overdue') acc.overdue++
                return acc
            },
            { totalVaccines: 0, completed: 0, overdue: 0, totalDoses: 0, completedDoses: 0 }
        )
    }, [vaccinationSummary])

    // Toggle category expansion
    const toggleCategory = (category) => {
        setExpandedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        )
    }

    // Format age for display
    const formatAge = (ageText) => {
        return ageText
    }

    // Get status indicator for a vaccine
    const getStatusIndicator = (status) => {
        switch (status) {
            case 'complete':
                return (
                    <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Complete</span>
                    </div>
                )
            case 'overdue':
                return (
                    <div className="flex items-center gap-1.5 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Overdue</span>
                    </div>
                )
            case 'in_progress':
                return (
                    <div className="flex items-center gap-1.5 text-blue-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">In Progress</span>
                    </div>
                )
            default:
                return (
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <Syringe className="w-4 h-4" />
                        <span className="text-sm">Not Started</span>
                    </div>
                )
        }
    }

    // Handle print
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className={cn('bg-white rounded-lg', className)}>
            {/* Header with Statistics */}
            <div className="p-4 border-b border-gray-200 print:border-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Immunization Schedule
                        </h3>
                        {patientAge && (
                            <p className="text-sm text-gray-500 mt-1">
                                Patient Age: {patientAge.years > 0 && `${patientAge.years} year${patientAge.years > 1 ? 's' : ''} `}
                                {patientAge.months > 0 && `${patientAge.months} month${patientAge.months > 1 ? 's' : ''}`}
                                {patientAge.years === 0 && patientAge.months === 0 && `${patientAge.weeks} weeks`}
                            </p>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 print:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'timeline' ? 'grid' : 'timeline')}
                        >
                            {viewMode === 'timeline' ? 'Grid View' : 'Timeline View'}
                        </Button>
                        {showPrintButton && (
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                            </Button>
                        )}
                    </div>
                </div>

                {/* Overall Progress Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-600">Total Vaccines</p>
                        <p className="text-2xl font-bold text-blue-900">{overallStats.totalVaccines}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm text-green-600">Completed</p>
                        <p className="text-2xl font-bold text-green-900">{overallStats.completed}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-sm text-yellow-600">Doses Given</p>
                        <p className="text-2xl font-bold text-yellow-900">
                            {overallStats.completedDoses}/{overallStats.totalDoses}
                        </p>
                    </div>
                    {overallStats.overdue > 0 && (
                        <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-sm text-red-600">Overdue</p>
                            <p className="text-2xl font-bold text-red-900">{overallStats.overdue}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Vaccination Schedule by Category */}
            <div className="p-4 space-y-4">
                {VACCINE_CATEGORIES.map((category) => {
                    const stats = categoryStats[category.value]
                    if (!stats) return null

                    const isExpanded = expandedCategories.includes(category.value)

                    return (
                        <div
                            key={category.value}
                            className={cn(
                                'border rounded-lg overflow-hidden',
                                stats.overdue > 0 ? 'border-red-200' : 'border-gray-200'
                            )}
                        >
                            {/* Category Header */}
                            <button
                                className={cn(
                                    'w-full px-4 py-3 flex items-center justify-between',
                                    'hover:bg-gray-50 transition-colors',
                                    category.color
                                )}
                                onClick={() => toggleCategory(category.value)}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                    <span className="font-medium">{category.label}</span>
                                    <span className="text-sm opacity-75">
                                        ({stats.completed}/{stats.vaccines.length} complete)
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {stats.overdue > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                                            <AlertTriangle className="w-3 h-3" />
                                            {stats.overdue} overdue
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 bg-white">
                                    {viewMode === 'timeline' ? (
                                        /* Timeline View */
                                        <div className="space-y-3">
                                            {stats.vaccines.map((vaccine) => (
                                                <div
                                                    key={vaccine.vaccineName}
                                                    className={cn(
                                                        'p-3 rounded-lg border',
                                                        vaccine.status === 'overdue'
                                                            ? 'border-red-200 bg-red-50'
                                                            : vaccine.status === 'complete'
                                                            ? 'border-green-200 bg-green-50'
                                                            : 'border-gray-200 bg-gray-50'
                                                    )}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-2">
                                                                <h5 className="font-medium text-gray-900">
                                                                    {vaccine.vaccineName}
                                                                </h5>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {vaccine.description}
                                                            </p>

                                                            {/* Schedule Timeline */}
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                {vaccine.schedule?.map((s, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className={cn(
                                                                            'px-2 py-0.5 rounded text-xs',
                                                                            idx < vaccine.completedDoses
                                                                                ? 'bg-green-200 text-green-800'
                                                                                : 'bg-gray-200 text-gray-600'
                                                                        )}
                                                                    >
                                                                        Dose {s.dose}: {s.age}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Progress and Status */}
                                                        <div className="flex flex-col items-end gap-2">
                                                            <VaccineDoseProgress
                                                                vaccineName={vaccine.vaccineName}
                                                                completedDoses={vaccine.completedDoses}
                                                                totalDoses={vaccine.totalDoses}
                                                                nextDoseDue={vaccine.nextDoseDue}
                                                                status={vaccine.status}
                                                                compact
                                                            />
                                                            {getStatusIndicator(vaccine.status)}

                                                            {vaccine.nextDoseDue && vaccine.status !== 'complete' && (
                                                                <p className="text-xs text-gray-500">
                                                                    Next: {new Date(vaccine.nextDoseDue).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Grid View */
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {stats.vaccines.map((vaccine) => (
                                                <div
                                                    key={vaccine.vaccineName}
                                                    className={cn(
                                                        'p-3 rounded-lg border',
                                                        vaccine.status === 'overdue'
                                                            ? 'border-red-200 bg-red-50'
                                                            : vaccine.status === 'complete'
                                                            ? 'border-green-200 bg-green-50'
                                                            : 'border-gray-200 bg-white'
                                                    )}
                                                >
                                                    <h5 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                                                        {vaccine.vaccineName}
                                                    </h5>
                                                    <VaccineDoseProgress
                                                        vaccineName={vaccine.vaccineName}
                                                        completedDoses={vaccine.completedDoses}
                                                        totalDoses={vaccine.totalDoses}
                                                        nextDoseDue={vaccine.nextDoseDue}
                                                        status={vaccine.status}
                                                        showLabel={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Info Panel */}
            <div className="p-4 border-t border-gray-200 bg-blue-50 print:hidden">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-900 mb-1">
                            WHO/DOH Immunization Schedule
                        </h4>
                        <p className="text-sm text-blue-700">
                            This schedule follows the Department of Health (DOH) Expanded Program on
                            Immunization (EPI) and WHO recommendations. Vaccines marked as "Optional"
                            are recommended but may vary based on endemic areas and risk factors.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImmunizationScheduleView
