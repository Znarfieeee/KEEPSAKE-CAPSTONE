import React, { useState, useCallback, useMemo, useRef, memo } from 'react'
import { format } from 'date-fns'
import { addPrescription } from '@/api/doctors/prescription'
import { useAuth } from '@/context/auth'

// UI Components
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, Trash2, AlertCircle, Pill } from 'lucide-react'

// Helper
import { sanitizeObject } from '@/util/sanitize'
import { showToast } from '../../../util/alertHelper'

// Constants - Move outside component to prevent recreating on each render
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

const CONSULTATION_TYPES = [
    { id: 1, name: 'Initial Visit' },
    { id: 2, name: 'Follow-up' },
    { id: 3, name: 'Well-Child Visit' },
    { id: 4, name: 'Sick Visit' },
    { id: 5, name: 'Vaccination' },
    { id: 6, name: 'Growth and Development Check' },
    { id: 7, name: 'Emergency Visit' },
    { id: 8, name: 'Post Treatment' },
    { id: 9, name: 'Specialist Referral' },
    { id: 10, name: 'Telemedicine' },
]

const initialMedication = {
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    special_instructions: '',
    quantity: 1,
    refills_authorized: 0,
}

const initialForm = {
    findings: '',
    consultation_type: 1,
    consultation_notes: '',
    doctor_instructions: '',
    return_date: null,
    medications: [{ ...initialMedication }],
}

// Optimized Medication Component - Memoized to prevent unnecessary re-renders
const MedicationForm = memo(
    ({ medication, index, errors, onUpdate, onRemove, canRemove, suggestions }) => {
        // Use refs to avoid re-renders on input changes
        const inputRefs = useRef({})

        const handleInputChange = useCallback(
            (field, value) => {
                onUpdate(index, field, value)
            },
            [index, onUpdate]
        )

        const handleRemove = useCallback(() => {
            onRemove(index)
        }, [index, onRemove])

        // Memoize prescription preview
        const prescriptionPreview = useMemo(() => {
            if (
                !medication.medication_name ||
                !medication.dosage ||
                !medication.frequency ||
                !medication.duration
            ) {
                return null
            }

            const frequencyLabel = FREQUENCY_OPTIONS.find(
                (f) => f.value === medication.frequency
            )?.label.toLowerCase()
            const durationLabel = DURATION_OPTIONS.find(
                (d) => d.value === medication.duration
            )?.label.toLowerCase()

            return (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800 font-medium">Prescription Preview:</p>
                    <p className="text-sm text-blue-700">
                        <strong>{medication.medication_name}</strong> {medication.dosage},{' '}
                        {frequencyLabel}, for {durationLabel}
                        {medication.special_instructions && (
                            <span className="block mt-1 italic">
                                Special instructions: {medication.special_instructions}
                            </span>
                        )}
                    </p>
                </div>
            )
        }, [medication])

        const medicationErrors = errors[`medication_${index}`] || {}
        return (
            <div className="border rounded-lg p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                        Medication {index + 1}
                    </span>
                    {canRemove && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemove}
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
                                ref={(el) => (inputRefs.current.medication_name = el)}
                                placeholder="Enter medication name"
                                value={medication.medication_name}
                                onChange={(e) =>
                                    handleInputChange('medication_name', e.target.value)
                                }
                                className={medicationErrors.medication_name ? 'border-red-500' : ''}
                                list={`medications-${index}`}
                            />
                            <datalist id={`medications-${index}`}>
                                {suggestions.map((suggestion) => (
                                    <option key={suggestion} value={suggestion} />
                                ))}
                            </datalist>
                        </div>
                        {medicationErrors.medication_name && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {medicationErrors.medication_name}
                            </p>
                        )}
                    </div>

                    {/* Dosage */}
                    <div className="space-y-2">
                        <Label>Dosage & Strength *</Label>
                        <Input
                            placeholder="e.g., 500mg, 10ml, 1 tablet"
                            value={medication.dosage}
                            onChange={(e) => handleInputChange('dosage', e.target.value)}
                            className={medicationErrors.dosage ? 'border-red-500' : ''}
                        />
                        {medicationErrors.dosage && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {medicationErrors.dosage}
                            </p>
                        )}
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                        <Label>Frequency *</Label>
                        <Select
                            value={medication.frequency}
                            onValueChange={(value) => handleInputChange('frequency', value)}
                        >
                            <SelectTrigger
                                className={medicationErrors.frequency ? 'border-red-500' : ''}
                            >
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                {FREQUENCY_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {medicationErrors.frequency && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {medicationErrors.frequency}
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <Label>Duration *</Label>
                        <Select
                            value={medication.duration}
                            onValueChange={(value) => handleInputChange('duration', value)}
                        >
                            <SelectTrigger
                                className={medicationErrors.duration ? 'border-red-500' : ''}
                            >
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                {DURATION_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {medicationErrors.duration && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {medicationErrors.duration}
                            </p>
                        )}
                    </div>
                </div>

                {/* Special Instructions */}
                <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <Textarea
                        placeholder="e.g., Take with food, Avoid alcohol, Monitor blood pressure..."
                        value={medication.special_instructions}
                        onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                        rows={2}
                        className="resize-none"
                    />
                </div>

                {/* Prescription Preview */}
                {prescriptionPreview}
            </div>
        )
    }
)

MedicationForm.displayName = 'MedicationForm'

const AddPatientPrescriptionModal = ({ prescription, setIsOpen, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [formData, setFormData] = useState(initialForm)

    // Memoize medication suggestions to avoid recalculating on every render
    const getMedicationSuggestions = useCallback((input) => {
        if (!input || input.length < 2) return []
        const inputLower = input.toLowerCase()
        return COMMON_MEDICATIONS.filter((med) => med.toLowerCase().includes(inputLower)).slice(
            0,
            5
        )
    }, [])

    // Debounced validation to avoid excessive validation calls
    const validateMedication = useCallback((med, index) => {
        const medErrors = {}
        if (!med.medication_name?.trim()) medErrors.medication_name = 'Medication name is required'
        if (!med.dosage?.trim()) medErrors.dosage = 'Dosage is required'
        if (!med.frequency) medErrors.frequency = 'Frequency is required'
        if (!med.duration) medErrors.duration = 'Duration is required'

        return Object.keys(medErrors).length > 0 ? { [`medication_${index}`]: medErrors } : {}
    }, [])

    const validateForm = useCallback(() => {
        const newErrors = formData.medications.reduce((acc, med, index) => {
            const medErrors = validateMedication(med, index)
            return { ...acc, ...medErrors }
        }, {})

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData.medications, validateMedication])

    // Optimized form handlers
    const handleChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }, [])

    const updateMedication = useCallback((index, field, value) => {
        setFormData((prev) => {
            const newMeds = [...prev.medications]
            newMeds[index] = { ...newMeds[index], [field]: value }
            return { ...prev, medications: newMeds }
        })

        // Clear errors for this field
        setErrors((prev) => {
            const newErrors = { ...prev }
            if (newErrors[`medication_${index}`]?.[field]) {
                delete newErrors[`medication_${index}`][field]
                if (Object.keys(newErrors[`medication_${index}`]).length === 0) {
                    delete newErrors[`medication_${index}`]
                }
            }
            return newErrors
        })
    }, [])

    const addMedication = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            medications: [...prev.medications, { ...initialMedication }],
        }))
    }, [])

    const removeMedication = useCallback((index) => {
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
    }, [])

    const addCommonMedication = useCallback(
        (medication) => {
            const lastMedIndex = formData.medications.length - 1
            const lastMed = formData.medications[lastMedIndex]

            if (lastMed.medication_name === '') {
                updateMedication(lastMedIndex, 'medication_name', medication)
            } else {
                setFormData((prev) => ({
                    ...prev,
                    medications: [
                        ...prev.medications,
                        { ...initialMedication, medication_name: medication },
                    ],
                }))
            }
        },
        [formData.medications, updateMedication]
    )

    const { user } = useAuth()

    const reset = useCallback(() => {
        setFormData(initialForm)
        setErrors({})
    }, [])

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault()

            if (!validateForm()) return
            if (!prescription?.patient_id) {
                showToast('error', 'Patient ID is required')
                return
            }

            try {
                setIsLoading(true)

                const formattedData = {
                    ...formData,
                    facility_id: user?.facility_id || user?.current_facility_id,
                    return_date: formData.return_date
                        ? format(formData.return_date, 'yyyy-MM-dd')
                        : null,
                    medications: formData.medications.map((med) => ({
                        ...med,
                        special_instructions: med.special_instructions || '',
                    })),
                }
                const payload = sanitizeObject(formattedData)
                const res = await addPrescription(prescription.patient_id, payload)

                if (res.status === 'success') {
                    showToast('success', 'Prescription added successfully')
                    reset()
                    onSuccess?.(res.data)
                    setIsOpen?.(false)
                } else {
                    showToast('error', res.message || 'Failed to add prescription')
                }
            } catch (error) {
                console.error('Error saving prescription:', error)
                showToast('error', 'Failed to save prescription. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [
            formData,
            prescription?.patient_id,
            validateForm,
            reset,
            onSuccess,
            setIsOpen,
            user?.facility_id,
            user?.current_facility_id,
        ]
    )

    // Memoize medication suggestions for each medication
    const medicationSuggestions = useMemo(() => {
        return formData.medications.map((med) => getMedicationSuggestions(med.medication_name))
    }, [formData.medications, getMedicationSuggestions])

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
                        value={formData.consultation_type.toString()}
                        onValueChange={(value) =>
                            handleChange('consultation_type', parseInt(value, 10))
                        }
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select consultation type" />
                        </SelectTrigger>
                        <SelectContent>
                            {CONSULTATION_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                </SelectItem>
                            ))}
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
                            <MedicationForm
                                key={index}
                                medication={med}
                                index={index}
                                errors={errors}
                                onUpdate={updateMedication}
                                onRemove={removeMedication}
                                canRemove={formData.medications.length > 1}
                                suggestions={medicationSuggestions[index] || []}
                            />
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
                                    onClick={() => addCommonMedication(medication)}
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
