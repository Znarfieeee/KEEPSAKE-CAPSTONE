import React from 'react'
import { Users, User } from 'lucide-react'
import { cn } from '@/util/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

/**
 * ChildFilterTabs Component
 * Tab-based child selector for filtering appointments
 * Shows all children tab and individual child tabs with appointment counts
 */
const ChildFilterTabs = ({
    children = [],
    selectedChildId = 'all',
    onSelectChild,
    appointmentCounts = {},
    childColors = {}
}) => {
    // Calculate total appointments across all children
    const totalAppointments = Object.values(appointmentCounts).reduce((sum, count) => sum + count, 0)

    const getChildName = (child) => {
        if (child.firstname && child.lastname) {
            return `${child.firstname} ${child.lastname}`
        }
        return child.full_name || 'Unknown Child'
    }

    const calculateAge = (birthDate) => {
        if (!birthDate) return ''
        const birth = new Date(birthDate)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }

        if (age === 0) {
            const months = monthDiff < 0 ? 12 + monthDiff : monthDiff
            return `${months}mo`
        }
        return `${age}y`
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
            <ScrollArea className="w-full">
                <div className="flex items-center gap-2 pb-2">
                    {/* All Children Tab */}
                    <button
                        onClick={() => onSelectChild('all')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap',
                            'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50',
                            selectedChildId === 'all'
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                    >
                        <Users className="h-4 w-4" />
                        <span className="font-medium">All Children</span>
                        {totalAppointments > 0 && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    'ml-1 text-xs',
                                    selectedChildId === 'all'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                )}
                            >
                                {totalAppointments}
                            </Badge>
                        )}
                    </button>

                    {/* Separator */}
                    <div className="h-8 w-px bg-gray-300" />

                    {/* Individual Child Tabs */}
                    {children.map((child) => {
                        const childId = child.patient_id || child.id
                        const childName = getChildName(child)
                        const childAge = calculateAge(child.date_of_birth || child.birthdate)
                        const appointmentCount = appointmentCounts[childId] || 0
                        const childColor = childColors[childId] || 'bg-blue-500'
                        const isSelected = selectedChildId === childId

                        return (
                            <button
                                key={childId}
                                onClick={() => onSelectChild(childId)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap',
                                    'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50',
                                    isSelected
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {/* Child color indicator */}
                                    <div className={cn('w-3 h-3 rounded-full', childColor)} />
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium text-sm">{childName}</span>
                                    {childAge && (
                                        <span className={cn(
                                            'text-xs',
                                            isSelected ? 'text-white/80' : 'text-gray-500'
                                        )}>
                                            {childAge}
                                        </span>
                                    )}
                                </div>
                                {appointmentCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            'ml-1 text-xs',
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                        )}
                                    >
                                        {appointmentCount}
                                    </Badge>
                                )}
                            </button>
                        )
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}

export default ChildFilterTabs
