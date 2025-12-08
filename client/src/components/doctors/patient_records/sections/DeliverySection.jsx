import React, { useState, useEffect } from 'react'

// UI Components
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Helper
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const DeliverySection = ({ form, updateForm }) => {
    const [dates, setDates] = useState({
        vitamin_k_date: null,
        hepatitis_b_date: null,
        bcg_vaccination_date: null,
        follow_up_visit_date: null,
    })

    useEffect(() => {
        // Parse dates using local timezone to avoid timezone conversion issues
        const parseDate = (dateString) => {
            if (!dateString) return null
            const [year, month, day] = dateString.split('-').map(Number)
            return new Date(year, month - 1, day) // month is 0-indexed in Date constructor
        }

        setDates({
            vitamin_k_date: parseDate(form.vitamin_k_date),
            hepatitis_b_date: parseDate(form.hepatitis_b_date),
            bcg_vaccination_date: parseDate(form.bcg_vaccination_date),
            follow_up_visit_date: parseDate(form.follow_up_visit_date),
        })
    }, [
        form.vitamin_k_date,
        form.hepatitis_b_date,
        form.bcg_vaccination_date,
        form.follow_up_visit_date,
    ])

    const handleDateChange = (field, date) => {
        setDates((prev) => ({ ...prev, [field]: date }))
        if (date) {
            // Create a date string in local timezone to avoid timezone conversion issues
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateString = `${year}-${month}-${day}`
            updateForm(field, dateString)
        } else {
            updateForm(field, '')
        }
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

    return (
        <div className="space-y-8">
            {/* Basic Delivery Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Basic Delivery Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Type of Delivery</Label>
                        <Select
                            value={form.type_of_delivery}
                            onValueChange={(v) => updateForm('type_of_delivery', v)}
                        >
                            <SelectTrigger className="border-input w-full">
                                <SelectValue placeholder="Select delivery type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal Delivery</SelectItem>
                                <SelectItem value="cesarean">Cesarean Section</SelectItem>
                                <SelectItem value="vacuum">Vacuum Assisted</SelectItem>
                                <SelectItem value="forceps">Forceps Assisted</SelectItem>
                                <SelectItem value="vbac">
                                    VBAC (Vaginal Birth After Cesarean)
                                </SelectItem>
                                <SelectItem value="water">Water Birth</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Apgar Score (0-10)</Label>
                        <Input
                            type="number"
                            min="0"
                            max="10"
                            className="border-input"
                            placeholder="Enter Apgar score"
                            value={form.apgar_score}
                            onChange={(e) => updateForm('apgar_score', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Mother's Blood Type</Label>
                        <Select
                            value={form.mother_blood_type}
                            onValueChange={(v) => updateForm('mother_blood_type', v)}
                        >
                            <SelectTrigger className="border-input w-full">
                                <SelectValue placeholder="Select blood type" />
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
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Father's Blood Type</Label>
                        <Select
                            value={form.father_blood_type}
                            onValueChange={(v) => updateForm('father_blood_type', v)}
                        >
                            <SelectTrigger className="border-input w-full">
                                <SelectValue placeholder="Select blood type" />
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
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Distinguishable Marks</Label>
                        <Textarea
                            className="border-input min-h-[100px]"
                            placeholder="Enter any distinguishing marks or features"
                            value={form.distinguishable_marks}
                            onChange={(e) => updateForm('distinguishable_marks', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Vaccinations and Medications */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Early Vaccinations & Medications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateField label="Vitamin K Date" field="vitamin_k_date" />
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Vitamin K Location</Label>
                        <Input
                            className="border-input"
                            placeholder="Enter body part location"
                            value={form.vitamin_k_location}
                            onChange={(e) => updateForm('vitamin_k_location', e.target.value)}
                        />
                    </div>
                    <DateField label="Hepatitis B Date" field="hepatitis_b_date" />
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Hepatitis B Location</Label>
                        <Input
                            className="border-input"
                            placeholder="Enter body part location"
                            value={form.hepatitis_b_location}
                            onChange={(e) => updateForm('hepatitis_b_location', e.target.value)}
                        />
                    </div>
                    <DateField label="BCG Vaccination Date" field="bcg_vaccination_date" />
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">BCG Location</Label>
                        <Input
                            className="border-input"
                            placeholder="Enter body part location"
                            value={form.bcg_vaccination_location}
                            onChange={(e) => updateForm('bcg_vaccination_location', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Other Medications</Label>
                        <Textarea
                            className="border-input min-h-[100px]"
                            placeholder="List any other medications given during or after delivery"
                            value={form.other_medications}
                            onChange={(e) => updateForm('other_medications', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Obstetrician</Label>
                        <Input
                            className="border-input"
                            placeholder="Enter obstetrician"
                            value={form.obstetrician}
                            onChange={(e) => updateForm('obstetrician', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Pediatrician</Label>
                        <Input
                            className="border-input"
                            placeholder="Enter pediatrician"
                            value={form.pediatrician}
                            onChange={(e) => updateForm('pediatrician', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Discharge Diagnosis</Label>
                        <Textarea
                            className="border-input min-h-[100px]"
                            placeholder="Enter discharge diagnosis and notes"
                            value={form.discharge_diagnosis}
                            onChange={(e) => updateForm('discharge_diagnosis', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Follow-up Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Follow-up Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateField label="Follow-up Visit Date" field="follow_up_visit_date" />
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Follow-up Visit Site</Label>
                        <Input
                            className="border-input"
                            placeholder="Enter follow-up visit location"
                            value={form.follow_up_visit_site}
                            onChange={(e) => updateForm('follow_up_visit_site', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeliverySection
