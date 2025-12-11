import { useCallback } from 'react'
import { useSupabaseRealtime } from './useSupabaseRealtime'

/**
 * Real-time hook for invoices table
 * Listens for invoice CRUD operations
 */
export const useInvoicesRealtime = ({ onInvoiceChange }) => {
    const formatInvoice = useCallback((raw) => {
        if (!raw) return null

        return {
            invoice_id: raw.invoice_id,
            invoice_number: raw.invoice_number,
            facility_id: raw.facility_id,
            status: raw.status,
            total_amount: raw.total_amount,
            subtotal: raw.subtotal,
            tax_amount: raw.tax_amount,
            issue_date: raw.issue_date,
            due_date: raw.due_date,
            billing_period_start: raw.billing_period_start,
            billing_period_end: raw.billing_period_end,
            plan_type: raw.plan_type,
            notes: raw.notes,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            healthcare_facilities: raw.healthcare_facilities,
        }
    }, [])

    const handleInsert = useCallback(
        (newInvoice) => {
            const formatted = formatInvoice(newInvoice)
            if (formatted) {
                onInvoiceChange({
                    type: 'INSERT',
                    invoice: formatted,
                    raw: newInvoice,
                })
            }
        },
        [formatInvoice, onInvoiceChange]
    )

    const handleUpdate = useCallback(
        (updatedInvoice, oldInvoice) => {
            const formatted = formatInvoice(updatedInvoice)
            if (formatted) {
                onInvoiceChange({
                    type: 'UPDATE',
                    invoice: formatted,
                    raw: updatedInvoice,
                    oldRaw: oldInvoice,
                })
            }
        },
        [formatInvoice, onInvoiceChange]
    )

    const handleDelete = useCallback(
        (deletedInvoice) => {
            const formatted = formatInvoice(deletedInvoice)
            if (formatted) {
                onInvoiceChange({
                    type: 'DELETE',
                    invoice: formatted,
                    raw: deletedInvoice,
                })
            }
        },
        [formatInvoice, onInvoiceChange]
    )

    return useSupabaseRealtime({
        table: 'invoices',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onInvoiceChange],
    })
}

/**
 * Real-time hook for payments table
 * Listens for payment transaction CRUD operations
 */
export const usePaymentsRealtime = ({ onPaymentChange }) => {
    const formatPayment = useCallback((raw) => {
        if (!raw) return null

        return {
            transaction_id: raw.transaction_id,
            invoice_id: raw.invoice_id,
            facility_id: raw.facility_id,
            amount: raw.amount,
            payment_method: raw.payment_method,
            transaction_reference: raw.transaction_reference,
            transaction_date: raw.transaction_date,
            status: raw.status,
            notes: raw.notes,
            created_at: raw.created_at,
            invoices: raw.invoices,
            healthcare_facilities: raw.healthcare_facilities,
        }
    }, [])

    const handleInsert = useCallback(
        (newPayment) => {
            const formatted = formatPayment(newPayment)
            if (formatted) {
                onPaymentChange({
                    type: 'INSERT',
                    payment: formatted,
                    raw: newPayment,
                })
            }
        },
        [formatPayment, onPaymentChange]
    )

    const handleUpdate = useCallback(
        (updatedPayment, oldPayment) => {
            const formatted = formatPayment(updatedPayment)
            if (formatted) {
                onPaymentChange({
                    type: 'UPDATE',
                    payment: formatted,
                    raw: updatedPayment,
                    oldRaw: oldPayment,
                })
            }
        },
        [formatPayment, onPaymentChange]
    )

    const handleDelete = useCallback(
        (deletedPayment) => {
            const formatted = formatPayment(deletedPayment)
            if (formatted) {
                onPaymentChange({
                    type: 'DELETE',
                    payment: formatted,
                    raw: deletedPayment,
                })
            }
        },
        [formatPayment, onPaymentChange]
    )

    return useSupabaseRealtime({
        table: 'payments',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onPaymentChange],
    })
}

/**
 * Real-time hook for email_notifications table
 * Listens for email notification CRUD operations
 */
export const useEmailNotificationsRealtime = ({ onNotificationChange }) => {
    const formatNotification = useCallback((raw) => {
        if (!raw) return null

        return {
            notification_id: raw.notification_id,
            recipient_email: raw.recipient_email,
            subject: raw.subject,
            body: raw.body,
            type: raw.type,
            status: raw.status,
            sent_at: raw.sent_at,
            error_message: raw.error_message,
            created_at: raw.created_at,
        }
    }, [])

    const handleInsert = useCallback(
        (newNotification) => {
            const formatted = formatNotification(newNotification)
            if (formatted) {
                onNotificationChange({
                    type: 'INSERT',
                    notification: formatted,
                    raw: newNotification,
                })
            }
        },
        [formatNotification, onNotificationChange]
    )

    const handleUpdate = useCallback(
        (updatedNotification, oldNotification) => {
            const formatted = formatNotification(updatedNotification)
            if (formatted) {
                onNotificationChange({
                    type: 'UPDATE',
                    notification: formatted,
                    raw: updatedNotification,
                    oldRaw: oldNotification,
                })
            }
        },
        [formatNotification, onNotificationChange]
    )

    const handleDelete = useCallback(
        (deletedNotification) => {
            const formatted = formatNotification(deletedNotification)
            if (formatted) {
                onNotificationChange({
                    type: 'DELETE',
                    notification: formatted,
                    raw: deletedNotification,
                })
            }
        },
        [formatNotification, onNotificationChange]
    )

    return useSupabaseRealtime({
        table: 'email_notifications',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onNotificationChange],
    })
}

/**
 * Real-time hook for parent_subscriptions table
 * Listens for parent subscription CRUD operations
 */
export const useParentSubscriptionsRealtime = ({ onSubscriptionChange }) => {
    const formatSubscription = useCallback((raw) => {
        if (!raw) return null

        return {
            subscription_id: raw.subscription_id,
            user_id: raw.user_id,
            plan_type: raw.plan_type,
            status: raw.status,
            current_period_start: raw.current_period_start,
            current_period_end: raw.current_period_end,
            cancel_at_period_end: raw.cancel_at_period_end,
            cancelled_at: raw.cancelled_at,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            users: raw.users,
        }
    }, [])

    const handleInsert = useCallback(
        (newSubscription) => {
            const formatted = formatSubscription(newSubscription)
            if (formatted) {
                onSubscriptionChange({
                    type: 'INSERT',
                    subscription: formatted,
                    raw: newSubscription,
                })
            }
        },
        [formatSubscription, onSubscriptionChange]
    )

    const handleUpdate = useCallback(
        (updatedSubscription, oldSubscription) => {
            const formatted = formatSubscription(updatedSubscription)
            if (formatted) {
                onSubscriptionChange({
                    type: 'UPDATE',
                    subscription: formatted,
                    raw: updatedSubscription,
                    oldRaw: oldSubscription,
                })
            }
        },
        [formatSubscription, onSubscriptionChange]
    )

    const handleDelete = useCallback(
        (deletedSubscription) => {
            const formatted = formatSubscription(deletedSubscription)
            if (formatted) {
                onSubscriptionChange({
                    type: 'DELETE',
                    subscription: formatted,
                    raw: deletedSubscription,
                })
            }
        },
        [formatSubscription, onSubscriptionChange]
    )

    return useSupabaseRealtime({
        table: 'parent_subscriptions',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onSubscriptionChange],
    })
}
