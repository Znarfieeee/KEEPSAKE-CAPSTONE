/**
 * Parent Subscription API Client
 * Handles parent subscription management, checkout, and payment history
 */

import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get current user's subscription information
 * @returns {Promise<Object>} Subscription data
 */
export const getMySubscription = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/parent/subscription`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching subscription:', error)
        throw error
    }
}

/**
 * Create Stripe checkout session for Premium subscription
 * @returns {Promise<Object>} Checkout session data with URL
 */
export const createCheckoutSession = async () => {
    try {
        const response = await axios.post(
            `${backendConnection()}/parent/subscription/checkout`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error creating checkout session:', error)
        throw error
    }
}

/**
 * Process mock payment for testing (bypasses Stripe)
 * @returns {Promise<Object>} Payment result with subscription data
 */
export const processMockPayment = async () => {
    try {
        const response = await axios.post(
            `${backendConnection()}/parent/subscription/mock-payment`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error processing mock payment:', error)
        throw error
    }
}

/**
 * Cancel Premium subscription (remains active until period end)
 * @returns {Promise<Object>} Cancellation confirmation
 */
export const cancelSubscription = async () => {
    try {
        const response = await axios.post(
            `${backendConnection()}/parent/subscription/cancel`,
            {},
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error cancelling subscription:', error)
        throw error
    }
}

/**
 * Get user's payment transaction history
 * @returns {Promise<Object>} Payment history array
 */
export const getPaymentHistory = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/parent/subscription/payment-history`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching payment history:', error)
        throw error
    }
}

export default {
    getMySubscription,
    createCheckoutSession,
    processMockPayment,
    cancelSubscription,
    getPaymentHistory
}
