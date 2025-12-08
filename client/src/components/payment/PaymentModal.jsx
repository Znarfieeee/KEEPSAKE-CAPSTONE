import { useState, useEffect } from 'react'
import { createCheckoutSession } from '@/api/parent/subscription'
import { showToast } from '@/util/alertHelper'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog'
import { Loader2, CreditCard, Shield } from 'lucide-react'
import StripePaymentForm from './StripePaymentForm'

const PaymentModal = ({ isOpen, onClose, planType, amount }) => {
    const [loading, setLoading] = useState(true)
    const [clientSecret, setClientSecret] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (isOpen) {
            initializePayment()
        }
    }, [isOpen])

    const initializePayment = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await createCheckoutSession()

            if (response.client_secret) {
                setClientSecret(response.client_secret)
            } else {
                throw new Error('No client secret received from server')
            }
        } catch (err) {
            console.error('Payment initialization error:', err)

            if (err.response?.status === 400) {
                setError('You already have an active Premium subscription.')
                showToast('info', 'You already have a Premium subscription')
            } else if (err.code === 'ERR_NETWORK') {
                setError('Network error. Please check your internet connection.')
                showToast('error', 'Network error. Check your connection.')
            } else {
                setError('Failed to initialize payment. Please try again.')
                showToast('error', 'Failed to start payment. Try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setClientSecret(null)
        setError(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg" scrollable={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Upgrade to {planType === 'premium' ? 'Premium' : 'Basic'}
                    </DialogTitle>
                    <DialogDescription>
                        Secure payment powered by Stripe. Your card information is never stored on
                        our servers.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-gray-600">Setting up secure payment...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <p className="font-medium">Payment Error</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                            <button
                                onClick={initializePayment}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {clientSecret && !loading && !error && (
                        <div className="space-y-6">
                            {/* Plan Summary */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-900">
                                            KEEPSAKE Premium
                                        </p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Full access to all features, unlimited storage, priority
                                            support
                                        </p>
                                        <p className="text-2xl font-bold text-blue-900 mt-3">
                                            ₱{amount}
                                            <span className="text-sm font-normal">/month</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <StripePaymentForm clientSecret={clientSecret} />

                            {/* Security Notice */}
                            <div className="text-xs text-gray-500 text-center space-y-1">
                                <p className="flex items-center justify-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Payments are secured and encrypted by Stripe
                                </p>
                                <p>We never store your card information</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PaymentModal
