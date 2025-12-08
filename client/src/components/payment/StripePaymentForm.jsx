import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import PaymentElementWrapper from './PaymentElementWrapper'

const StripePaymentForm = ({ clientSecret }) => {
    const stripePromise = getStripe()

    if (!stripePromise) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Configuration Error</p>
                <p className="text-sm mt-1">
                    Stripe is not properly configured. Please contact support.
                </p>
            </div>
        )
    }

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#2563eb', // KEEPSAKE blue
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
            spacingUnit: '4px',
        },
        rules: {
            '.Label': {
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
            },
            '.Input': {
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #e5e7eb',
            },
            '.Input:focus': {
                border: '1px solid #2563eb',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            },
            '.Tab': {
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
            },
            '.Tab--selected': {
                borderColor: '#2563eb',
                boxShadow: '0 0 0 1px #2563eb',
            },
        },
    }

    const options = {
        clientSecret,
        appearance,
        loader: 'auto',
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentElementWrapper />
        </Elements>
    )
}

export default StripePaymentForm
