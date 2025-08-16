import React from "react"
import { Search, Calendar } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const PatientRecordFilters = ({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    categoryFilter,
    onCategoryChange,
    dateRange,
    onDateRangeChange,
}) => {
    const statusOptions = [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
    ]

    const categoryOptions = [
        { value: "all", label: "All Categories" },
        { value: "general", label: "General Checkup" },
        { value: "vaccination", label: "Vaccination" },
        { value: "treatment", label: "Treatment" },
        { value: "prescription", label: "Prescription" },
        { value: "laboratory", label: "Laboratory" },
    ]

    return (
        <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search patients..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <div className="min-w-[150px]">
                    <Select
                        value={categoryFilter}
                        onValueChange={onCategoryChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categoryOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Filter */}
                <div className="min-w-[150px]">
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select status" />
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
                </div>

                {/* Date Range Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-[240px] bg-white border-gray-200">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                <>
                                    {new Date(
                                        dateRange.from
                                    ).toLocaleDateString()}
                                    {dateRange?.to &&
                                        ` - ${new Date(
                                            dateRange.to
                                        ).toLocaleDateString()}`}
                                </>
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col gap-3 p-3">
                            <RangeCalendar
                                value={dateRange}
                                onChange={onDateRangeChange}
                                className="rounded-md"
                            />
                            <div className="flex justify-end px-3 pb-3">
                                <Button
                                    variant="outline"
                                    className="text-sm"
                                    onClick={() => onDateRangeChange(null)}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default PatientRecordFilters
