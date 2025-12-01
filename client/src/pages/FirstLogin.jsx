import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { changePassword } from '@/api/settings'
import { completeFirstLogin } from '@/api/settings'
import { showToast } from '@/util/alertHelper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LoadingButton from '@/components/ui/LoadingButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, CheckCircle2, XCircle, Lock, Shield, KeyRound, Info } from 'lucide-react'

const FirstLogin = () => {
    const navigate = useNavigate()
    const { user, checkExistingSession } = useAuth()
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

            // Step 1: Change password
            const changePasswordResponse = await changePassword(passwords)

            if (changePasswordResponse.status === 'success') {
                showToast('success', 'Password changed successfully')

                // Step 2: Complete first login (update last_signed_in_at)
                const completeResponse = await completeFirstLogin()

                if (completeResponse.status === 'success') {
                    showToast('success', 'Welcome! Setup complete. Redirecting to dashboard...')

                    // Step 3: Refresh user session to update is_first_login flag
                    await checkExistingSession()

                    // Determine redirect path based on user role
                    let redirectPath = '/'
                    const role = user?.role

                    switch (role) {
                        case 'admin':
                            redirectPath = '/admin'
                            break
                        case 'doctor':
                            redirectPath = '/pediapro'
                            break
                        case 'parent':
                            redirectPath = '/parent'
                            break
                        case 'nurse':
                        case 'vital_custodian':
                            redirectPath = '/nurse'
                            break
                        case 'facility_admin':
                            redirectPath = '/facility_admin'
                            break
                        default:
                            redirectPath = '/'
                    }

                    // Small delay to let user see the success toast
                    setTimeout(() => {
                        navigate(redirectPath, { replace: true })
                    }, 1500)
                } else {
                    showToast('warning', 'Password changed, but there was an issue completing setup')
                }
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    const PasswordCheck = ({ check, label }) => (
        <div className="flex items-center gap-2.5 text-sm">
            {check ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            )}
            <span className={check ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                {label}
            </span>
        </div>
    )

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl border-border">
                <CardHeader className="bg-primary text-primary-foreground rounded-t-lg space-y-3 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-foreground/10 rounded-lg">
                            <Shield className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-2xl font-semibold">First Login - Change Password</CardTitle>
                    </div>
                    <p className="text-primary-foreground/90 text-sm leading-relaxed">
                        For security purposes, you must change your initial password before accessing the system.
                        This ensures your account remains secure and protected.
                    </p>
                </CardHeader>

                <CardContent className="pt-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label htmlFor="current_password" className="text-foreground font-medium">
                                Current Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    name="current_password"
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwords.current_password}
                                    onChange={handleChange}
                                    placeholder="Enter your current password"
                                    className="pr-10 border-input focus:ring-primary focus:border-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                            <Label htmlFor="new_password" className="text-foreground font-medium">
                                New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    name="new_password"
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwords.new_password}
                                    onChange={handleChange}
                                    placeholder="Enter your new password"
                                    className="pr-10 border-input focus:ring-primary focus:border-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                                <div className="mt-4 p-4 bg-secondary/30 rounded-lg space-y-2.5 border border-secondary">
                                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-primary" />
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
                                    <PasswordCheck
                                        check={passwordChecks.number}
                                        label="One number"
                                    />
                                    <PasswordCheck
                                        check={passwordChecks.special}
                                        label="One special character (!@#$%^&*...)"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password" className="text-foreground font-medium">
                                Confirm New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwords.confirm_password}
                                    onChange={handleChange}
                                    placeholder="Confirm your new password"
                                    className="pr-10 border-input focus:ring-primary focus:border-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                                    <p className="text-sm text-destructive flex items-center gap-1.5 mt-2 font-medium">
                                        <XCircle className="h-4 w-4" />
                                        Passwords do not match
                                    </p>
                                )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-border">
                            <LoadingButton
                                type="submit"
                                isLoading={loading}
                                disabled={loading || !isPasswordValid}
                                className="min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
                            >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Change Password
                            </LoadingButton>
                        </div>

                        {/* Info Box */}
                        <div className="mt-4 p-4 bg-accent/20 border border-accent rounded-lg">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">Why this step?</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        For security purposes, you must change your initial password before accessing the system.
                                        Your password is unique to you and should never be shared with anyone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default FirstLogin
