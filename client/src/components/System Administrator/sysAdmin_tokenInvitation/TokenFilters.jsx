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
    getLocalTimeZone,
    today,
    parseDate,
    CalendarDate,
} from "@internationalized/date"
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
                        <SelectTrigger className="w-[145px] bg-white">
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
                        <SelectTrigger className="w-[115px] bg-white">
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
                        <Button variant="outline" className="border-gray-200">
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
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="flex flex-col gap-3 p-3">
                            <RangeCalendar
                                key={
                                    dateRange?.from || dateRange?.to
                                        ? "with-date"
                                        : "no-date"
                                }
                                value={
                                    dateRange?.from &&
                                    !isNaN(new Date(dateRange.from))
                                        ? {
                                              start: parseDate(
                                                  new Date(dateRange.from)
                                                      .toISOString()
                                                      .slice(0, 10)
                                              ),
                                              end:
                                                  dateRange?.to &&
                                                  !isNaN(new Date(dateRange.to))
                                                      ? parseDate(
                                                            new Date(
                                                                dateRange.to
                                                            )
                                                                .toISOString()
                                                                .slice(0, 10)
                                                        )
                                                      : undefined,
                                          }
                                        : undefined
                                }
                                onChange={range => {
                                    if (range) {
                                        onDateRangeChange({
                                            from: range.start
                                                ? new Date(
                                                      range.start.toString()
                                                  )
                                                : undefined,
                                            to: range.end
                                                ? new Date(range.end.toString())
                                                : undefined,
                                        })
                                    } else {
                                        onDateRangeChange({
                                            from: undefined,
                                            to: undefined,
                                        })
                                    }
                                }}
                                className="rounded-md"
                            />
                            <div className="flex justify-end px-3 pb-3">
                                <Button
                                    className="text-sm bg-red-300 hover:bg-red-400"
                                    onClick={() => {
                                        // Clear state → clears calendar selection too
                                        onDateRangeChange({
                                            from: undefined,
                                            to: undefined,
                                        })
                                    }}>
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

export default TokenFilters
