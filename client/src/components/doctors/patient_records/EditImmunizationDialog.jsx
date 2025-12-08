import React, { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Syringe, Calendar, Info, AlertTriangle } from 'lucide-react'
import {
    getVaccineOptions,
    getVaccineInfo,
    getManufacturers,
    ADMINISTRATION_ROUTES,
    BODY_SITES,
} from '@/constants/vaccineData'
import { updateVaccination } from '@/api/doctor/vaccinations'
import { showToast } from '@/util/alertHelper'
import { cn } from '@/lib/utils'

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
        // HIPAA-compliant fields
        route_of_administration: '',
        body_site: '',
        vaccine_expiration_date: '',
        vis_publication_date: '',
        vis_given_date: '',
        // Legacy field
        administration_site: '',
        next_dose_due: '',
        notes: '',
        // Adverse reaction fields
        adverse_reaction: false,
        adverse_reaction_details: '',
    })

    const [errors, setErrors] = useState({})

    // Get vaccine options
    const vaccineOptions = getVaccineOptions()

    // Get manufacturers for selected vaccine
    const manufacturers = useMemo(() => getManufacturers(selectedVaccine), [selectedVaccine])

    // Helper to format date for input
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return ''
        try {
            const date = new Date(dateValue)
            if (isNaN(date.getTime())) return ''
            return date.toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    // Populate form when vaccination data is provided
    useEffect(() => {
        if (vaccination && open) {
            setSelectedVaccine(vaccination.vaccine_name || '')
            setFormData({
                vaccine_name: vaccination.vaccine_name || '',
                dose_number: vaccination.dose_number?.toString() || '1',
                administered_date: formatDateForInput(vaccination.administered_date),
                manufacturer: vaccination.manufacturer || '',
                lot_number: vaccination.lot_number || '',
                // HIPAA fields
                route_of_administration: vaccination.route_of_administration || '',
                body_site: vaccination.body_site || '',
                vaccine_expiration_date: formatDateForInput(vaccination.vaccine_expiration_date),
                vis_publication_date: formatDateForInput(vaccination.vis_publication_date),
                vis_given_date: formatDateForInput(vaccination.vis_given_date),
                // Legacy field
                administration_site: vaccination.administration_site || '',
                next_dose_due: formatDateForInput(vaccination.next_dose_due),
                notes: vaccination.notes || '',
                // Adverse reaction
                adverse_reaction: vaccination.adverse_reaction || false,
                adverse_reaction_details: vaccination.adverse_reaction_details || '',
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
                route_of_administration: '',
                body_site: '',
                vaccine_expiration_date: '',
                vis_publication_date: '',
                vis_given_date: '',
                administration_site: '',
                next_dose_due: '',
                notes: '',
                adverse_reaction: false,
                adverse_reaction_details: '',
            })
            setSelectedVaccine('')
            setVaccineInfo(null)
            setErrors({})
        }
    }, [open])

    // Handle input change
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
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

        // Check if dose exceeds max doses
        if (vaccineInfo?.totalDoses && parseInt(formData.dose_number) > vaccineInfo.totalDoses) {
            newErrors.dose_number = `Maximum ${vaccineInfo.totalDoses} doses for this vaccine`
        }

        if (!formData.administered_date) {
            newErrors.administered_date = 'Administration date is required'
        }

        if (formData.administered_date && new Date(formData.administered_date) > new Date()) {
            newErrors.administered_date = 'Administration date cannot be in the future'
        }

        // Validate next dose due date
        if (formData.next_dose_due && formData.administered_date) {
            if (new Date(formData.next_dose_due) <= new Date(formData.administered_date)) {
                newErrors.next_dose_due = 'Next dose date must be after administration date'
            }
        }

        // Validate vaccine expiration date
        if (formData.vaccine_expiration_date && formData.administered_date) {
            if (new Date(formData.vaccine_expiration_date) < new Date(formData.administered_date)) {
                newErrors.vaccine_expiration_date = 'Vaccine appears to be expired'
            }
        }

        // Adverse reaction details required if adverse reaction is checked
        if (formData.adverse_reaction && !formData.adverse_reaction_details) {
            newErrors.adverse_reaction_details = 'Please describe the adverse reaction'
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
            const vaccinationData = {
                vaccine_name: formData.vaccine_name,
                dose_number: parseInt(formData.dose_number),
                administered_date: new Date(formData.administered_date).toISOString(),
                manufacturer: formData.manufacturer || null,
                lot_number: formData.lot_number || null,
                // HIPAA fields
                route_of_administration: formData.route_of_administration || null,
                body_site: formData.body_site || null,
                vaccine_expiration_date: formData.vaccine_expiration_date || null,
                vis_publication_date: formData.vis_publication_date || null,
                vis_given_date: formData.vis_given_date || null,
                // Legacy field
                administration_site: formData.administration_site || null,
                next_dose_due: formData.next_dose_due || null,
                notes: formData.notes || null,
                // Adverse reaction
                adverse_reaction: formData.adverse_reaction,
                adverse_reaction_details: formData.adverse_reaction
                    ? formData.adverse_reaction_details
                    : null,
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
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700 flex items-start gap-1">
                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        {vaccineInfo.description}
                                        <br />
                                        <span className="text-xs">
                                            Schedule: {vaccineInfo.recommendedAge} | Total doses:{' '}
                                            {vaccineInfo.totalDoses || 'Annual'}
                                        </span>
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Dose Number and Administered Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dose_number" className="required">
                                Dose Number
                            </Label>
                            <Input
                                id="dose_number"
                                type="number"
                                min="1"
                                max={vaccineInfo?.totalDoses || 10}
                                value={formData.dose_number}
                                onChange={(e) => handleChange('dose_number', e.target.value)}
                                className={errors.dose_number ? 'border-red-500' : ''}
                            />
                            {errors.dose_number && (
                                <p className="text-sm text-red-600 mt-1">{errors.dose_number}</p>
                            )}
                            {vaccineInfo?.totalDoses && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Dose {formData.dose_number} of {vaccineInfo.totalDoses}
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
                                    className={cn(
                                        'pl-10',
                                        errors.administered_date && 'border-red-500'
                                    )}
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

                    {/* Route and Body Site (HIPAA Fields) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="route_of_administration">Route of Administration</Label>
                            <Select
                                value={formData.route_of_administration}
                                onValueChange={(v) => handleChange('route_of_administration', v)}
                            >
                                <SelectTrigger id="route_of_administration">
                                    <SelectValue placeholder="Select route" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ADMINISTRATION_ROUTES.map((route) => (
                                        <SelectItem key={route.value} value={route.value}>
                                            {route.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="body_site">Body Site</Label>
                            <Select
                                value={formData.body_site}
                                onValueChange={(v) => handleChange('body_site', v)}
                            >
                                <SelectTrigger id="body_site">
                                    <SelectValue placeholder="Select body site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BODY_SITES.map((site) => (
                                        <SelectItem key={site.value} value={site.value}>
                                            {site.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Manufacturer and Lot Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Select
                                value={formData.manufacturer}
                                onValueChange={(v) => handleChange('manufacturer', v)}
                            >
                                <SelectTrigger id="manufacturer">
                                    <SelectValue placeholder="Select manufacturer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {manufacturers.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="lot_number">Lot Number</Label>
                            <Input
                                id="lot_number"
                                placeholder="e.g., LOT123456"
                                value={formData.lot_number}
                                onChange={(e) => handleChange('lot_number', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Vaccine Expiration and Administration Facility */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="vaccine_expiration_date">Vaccine Expiration Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="vaccine_expiration_date"
                                    type="date"
                                    value={formData.vaccine_expiration_date}
                                    onChange={(e) =>
                                        handleChange('vaccine_expiration_date', e.target.value)
                                    }
                                    className={cn(
                                        'pl-10',
                                        errors.vaccine_expiration_date && 'border-red-500'
                                    )}
                                />
                            </div>
                            {errors.vaccine_expiration_date && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.vaccine_expiration_date}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="administration_site">Administration Facility</Label>
                            <Input
                                id="administration_site"
                                placeholder="e.g., City Health Center"
                                value={formData.administration_site}
                                onChange={(e) =>
                                    handleChange('administration_site', e.target.value)
                                }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Health facility where vaccine was given
                            </p>
                        </div>
                    </div>

                    {/* VIS Dates (HIPAA) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="vis_publication_date">VIS Publication Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="vis_publication_date"
                                    type="date"
                                    value={formData.vis_publication_date}
                                    onChange={(e) =>
                                        handleChange('vis_publication_date', e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Vaccine Information Statement date
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="vis_given_date">VIS Given to Patient</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="vis_given_date"
                                    type="date"
                                    value={formData.vis_given_date}
                                    onChange={(e) => handleChange('vis_given_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="pl-10"
                                />
                            </div>
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
                                className={cn('pl-10', errors.next_dose_due && 'border-red-500')}
                            />
                        </div>
                        {errors.next_dose_due && (
                            <p className="text-sm text-red-600 mt-1">{errors.next_dose_due}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty if this is the final dose
                        </p>
                    </div>

                    {/* Adverse Reaction Section */}
                    <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="adverse_reaction"
                                checked={formData.adverse_reaction}
                                onCheckedChange={(checked) =>
                                    handleChange('adverse_reaction', checked)
                                }
                            />
                            <Label
                                htmlFor="adverse_reaction"
                                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                Adverse Reaction Occurred
                            </Label>
                        </div>

                        {formData.adverse_reaction && (
                            <div>
                                <Label htmlFor="adverse_reaction_details" className="required">
                                    Describe Adverse Reaction
                                </Label>
                                <Textarea
                                    id="adverse_reaction_details"
                                    placeholder="Describe the adverse reaction, symptoms, timing, and any treatment provided..."
                                    value={formData.adverse_reaction_details}
                                    onChange={(e) =>
                                        handleChange('adverse_reaction_details', e.target.value)
                                    }
                                    rows={3}
                                    className={
                                        errors.adverse_reaction_details ? 'border-red-500' : ''
                                    }
                                />
                                {errors.adverse_reaction_details && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.adverse_reaction_details}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional observations or special circumstances..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Updating...' : 'Update Immunization'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditImmunizationDialog
