import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const AllergySection = ({ form, updateForm }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Date Identified</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                                'w-full justify-start text-left font-normal',
                                !form.date_identified && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.date_identified ? (
                                format(form.date_identified, 'PP')
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={form.date_identified}
                            onSelect={(date) => {
                                new Date(date)
                                updateForm('date_identified', date ? format(date, 'PP') : '')
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Allergen</Label>
                <Input
                    className="border-input"
                    placeholder="Enter allergen"
                    value={form.allergen}
                    onChange={(e) => updateForm('allergen', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Reaction Type</Label>
                <Input
                    className="border-input"
                    placeholder="e.g., Skin rash, Breathing difficulty, Swelling"
                    value={form.reaction_type}
                    onChange={(e) => updateForm('reaction_type', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => updateForm('severity', v)}>
                    <SelectTrigger className="border-input w-full">
                        <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                        <SelectItem value="life_threatening">Life Threatening</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                    className="border-input min-h-[100px]"
                    placeholder="Enter any additional notes about the allergy"
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                />
            </div>
        </div>
    )
}

export default AllergySection
