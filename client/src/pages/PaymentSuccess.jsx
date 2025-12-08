import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { getMySubscription } from '@/api/parent/subscription'
import confetti from 'canvas-confetti'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PaymentSuccess = () => {
    const navigate = useNavigate()
    const { updateUser } = useAuth()
    const [loading, setLoading] = useState(true)
    const [verificationError, setVerificationError] = useState(null)
    const [countdown, setCountdown] = useState(3)

    useEffect(() => {
        verifyPaymentAndUpdateSubscription()
    }, [])

    useEffect(() => {
        if (!loading && !verificationError && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => prev - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else if (!loading && !verificationError && countdown === 0) {
            navigate('/parent')
        }
    }, [countdown, loading, verificationError, navigate])

    const verifyPaymentAndUpdateSubscription = async () => {
        try {
            setLoading(true)

            // Trigger confetti immediately
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
            })

            // Small delay to let Stripe webhook process
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Fetch updated subscription
            const response = await getMySubscription()

            if (response.data) {
                // Update user context with new subscription
                updateUser({ subscription: response.data })
            }

            // More confetti!
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
                })
            }, 500)
        } catch (error) {
            console.error('Error verifying payment:', error)
            setVerificationError(
                'Payment successful, but we could not verify your subscription. Please refresh the page.'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleGoToDashboard = () => {
        navigate('/parent')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
                {loading ? (
                    <div className="text-center space-y-4">
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                        <h2 className="text-2xl font-bold text-gray-900">
                            Verifying Your Payment...
                        </h2>
                        <p className="text-gray-600">Please wait while we confirm your upgrade</p>
                    </div>
                ) : verificationError ? (
                    <div className="text-center space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 text-sm">{verificationError}</p>
                        </div>
                        <Button
                            onClick={handleGoToDashboard}
                            className="w-full"
                            variant="default"
                        >
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Payment Successful!
                            </h1>
                            <p className="text-lg text-gray-600">
                                Welcome to KEEPSAKE Premium
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                            <p className="text-green-800 font-medium">
                                Your subscription is now active
                            </p>
                            <p className="text-green-700 text-sm">
                                You now have access to all premium features!
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-gray-600 text-sm">
                                Redirecting to your dashboard in{' '}
                                <span className="font-bold text-primary">{countdown}</span>{' '}
                                seconds...
                            </p>

                            <Button
                                onClick={handleGoToDashboard}
                                className="w-full"
                                variant="default"
                            >
                                Go to Dashboard Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                A receipt has been sent to your email address
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PaymentSuccess
