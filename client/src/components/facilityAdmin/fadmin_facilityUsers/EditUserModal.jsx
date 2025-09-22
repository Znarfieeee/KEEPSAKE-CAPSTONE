import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import LoadingButton from '@/components/ui/LoadingButton'
import { showToast } from '@/util/alertHelper'
import { AlertTriangle, Info } from 'lucide-react'

// Validation schema for editing
const editUserSchema = z.object({
    firstname: z.string().min(2, 'First name must be at least 2 characters'),
    lastname: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    department: z.string().optional(),
    license_number: z.string().optional(),
    specialty: z.string().optional(),
    notes: z.string().optional(),
})

const EditUserModal = ({ open, user, onSubmit, onClose, loading = false, error = null }) => {
    const [selectedDepartment, setSelectedDepartment] = useState('')
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            firstname: '',
            lastname: '',
            email: '',
            phone_number: '',
            department: 'none',
            license_number: '',
            specialty: '',
        },
    })

    // Populate form when user changes
    useEffect(() => {
        if (user) {
            reset({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                department: user.department || '',
                license_number: user.license_number || '',
                specialty: user.specialty || '',
                notes: user.notes || '',
            })
            setSelectedDepartment(user.department || 'none')
        }
    }, [user, reset])

    const handleClose = () => {
        reset()
        setSelectedDepartment('none')
        onClose()
    }

    const onFormSubmit = async (data) => {
        try {
            setIsSubmittingForm(true)

            // Transform form data to match API expectations
            const payload = {
                firstname: data.firstname,
                lastname: data.lastname,
                email: data.email,
                phone_number: data.phone_number,
                department: data.department === 'none' ? null : data.department,
                specialty: data.specialty,
                license_number: data.license_number,
                notes: data.notes,
            }

            const result = await onSubmit(payload)

            if (result?.success) {
                showToast('success', 'User information updated successfully')
                handleClose()
            }
            return result
        } catch (error) {
            showToast('error', error.message || 'Failed to update user information')
            throw error
        } finally {
            setIsSubmittingForm(false)
        }
    }

    const requiresLicense = ['doctor', 'nurse'].includes(user?.role)
    const userRole = user?.role || ''

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information for {user?.full_name || 'this user'}. Changes will
                        be saved immediately.
                    </DialogDescription>
                </DialogHeader>

                {/* Important Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        Note: User role cannot be changed after account creation. Contact system
                        administrator if role change is needed.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstname">First Name *</Label>
                                <Input
                                    id="firstname"
                                    {...register('firstname')}
                                    placeholder="Enter first name"
                                />
                                {errors.firstname && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.firstname.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="lastname">Last Name *</Label>
                                <Input
                                    id="lastname"
                                    {...register('lastname')}
                                    placeholder="Enter last name"
                                />
                                {errors.lastname && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.lastname.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="user@example.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="phone_number">Phone Number</Label>
                                <Input
                                    id="phone_number"
                                    {...register('phone_number')}
                                    placeholder="09123456789"
                                />
                                {errors.phone_number && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.phone_number.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Professional Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={selectedDepartment}
                                    onValueChange={(value) => {
                                        setSelectedDepartment(value)
                                        setValue('department', value, { shouldDirty: true })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None">No department</SelectItem>
                                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                                        <SelectItem value="Emergency">Emergency</SelectItem>
                                        <SelectItem value="Surgery">Surgery</SelectItem>
                                        <SelectItem value="Administration">
                                            Administration
                                        </SelectItem>
                                        <SelectItem value="Radiology">Radiology</SelectItem>
                                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                                        <SelectItem value="Nursing">Nursing</SelectItem>
                                        <SelectItem value="IT">IT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {requiresLicense && (
                                <div>
                                    <Label htmlFor="license_number">
                                        License Number {userRole === 'doctor' ? '*' : ''}
                                    </Label>
                                    <Input
                                        id="license_number"
                                        {...register('license_number')}
                                        placeholder="Enter license number"
                                    />
                                    {errors.license_number && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.license_number.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {userRole === 'doctor' && (
                                <div className="md:col-span-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input
                                        id="specialization"
                                        {...register('specialization')}
                                        placeholder="e.g., Pediatric Cardiology, Internal Medicine"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Role Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Current Role</h4>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium capitalize">
                                {userRole?.replace('_', ' ') || 'Unknown'}
                            </span>
                            {userRole && (
                                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                                    Cannot be changed
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading || isSubmittingForm}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            type="submit"
                            loading={loading || isSubmittingForm}
                            disabled={loading || isSubmittingForm || !isDirty}
                        >
                            {isDirty ? 'Save Changes' : 'No Changes'}
                        </LoadingButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditUserModal
