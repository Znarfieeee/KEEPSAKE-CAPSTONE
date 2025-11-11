import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Plus, Ruler, Weight, Brain, Activity } from 'lucide-react'
import axios from 'axios'

// UI Components
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

// Create validation schema with patient birthdate check
const createMeasurementSchema = (patientBirthdate) => z.object({
    weight: z.string().optional().refine(
        val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) < 200),
        { message: 'Weight must be between 0 and 200 kg' }
    ),
    height: z.string().optional().refine(
        val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) < 250),
        { message: 'Height must be between 0 and 250 cm' }
    ),
    head_circumference: z.string().optional().refine(
        val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) < 100),
        { message: 'Head circumference must be between 0 and 100 cm' }
    ),
    chest_circumference: z.string().optional().refine(
        val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) < 200),
        { message: 'Chest circumference must be between 0 and 200 cm' }
    ),
    abdominal_circumference: z.string().optional().refine(
        val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) < 200),
        { message: 'Abdominal circumference must be between 0 and 200 cm' }
    ),
    measurement_date: z.string().min(1, 'Measurement date is required').refine(
        val => {
            if (!val || !patientBirthdate) return true
            const birthdate = new Date(patientBirthdate)
            const measurementDate = new Date(val)
            return measurementDate >= birthdate
        },
        { message: 'Measurement date cannot be before patient birthdate' }
    ).refine(
        val => {
            if (!val) return true
            const measurementDate = new Date(val)
            const today = new Date()
            today.setHours(23, 59, 59, 999) // End of today
            return measurementDate <= today
        },
        { message: 'Measurement date cannot be in the future' }
    )
}).refine(
    data => data.weight || data.height || data.head_circumference || data.chest_circumference || data.abdominal_circumference,
    { message: 'At least one measurement must be provided', path: ['weight'] }
)

const AddMeasurementModal = ({ isOpen, onClose, patient, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)

    // Get patient birthdate (support both field names)
    const patientBirthdate = patient?.date_of_birth || patient?.birthdate

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: zodResolver(createMeasurementSchema(patientBirthdate)),
        defaultValues: {
            measurement_date: new Date().toISOString().split('T')[0]
        }
    })

    const onSubmit = async (data) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const measurementData = {
                weight: data.weight ? parseFloat(data.weight) : null,
                height: data.height ? parseFloat(data.height) : null,
                head_circumference: data.head_circumference ? parseFloat(data.head_circumference) : null,
                chest_circumference: data.chest_circumference ? parseFloat(data.chest_circumference) : null,
                abdominal_circumference: data.abdominal_circumference ? parseFloat(data.abdominal_circumference) : null,
                measurement_date: data.measurement_date
            }

            const response = await axios.post(
                `/patient_record/${patient.patient_id}/growth-milestone`,
                measurementData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            )

            if (response.data.status === 'success') {
                // Dispatch custom event for immediate UI update
                window.dispatchEvent(new CustomEvent('growth-milestone-added', {
                    detail: { patient_id: patient.patient_id, data: response.data.data }
                }))

                reset()
                onSuccess?.()
                onClose()
            } else {
                throw new Error(response.data.message || 'Failed to save growth milestone')
            }
        } catch (err) {
            console.error('Error saving measurement:', err)
            setError(err.response?.data?.message || err.message || 'Failed to save measurement')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        reset()
        setError(null)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Add Measurement</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Record anthropometric measurements for {patient?.firstname} {patient?.lastname}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Measurement Date */}
                    <div>
                        <Label htmlFor="measurement_date" className="text-sm font-medium text-gray-700">
                            Measurement Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="measurement_date"
                            type="date"
                            {...register('measurement_date')}
                            className="mt-1"
                            min={patientBirthdate || undefined}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        {errors.measurement_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.measurement_date.message}</p>
                        )}
                        {patientBirthdate && (
                            <p className="mt-1 text-xs text-gray-500">
                                Patient birthdate: {new Date(patientBirthdate).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {/* Measurements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Weight */}
                        <div>
                            <Label htmlFor="weight" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Weight className="h-4 w-4 text-blue-500" />
                                Weight (kg)
                            </Label>
                            <Input
                                id="weight"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 8.5"
                                {...register('weight')}
                                className="mt-1"
                            />
                            {errors.weight && (
                                <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                            )}
                        </div>

                        {/* Height/Length */}
                        <div>
                            <Label htmlFor="height" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Ruler className="h-4 w-4 text-green-500" />
                                Height/Length (cm)
                            </Label>
                            <Input
                                id="height"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 75.5"
                                {...register('height')}
                                className="mt-1"
                            />
                            {errors.height && (
                                <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                            )}
                        </div>

                        {/* Head Circumference */}
                        <div>
                            <Label htmlFor="head_circumference" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Brain className="h-4 w-4 text-purple-500" />
                                Head Circumference (cm)
                            </Label>
                            <Input
                                id="head_circumference"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 45.0"
                                {...register('head_circumference')}
                                className="mt-1"
                            />
                            {errors.head_circumference && (
                                <p className="mt-1 text-sm text-red-600">{errors.head_circumference.message}</p>
                            )}
                        </div>

                        {/* Chest Circumference */}
                        <div>
                            <Label htmlFor="chest_circumference" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Activity className="h-4 w-4 text-orange-500" />
                                Chest Circumference (cm)
                            </Label>
                            <Input
                                id="chest_circumference"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 44.0"
                                {...register('chest_circumference')}
                                className="mt-1"
                            />
                            {errors.chest_circumference && (
                                <p className="mt-1 text-sm text-red-600">{errors.chest_circumference.message}</p>
                            )}
                        </div>

                        {/* Abdominal Circumference */}
                        <div className="md:col-span-2">
                            <Label htmlFor="abdominal_circumference" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Activity className="h-4 w-4 text-pink-500" />
                                Abdominal Circumference (cm)
                            </Label>
                            <Input
                                id="abdominal_circumference"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 42.0"
                                {...register('abdominal_circumference')}
                                className="mt-1"
                            />
                            {errors.abdominal_circumference && (
                                <p className="mt-1 text-sm text-red-600">{errors.abdominal_circumference.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> At least one measurement must be provided. All measurements should be entered in metric units (kg for weight, cm for lengths/circumferences).
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Measurement
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddMeasurementModal
