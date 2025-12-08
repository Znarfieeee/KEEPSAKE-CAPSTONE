import React from 'react'

// UI Components
import { Search, Calendar, InfoIcon } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RangeCalendar } from '@/components/ui/calendar-rac'
import { parseDate, CalendarDate } from '@internationalized/date'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/Button'

// Helper
import { TooltipHelper } from '@/util/TooltipHelper'

const PatientRecordFilters = ({
    search,
    onSearchChange,

    sexFilter,
    onSexChange,
    ageFilter,
    onAgeChange,
    dateRange,
    onDateRangeChange,
}) => {
    const sexOptions = [
        { value: 'all', label: 'All Sex' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
    ]

    return (
        <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
            <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search patients..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            <div className="flex flex-wrap gap-4">
                {/* Age Filter */}
                <div>
                    <Input
                        type="number"
                        placeholder="Age"
                        value={ageFilter || ''}
                        onChange={(e) =>
                            onAgeChange(e.target.value ? Number(e.target.value) : null)
                        }
                        min={0}
                        max={150}
                        step={1}
                        className="w-[100px] bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                {/* Sex Filter */}
                <div>
                    <Select value={sexFilter} onValueChange={onSexChange}>
                        <SelectTrigger className="lg:w-[115px] bg-white">
                            <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                            {sexOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-gray-200">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                <>
                                    {new Date(dateRange.from).toLocaleDateString()}
                                    {dateRange?.to &&
                                        ` - ${new Date(dateRange.to).toLocaleDateString()}`}
                                </>
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="flex flex-col gap-3 p-3">
                            <RangeCalendar
                                key={dateRange?.from || dateRange?.to ? 'with-date' : 'no-date'}
                                value={
                                    dateRange?.from && !isNaN(new Date(dateRange.from))
                                        ? {
                                              start: parseDate(
                                                  new Date(dateRange.from)
                                                      .toISOString()
                                                      .slice(0, 10)
                                              ),
                                              end:
                                                  dateRange?.to && !isNaN(new Date(dateRange.to))
                                                      ? parseDate(
                                                            new Date(dateRange.to)
                                                                .toISOString()
                                                                .slice(0, 10)
                                                        )
                                                      : undefined,
                                          }
                                        : undefined
                                }
                                onChange={(range) => {
                                    if (range) {
                                        onDateRangeChange({
                                            from: range.start
                                                ? new Date(range.start.toString())
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
                            <div className="flex justify-between items-center px-3 pb-3">
                                <TooltipHelper content="To select a single date, just click the selected date twice">
                                    <InfoIcon size={14} />
                                </TooltipHelper>
                                <Button
                                    className="text-sm bg-red-300 hover:bg-red-400"
                                    onClick={() => {
                                        onDateRangeChange({
                                            from: undefined,
                                            to: undefined,
                                        })
                                    }}
                                >
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
