import React from 'react'
import { Users, ChevronDown } from 'lucide-react'
import { cn } from '@/util/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

/**
 * ChildSelector Component
 * Dropdown-based child selector for filtering appointments
 */
const ChildSelector = ({
    children = [],
    selectedChildId = 'all',
    onSelectChild,
    appointmentCounts = {},
    childColors = {},
}) => {
    // Calculate total appointments across all children
    const totalAppointments = Object.values(appointmentCounts).reduce(
        (sum, count) => sum + count,
        0
    )

    const getChildName = (child) => {
        if (child.firstname && child.lastname) {
            return `${child.firstname} ${child.lastname}`
        }
        return child.full_name || 'Unknown Child'
    }

    const getInitials = (child) => {
        if (child.firstname && child.lastname) {
            return `${child.firstname[0]}${child.lastname[0]}`.toUpperCase()
        }
        if (child.full_name) {
            const parts = child.full_name.split(' ')
            return parts.length > 1
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : parts[0][0].toUpperCase()
        }
        return '?'
    }

    const getSelectedLabel = () => {
        if (selectedChildId === 'all') {
            return (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>All Children</span>
                    <span className="text-xs text-gray-500">({totalAppointments})</span>
                </div>
            )
        }

        const selectedChild = children.find((c) => (c.patient_id || c.id) === selectedChildId)
        if (!selectedChild) return 'Select child'

        const childColor = childColors[selectedChildId] || 'bg-blue-500'
        const appointmentCount = appointmentCounts[selectedChildId] || 0

        return (
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
                        childColor
                    )}
                >
                    {/* {getInitials(selectedChild)} */}
                </div>
                <span>{getChildName(selectedChild)}</span>
                <span className="text-xs text-gray-500">({appointmentCount})</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700">Viewing:</span>
            <Select value={selectedChildId} onValueChange={onSelectChild}>
                <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue>{getSelectedLabel()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {/* All Children Option */}
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>All Children</span>
                            <span className="text-xs text-gray-500 ml-auto">
                                {totalAppointments} appts
                            </span>
                        </div>
                    </SelectItem>

                    {/* Individual Children */}
                    {children.map((child) => {
                        const childId = child.patient_id || child.id
                        const childName = getChildName(child)
                        const appointmentCount = appointmentCounts[childId] || 0

                        return (
                            <SelectItem key={childId} value={childId}>
                                <div className="flex items-center gap-2">
                                    <span>{childName}</span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                        {appointmentCount} appts
                                    </span>
                                </div>
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    )
}

export default ChildSelector
