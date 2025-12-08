import { useState, useEffect } from 'react'
import { useAuth } from '../../context/auth'
import { updatePhone } from '../../api/settings'
import { showToast } from '../../util/alertHelper'
import { Input } from '../ui/Input'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/Dialog'

const PhoneSettings = () => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [currentPhone, setCurrentPhone] = useState(user?.phone_number || 'Not set')
    const [newPhone, setNewPhone] = useState('')
    const [password, setPassword] = useState('')

    // Update current phone when user context changes
    useEffect(() => {
        if (user) {
            setCurrentPhone(user.phone_number || 'Not set')
        }
    }, [user])

    const handleOpenDialog = () => {
        // Validation
        if (!newPhone || !password) {
            showToast('error', 'All fields are required')
            return
        }

        setShowConfirmDialog(true)
    }

    const handleConfirmUpdate = async () => {
        try {
            setLoading(true)
            const response = await updatePhone({
                phone_number: newPhone,
                password: password,
            })

            if (response.status === 'success') {
                showToast('success', 'Phone number updated successfully')

                // Update AuthContext with the returned user data
                if (response.user) {
                    updateUser(response.user)
                }

                setCurrentPhone(newPhone)
                setNewPhone('')
                setPassword('')
                setShowConfirmDialog(false)
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to update phone number')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Phone Number Usage</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Your phone number is used for account recovery and important
                            notifications. Enter your number in international format (e.g.,
                            +1234567890).
                        </p>
                    </div>
                </div>
            </div>

            {/* Update Phone Form */}
            <div className="space-y-6">
                {/* Current Phone (Read-only) */}
                <div className="space-y-2">
                    <Label htmlFor="current_phone">Current Phone Number</Label>
                    <Input
                        id="current_phone"
                        value={currentPhone}
                        readOnly
                        className="bg-gray-50"
                    />
                </div>

                {/* New Phone Number */}
                <div className="space-y-2">
                    <Label htmlFor="new_phone">
                        New Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="new_phone"
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+1234567890"
                    />
                    <p className="text-sm text-gray-500">
                        Include country code (e.g., +1 for US, +63 for Philippines)
                    </p>
                </div>

                {/* Password Confirmation */}
                <div className="space-y-2">
                    <Label htmlFor="password">
                        Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your current password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        For security, please enter your password to confirm this change
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t">
                    <Button
                        onClick={handleOpenDialog}
                        disabled={loading || !newPhone || !password}
                        className="min-w-[160px]"
                    >
                        Update Phone Number
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="w-xl">
                    <DialogHeader>
                        <DialogTitle>Confirm Phone Number Change</DialogTitle>
                        <DialogDescription className="space-y-3 pt-4">
                            <p className="font-semibold text-gray-900">
                                Are you sure you want to change your phone number?
                            </p>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Current:</span>
                                    <span className="font-medium text-gray-900">
                                        {currentPhone}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">New:</span>
                                    <span className="font-medium text-blue-600">{newPhone}</span>
                                </div>
                            </div>
                            <p className="text-gray-700">
                                This phone number will be used for account recovery and
                                notifications.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 justify-between mt-12">
                        <Button
                            onClick={() => setShowConfirmDialog(false)}
                            variant="destructive"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmUpdate} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Confirm Change'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PhoneSettings
