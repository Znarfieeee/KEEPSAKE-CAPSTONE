import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Check, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createCheckoutSession, processMockPayment } from '@/api/parent/subscription'
import { showToast } from '@/util/alertHelper'
import { useAuth } from '@/context/auth'

const CheckoutPage = () => {
    const navigate = useNavigate()
    const { user, isAuthenticated, updateUser } = useAuth()
    const [mockSession, setMockSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            showToast('error', 'Please login to continue')
            navigate('/login?redirect=/checkout')
            return
        }

        // Redirect non-parents
        if (user?.role !== 'parent') {
            showToast('error', 'Premium plan is only available for parents')
            navigate('/pricing')
            return
        }

        // Create checkout session
        initializeCheckout()
    }, [isAuthenticated, user])

    const initializeCheckout = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await createCheckoutSession()

            if (response.status === 'success' && response.mock_payment) {
                setMockSession(response)
            } else {
                throw new Error('Failed to initialize payment')
            }
        } catch (err) {
            console.error('Checkout initialization error:', err)

            // Handle already subscribed error
            if (err.response?.status === 400) {
                showToast('info', 'You already have a Premium subscription')
                navigate('/parent')
            } else if (err.code === 'ERR_NETWORK') {
                setError('Network error. Please check your connection.')
                showToast('error', 'Network error. Please check your connection.')
            } else {
                setError('Failed to start payment. Please try again.')
                showToast('error', 'Failed to start payment. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleMockPayment = async () => {
        setProcessing(true)
        setError(null)

        try {
            const response = await processMockPayment()

            if (response.status === 'success') {
                showToast('success', 'Payment successful! Premium activated.')

                // Update user subscription in context
                if (updateUser) {
                    updateUser({
                        is_subscribed: true,
                        subscription_expires: response.subscription?.subscription_expires
                    })
                }

                // Redirect to parent dashboard with success message
                setTimeout(() => {
                    navigate('/parent', { replace: true })
                }, 1500)
            } else {
                throw new Error('Payment failed')
            }
        } catch (err) {
            console.error('Mock payment error:', err)
            setError('Payment failed. Please try again.')
            showToast('error', 'Payment failed. Please try again.')
        } finally {
            setProcessing(false)
        }
    }

    const premiumFeatures = [
        'Advanced analytics & insights',
        'Growth predictions & trends',
        'Unlimited report history',
        'Export medical records (PDF)',
        'Priority customer support',
        'Multiple children support',
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Button
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Plan Details */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Upgrade to Premium
                            </h1>
                            <p className="text-gray-600">
                                Get comprehensive health insights for your child
                            </p>
                        </div>

                        {/* Plan Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Premium Plan
                                    </h3>
                                    <p className="text-sm text-gray-500">Monthly subscription</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-primary">₱299</div>
                                    <div className="text-sm text-gray-500">/month</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    What's included:
                                </h4>
                                <ul className="space-y-2">
                                    {premiumFeatures.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Test Mode Badge */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-green-900 mb-1">
                                        Test Mode Active
                                    </h4>
                                    <p className="text-xs text-green-700">
                                        This is a simulated payment system for testing. No real money will be charged.
                                        Cancel anytime with no commitments.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment Form */}
                    <div>
                        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-200">
                            <div className="flex items-center gap-2 mb-6">
                                <CreditCard className="h-5 w-5 text-gray-700" />
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Payment Details
                                </h2>
                            </div>

                            {/* Loading State */}
                            {loading && (
                                <div className="space-y-4">
                                    <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                    <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                    <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                    <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                                    <p className="text-center text-sm text-gray-500 mt-4">
                                        Preparing payment form...
                                    </p>
                                </div>
                            )}

                            {/* Error State */}
                            {error && !loading && (
                                <div className="space-y-4">
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        <p className="font-medium">Payment Error</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                    <Button
                                        onClick={initializeCheckout}
                                        className="w-full"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            )}

                            {/* Mock Payment Form */}
                            {mockSession && !loading && !error && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                            Test Payment Mode
                                        </h3>
                                        <p className="text-xs text-blue-700">
                                            This is a simulated payment for testing. No actual payment will be processed.
                                            Click the button below to activate your Premium subscription instantly.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Amount</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                ₱{mockSession.amount}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Currency</span>
                                            <span className="text-sm text-gray-900">{mockSession.currency}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Billing Cycle</span>
                                            <span className="text-sm text-gray-900">Monthly</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleMockPayment}
                                        disabled={processing}
                                        className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing Payment...
                                            </span>
                                        ) : (
                                            `Activate Premium - ₱${mockSession.amount}/month`
                                        )}
                                    </Button>

                                    <p className="text-xs text-gray-500 text-center">
                                        By clicking above, you agree to activate Premium subscription for testing purposes.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-gray-500 text-center mt-4">
                            By completing your purchase, you agree to our Terms of Service.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage
