import { useState } from 'react'
import { useAuth } from '../../context/auth'
import { deactivateAccount } from '../../api/settings'
import { showToast } from '../../util/alertHelper'
import { Input } from '../ui/Input'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Loader2, AlertTriangle, XCircle, Eye, EyeOff } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/Dialog'

const AccountDeactivation = () => {
    const { signOut } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')

    const handleOpenDialog = () => {
        if (!password) {
            showToast('error', 'Please enter your password')
            return
        }
        if (confirmation !== 'DEACTIVATE') {
            showToast('error', 'Please type DEACTIVATE to confirm')
            return
        }
        setShowConfirmDialog(true)
    }

    const handleDeactivate = async () => {
        try {
            setLoading(true)
            const response = await deactivateAccount(password, confirmation)

            if (response.status === 'success') {
                showToast('success', 'Account deactivated successfully')
                setShowConfirmDialog(false)

                // Sign out user after deactivation
                setTimeout(() => {
                    signOut()
                }, 2000)
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to deactivate account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Warning Alert */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Danger Zone</p>
                        <p className="text-sm text-red-700 mt-1">
                            Deactivating your account is a serious action. Please read the following
                            carefully before proceeding:
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-red-700 list-disc list-inside">
                            <li>You will immediately lose access to your account</li>
                            <li>Your data will be retained but marked as inactive</li>
                            <li>You will need to contact an administrator to reactivate</li>
                            <li>All active sessions will be terminated</li>
                            <li>This action cannot be undone without admin assistance</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Deactivation Form */}
            <div className="space-y-6">
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
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        For security, please enter your password to confirm
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmation">
                        Type "DEACTIVATE" to confirm <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="confirmation"
                        type="text"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="Type DEACTIVATE in capital letters"
                    />
                    <p className="text-sm text-gray-500">
                        This helps prevent accidental deactivation
                    </p>
                </div>

                {/* Deactivate Button */}
                <div className="flex justify-end pt-6 border-t">
                    <Button
                        onClick={handleOpenDialog}
                        disabled={loading || !password || confirmation !== 'DEACTIVATE'}
                        variant="destructive"
                        className="min-w-[160px]"
                    >
                        Deactivate Account
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="w-xl" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl text-red-600 justify-center">
                            Final Confirmation
                        </DialogTitle>
                        <DialogDescription className="space-y-2 pt-10 flex flex-col justify-center items-center">
                            <span className="font-semibold text-gray-900 text-center">
                                Are you absolutely sure you want to deactivate your account?
                            </span>
                            <span className="text-gray-700">
                                This action will immediately log you out and prevent you from
                                accessing the system until an administrator reactivates your
                                account.
                            </span>
                            <span className="text-gray-700 font-medium">
                                This action is irreversible without administrator intervention.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-8 flex justify-between items-center">
                        <Button
                            onClick={() => setShowConfirmDialog(false)}
                            variant="outline"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDeactivate} disabled={loading} variant="destructive">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deactivating...
                                </>
                            ) : (
                                'Yes, Deactivate My Account'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AccountDeactivation
