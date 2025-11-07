import { useState } from 'react'
import { changePassword } from '../../api/settings'
import { showToast } from '../../util/alertHelper'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'

const PasswordSettings = () => {
    const [loading, setLoading] = useState(false)
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    })

    // Password strength validation
    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        }
        return checks
    }

    const passwordChecks = validatePassword(passwords.new_password)
    const isPasswordValid = Object.values(passwordChecks).every((check) => check)

    const handleChange = (e) => {
        const { name, value } = e.target
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!passwords.current_password || !passwords.new_password || !passwords.confirm_password) {
            showToast('error', 'All fields are required')
            return
        }

        if (passwords.new_password !== passwords.confirm_password) {
            showToast('error', 'New passwords do not match')
            return
        }

        if (!isPasswordValid) {
            showToast('error', 'Password does not meet security requirements')
            return
        }

        try {
            setLoading(true)
            const response = await changePassword(passwords)

            if (response.status === 'success') {
                showToast('success', 'Password changed successfully')
                setPasswords({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                })
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    const PasswordCheck = ({ check, label }) => (
        <div className="flex items-center gap-2 text-sm">
            {check ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-gray-300" />
            )}
            <span className={check ? 'text-green-700' : 'text-gray-500'}>{label}</span>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Current Password */}
            <div className="space-y-2">
                <Label htmlFor="current_password">
                    Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                    <Input
                        id="current_password"
                        name="current_password"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current_password}
                        onChange={handleChange}
                        placeholder="Enter your current password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex="-1"
                    >
                        {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
                <Label htmlFor="new_password">
                    New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                    <Input
                        id="new_password"
                        name="new_password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new_password}
                        onChange={handleChange}
                        placeholder="Enter your new password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex="-1"
                    >
                        {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {/* Password Requirements */}
                {passwords.new_password && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Password Requirements:
                        </p>
                        <PasswordCheck
                            check={passwordChecks.length}
                            label="At least 8 characters"
                        />
                        <PasswordCheck
                            check={passwordChecks.uppercase}
                            label="One uppercase letter"
                        />
                        <PasswordCheck
                            check={passwordChecks.lowercase}
                            label="One lowercase letter"
                        />
                        <PasswordCheck check={passwordChecks.number} label="One number" />
                        <PasswordCheck
                            check={passwordChecks.special}
                            label="One special character"
                        />
                    </div>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirm_password">
                    Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                    <Input
                        id="confirm_password"
                        name="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm_password}
                        onChange={handleChange}
                        placeholder="Confirm your new password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex="-1"
                    >
                        {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {passwords.confirm_password &&
                    passwords.new_password !== passwords.confirm_password && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Passwords do not match
                        </p>
                    )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
                <Button
                    type="submit"
                    disabled={loading || !isPasswordValid}
                    className="min-w-[140px]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                        </>
                    ) : (
                        'Change Password'
                    )}
                </Button>
            </div>
        </form>
    )
}

export default PasswordSettings
