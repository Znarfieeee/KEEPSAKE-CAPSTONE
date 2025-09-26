import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'

const AnthropometricSection = ({ form, updateForm }) => {
    const [measurementDate, setMeasurementDate] = useState(
        form.measurement_date ? new Date(form.measurement_date) : null
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Measurement Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                                'w-full justify-start text-left font-normal border border-gray-200',
                                !measurementDate && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {measurementDate ? (
                                format(measurementDate, 'PPP')
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={measurementDate}
                            onSelect={(date) => {
                                setMeasurementDate(date)
                                updateForm(
                                    'measurement_date',
                                    date ? date.toISOString().split('T')[0] : ''
                                )
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Weight (kg)</Label>
                <Input
                    type="number"
                    step="0.01"
                    className="border-input"
                    placeholder="Enter weight"
                    value={form.weight}
                    onChange={(e) => updateForm('weight', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Height (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter height"
                    value={form.height}
                    onChange={(e) => updateForm('height', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Head Circumference (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter head circumference"
                    value={form.head_circumference}
                    onChange={(e) => updateForm('head_circumference', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Chest Circumference (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter chest circumference"
                    value={form.chest_circumference}
                    onChange={(e) => updateForm('chest_circumference', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Abdominal Circumference (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter abdominal circumference"
                    value={form.abdominal_circumference}
                    onChange={(e) => updateForm('abdominal_circumference', e.target.value)}
                />
            </div>
        </div>
    )
}

export default AnthropometricSection
