import React, { memo, useMemo, useCallback } from "react"

// UI Components
import { Brush, Search } from "lucide-react"
import { BrushCleaning } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/Button"

const FacilityFilters = memo(
    ({
        search,
        onSearchChange,
        statusFilter,
        onStatusChange,
        typeFilter,
        onTypeChange,
        planFilter,
        onPlanChange,
        activeFiltersCount = 0,
    }) => {
        const clearAllFilters = useCallback(() => {
            onSearchChange("")
            onStatusChange("all")
            onTypeChange("all")
            onPlanChange("all")
        }, [onSearchChange, onStatusChange, onTypeChange, onPlanChange])

        const filterOptions = useMemo(
            () => ({
                status: [
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "pending", label: "Pending" },
                    { value: "suspended", label: "Suspended" },
                ],
                type: [
                    { value: "all", label: "All Types" },
                    { value: "hospital", label: "Hospital" },
                    { value: "clinic", label: "Clinic" },
                    { value: "pharmacy", label: "Pharmacy" },
                ],
                plan: [
                    { value: "all", label: "All Plans" },
                    { value: "standard", label: "Standard" },
                    { value: "premium", label: "Premium" },
                    { value: "enterprise", label: "Enterprise" },
                ],
            }),
            []
        )

        const {
            status: statusOptions,
            type: typeOptions,
            plan: planOptions,
        } = filterOptions

        return (
            <div className="flex justify-between items-center">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search facilities..."
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex gap-4">
                    {/* Plan Filter */}
                    <Select value={planFilter} onValueChange={onPlanChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {planOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={onTypeChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {typeOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" onClick={clearAllFilters}>
                            <BrushCleaning className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        )
    }
)

export default FacilityFilters
