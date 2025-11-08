import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Syringe, Calendar, AlertCircle } from 'lucide-react'
import { getVaccineOptions, getVaccineInfo } from '@/constants/vaccineData'
import { updateVaccination } from '@/api/doctor/vaccinations'
import { showToast } from '@/util/alertHelper'

const EditImmunizationDialog = ({ open, onOpenChange, patient, vaccination, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [selectedVaccine, setSelectedVaccine] = useState('')
    const [vaccineInfo, setVaccineInfo] = useState(null)

    const [formData, setFormData] = useState({
        vaccine_name: '',
        dose_number: '1',
        administered_date: '',
        manufacturer: '',
        lot_number: '',
        administration_site: '',
        next_dose_due: '',
        notes: '',
    })

    const [errors, setErrors] = useState({})

    // Get vaccine options
    const vaccineOptions = getVaccineOptions()

    // Populate form when vaccination data is provided
    useEffect(() => {
        if (vaccination && open) {
            setSelectedVaccine(vaccination.vaccine_name || '')
            setFormData({
                vaccine_name: vaccination.vaccine_name || '',
                dose_number: vaccination.dose_number?.toString() || '1',
                administered_date: vaccination.administered_date
                    ? new Date(vaccination.administered_date).toISOString().split('T')[0]
                    : '',
                manufacturer: vaccination.manufacturer || '',
                lot_number: vaccination.lot_number || '',
                administration_site: vaccination.administration_site || '',
                next_dose_due: vaccination.next_dose_due || '',
                notes: vaccination.notes || '',
            })

            // Set vaccine info
            if (vaccination.vaccine_name) {
                const info = getVaccineInfo(vaccination.vaccine_name)
                setVaccineInfo(info)
            }
        }
    }, [vaccination, open])

    // Update vaccine info when vaccine changes
    useEffect(() => {
        if (selectedVaccine) {
            const info = getVaccineInfo(selectedVaccine)
            setVaccineInfo(info)
            setFormData((prev) => ({
                ...prev,
                vaccine_name: selectedVaccine,
            }))
        }
    }, [selectedVaccine])

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setFormData({
                vaccine_name: '',
                dose_number: '1',
                administered_date: '',
                manufacturer: '',
                lot_number: '',
                administration_site: '',
                next_dose_due: '',
                notes: '',
            })
            setSelectedVaccine('')
            setVaccineInfo(null)
            setErrors({})
        }
    }, [open])

    // Handle input change
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }))
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors = {}

        if (!formData.vaccine_name) {
            newErrors.vaccine_name = 'Vaccine name is required'
        }

        if (!formData.dose_number) {
            newErrors.dose_number = 'Dose number is required'
        }

        if (!formData.administered_date) {
            newErrors.administered_date = 'Administration date is required'
        }

        // Validate that administered date is not in the future
        if (formData.administered_date && new Date(formData.administered_date) > new Date()) {
            newErrors.administered_date = 'Administration date cannot be in the future'
        }

        // Validate next dose due date
        if (formData.next_dose_due && formData.administered_date) {
            if (new Date(formData.next_dose_due) <= new Date(formData.administered_date)) {
                newErrors.next_dose_due = 'Next dose date must be after administration date'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            showToast('error', 'Please fill in all required fields correctly')
            return
        }

        setLoading(true)
        try {
            // Prepare data for API - convert empty strings to null for optional fields
            const vaccinationData = {
                vaccine_name: formData.vaccine_name,
                dose_number: parseInt(formData.dose_number),
                administered_date: new Date(formData.administered_date).toISOString(),
                manufacturer: formData.manufacturer || null,
                lot_number: formData.lot_number || null,
                administration_site: formData.administration_site || null,
                next_dose_due: formData.next_dose_due || null,
                notes: formData.notes || null,
            }

            const response = await updateVaccination(
                patient.patient_id,
                vaccination.vax_id,
                vaccinationData
            )

            if (response.status === 'success') {
                showToast('success', 'Immunization record updated successfully')
                onSuccess(response.data)
                onOpenChange(false)
            } else {
                showToast('error', response.message || 'Failed to update immunization record')
            }
        } catch (error) {
            console.error('Error updating immunization:', error)
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to update immunization record'
            showToast('error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Syringe className="w-5 h-5 text-blue-600" />
                        <DialogTitle>Edit Immunization Record</DialogTitle>
                    </div>
                    <DialogDescription>
                        Update vaccination record for{' '}
                        <span className="font-semibold">
                            {patient?.firstname} {patient?.lastname}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Vaccine Name */}
                    <div>
                        <Label htmlFor="vaccine_name" className="required">
                            Vaccine Name
                        </Label>
                        <Select value={selectedVaccine} onValueChange={setSelectedVaccine}>
                            <SelectTrigger
                                id="vaccine_name"
                                className={errors.vaccine_name ? 'border-red-500' : ''}
                            >
                                <SelectValue placeholder="Select vaccine" />
                            </SelectTrigger>
                            <SelectContent>
                                {vaccineOptions.map((vaccine) => (
                                    <SelectItem key={vaccine.value} value={vaccine.value}>
                                        {vaccine.label}{' '}
                                        <span className="text-xs text-gray-500">
                                            ({vaccine.category})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.vaccine_name && (
                            <p className="text-sm text-red-600 mt-1">{errors.vaccine_name}</p>
                        )}
                        {vaccineInfo && (
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {vaccineInfo.description} | {vaccineInfo.recommendedAge}
                            </p>
                        )}
                    </div>

                    {/* Dose Number and Administered Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dose_number" className="required">
                                Dose Number
                            </Label>
                            <Input
                                id="dose_number"
                                type="number"
                                min="1"
                                max={vaccineInfo?.maxDoses || 10}
                                value={formData.dose_number}
                                onChange={(e) => handleChange('dose_number', e.target.value)}
                                className={errors.dose_number ? 'border-red-500' : ''}
                            />
                            {errors.dose_number && (
                                <p className="text-sm text-red-600 mt-1">{errors.dose_number}</p>
                            )}
                            {vaccineInfo?.maxDoses && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Max doses: {vaccineInfo.maxDoses}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="administered_date" className="required">
                                Date Administered
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="administered_date"
                                    type="date"
                                    value={formData.administered_date}
                                    onChange={(e) =>
                                        handleChange('administered_date', e.target.value)
                                    }
                                    max={new Date().toISOString().split('T')[0]}
                                    className={`pl-10 ${
                                        errors.administered_date ? 'border-red-500' : ''
                                    }`}
                                    required
                                />
                            </div>
                            {errors.administered_date && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.administered_date}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Manufacturer */}
                    <div>
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                            id="manufacturer"
                            value={formData.manufacturer}
                            onChange={(e) => handleChange('manufacturer', e.target.value)}
                            placeholder="e.g., Pfizer, GSK, Sanofi Pasteur"
                            required
                        />
                    </div>

                    {/* Lot Number and Administration Site */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="lot_number">Lot Number</Label>
                            <Input
                                id="lot_number"
                                placeholder="e.g., LOT123456"
                                value={formData.lot_number}
                                onChange={(e) => handleChange('lot_number', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="administration_site" className="required">
                                Administration Site
                            </Label>
                            <Input
                                id="administration_site"
                                placeholder="e.g., City Health Center, Hospital Name"
                                value={formData.administration_site}
                                onChange={(e) =>
                                    handleChange('administration_site', e.target.value)
                                }
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Health facility or location where vaccine was given
                            </p>
                        </div>
                    </div>

                    {/* Next Dose Due */}
                    <div>
                        <Label htmlFor="next_dose_due">Next Dose Due Date</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                id="next_dose_due"
                                type="date"
                                value={formData.next_dose_due}
                                onChange={(e) => handleChange('next_dose_due', e.target.value)}
                                min={formData.administered_date}
                                className={`pl-10 ${errors.next_dose_due ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.next_dose_due && (
                            <p className="text-sm text-red-600 mt-1">{errors.next_dose_due}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty if this is the final dose
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional notes, adverse reactions, or observations..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Immunization'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditImmunizationDialog
