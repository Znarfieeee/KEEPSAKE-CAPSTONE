import React, { useState, useEffect } from 'react'
import { updateUser } from '@/api/admin/users'
import { sanitizeObject } from '@/util/sanitize'

// UI Components
import { showToast } from '@/util/alertHelper'
import { Button } from '@/components/ui/Button'
import LoadingButton from '@/components/ui/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneNumberInput } from '@/components/ui/phone-number'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X } from 'lucide-react'

const EditUserModal = ({ open, user, onClose }) => {
    const [form, setForm] = useState({
        email: '',
        firstname: '',
        lastname: '',
        specialty: '',
        role: '',
        license_number: '',
        phone_number: '',
        subscription_expires: '',
        is_subscribed: false,
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    // Map display roles back to database values (optimize by moving outside useEffect)
    const mapRoleToValue = (displayRole) => {
        if (!displayRole) return ''
        switch (displayRole) {
            case 'Admin':
                return 'admin'
            case 'Facility Admin':
                return 'facility_admin'
            case 'System Admin':
                return 'admin'
            case 'Doctor':
                return 'doctor'
            case 'Nurse':
                return 'nurse'
            case 'Staff':
                return 'staff'
            default:
                return displayRole.toLowerCase().replace(' ', '_')
        }
    }

    // Initialize form when user prop changes
    useEffect(() => {
        if (!user || !open) return

        // Simplified phone number processing
        const formatPhoneNumber = (contact) => {
            if (!contact || contact === '—') return ''
            // If already in international format, use as-is
            if (contact.startsWith('+')) return contact
            // Otherwise, just return the original for PhoneNumberInput to handle
            return contact
        }

        setForm({
            email: user.email || '',
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            specialty: user.specialty === '—' ? '' : user.specialty || '',
            role: mapRoleToValue(user.role),
            license_number: user.license_number === '—' ? '' : user.license_number || '',
            phone_number: formatPhoneNumber(user.contact),
            subscription_expires: user.sub_exp || '',
            is_subscribed: user.plan === 'Premium',
        })
        setErrors({})
    }, [user?.id, open]) // Only re-run if user ID changes or modal opens

    // Form validation
    const validateForm = () => {
        const newErrors = {}

        if (!form.firstname.trim()) {
            newErrors.firstname = 'First name is required'
        }

        if (!form.lastname.trim()) {
            newErrors.lastname = 'Last name is required'
        }

        if (!form.role) {
            newErrors.role = 'Role is required'
        }

        if (!form.specialty.trim()) {
            newErrors.specialty = 'Specialty is required'
        }

        if (form.phone_number && form.phone_number.length > 0) {
            // Basic validation for international phone numbers
            const cleanPhone = form.phone_number.replace(/[\s\-\(\)]/g, '')
            if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
                newErrors.phone_number = 'Invalid phone number format'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            showToast('error', 'Please fix the errors in the form')
            return
        }

        try {
            setLoading(true)

            const updatePayload = sanitizeObject({
                firstname: form.firstname.trim(),
                lastname: form.lastname.trim(),
                specialty: form.specialty.trim(),
                role: form.role,
                license_number: form.license_number.trim() || null,
                phone_number: form.phone_number || null,
                subscription_expires: form.subscription_expires || null,
                is_subscribed: form.is_subscribed,
            })

            const response = await updateUser(user.id, updatePayload)

            if (response.status === 'success') {
                showToast('success', 'User updated successfully')
                onClose()
            } else {
                showToast('error', response.message || 'Failed to update user')
            }
        } catch (error) {
            console.error('Update error:', error)
            showToast('error', error.message || 'Failed to update user')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setForm({
            email: '',
            firstname: '',
            lastname: '',
            specialty: '',
            role: '',
            license_number: '',
            phone_number: '',
            subscription_expires: '',
            is_subscribed: false,
        })
        setErrors({})
        onClose()
    }

    if (!open || !user) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white text-black dark:bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Edit User</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
                >
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed"
                                placeholder="user@example.com"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Email cannot be changed for security reasons
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="firstname">First Name *</Label>
                                <Input
                                    id="firstname"
                                    value={form.firstname}
                                    onChange={(e) =>
                                        setForm({ ...form, firstname: e.target.value })
                                    }
                                    placeholder="Juan"
                                    className={errors.firstname ? 'border-red-500' : ''}
                                />
                                {errors.firstname && (
                                    <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="lastname">Last Name *</Label>
                                <Input
                                    id="lastname"
                                    value={form.lastname}
                                    onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                                    placeholder="De la Cruz"
                                    className={errors.lastname ? 'border-red-500' : ''}
                                />
                                {errors.lastname && (
                                    <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <PhoneNumberInput
                                value={form.phone_number}
                                onChange={(value) =>
                                    setForm({ ...form, phone_number: value || '' })
                                }
                                placeholder="Enter phone number"
                                className={errors.phone_number ? 'border-red-500' : ''}
                            />
                            {errors.phone_number && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>
                            )}
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={form.role}
                                onValueChange={(value) => setForm({ ...form, role: value })}
                            >
                                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="nurse">Nurse</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="facility_admin">Facility Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="specialty">Specialty *</Label>
                            <Input
                                id="specialty"
                                value={form.specialty}
                                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                                placeholder="e.g., Pediatrician"
                                className={errors.specialty ? 'border-red-500' : ''}
                            />
                            {errors.specialty && (
                                <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="license_number">License Number</Label>
                            <Input
                                id="license_number"
                                value={form.license_number}
                                onChange={(e) =>
                                    setForm({ ...form, license_number: e.target.value })
                                }
                                placeholder="Professional license number"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Required for medical professionals
                            </p>
                        </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="is_subscribed">Premium Subscription</Label>
                                <p className="text-xs text-muted-foreground">
                                    Enable premium features for this user
                                </p>
                            </div>
                            <Switch
                                id="is_subscribed"
                                checked={form.is_subscribed}
                                onCheckedChange={(checked) =>
                                    setForm({ ...form, is_subscribed: checked })
                                }
                            />
                        </div>

                        {form.is_subscribed && (
                            <div>
                                <Label htmlFor="subscription_expires">Subscription Expires</Label>
                                <Input
                                    type="date"
                                    id="subscription_expires"
                                    value={form.subscription_expires}
                                    onChange={(e) =>
                                        setForm({ ...form, subscription_expires: e.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave empty for no expiration
                                </p>
                            </div>
                        )}
                    </div>
                </form>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        type="submit"
                        onClick={handleSubmit}
                        isLoading={loading}
                        disabled={loading}
                        className="bg-primary text-white hover:bg-primary/90"
                    >
                        Update User
                    </LoadingButton>
                </div>
            </div>
        </div>
    )
}

export default EditUserModal
