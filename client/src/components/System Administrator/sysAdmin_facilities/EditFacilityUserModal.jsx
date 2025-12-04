import React, { useState, memo, useCallback, useEffect } from 'react'

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AlertCircle, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Helper
import { showToast } from '@/util/alertHelper'
import { displayRoles } from '@/util/roleHelper'

const EditFacilityUserModal = memo(({ open, user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        specialty: '',
        license_number: '',
        phone_number: '',
        role: '',
        department: '',
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (user) {
            setFormData({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                specialty: user.specialty || '',
                license_number: user.license_number || '',
                phone_number: user.phone_number || '',
                role: user.role || '',
                department: user.department || '',
            })
            setErrors({})
        }
    }, [user])

    const sanitizeInput = (val) => {
        if (typeof val !== 'string') return val
        return val.trim().replace(/[<>"'&]/g, (match) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;',
            }
            return entities[match] || match
        })
    }

    const validatePhone = (phone) => {
        if (!phone || phone === '') return true
        const phoneRegex = /^[\d\s\-+()]+$/
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
    }

    const handleChange = useCallback(
        (field, value) => {
            const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value
            setFormData((prev) => ({ ...prev, [field]: sanitizedValue }))

            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: null }))
            }
        },
        [errors]
    )

    const validateForm = useCallback(() => {
        const newErrors = {}

        if (!formData.firstname.trim()) {
            newErrors.firstname = 'First name is required'
        } else if (formData.firstname.length < 2) {
            newErrors.firstname = 'First name must be at least 2 characters'
        }

        if (!formData.lastname.trim()) {
            newErrors.lastname = 'Last name is required'
        } else if (formData.lastname.length < 2) {
            newErrors.lastname = 'Last name must be at least 2 characters'
        }

        if (formData.phone_number && !validatePhone(formData.phone_number)) {
            newErrors.phone_number = 'Please enter a valid phone number (minimum 10 digits)'
        }

        if (!formData.role) {
            newErrors.role = 'Role is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault()

            if (!validateForm()) return

            setIsLoading(true)

            try {
                const updatedData = {
                    firstname: formData.firstname,
                    lastname: formData.lastname,
                    specialty: formData.specialty || null,
                    license_number: formData.license_number || null,
                    phone_number: formData.phone_number || null,
                    role: formData.role,
                    department: formData.department || null,
                }

                await onSave(user.facility_id, user.user_id, updatedData)
                onClose()
            } catch (error) {
                showToast('error', 'Failed to update user. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [formData, user, onSave, onClose, validateForm]
    )

    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'
    }

    if (!open || !user) return null

    const roleOptions = [
        { value: 'doctor', label: 'Doctor' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'admin', label: 'Admin' },
        { value: 'staff', label: 'Staff' },
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-xl w-full min-h-[600px]"
                scrollable={true}
                showCloseButton={false}
            >
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 mb-4 border-b border-b-gray-400 bg-white">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                                Edit User Assignment
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                {user.firstname} {user.lastname}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(user.is_active)}>
                        {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-8 mt-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-b-gray-200">
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="firstname" className="text-sm font-medium">
                                        First Name *
                                    </Label>
                                    <Input
                                        id="firstname"
                                        value={formData.firstname}
                                        onChange={(e) => handleChange('firstname', e.target.value)}
                                        className={
                                            errors.firstname
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                : ''
                                        }
                                        placeholder="Enter first name"
                                        maxLength={50}
                                        required
                                    />
                                    {errors.firstname && (
                                        <div className="flex items-center space-x-1 text-xs text-red-600">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.firstname}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="lastname" className="text-sm font-medium">
                                        Last Name *
                                    </Label>
                                    <Input
                                        id="lastname"
                                        value={formData.lastname}
                                        onChange={(e) => handleChange('lastname', e.target.value)}
                                        className={
                                            errors.lastname
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                : ''
                                        }
                                        placeholder="Enter last name"
                                        maxLength={50}
                                        required
                                    />
                                    {errors.lastname && (
                                        <div className="flex items-center space-x-1 text-xs text-red-600">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.lastname}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="phone_number" className="text-sm font-medium">
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone_number"
                                    value={formData.phone_number}
                                    onChange={(e) => handleChange('phone_number', e.target.value)}
                                    className={
                                        errors.phone_number
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="(555) 123-4567"
                                />
                                {errors.phone_number && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.phone_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-b-gray-200">
                                Professional Information
                            </h3>

                            <div className="space-y-1">
                                <Label htmlFor="role" className="text-sm font-medium">
                                    Role *
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleChange('role', value)}
                                >
                                    <SelectTrigger
                                        className={
                                            errors.role
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.role}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="department" className="text-sm font-medium">
                                    Department
                                </Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => handleChange('department', e.target.value)}
                                    placeholder="e.g., Pediatrics, Emergency, etc."
                                    maxLength={100}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="specialty" className="text-sm font-medium">
                                    Specialty
                                </Label>
                                <Input
                                    id="specialty"
                                    value={formData.specialty}
                                    onChange={(e) => handleChange('specialty', e.target.value)}
                                    placeholder="e.g., Cardiology, Surgery, etc."
                                    maxLength={100}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="license_number" className="text-sm font-medium">
                                    License Number
                                </Label>
                                <Input
                                    id="license_number"
                                    value={formData.license_number}
                                    onChange={(e) =>
                                        handleChange('license_number', e.target.value)
                                    }
                                    placeholder="Enter professional license number"
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        {/* Facility Assignment Info (Read-only) */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-b-gray-200">
                                Facility Assignment
                            </h3>
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Facility</p>
                                        <p className="text-sm font-medium">{user.facility_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Start Date</p>
                                        <p className="text-sm font-medium">
                                            {user.start_date
                                                ? new Date(user.start_date).toLocaleDateString()
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <p className="text-sm font-medium">
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/80"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
})

export default EditFacilityUserModal
