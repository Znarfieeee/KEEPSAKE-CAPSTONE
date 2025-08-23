import { getLocalTimeZone, today, CalendarDate } from '@internationalized/date'
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  composeRenderProps,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
} from 'react-aria-components'

import { cn } from '@/lib/utils'

function MonthYearSelector({ currentDate, onDateChange, onClose }) {
  const [step, setStep] = useState('year') // 'year' or 'month'
  const [selectedYear, setSelectedYear] = useState(currentDate.year)
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month)

  const currentYear = today(getLocalTimeZone()).year
  // Start from 2000 up to current year
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => 2000 + i).reverse()
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const handleYearSelect = (year) => {
    setSelectedYear(year)
    setStep('month')
  }

  const handleMonthSelect = (monthIndex) => {
    const newDate = new CalendarDate(selectedYear, monthIndex + 1, 1)
    onDateChange(newDate)
    onClose()
  }

  const handleBack = () => {
    setStep('year')
  }

  return (
    <div className="absolute top-0 left-0 w-full h-80 bg-white rounded-md p-3 z-50 shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 'month' && (
              <ArrowLeftIcon
                onClick={handleBack}
                className="size-5 text-muted-foreground flex items-center justify-center rounded hover:text-accent transition-colors cursor-pointer"
              />
            )}
            <h3 className="text-sm font-medium">
              {step === 'year' ? 'Select Year' : `Select Month for ${selectedYear}`}
            </h3>
          </div>
        </div>

        {step === 'year' && (
          <div>
            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={cn(
                    'size-10 text-sm rounded transition-colors hover:bg-accent flex items-center justify-center',
                    selectedYear === year ? 'bg-primary text-primary-foreground' : 'bg-transparent'
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'month' && (
          <div>
            <div className="grid grid-cols-4 gap-1">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    'h-10 text-sm rounded transition-colors hover:bg-accent flex items-center justify-center',
                    selectedMonth === index + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent'
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cancel button */}
        {/* <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-8 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded transition-colors"
          >
            Cancel
          </button>
        </div> */}
      </div>
    </div>
  )
}

function CalendarHeader({ onMonthClick, showMonthSelector, currentDate }) {
  return (
    <header className="flex w-full items-center gap-1 pb-1 relative">
      <Button
        slot="previous"
        className="text-muted-foreground/80 hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
      >
        <ChevronLeftIcon size={16} />
      </Button>

      <button
        onClick={onMonthClick}
        className="grow text-center text-sm font-medium hover:bg-accent rounded-md p-1 transition-colors"
      >
        <HeadingRac />
      </button>

      <Button
        slot="next"
        className="text-muted-foreground/80 hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
      >
        <ChevronRightIcon size={16} />
      </Button>

      {showMonthSelector && (
        <MonthYearSelector
          currentDate={currentDate}
          onDateChange={onMonthClick}
          onClose={() => onMonthClick(null)}
        />
      )}
    </header>
  )
}

function CalendarGridComponent({ isRange = false }) {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="text-muted-foreground/80 size-9 rounded-md p-0 text-xs font-medium">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0 [&_td]:py-px">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              'text-foreground data-hovered:bg-accent data-selected:bg-primary data-hovered:text-foreground data-selected:text-primary-foreground data-focus-visible:ring-ring/50 relative flex size-9 items-center justify-center rounded-md p-0 text-sm font-normal whitespace-nowrap [transition-property:color,background-color,border-radius,box-shadow] duration-150 outline-none data-disabled:pointer-events-none data-disabled:opacity-30 data-focus-visible:z-10 data-focus-visible:ring-[3px] data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-30',
              // Range-specific styles
              isRange &&
                'data-selected:bg-accent data-selected:text-foreground data-invalid:data-selection-end:bg-destructive data-invalid:data-selection-start:bg-destructive data-selection-end:bg-primary data-selection-start:bg-primary data-selection-end:text-primary-foreground data-selection-start:text-primary-foreground data-invalid:bg-red-100 data-selected:rounded-none data-selection-end:rounded-e-md data-invalid:data-selection-end:text-white data-selection-start:rounded-s-md data-invalid:data-selection-start:text-white',
              // Today indicator styles
              date.compare(now) === 0 &&
                cn(
                  'after:bg-primary after:pointer-events-none after:absolute after:start-1/2 after:bottom-1 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full',
                  isRange
                    ? 'data-selection-end:after:bg-background data-selection-start:after:bg-background'
                    : 'data-selected:after:bg-background'
                )
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

function Calendar({ className, ...props }) {
  const [showMonthSelector, setShowMonthSelector] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => {
    // Initialize with the current value if available, otherwise use today
    if (props.value) {
      return props.value
    }
    return today(getLocalTimeZone())
  })

  const handleMonthClick = (newDate) => {
    if (newDate === null) {
      setShowMonthSelector(false)
    } else if (newDate instanceof CalendarDate) {
      setCurrentDate(newDate)
      setShowMonthSelector(false)
      // Navigate the calendar to the new date by calling the calendar's internal navigation
      // The calendar will automatically update to show the selected month/year
    } else {
      setShowMonthSelector(true)
    }
  }

  return (
    <div className="relative">
      <CalendarRac
        {...props}
        className={composeRenderProps(className, (className) => cn('w-fit', className))}
        visibleDuration={{ months: 1 }}
        focusedValue={currentDate}
      >
        <CalendarHeader
          onMonthClick={handleMonthClick}
          showMonthSelector={showMonthSelector}
          currentDate={currentDate}
        />
        <CalendarGridComponent />
      </CalendarRac>
    </div>
  )
}

function RangeCalendar({ className, ...props }) {
  const [showMonthSelector, setShowMonthSelector] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => {
    // Initialize with the start of the current range if available, otherwise use today
    if (props.value?.start) {
      return props.value.start
    }
    return today(getLocalTimeZone())
  })

  const handleMonthClick = (newDate) => {
    if (newDate === null) {
      setShowMonthSelector(false)
    } else if (newDate instanceof CalendarDate) {
      setCurrentDate(newDate)
      setShowMonthSelector(false)
      // Navigate the calendar to the new date by updating the focused value
    } else {
      setShowMonthSelector(true)
    }
  }

  return (
    <div className="relative">
      <RangeCalendarRac
        {...props}
        className={composeRenderProps(className, (className) => cn('w-fit', className))}
        visibleDuration={{ months: 1 }}
        focusedValue={currentDate}
      >
        <CalendarHeader
          onMonthClick={handleMonthClick}
          showMonthSelector={showMonthSelector}
          currentDate={currentDate}
        />
        <CalendarGridComponent isRange />
      </RangeCalendarRac>
    </div>
  )
}

export { Calendar, RangeCalendar }
