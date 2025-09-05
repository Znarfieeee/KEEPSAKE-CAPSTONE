import React, { useState } from 'react'
import { format } from 'date-fns'

// UI Components
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, Trash2, AlertCircle, Pill } from 'lucide-react'
import { DialogClose } from '../../ui/dialog'

// Common medications database (can be moved to a separate file)
const COMMON_MEDICATIONS = [
    'Acetaminophen',
    'Ibuprofen',
    'Aspirin',
    'Amoxicillin',
    'Azithromycin',
    'Metformin',
    'Lisinopril',
    'Amlodipine',
    'Atorvastatin',
    'Omeprazole',
    'Albuterol',
    'Prednisone',
    'Gabapentin',
    'Hydrochlorothiazide',
    'Losartan',
]

const FREQUENCY_OPTIONS = [
    { value: 'once_daily', label: 'Once daily' },
    { value: 'twice_daily', label: 'Twice daily (BID)' },
    { value: 'three_times_daily', label: 'Three times daily (TID)' },
    { value: 'four_times_daily', label: 'Four times daily (QID)' },
    { value: 'every_4_hours', label: 'Every 4 hours' },
    { value: 'every_6_hours', label: 'Every 6 hours' },
    { value: 'every_8_hours', label: 'Every 8 hours' },
    { value: 'every_12_hours', label: 'Every 12 hours' },
    { value: 'as_needed', label: 'As needed (PRN)' },
    { value: 'bedtime', label: 'At bedtime (HS)' },
    { value: 'with_meals', label: 'With meals' },
    { value: 'before_meals', label: 'Before meals' },
]

const DURATION_OPTIONS = [
    { value: '3_days', label: '3 days' },
    { value: '5_days', label: '5 days' },
    { value: '7_days', label: '1 week' },
    { value: '10_days', label: '10 days' },
    { value: '14_days', label: '2 weeks' },
    { value: '30_days', label: '1 month' },
    { value: '60_days', label: '2 months' },
    { value: '90_days', label: '3 months' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'until_finished', label: 'Until finished' },
]

const AddPatientPrescriptionModal = ({ onSave }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [formData, setFormData] = useState({
        findings: '',
        consultation_type: '',
        consultation_notes: '',
        doctor_instructions: '',
        return_date: undefined,
        medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
    })

    const validateMedication = (med, index) => {
        const medErrors = {}
        if (!med.name.trim()) medErrors.name = 'Medication name is required'
        if (!med.dosage.trim()) medErrors.dosage = 'Dosage is required'
        if (!med.frequency) medErrors.frequency = 'Frequency is required'
        if (!med.duration) medErrors.duration = 'Duration is required'

        return Object.keys(medErrors).length > 0 ? { [`medication_${index}`]: medErrors } : {}
    }

    const validateForm = () => {
        let newErrors = {}

        // Validate medications
        formData.medications.forEach((med, index) => {
            const medErrors = validateMedication(med, index)
            newErrors = { ...newErrors, ...medErrors }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)
        try {
            await onSave(formData)
            // Reset form on success
            setFormData({
                findings: '',
                consultation_type: '',
                consultation_notes: '',
                doctor_instructions: '',
                return_date: undefined,
                medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
            })
            setErrors({})
        } catch (error) {
            console.error('Error saving prescription:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const addMedication = () => {
        setFormData((prev) => ({
            ...prev,
            medications: [
                ...prev.medications,
                { name: '', dosage: '', frequency: '', duration: '', notes: '' },
            ],
        }))
    }

    const removeMedication = (index) => {
        setFormData((prev) => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index),
        }))
        // Clear errors for removed medication
        setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[`medication_${index}`]
            return newErrors
        })
    }

    const updateMedication = (index, field, value) => {
        setFormData((prev) => {
            const newMeds = [...prev.medications]
            newMeds[index] = { ...newMeds[index], [field]: value }
            return { ...prev, medications: newMeds }
        })

        // Clear specific field error when user starts typing
        setErrors((prev) => {
            const newErrors = { ...prev }
            if (newErrors[`medication_${index}`]) {
                delete newErrors[`medication_${index}`][field]
                if (Object.keys(newErrors[`medication_${index}`]).length === 0) {
                    delete newErrors[`medication_${index}`]
                }
            }
            return newErrors
        })
    }

    const getMedicationSuggestions = (input) => {
        if (!input || input.length < 2) return []
        return COMMON_MEDICATIONS.filter((med) =>
            med.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 5)
    }

    return (
        <DialogContent
            className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
            showCloseButton={false}
        >
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 mb-6 text-xl">
                    Add New Prescription
                </DialogTitle>
            </DialogHeader>
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Consultation Type */}
                <div className="space-y-2">
                    <Label htmlFor="consultation_type">Consultation Type *</Label>
                    <Select
                        value={formData.consultation_type}
                        onValueChange={(value) => handleChange('consultation_type', value)}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select consultation type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Routine Checkup">Routine Checkup</SelectItem>
                            <SelectItem value="Acute Illness">Acute Illness</SelectItem>
                            <SelectItem value="Chronic Condition">Chronic Condition</SelectItem>
                            <SelectItem value="Vaccination">Vaccination</SelectItem>
                            <SelectItem value="Follow-up / Post Treatment">
                                Follow-up / Post Treatment
                            </SelectItem>
                            <SelectItem value="Emergency / Urgent">Emergency / Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Findings */}
                <div className="space-y-2">
                    <Label htmlFor="findings">Clinical Findings *</Label>
                    <Textarea
                        id="findings"
                        placeholder="Describe the clinical findings, symptoms, and diagnosis..."
                        value={formData.findings}
                        onChange={(e) => handleChange('findings', e.target.value)}
                        required
                        rows={3}
                        className="resize-none"
                    />
                </div>

                {/* Consultation notes */}
                <div className="space-y-2">
                    <Label htmlFor="consultation_notes">Consultation Notes</Label>
                    <Textarea
                        id="consultation_notes"
                        placeholder="Additional notes about the consultation..."
                        value={formData.consultation_notes}
                        onChange={(e) => handleChange('consultation_notes', e.target.value)}
                        rows={2}
                        className="resize-none"
                    />
                </div>

                {/* Medications Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-lg font-medium">Medications *</Label>
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={addMedication}
                            className="flex items-center gap-1"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Add Medication
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {formData.medications.map((med, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">
                                        Medication {index + 1}
                                    </span>
                                    {formData.medications.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeMedication(index)}
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Medication Name */}
                                    <div className="space-y-2">
                                        <Label>Medication Name *</Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Enter medication name"
                                                value={med.name}
                                                onChange={(e) =>
                                                    updateMedication(index, 'name', e.target.value)
                                                }
                                                className={
                                                    errors[`medication_${index}`]?.name
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                                list={`medications-${index}`}
                                            />
                                            <datalist id={`medications-${index}`}>
                                                {getMedicationSuggestions(med.name).map(
                                                    (suggestion) => (
                                                        <option
                                                            key={suggestion}
                                                            value={suggestion}
                                                        />
                                                    )
                                                )}
                                            </datalist>
                                        </div>
                                        {errors[`medication_${index}`]?.name && (
                                            <p className="text-red-500 text-sm flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors[`medication_${index}`].name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Dosage */}
                                    <div className="space-y-2">
                                        <Label>Dosage & Strength *</Label>
                                        <Input
                                            placeholder="e.g., 500mg, 10ml, 1 tablet"
                                            value={med.dosage}
                                            onChange={(e) =>
                                                updateMedication(index, 'dosage', e.target.value)
                                            }
                                            className={
                                                errors[`medication_${index}`]?.dosage
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {errors[`medication_${index}`]?.dosage && (
                                            <p className="text-red-500 text-sm flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors[`medication_${index}`].dosage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Frequency */}
                                    <div className="space-y-2">
                                        <Label>Frequency *</Label>
                                        <Select
                                            value={med.frequency}
                                            onValueChange={(value) =>
                                                updateMedication(index, 'frequency', value)
                                            }
                                        >
                                            <SelectTrigger
                                                className={
                                                    errors[`medication_${index}`]?.frequency
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            >
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FREQUENCY_OPTIONS.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors[`medication_${index}`]?.frequency && (
                                            <p className="text-red-500 text-sm flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors[`medication_${index}`].frequency}
                                            </p>
                                        )}
                                    </div>

                                    {/* Duration */}
                                    <div className="space-y-2">
                                        <Label>Duration *</Label>
                                        <Select
                                            value={med.duration}
                                            onValueChange={(value) =>
                                                updateMedication(index, 'duration', value)
                                            }
                                        >
                                            <SelectTrigger
                                                className={
                                                    errors[`medication_${index}`]?.duration
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            >
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DURATION_OPTIONS.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors[`medication_${index}`]?.duration && (
                                            <p className="text-red-500 text-sm flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors[`medication_${index}`].duration}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Special Instructions */}
                                <div className="space-y-2">
                                    <Label>Special Instructions</Label>
                                    <Textarea
                                        placeholder="e.g., Take with food, Avoid alcohol, Monitor blood pressure..."
                                        value={med.notes}
                                        onChange={(e) =>
                                            updateMedication(index, 'notes', e.target.value)
                                        }
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Medication Summary Preview */}
                                {med.name && med.dosage && med.frequency && med.duration && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <p className="text-sm text-blue-800 font-medium">
                                            Prescription Preview:
                                        </p>
                                        <p className="text-sm text-blue-700">
                                            <strong>{med.name}</strong> {med.dosage},{' '}
                                            {FREQUENCY_OPTIONS.find(
                                                (f) => f.value === med.frequency
                                            )?.label.toLowerCase()}
                                            , for{' '}
                                            {DURATION_OPTIONS.find(
                                                (d) => d.value === med.duration
                                            )?.label.toLowerCase()}
                                            {med.notes && (
                                                <span className="block mt-1 italic">
                                                    Special instructions: {med.notes}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Add Common Medications */}
                    <div className="space-y-2">
                        <Label className="text-sm text-gray-600">
                            Quick Add Common Medications:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_MEDICATIONS.slice(0, 8).map((medication) => (
                                <Button
                                    key={medication}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const lastMedIndex = formData.medications.length - 1
                                        const lastMed = formData.medications[lastMedIndex]
                                        if (lastMed.name === '') {
                                            updateMedication(lastMedIndex, 'name', medication)
                                        } else {
                                            addMedication()
                                            setTimeout(() => {
                                                updateMedication(
                                                    formData.medications.length,
                                                    'name',
                                                    medication
                                                )
                                            }, 0)
                                        }
                                    }}
                                    className="text-xs"
                                >
                                    + {medication}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Doctor's Instructions */}
                <div className="space-y-2">
                    <Label htmlFor="doctor_instructions">Doctor's Instructions</Label>
                    <Textarea
                        id="doctor_instructions"
                        placeholder="General instructions for the patient (diet, activity, follow-up care, etc.)"
                        value={formData.doctor_instructions}
                        onChange={(e) => handleChange('doctor_instructions', e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                </div>

                {/* Return Date */}
                <div className="space-y-2 flex gap-4 items-center">
                    <Label htmlFor="return_date">Follow-up Return Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full md:w-auto border-gray-200 justify-start text-left font-normal"
                            >
                                {formData.return_date ? (
                                    format(formData.return_date, 'PPP')
                                ) : (
                                    <span className="text-gray-500">
                                        Select return date (optional)
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.return_date}
                                onSelect={(date) => handleChange('return_date', date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                    <div className="flex-1">
                        {Object.keys(errors).length > 0 && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Please correct the errors above before saving
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={isLoading || Object.keys(errors).length > 0}
                            className="min-w-[120px]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </div>
                            ) : (
                                'Save Prescription'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

export default AddPatientPrescriptionModal
