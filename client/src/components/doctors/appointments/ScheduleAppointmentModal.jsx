import React, { useState } from 'react'
import { scheduleAppointment } from '@/api/doctors/appointment'

// UI Components
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import LoadingButton from '@/components/ui/LoadingButton'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BrushCleaning } from 'lucide-react'

// Utilities
import { showToast } from '@/util/alertHelper'
import { sanitizeObject } from '@/util/sanitize'
import { cn } from '@/util/utils'
import { format } from 'date-fns'
import TooltipHelper from '@/util/TooltipHelper'

/**
 * ScheduleAppointmentModal Component
 * Modal for scheduling new appointments with form validation and submission
 */
const ScheduleAppointmentModal = ({ onSuccess }) => {
    // Form state management
    const [formData, setFormData] = useState({
        patientName: '',
        appointmentDate: new Date(),
        appointmentTime: '',
        reason: '',
        notes: '',
    })

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

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

        // Required field validations
        if (!formData.patientName.trim()) {
            newErrors.patientName = 'Patient name is required'
        }

        if (!formData.appointmentDate) {
            newErrors.appointmentDate = 'Appointment date is required'
        } else {
            // Check if appointment date is in the past
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const selectedDate = new Date(formData.appointmentDate)
            selectedDate.setHours(0, 0, 0, 0)

            if (selectedDate < today) {
                newErrors.appointmentDate = 'Appointment date cannot be in the past'
            }
        }

        if (!formData.appointmentTime) {
            newErrors.appointmentTime = 'Appointment time is required'
        } else {
            // Validate time format and business hours
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(formData.appointmentTime)) {
                newErrors.appointmentTime = 'Invalid time format'
            } else {
                const [hours] = formData.appointmentTime.split(':').map(Number)
                if (hours < 8 || hours > 18) {
                    newErrors.appointmentTime = 'Please select a time between 8:00 AM and 6:00 PM'
                }
            }
        }

        if (!formData.reason.trim()) {
            newErrors.reason = 'Reason for visit is required'
        } else if (formData.reason.trim().length < 3) {
            newErrors.reason = 'Reason must be at least 3 characters long'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    /**
     * Check if form is valid (for real-time validation)
     */
    const isFormValid = () => {
        return (
            formData.patientName.trim() &&
            formData.appointmentDate &&
            formData.appointmentTime &&
            formData.reason.trim() &&
            Object.keys(errors).length === 0
        )
    }

    /**
     * Reset form to initial state
     */
    const resetForm = () => {
        setFormData({
            patientName: '',
            appointmentDate: new Date(),
            appointmentTime: '',
            reason: '',
            notes: '',
        })
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
            const submitData = {
                ...formData,
                patientName: formData.patientName.trim(),
                reason: formData.reason.trim(),
                notes: formData.notes.trim(),
                appointmentDate: formData.appointmentDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            }

            // Sanitize the data if sanitizeObject function is available
            const sanitizedData = sanitizeObject ? sanitizeObject(submitData) : submitData

            const response = await scheduleAppointment(sanitizedData)

            if (response.status === 'success' || response.success) {
                showToast('success', 'Appointment scheduled successfully')
                resetForm()
                onSuccess?.()
            } else {
                throw new Error(response.message || 'Failed to schedule appointment')
            }
        } catch (error) {
            console.error('Schedule appointment error:', error)
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to schedule appointment. Please try again.'
            showToast('error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DialogContent
            className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
            showCloseButton={false}
        >
            <DialogHeader className="space-y-3">
                <h2 className="text-2xl font-semibold text-gray-900">Schedule an appointment</h2>
                <DialogDescription>
                    Fill up all required fields marked with an asterisk (*)
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-4">
                    {/* Patient Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="patientName">Patient Name *</Label>
                        <Input
                            id="patientName"
                            placeholder="Enter patient's full name"
                            value={formData.patientName}
                            onChange={(e) => handleInputChange('patientName', e.target.value)}
                            className={cn(errors.patientName && 'border-red-500')}
                            required
                        />
                        {errors.patientName && (
                            <p className="text-sm text-red-600">{errors.patientName}</p>
                        )}
                    </div>

                    {/* Appointment Date and Time Picker */}
                    <div className="grid gap-2 p-2">
                        <Label>Appointment Date & Time *</Label>
                        <div className="rounded-md border border-gray-200">
                            <div className="flex max-sm:flex-col">
                                <Calendar
                                    mode="single"
                                    selected={formData.appointmentDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            handleInputChange('appointmentDate', date)
                                            // Reset time when date changes
                                            handleInputChange('appointmentTime', '')
                                        }
                                    }}
                                    className={cn(
                                        'p-2 sm:pe-5',
                                        errors.appointmentDate && 'border-red-500'
                                    )}
                                    disabled={[
                                        {
                                            before: new Date(),
                                        },
                                    ]}
                                    required
                                />
                                <div className="relative w-full max-sm:h-48 sm:w-40">
                                    <div className="absolute inset-0 py-4 max-sm:border-t">
                                        <ScrollArea className="h-full sm:border-s">
                                            <div className="space-y-3">
                                                <div className="flex h-5 shrink-0 items-center px-5">
                                                    <p className="text-sm font-medium">
                                                        {format(
                                                            formData.appointmentDate,
                                                            'EEEE, d'
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                                                    {[
                                                        '09:00',
                                                        '09:30',
                                                        '10:00',
                                                        '10:30',
                                                        '11:00',
                                                        '11:30',
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
                                                    ].map((timeSlot) => (
                                                        <Button
                                                            key={timeSlot}
                                                            variant={
                                                                formData.appointmentTime ===
                                                                timeSlot
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            className="w-full border-gray-200"
                                                            onClick={() =>
                                                                handleInputChange(
                                                                    'appointmentTime',
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
                        {(errors.appointmentDate || errors.appointmentTime) && (
                            <p className="text-sm text-red-600">
                                {errors.appointmentDate || errors.appointmentTime}
                            </p>
                        )}
                    </div>

                    {/* Reason for Visit */}
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason for Visit *</Label>
                        <Input
                            id="reason"
                            placeholder="Brief description of the visit"
                            value={formData.reason}
                            onChange={(e) => handleInputChange('reason', e.target.value)}
                            className={cn(errors.reason && 'border-red-500')}
                            maxLength={100}
                            required
                        />
                        {errors.reason && <p className="text-sm text-red-600">{errors.reason}</p>}
                        <p className="text-xs text-gray-500">
                            {formData.reason.length}/100 characters
                        </p>
                    </div>

                    {/* Additional Notes */}
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional information..."
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            className="h-20"
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500">
                            {formData.notes.length}/500 characters
                        </p>
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
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                </div>
                <div className="flex gap-2">
                    <TooltipHelper content="Clear Form">
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
                        {loading ? 'Scheduling...' : 'Schedule Appointment'}
                    </LoadingButton>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}

export default ScheduleAppointmentModal
