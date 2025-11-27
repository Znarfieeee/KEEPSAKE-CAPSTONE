import backendConnection from '../backendApi'
import axios from 'axios'
import { axiosConfig } from '../axiosConfig'

// ============================================
// Subscription Management
// ============================================

export const upgradeSubscription = async (facilityId, newPlan, reason = '') => {
    const response = await axios.post(
        `${backendConnection()}/admin/subscriptions/upgrade`,
        { facility_id: facilityId, new_plan: newPlan, reason },
        axiosConfig
    )
    return response.data
}

export const downgradeSubscription = async (facilityId, newPlan, reason = '') => {
    const response = await axios.post(
        `${backendConnection()}/admin/subscriptions/downgrade`,
        { facility_id: facilityId, new_plan: newPlan, reason },
        axiosConfig
    )
    return response.data
}

export const cancelSubscription = async (facilityId, cancelImmediately = false, reason = '') => {
    const response = await axios.post(
        `${backendConnection()}/admin/subscriptions/cancel`,
        { facility_id: facilityId, cancel_immediately: cancelImmediately, reason },
        axiosConfig
    )
    return response.data
}

export const renewSubscription = async (facilityId, duration = 30) => {
    const response = await axios.post(
        `${backendConnection()}/admin/subscriptions/renew`,
        { facility_id: facilityId, duration },
        axiosConfig
    )
    return response.data
}

// ============================================
// Invoice Management
// ============================================

export const getInvoices = async (filters = {}) => {
    const params = new URLSearchParams()

    if (filters.facility_id) params.append('facility_id', filters.facility_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.page) params.append('page', filters.page)
    if (filters.per_page) params.append('per_page', filters.per_page)

    const queryString = params.toString()
    const response = await axios.get(
        `${backendConnection()}/admin/invoices${queryString ? '?' + queryString : ''}`,
        axiosConfig
    )
    return response.data
}

export const getInvoiceById = async (invoiceId) => {
    const response = await axios.get(
        `${backendConnection()}/admin/invoices/${invoiceId}`,
        axiosConfig
    )
    return response.data
}

export const generateInvoice = async (facilityId, periodStart, periodEnd, notes = '') => {
    const response = await axios.post(
        `${backendConnection()}/admin/invoices/generate`,
        {
            facility_id: facilityId,
            billing_period_start: periodStart,
            billing_period_end: periodEnd,
            notes
        },
        axiosConfig
    )
    return response.data
}

export const markInvoicePaid = async (invoiceId, paymentData) => {
    const response = await axios.post(
        `${backendConnection()}/admin/invoices/${invoiceId}/mark-paid`,
        {
            payment_date: paymentData.payment_date,
            amount: paymentData.amount,
            payment_method: paymentData.payment_method,
            transaction_reference: paymentData.transaction_reference,
            notes: paymentData.notes
        },
        axiosConfig
    )
    return response.data
}

// ============================================
// Analytics
// ============================================

export const getSubscriptionAnalytics = async (bustCache = false) => {
    const url = bustCache
        ? `${backendConnection()}/admin/subscriptions/analytics?bust_cache=true`
        : `${backendConnection()}/admin/subscriptions/analytics`

    const response = await axios.get(url, axiosConfig)
    return response.data
}

// ============================================
// Payment History
// ============================================

export const getPaymentHistory = async (filters = {}) => {
    const params = new URLSearchParams()

    if (filters.facility_id) params.append('facility_id', filters.facility_id)
    if (filters.invoice_id) params.append('invoice_id', filters.invoice_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.page) params.append('page', filters.page)
    if (filters.per_page) params.append('per_page', filters.per_page)

    const queryString = params.toString()
    const response = await axios.get(
        `${backendConnection()}/admin/payments${queryString ? '?' + queryString : ''}`,
        axiosConfig
    )
    return response.data
}

// ============================================
// Email Notifications
// ============================================

export const getEmailNotifications = async (filters = {}) => {
    const params = new URLSearchParams()

    if (filters.type) params.append('type', filters.type)
    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page)
    if (filters.per_page) params.append('per_page', filters.per_page)

    const queryString = params.toString()
    const response = await axios.get(
        `${backendConnection()}/admin/notifications${queryString ? '?' + queryString : ''}`,
        axiosConfig
    )
    return response.data
}

// Default export with all functions
export default {
    upgradeSubscription,
    downgradeSubscription,
    cancelSubscription,
    renewSubscription,
    getInvoices,
    getInvoiceById,
    generateInvoice,
    markInvoicePaid,
    getSubscriptionAnalytics,
    getPaymentHistory,
    getEmailNotifications
}
