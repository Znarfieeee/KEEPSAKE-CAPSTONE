import React from 'react'
import { CheckCircle, Circle, Clock, AlertTriangle, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * VaccineDoseProgress - Visual dose progress indicator component
 * WHO Baby Book style dose tracking visualization
 *
 * @param {string} vaccineName - Name of the vaccine
 * @param {number} completedDoses - Number of doses completed
 * @param {number|null} totalDoses - Total doses required (null for annual vaccines)
 * @param {string|null} nextDoseDue - Next dose due date (ISO string)
 * @param {string} status - Status: 'complete', 'in_progress', 'overdue', 'not_started'
 * @param {boolean} compact - Show compact version (for table rows)
 * @param {boolean} showLabel - Show text label alongside progress
 * @param {string} className - Additional CSS classes
 */
const VaccineDoseProgress = ({
    vaccineName,
    completedDoses = 0,
    totalDoses = null,
    nextDoseDue = null,
    status = 'not_started',
    compact = false,
    showLabel = true,
    className = '',
}) => {
    // Calculate days until next dose
    const getDaysUntilDue = () => {
        if (!nextDoseDue) return null
        const due = new Date(nextDoseDue)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)
        return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    }

    const daysUntilDue = getDaysUntilDue()

    // Determine actual status based on days
    const getEffectiveStatus = () => {
        if (status === 'complete') return 'complete'
        if (status === 'not_started') return 'not_started'

        if (daysUntilDue !== null) {
            if (daysUntilDue < 0) return 'overdue'
            if (daysUntilDue <= 7) return 'due_soon'
        }
        return status
    }

    const effectiveStatus = getEffectiveStatus()

    // Status badge configuration
    const statusConfig = {
        complete: {
            icon: CheckCircle,
            label: 'Complete',
            badgeClass: 'bg-green-100 text-green-800 border-green-200',
            iconClass: 'text-green-600',
        },
        in_progress: {
            icon: Clock,
            label: 'In Progress',
            badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
            iconClass: 'text-blue-600',
        },
        due_soon: {
            icon: AlertTriangle,
            label: daysUntilDue === 0 ? 'Due Today' : `Due in ${daysUntilDue} days`,
            badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            iconClass: 'text-yellow-600',
        },
        overdue: {
            icon: AlertTriangle,
            label: `Overdue ${Math.abs(daysUntilDue || 0)} days`,
            badgeClass: 'bg-red-100 text-red-800 border-red-200',
            iconClass: 'text-red-600',
        },
        not_started: {
            icon: Circle,
            label: 'Not Started',
            badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
            iconClass: 'text-gray-400',
        },
    }

    const config = statusConfig[effectiveStatus] || statusConfig.not_started
    const StatusIcon = config.icon

    // Render dose circles
    const renderDoseCircles = () => {
        // For annual vaccines, show different indicator
        if (totalDoses === null) {
            return (
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Annual</span>
                    <span className="text-sm font-medium">{completedDoses} given</span>
                </div>
            )
        }

        const circles = []
        for (let i = 1; i <= totalDoses; i++) {
            const isCompleted = i <= completedDoses
            circles.push(
                <div
                    key={i}
                    className={cn(
                        'rounded-full transition-all duration-200',
                        compact ? 'w-3 h-3' : 'w-4 h-4',
                        isCompleted
                            ? 'bg-green-500 border-2 border-green-600'
                            : 'bg-gray-200 border-2 border-gray-300'
                    )}
                    title={`Dose ${i}: ${isCompleted ? 'Completed' : 'Pending'}`}
                />
            )
        }
        return (
            <div className={cn('flex items-center', compact ? 'gap-1' : 'gap-1.5')}>
                {circles}
            </div>
        )
    }

    // Compact version for table rows
    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                {renderDoseCircles()}
                <span className="text-xs text-gray-500">
                    {totalDoses ? `${completedDoses}/${totalDoses}` : `${completedDoses}`}
                </span>
            </div>
        )
    }

    // Full version with status badge
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            {/* Dose Progress Circles */}
            <div className="flex items-center gap-3">
                {renderDoseCircles()}
                {showLabel && totalDoses && (
                    <span className="text-sm font-medium text-gray-700">
                        {completedDoses} of {totalDoses} doses
                    </span>
                )}
            </div>

            {/* Status Badge */}
            <div
                className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit',
                    config.badgeClass
                )}
            >
                <StatusIcon className={cn('w-3.5 h-3.5', config.iconClass)} />
                {config.label}
            </div>
        </div>
    )
}

/**
 * VaccineDoseProgressBar - Alternative progress bar visualization
 */
export const VaccineDoseProgressBar = ({
    completedDoses = 0,
    totalDoses = 1,
    className = '',
}) => {
    const percentage = totalDoses ? Math.min((completedDoses / totalDoses) * 100, 100) : 0

    return (
        <div className={cn('w-full', className)}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{completedDoses} of {totalDoses}</span>
                <span>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

/**
 * VaccineStatusBadge - Standalone status badge component
 */
export const VaccineStatusBadge = ({ status, daysUntilDue = null, className = '' }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'complete':
                return {
                    icon: CheckCircle,
                    label: 'Complete',
                    className: 'bg-green-100 text-green-800',
                }
            case 'overdue':
                return {
                    icon: AlertTriangle,
                    label: daysUntilDue ? `${Math.abs(daysUntilDue)}d overdue` : 'Overdue',
                    className: 'bg-red-100 text-red-800',
                }
            case 'due_soon':
                return {
                    icon: Clock,
                    label: daysUntilDue === 0 ? 'Due today' : `${daysUntilDue}d left`,
                    className: 'bg-yellow-100 text-yellow-800',
                }
            case 'in_progress':
                return {
                    icon: Clock,
                    label: 'In Progress',
                    className: 'bg-blue-100 text-blue-800',
                }
            default:
                return {
                    icon: Circle,
                    label: 'Not Started',
                    className: 'bg-gray-100 text-gray-600',
                }
        }
    }

    const config = getStatusConfig()
    const Icon = config.icon

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                config.className,
                className
            )}
        >
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    )
}

/**
 * VaccineSummaryCard - Summary card for vaccine category overview
 */
export const VaccineSummaryCard = ({
    category,
    vaccines = [],
    completedCount = 0,
    totalCount = 0,
    overdueCount = 0,
    className = '',
}) => {
    const percentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div
            className={cn(
                'bg-white border rounded-lg p-4 shadow-sm',
                overdueCount > 0 ? 'border-red-200' : 'border-gray-200',
                className
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{category}</h4>
                {overdueCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        {overdueCount} overdue
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                    {completedCount} of {totalCount} vaccines
                </span>
                <span className={cn(
                    'font-medium',
                    percentage === 100 ? 'text-green-600' : 'text-blue-600'
                )}>
                    {percentage}%
                </span>
            </div>
        </div>
    )
}

export default VaccineDoseProgress
