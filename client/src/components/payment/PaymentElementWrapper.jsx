import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'
import { showToast } from '@/util/alertHelper'

const PaymentElementWrapper = () => {
    const stripe = useStripe()
    const elements = useElements()
    const [processing, setProcessing] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const paymentElementOptions = {
        layout: {
            type: 'tabs',
            defaultCollapsed: false,
        },
        business: {
            name: 'KEEPSAKE Healthcare',
        },
        paymentMethodOrder: ['card', 'grabpay'], // GCash via GrabPay
        fields: {
            billingDetails: {
                name: 'auto',
                email: 'auto',
                phone: 'auto',
            },
        },
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!stripe || !elements) {
            // Stripe.js hasn't loaded yet
            return
        }

        setProcessing(true)
        setErrorMessage('')

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment/success`,
            },
        })

        if (error) {
            // This point will only be reached if there's an immediate error when
            // confirming the payment. Otherwise, the customer will be redirected to
            // the `return_url`.
            const errorMessages = {
                card_declined: 'Card declined. Please try another payment method.',
                insufficient_funds:
                    'Insufficient funds. Please try GCash or another card.',
                grabpay_failed: 'GCash payment failed. Please try again.',
            }

            const message =
                errorMessages[error.code] ||
                error.message ||
                'An unexpected error occurred.'

            setErrorMessage(message)
            showToast('error', message)
            setProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={paymentElementOptions} />

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={!stripe || processing}
                    className="w-full py-6 text-lg font-semibold"
                >
                    {processing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Pay ₱299/month'
                    )}
                </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
                Your payment is secured by Stripe. Cancel anytime.
            </p>
        </form>
    )
}

export default PaymentElementWrapper
