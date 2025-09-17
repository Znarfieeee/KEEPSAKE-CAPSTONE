import React, { useState, useEffect } from 'react'

// UI Components
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import LoadingButton from '@/components/ui/LoadingButton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BrushCleaning } from 'lucide-react'

// Utilities
import { showToast } from '@/util/alertHelper'
import { sanitizeObject } from '@/util/sanitize'
import { cn } from '@/util/utils'
import { format } from 'date-fns'
import TooltipHelper from '@/util/TooltipHelper'
import { updateAppointment } from '@/api/doctors/appointment'

const RescheduleAppointmentModal = ({ appointment, onSuccess, onClose }) => {
    // Form state management
    const [formData, setFormData] = useState({
        appointment_date: new Date(),
        appointment_time: '',
    })

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    // Initialize form with appointment data
    useEffect(() => {
        if (appointment) {
            setFormData({
                appointment_date: new Date(appointment.appointment_date),
                appointment_time: appointment.appointment_time || '',
            })
        }
    }, [appointment])

    /**
     * Handle input changes and clear related errors
     */
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: '',
            }))
        }
    }

    /**
     * Validate form data
     */
    const validateForm = () => {
        const newErrors = {}

        if (!formData.appointment_date) {
            newErrors.appointment_date = 'Appointment date is required'
        }

        if (!formData.appointment_time) {
            newErrors.appointment_time = 'Appointment time is required'
        } else {
            // Validate time format
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(formData.appointment_time)) {
                newErrors.appointment_time = 'Invalid time format'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    /**
     * Check if form is valid (for real-time validation)
     */
    const isFormValid = () => {
        return (
            formData.appointment_date &&
            formData.appointment_time &&
            Object.keys(errors).length === 0
        )
    }

    /**
     * Reset form to initial state
     */
    const resetForm = () => {
        if (appointment) {
            setFormData({
                appointment_date: new Date(appointment.appointment_date),
                appointment_time: appointment.appointment_time || '',
            })
        }
        setErrors({})
    }

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            showToast('error', 'Please fix the errors in the form')
            return
        }

        try {
            setLoading(true)

            // Prepare data for API
            const updateData = {
                appointment_date: formData.appointment_date.toISOString(),
                appointment_time: formData.appointment_time,
            }

            // Sanitize the data if sanitizeObject function is available
            const sanitizedData = sanitizeObject ? sanitizeObject(updateData) : updateData

            const appointmentId = appointment.appointment_id || appointment.id
            const response = await updateAppointment(appointmentId, sanitizedData)

            if (response.status === 'success' || response.success) {
                showToast('success', 'Appointment rescheduled successfully')
                resetForm()
                onSuccess?.(response)
                onClose?.()
            } else {
                throw new Error(response.message || 'Failed to reschedule appointment')
            }
        } catch (error) {
            console.error('Reschedule appointment error:', error)
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to reschedule appointment. Please try again.'
            showToast('error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (!appointment) return null

    const patientName = appointment.patient_name ||
                       appointment.patients?.firstname + ' ' + appointment.patients?.lastname ||
                       appointment.patient?.full_name ||
                       'Unknown Patient'

    return (
        <DialogContent
            className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
            showCloseButton={false}
        >
            <DialogHeader className="space-y-3">
                <h2 className="text-2xl font-semibold text-gray-900">Reschedule Appointment</h2>
                <DialogDescription>
                    Update the date and time for <strong>{patientName}</strong>'s appointment
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-4">
                    {/* Patient Info Display */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                        <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Patient:</span> {patientName}</p>
                            <p><span className="font-medium">Reason:</span> {appointment.reason || 'General Consultation'}</p>
                            {appointment.doctor_name && (
                                <p><span className="font-medium">Doctor:</span> Dr. {appointment.doctor_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Appointment Date and Time Picker */}
                    <div className="grid gap-2 p-2">
                        <Label>New Appointment Date & Time *</Label>
                        <div className="rounded-md border border-gray-200">
                            <div className="flex max-sm:flex-col">
                                <Calendar
                                    mode="single"
                                    selected={formData.appointment_date}
                                    onSelect={(date) => {
                                        if (date) {
                                            handleInputChange('appointment_date', date)
                                            // Reset time when date changes
                                            handleInputChange('appointment_time', '')
                                        }
                                    }}
                                    className={cn(
                                        'p-2 sm:pe-5',
                                        errors.appointment_date && 'border-red-500'
                                    )}
                                    // Allow any date selection
                                    disabled={[]}
                                    required
                                />
                                <div className="relative w-full max-sm:h-48 sm:w-40">
                                    <div className="absolute inset-0 py-4 max-sm:border-t">
                                        <ScrollArea className="h-full sm:border-s">
                                            <div className="space-y-3">
                                                <div className="flex h-5 shrink-0 items-center px-5">
                                                    <p className="text-sm font-medium">
                                                        {format(
                                                            formData.appointment_date,
                                                            'EEEE, d'
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                                                    {[
                                                        '06:00',
                                                        '06:30',
                                                        '07:00',
                                                        '07:30',
                                                        '08:00',
                                                        '08:30',
                                                        '09:00',
                                                        '09:30',
                                                        '10:00',
                                                        '10:30',
                                                        '11:00',
                                                        '11:30',
                                                        '12:00',
                                                        '12:30',
                                                        '13:00',
                                                        '13:30',
                                                        '14:00',
                                                        '14:30',
                                                        '15:00',
                                                        '15:30',
                                                        '16:00',
                                                        '16:30',
                                                        '17:00',
                                                        '17:30',
                                                        '18:00',
                                                        '18:30',
                                                        '19:00',
                                                        '19:30',
                                                        '20:00',
                                                        '20:30',
                                                        '21:00',
                                                        '21:30',
                                                        '22:00',
                                                        '22:30',
                                                        '23:00',
                                                        '23:30',
                                                    ].map((timeSlot) => (
                                                        <Button
                                                            key={timeSlot}
                                                            type="button"
                                                            variant={
                                                                formData.appointment_time ===
                                                                timeSlot
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            className="w-full border-gray-200"
                                                            onClick={() =>
                                                                handleInputChange(
                                                                    'appointment_time',
                                                                    timeSlot
                                                                )
                                                            }
                                                        >
                                                            {timeSlot}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {(errors.appointment_date || errors.appointment_time) && (
                            <p className="text-sm text-red-600">
                                {errors.appointment_date || errors.appointment_time}
                            </p>
                        )}
                    </div>
                </div>
            </form>

            <DialogFooter className="flex justify-between items-center sm:gap-0">
                <div>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-gray-200 bg-red-400 text-white"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                </div>
                <div className="flex gap-2">
                    <TooltipHelper content="Reset Changes">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            className="flex-1 sm:flex-none border-gray-200"
                            disabled={loading}
                            size="sm"
                        >
                            <BrushCleaning className="size-4" />
                        </Button>
                    </TooltipHelper>
                    <LoadingButton
                        type="submit"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!isFormValid() || loading}
                        isLoading={loading}
                        className="flex-1 sm:flex-none bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {loading ? 'Rescheduling...' : 'Reschedule'}
                    </LoadingButton>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}

export default RescheduleAppointmentModal