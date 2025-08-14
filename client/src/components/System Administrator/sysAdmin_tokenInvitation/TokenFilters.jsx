import React from "react"

// UI Components
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

const TokenFilters = ({
    search,
    onSearchChange,
    roleFilter,
    onRoleChange,
    statusFilter,
    onStatusChange,
    dateRange,
    onDateRangeChange,
}) => {
    const roleOptions = [
        { value: "all", label: "All Roles" },
        { value: "facility_admin", label: "Facility Admin" },
        { value: "doctor", label: "Doctor" },
        { value: "nurse", label: "Nurse" },
        { value: "staff", label: "Staff" },
        { value: "parent", label: "Parent" },
    ]

    const statusOptions = [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
    ]

    return (
        <div className="flex justify-between items-center">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 " />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            <div className="flex gap-4">
                {/* Filter by Role */}
                <div>
                    <Select value={roleFilter} onValueChange={onRoleChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                            {roleOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Filter by status */}
                <div>
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select user type" />
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
                {/* Filter by calendar range */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-[240px] bg-white">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange?.from && dateRange?.to ? (
                                <>
                                    {dateRange.from.toDateString()} -{" "}
                                    {dateRange.to.toDateString()}
                                </>
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <RangeCalendar
                            value={dateRange}
                            onChange={onDateRangeChange}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default TokenFilters
