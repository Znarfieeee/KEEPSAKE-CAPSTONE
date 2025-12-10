import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Calendar } from '@/components/ui/calendar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/Button'
import { CalendarIcon, User } from 'lucide-react'
import { format } from 'date-fns'

const BasicInfoSection = ({ form, updateForm }) => {
    return (
        <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
                <User className="text-primary" size={20} />
                <h3 className="text-lg font-semibold text-foreground">Patient Information</h3>
                <span className="text-sm text-destructive">(Required)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">First Name *</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter first name"
                        value={form.firstname}
                        onChange={(e) => updateForm('firstname', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Middle Name</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter middle name"
                        value={form.middlename}
                        onChange={(e) => updateForm('middlename', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Last Name *</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter last name"
                        value={form.lastname}
                        onChange={(e) => updateForm('lastname', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Date of Birth *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={'outline'}
                                className={`w-full justify-start text-left font-normal border border-gray-200 ${
                                    !form.date_of_birth && 'text-muted-foreground'
                                }`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.date_of_birth ? (
                                    format(new Date(form.date_of_birth), 'MMM d, yyyy')
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={
                                    form.date_of_birth ? new Date(form.date_of_birth) : undefined
                                }
                                onSelect={(date) => {
                                    // Format the date as YYYY-MM-DD for storage
                                    const formattedDate = date ? format(date, 'yyyy-MM-dd') : ''
                                    updateForm('date_of_birth', formattedDate)
                                }}
                                initialFocus
                                ISOWeek
                                captionLayout="dropdown"
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                                showYearPicker
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2 flex justify-between gap-2">
                    <div className="w-full">
                        <Label className="text-sm font-medium">Sex *</Label>
                        <Select value={form.sex} onValueChange={(v) => updateForm('sex', v)}>
                            <SelectTrigger className="border-input w-full">
                                <SelectValue placeholder="Sex" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full">
                        <Label className="text-sm font-medium">Blood Type</Label>
                        <Select
                            value={form.bloodtype}
                            onValueChange={(v) => updateForm('bloodtype', v)}
                        >
                            <SelectTrigger className="border-input w-full">
                                <SelectValue placeholder="Blood Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                                    <SelectItem key={bt} value={bt}>
                                        {bt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Gestation Weeks</Label>
                    <Input
                        type="number"
                        className="border-input"
                        placeholder="Enter gestation weeks"
                        value={form.gestation_weeks}
                        onChange={(e) => updateForm('gestation_weeks', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Birth Weight (kg)</Label>
                    <Input
                        type="number"
                        className="border-input"
                        placeholder="Enter birth weight"
                        value={form.birth_weight}
                        onChange={(e) => updateForm('birth_weight', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Birth Height (cm)</Label>
                    <Input
                        type="number"
                        className="border-input"
                        placeholder="Enter birth height"
                        value={form.birth_height}
                        onChange={(e) => updateForm('birth_height', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Mother's Name</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter mother's name"
                        value={form.mother}
                        onChange={(e) => updateForm('mother', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Father's Name</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter father's name"
                        value={form.father}
                        onChange={(e) => updateForm('father', e.target.value)}
                    />
                </div>
            </div>
        </div>
    )
}

export default BasicInfoSection
