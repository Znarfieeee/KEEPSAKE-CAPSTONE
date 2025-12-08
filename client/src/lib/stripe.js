import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export const getStripe = () => {
    if (!stripePromise) {
        const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
        if (!key) {
            console.error('VITE_STRIPE_PUBLISHABLE_KEY not found in .env file')
            console.error('Please add VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... to client/.env')
            return null
        }
        stripePromise = loadStripe(key)
    }
    return stripePromise
}
