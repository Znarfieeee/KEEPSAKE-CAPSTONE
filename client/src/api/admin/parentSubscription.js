/**
 * Admin Parent Subscription API Client
 * System admin endpoints for managing and viewing parent subscriptions
 */

import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

/**
 * Get all parent subscriptions with optional filtering
 * @param {Object} filters - Filter options { status, plan_type, page, per_page }
 * @returns {Promise<Object>} List of parent subscriptions with pagination
 */
export const getParentSubscriptions = async (filters = {}) => {
    try {
        const params = new URLSearchParams()
        if (filters.status) params.append('status', filters.status)
        if (filters.plan_type) params.append('plan_type', filters.plan_type)
        if (filters.page) params.append('page', filters.page)
        if (filters.per_page) params.append('per_page', filters.per_page)

        const queryString = params.toString()
        const response = await axios.get(
            `${backendConnection()}/admin/parent-subscriptions${queryString ? '?' + queryString : ''}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching parent subscriptions:', error)
        throw error
    }
}

/**
 * Get single parent subscription with detailed information
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} Subscription details with payment history
 */
export const getParentSubscriptionDetails = async (subscriptionId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/admin/parent-subscriptions/${subscriptionId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching subscription details:', error)
        throw error
    }
}

/**
 * Get comprehensive parent subscription analytics
 * @param {boolean} bustCache - Whether to bypass cache
 * @returns {Promise<Object>} Analytics data
 */
export const getParentSubscriptionAnalytics = async (bustCache = false) => {
    try {
        const params = bustCache ? '?bust_cache=true' : ''
        const response = await axios.get(
            `${backendConnection()}/admin/parent-subscriptions/analytics${params}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching subscription analytics:', error)
        throw error
    }
}

/**
 * Get all payments for a specific subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} List of payments
 */
export const getSubscriptionPayments = async (subscriptionId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/admin/parent-subscriptions/${subscriptionId}/payments`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching subscription payments:', error)
        throw error
    }
}

/**
 * Get all parent payment transactions with filtering
 * @param {Object} filters - Filter options { status, user_id, page, per_page }
 * @returns {Promise<Object>} List of payments
 */
export const getAllParentPayments = async (filters = {}) => {
    try {
        const params = new URLSearchParams()
        if (filters.status) params.append('status', filters.status)
        if (filters.user_id) params.append('user_id', filters.user_id)
        if (filters.page) params.append('page', filters.page)
        if (filters.per_page) params.append('per_page', filters.per_page)

        const queryString = params.toString()
        const response = await axios.get(
            `${backendConnection()}/admin/parent-payments${queryString ? '?' + queryString : ''}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error fetching parent payments:', error)
        throw error
    }
}

/**
 * Export parent subscriptions data
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Promise<Object>} Exported data
 */
export const exportParentSubscriptions = async (format = 'json') => {
    try {
        const response = await axios.get(
            `${backendConnection()}/admin/parent-subscriptions/export?format=${format}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error('Error exporting subscriptions:', error)
        throw error
    }
}

export default {
    getParentSubscriptions,
    getParentSubscriptionDetails,
    getParentSubscriptionAnalytics,
    getSubscriptionPayments,
    getAllParentPayments,
    exportParentSubscriptions
}
