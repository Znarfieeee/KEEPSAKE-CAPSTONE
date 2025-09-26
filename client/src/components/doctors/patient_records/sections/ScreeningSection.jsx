import React, { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, CheckCircle, XCircle, Activity } from 'lucide-react'

const ScreeningSection = ({ form, updateForm }) => {
    // Local state for date handling
    const [dates, setDates] = useState({
        ens_date: null,
        nhs_date: null,
        pos_date: null,
        ror_date: null,
    })

    // Initialize dates from form data
    useEffect(() => {
        setDates({
            ens_date: form.ens_date ? new Date(form.ens_date) : null,
            nhs_date: form.nhs_date ? new Date(form.nhs_date) : null,
            pos_date: form.pos_date ? new Date(form.pos_date) : null,
            ror_date: form.ror_date ? new Date(form.ror_date) : null,
        })
    }, [form.ens_date, form.nhs_date, form.pos_date, form.ror_date])

    const handleDateChange = (field, date) => {
        setDates((prev) => ({ ...prev, [field]: date }))
        updateForm(field, date ? date.toISOString().split('T')[0] : '')
    }

    const handleSwitchChange = (field, value) => {
        updateForm(field, value)
    }

    const DateField = ({ label, field }) => (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal border-gray-300 hover:border-gray-400 bg-white',
                            !dates[field] && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {dates[field] ? format(dates[field], 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dates[field]}
                        onSelect={(date) => handleDateChange(field, date)}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )

    const ToggleField = ({ label, field }) => {
        const isChecked = Boolean(form[field])

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                <div className="flex items-center space-x-3">
                    {isChecked ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <Label htmlFor={field} className="text-sm font-medium cursor-pointer text-gray-700">
                        {label}
                    </Label>
                </div>
                <Switch
                    id={field}
                    checked={isChecked}
                    onCheckedChange={(value) => handleSwitchChange(field, value)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200"
                />
            </div>
        )
    }

    const SectionCard = ({ title, description, children }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
            <hr className="mb-6 border-gray-200" />
            {children}
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Early Newborn Screening */}
            <SectionCard
                title="Early Newborn Screening (ENS)"
                description="ENS test results and date"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateField label="Screening Date" field="ens_date" />
                    <ToggleField label="Normal Results" field="ens_remarks" />
                </div>
            </SectionCard>

            {/* Newborn Hearing Screening */}
            <SectionCard
                title="Newborn Hearing Screening (NHS)"
                description="Hearing test results for both ears"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DateField label="Screening Date" field="nhs_date" />
                    <ToggleField label="Right Ear Pass" field="nhs_right_ear" />
                    <ToggleField label="Left Ear Pass" field="nhs_left_ear" />
                </div>
            </SectionCard>

            {/* Pulse Oximetry Screening */}
            <SectionCard
                title="Pulse Oximetry Screening (POS)"
                description="Critical congenital heart disease screening"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DateField label="Screening Date" field="pos_date" />
                    <ToggleField label="Right Hand/Foot Pass" field="pos_for_cchd_right" />
                    <ToggleField label="Left Hand/Foot Pass" field="pos_for_cchd_left" />
                </div>
            </SectionCard>

            {/* Red Reflex Test */}
            <SectionCard
                title="Red Reflex Test (ROR)"
                description="Eye examination for congenital cataracts"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateField label="Test Date" field="ror_date" />
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Comments</Label>
                        <Textarea
                            className="min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                            placeholder="Enter detailed observations and remarks"
                            value={form.ror_remarks || ''}
                            onChange={(e) => updateForm('ror_remarks', e.target.value)}
                        />
                    </div>
                </div>
            </SectionCard>
        </div>
    )
}

export default ScreeningSection