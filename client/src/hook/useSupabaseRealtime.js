import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { displayRoles } from '../util/roleHelper'

/**
 * Custom hook for Supabase real-time subscriptions
 *
 * @param {string} table - The table name to listen to
 * @param {function} onInsert - Callback for INSERT operations
 * @param {function} onUpdate - Callback for UPDATE operations
 * @param {function} onDelete - Callback for DELETE operations
 * @param {object} filter - Optional filter conditions
 * @param {array} dependencies - Dependencies array for useEffect
 */

export const useSupabaseRealtime = ({
    table,
    onInsert,
    onUpdate,
    onDelete,
    filter = null,
    dependencies = [],
}) => {
    const handleInsert = useCallback(
        (payload) => {
            if (onInsert) onInsert(payload.new)
        },
        [onInsert]
    )

    const handleUpdate = useCallback(
        (payload) => {
            if (onUpdate) onUpdate(payload.new, payload.old)
        },
        [onUpdate]
    )

    const handleDelete = useCallback(
        (payload) => {
            if (onDelete) onDelete(payload.old)
        },
        [onDelete]
    )

    useEffect(() => {
        // Skip subscription if filter is explicitly null (e.g., userId is not available)
        if (filter === null && table === 'notifications') {
            console.log('Skipping real-time subscription - user not authenticated')
            return
        }

        let subscription
        try {
            subscription = supabase
                .channel(`${table}_changes`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: table,
                        ...(filter && { filter }),
                    },
                    handleInsert
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: table,
                        ...(filter && { filter }),
                    },
                    handleUpdate
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'PUT',
                        schema: 'public',
                        table: table,
                        ...(filter && { filter }),
                    },
                    handleUpdate
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: table,
                        ...(filter && { filter }),
                    },
                    handleDelete
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Real-time subscription active for ${table}`)
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`Real-time subscription error for ${table}`)
                    } else if (status === 'TIMED_OUT') {
                        console.warn(`Real-time subscription timed out for ${table}`)
                    } else if (status === 'CLOSED') {
                        console.log(`Real-time subscription closed for ${table}`)
                    }
                })
        } catch (error) {
            console.error('Error setting up real-time subscription:', error)
        }

        return () => {
            if (subscription) {
                try {
                    supabase.removeChannel(subscription)
                } catch (error) {
                    console.error('Error removing real-time channel:', error)
                }
            }
        }
    }, [table, handleInsert, handleUpdate, handleDelete, filter, ...dependencies])

    return { supabase }
}

export const useFacilitiesRealtime = ({ onFacilityChange }) => {
    const formatFacility = useCallback(
        (raw) => ({
            id: raw.facility_id,
            name: raw.facility_name,
            location: `${raw.address}, ${raw.city}, ${raw.zip_code}`,
            type: raw.type,
            plan: raw.plan,
            expiry: raw.subscription_expires,
            admin: raw.admin || raw.email || '—',
            status: raw.subscription_status,
            contact: raw.contact_number,
            email: raw.email,
            website: raw.website,
        }),
        []
    )

    const handleInsert = useCallback(
        (newFacility) => {
            // Only process if not deleted
            if (!newFacility.deleted_at) {
                const formatted = formatFacility(newFacility)
                onFacilityChange({
                    type: 'INSERT',
                    facility: formatted,
                    raw: newFacility,
                })
            }
        },
        [formatFacility, onFacilityChange]
    )

    const handleUpdate = useCallback(
        (updatedFacility, oldFacility) => {
            const formatted = formatFacility(updatedFacility)

            // Check if this is a soft delete (facility was active, now has deleted_at)
            if (!oldFacility.deleted_at && updatedFacility.deleted_at) {
                // This is a soft delete, send as DELETE event
                onFacilityChange({
                    type: 'DELETE',
                    facility: formatted,
                    raw: updatedFacility,
                    oldRaw: oldFacility,
                })
            } else if (!updatedFacility.deleted_at) {
                // Regular update for non-deleted facilities
                onFacilityChange({
                    type: 'UPDATE',
                    facility: formatted,
                    raw: updatedFacility,
                    oldRaw: oldFacility,
                })
            }
            // If updatedFacility.deleted_at exists and oldFacility.deleted_at also exists,
            // ignore (it's an update to an already deleted facility)
        },
        [formatFacility, onFacilityChange]
    )

    const handleDelete = useCallback(
        (deletedFacility) => {
            const formatted = formatFacility(deletedFacility)
            onFacilityChange({
                type: 'DELETE',
                facility: formatted,
                raw: deletedFacility,
            })
        },
        [formatFacility, onFacilityChange]
    )

    return useSupabaseRealtime({
        table: 'healthcare_facilities',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: null, // Remove filter to catch soft deletes via UPDATE
        dependencies: [onFacilityChange],
    })
}

export const useUsersRealtime = ({ onUserChange }) => {
    const formatLastLogin = (lastLoginTime) => {
        try {
            if (!lastLoginTime || lastLoginTime === 'null') return 'Never'

            const lastLogin = new Date(lastLoginTime)
            const now = new Date()
            const diffInHours = Math.floor((now - lastLogin) / (1000 * 60 * 60))

            if (diffInHours < 24) {
                return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
            } else {
                const days = Math.floor(diffInHours / 24)
                const remainingHours = diffInHours % 24

                if (remainingHours === 0) {
                    return `${days} ${days === 1 ? 'day' : 'days'} ago`
                } else {
                    return `${days} ${days === 1 ? 'day' : 'days'} and ${remainingHours} ${
                        remainingHours === 1 ? 'hour' : 'hours'
                    } ago`
                }
            }
        } catch {
            return 'Never'
        }
    }

    const formatUser = useCallback(
        (raw) => ({
            id: raw.user_id,
            email: raw.email,
            firstname: raw.firstname,
            lastname: raw.lastname,
            role: displayRoles(raw.role),
            specialty: raw.specialty || '—',
            license_number: raw.license_number || '—',
            contact: raw.phone_number || '—',
            plan: raw.is_subscribed ? 'Premium' : 'Free',
            status: raw.is_active ? 'active' : 'inactive',
            sub_exp: raw.subscription_expires,
            created_at: new Date(raw.created_at).toLocaleDateString(),
            updated_at: raw.updated_at ? new Date(raw.updated_at).toLocaleDateString() : '—',
            last_login:
                raw.last_sign_in_at && raw.last_sign_in_at !== 'null'
                    ? formatLastLogin(raw.last_sign_in_at)
                    : 'Never',
        }),
        []
    )

    const fetchUserFacilityInfo = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('facility_users')
                .select(
                    `
                    role,
                    healthcare_facilities (
                        id,
                        facility_name
                    )
                `
                )
                .eq('user_id', userId)
                .single()

            if (error || !data) {
                return {
                    assigned_facility: 'Not Assigned',
                    facility_role: '—',
                    facility_id: null,
                }
            }

            return {
                assigned_facility: data.healthcare_facilities?.facility_name || 'Not Assigned',
                facility_role: displayRoles(data.role || ''),
                facility_id: data.healthcare_facilities?.id || null,
            }
        } catch (error) {
            console.error('Error fetching facility info:', error)
            return {
                assigned_facility: 'Not Assigned',
                facility_role: '—',
                facility_id: null,
            }
        }
    }, [])

    const handleInsert = useCallback(
        async (newUser) => {
            const formatted = formatUser(newUser)

            // Fetch facility info separately
            const facilityInfo = await fetchUserFacilityInfo(newUser.user_id)
            const completeUser = { ...formatted, ...facilityInfo }

            onUserChange({
                type: 'INSERT',
                user: completeUser,
                raw: newUser,
            })
        },
        [formatUser, onUserChange]
    )

    const handleUpdate = useCallback(
        async (updatedUser, oldUser) => {
            const formatted = formatUser(updatedUser)

            // Fetch facility info separately
            const facilityInfo = await fetchUserFacilityInfo(updatedUser.user_id)
            const completeUser = { ...formatted, ...facilityInfo }

            onUserChange({
                type: 'UPDATE',
                user: completeUser,
                raw: updatedUser,
                oldRaw: oldUser,
            })
        },
        [formatUser, onUserChange]
    )

    const handleDelete = useCallback(
        (deletedUser) => {
            const formatted = formatUser(deletedUser)
            onUserChange({
                type: 'DELETE',
                user: formatted,
                raw: deletedUser,
            })
        },
        [formatUser, onUserChange]
    )

    return useSupabaseRealtime({
        table: 'users',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onUserChange],
    })
}

// NEW: Separate hook for facility_users table changes
export const useFacilityUsersRealtime = ({ onFacilityUserChange }) => {
    const handleInsert = useCallback(
        (newFacilityUser) => {
            onFacilityUserChange({
                type: 'INSERT',
                facilityUser: newFacilityUser,
            })
        },
        [onFacilityUserChange]
    )

    const handleUpdate = useCallback(
        (updatedFacilityUser, oldFacilityUser) => {
            onFacilityUserChange({
                type: 'UPDATE',
                facilityUser: updatedFacilityUser,
                oldFacilityUser: oldFacilityUser,
            })
        },
        [onFacilityUserChange]
    )

    const handleDelete = useCallback(
        (deletedFacilityUser) => {
            onFacilityUserChange({
                type: 'DELETE',
                facilityUser: deletedFacilityUser,
            })
        },
        [onFacilityUserChange]
    )

    return useSupabaseRealtime({
        table: 'facility_users',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onFacilityUserChange],
    })
}

export const usePatientsRealtime = ({ onPatientChange }) => {
    const formatPatients = useCallback(
        (raw) => ({
            id: raw.patient_id,
            patient_id: raw.patient_id,
            firstname: raw.firstname,
            middlename: raw.middlename,
            lastname: raw.lastname,
            full_name: `${raw.firstname} ${raw.middlename ? raw.middlename + ' ' : ''}${raw.lastname}`,
            date_of_birth: raw.date_of_birth,
            birthdate: raw.date_of_birth, // Add alias for compatibility
            sex: raw.sex,
            birth_weight: raw.birth_weight,
            birth_height: raw.birth_height,
            bloodtype: raw.bloodtype,
            gestation_weeks: raw.gestation_weeks,
            is_active: raw.is_active,
            created_by: raw.created_by,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
        }),
        []
    )

    const handleInsert = useCallback(
        (newPatient) => {
            const formatted = formatPatients(newPatient)
            onPatientChange({
                type: 'INSERT',
                patient: formatted,
            })
        },
        [formatPatients, onPatientChange]
    )

    const handleUpdate = useCallback(
        (updatedPatient, oldPatient) => {
            const formatted = formatPatients(updatedPatient)
            onPatientChange({
                type: 'UPDATE',
                patient: formatted,
            })
        },
        [formatPatients, onPatientChange]
    )

    const handleDelete = useCallback(
        (deletedPatient) => {
            const formatted = formatPatients(deletedPatient)
            onPatientChange({
                type: 'DELETE',
                patient: formatted,
            })
        },
        [formatPatients, onPatientChange]
    )

    // Set up custom event listeners for immediate UI updates
    useEffect(() => {
        const handleCustomPatientCreated = (event) => {
            console.log('Custom patient-created event received:', event.detail)
            const patient = event.detail
            if (patient) {
                const formattedPatient = formatPatients(patient)
                if (formattedPatient) {
                    onPatientChange({
                        type: 'INSERT',
                        patient: formattedPatient,
                        raw: patient,
                        source: 'custom-event'
                    })
                }
            }
        }

        const handleCustomPatientUpdated = (event) => {
            console.log('Custom patient-updated event received:', event.detail)
            const patient = event.detail
            if (patient) {
                const formattedPatient = formatPatients(patient)
                if (formattedPatient) {
                    onPatientChange({
                        type: 'UPDATE',
                        patient: formattedPatient,
                        raw: patient,
                        source: 'custom-event'
                    })
                }
            }
        }

        const handleCustomPatientDeleted = (event) => {
            console.log('Custom patient-deleted event received:', event.detail)
            const patient = event.detail
            if (patient) {
                // For delete events, we just need the ID
                const patientToDelete = {
                    id: patient.patient_id,
                    patient_id: patient.patient_id,
                    firstname: patient.firstname,
                    lastname: patient.lastname
                }

                onPatientChange({
                    type: 'DELETE',
                    patient: patientToDelete,
                    raw: patient,
                    source: 'custom-event'
                })
            }
        }

        // Add event listeners for custom events
        window.addEventListener('patient-created', handleCustomPatientCreated)
        window.addEventListener('patient-updated', handleCustomPatientUpdated)
        window.addEventListener('patient-deleted', handleCustomPatientDeleted)

        return () => {
            // Remove custom event listeners
            window.removeEventListener('patient-created', handleCustomPatientCreated)
            window.removeEventListener('patient-updated', handleCustomPatientUpdated)
            window.removeEventListener('patient-deleted', handleCustomPatientDeleted)
        }
    }, [formatPatients, onPatientChange])

    return useSupabaseRealtime({
        table: 'patients',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: 'is_active=neq.false',
        dependencies: [onPatientChange],
    })
}

export const useAppointmentsRealtime = ({ onAppointmentChange, doctorId, facilityId }) => {
    const formatAppointment = useCallback(
        (raw) => ({
            appointment_id: raw.appointment_id,
            id: raw.appointment_id, // Keep both for compatibility
            patient_id: raw.patient_id,
            doctor_id: raw.doctor_id,
            doctor_name: raw.doctor_name,
            patient_name: raw.patient_name,
            facility_id: raw.facility_id,
            appointment_date: raw.appointment_date,
            appointment_time: raw.appointment_time,
            reason: raw.reason,
            notes: raw.notes,
            status: raw.status || 'scheduled',
            scheduled_by: raw.scheduled_by,
            updated_by: raw.updated_by,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            // These will be populated from joins if needed
            patients: null,
            doctor: null,
            facility: null,
        }),
        []
    )

    const handleInsert = useCallback(
        (newAppointment) => {
            const formatted = formatAppointment(newAppointment)
            onAppointmentChange({
                type: 'INSERT',
                appointment: formatted,
                raw: newAppointment,
            })
        },
        [formatAppointment, onAppointmentChange]
    )

    const handleUpdate = useCallback(
        (updatedAppointment, oldAppointment) => {
            const formatted = formatAppointment(updatedAppointment)
            onAppointmentChange({
                type: 'UPDATE',
                appointment: formatted,
                raw: updatedAppointment,
                oldRaw: oldAppointment,
            })
        },
        [formatAppointment, onAppointmentChange]
    )

    const handleDelete = useCallback(
        (deletedAppointment) => {
            const formatted = formatAppointment(deletedAppointment)
            onAppointmentChange({
                type: 'DELETE',
                appointment: formatted,
                raw: deletedAppointment,
            })
        },
        [formatAppointment, onAppointmentChange]
    )

    // Set up custom event listeners for immediate UI updates
    useEffect(() => {
        const handleCustomAppointmentCreated = (event) => {
            console.log('Custom appointment-created event received:', event.detail)
            const appointment = event.detail
            if (appointment) {
                // Custom events are explicitly dispatched by our code when the current user
                // creates an appointment, so we should always accept them regardless of filters.
                // The Supabase realtime subscription handles the doctor/facility filtering
                // for appointments created by other users.
                const formattedAppointment = formatAppointment(appointment)
                if (formattedAppointment) {
                    onAppointmentChange({
                        type: 'INSERT',
                        appointment: formattedAppointment,
                        raw: appointment,
                        source: 'custom-event',
                    })
                }
            }
        }

        const handleCustomAppointmentUpdated = (event) => {
            console.log('Custom appointment-updated event received:', event.detail)
            const appointment = event.detail
            if (appointment) {
                const formattedAppointment = formatAppointment(appointment)
                if (formattedAppointment) {
                    onAppointmentChange({
                        type: 'UPDATE',
                        appointment: formattedAppointment,
                        raw: appointment,
                        source: 'custom-event',
                    })
                }
            }
        }

        const handleCustomAppointmentDeleted = (event) => {
            console.log('Custom appointment-deleted event received:', event.detail)
            const appointment = event.detail
            if (appointment) {
                const appointmentToDelete = {
                    appointment_id: appointment.appointment_id,
                    id: appointment.appointment_id,
                    patient_name: appointment.patient_name,
                }

                onAppointmentChange({
                    type: 'DELETE',
                    appointment: appointmentToDelete,
                    raw: appointment,
                    source: 'custom-event',
                })
            }
        }

        // Add event listeners for custom events
        window.addEventListener('appointment-created', handleCustomAppointmentCreated)
        window.addEventListener('appointment-updated', handleCustomAppointmentUpdated)
        window.addEventListener('appointment-deleted', handleCustomAppointmentDeleted)

        return () => {
            // Remove custom event listeners
            window.removeEventListener('appointment-created', handleCustomAppointmentCreated)
            window.removeEventListener('appointment-updated', handleCustomAppointmentUpdated)
            window.removeEventListener('appointment-deleted', handleCustomAppointmentDeleted)
        }
    }, [formatAppointment, onAppointmentChange])

    // Create filter based on available parameters
    let filter = null
    if (doctorId) {
        filter = `doctor_id=eq.${doctorId}`
    } else if (facilityId) {
        filter = `facility_id=eq.${facilityId}`
    }

    return useSupabaseRealtime({
        table: 'appointments',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: filter,
        dependencies: [onAppointmentChange, doctorId, facilityId],
    })
}

export const useAuditLogsRealtime = ({ onAuditLogChange }) => {
    const formatAuditLog = useCallback(
        (raw) => ({
            log_id: raw.log_id,
            user_id: raw.user_id,
            action_type: raw.action_type,
            table_name: raw.table_name,
            record_id: raw.record_id,
            patient_id: raw.patient_id,
            action_timestamp: raw.action_timestamp,
            ip_address: raw.ip_address,
            old_values: raw.old_values,
            new_values: raw.new_values,
            session_id: raw.session_id,
            users: raw.users || null,
        }),
        []
    )

    const handleInsert = useCallback(
        async (newLog) => {
            // Fetch user info for the audit log
            let userInfo = null
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('user_id, email, firstname, lastname, role')
                    .eq('user_id', newLog.user_id)
                    .single()

                if (!error && data) {
                    userInfo = data
                }
            } catch (error) {
                console.error('Error fetching user info for audit log:', error)
            }

            const formatted = {
                ...formatAuditLog(newLog),
                users: userInfo,
            }

            onAuditLogChange({
                type: 'INSERT',
                auditLog: formatted,
                raw: newLog,
            })
        },
        [formatAuditLog, onAuditLogChange]
    )

    const handleUpdate = useCallback(
        async (updatedLog, oldLog) => {
            // Fetch user info for the audit log
            let userInfo = null
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('user_id, email, firstname, lastname, role')
                    .eq('user_id', updatedLog.user_id)
                    .single()

                if (!error && data) {
                    userInfo = data
                }
            } catch (error) {
                console.error('Error fetching user info for audit log:', error)
            }

            const formatted = {
                ...formatAuditLog(updatedLog),
                users: userInfo,
            }

            onAuditLogChange({
                type: 'UPDATE',
                auditLog: formatted,
                raw: updatedLog,
                oldRaw: oldLog,
            })
        },
        [formatAuditLog, onAuditLogChange]
    )

    const handleDelete = useCallback(
        (deletedLog) => {
            const formatted = formatAuditLog(deletedLog)
            onAuditLogChange({
                type: 'DELETE',
                auditLog: formatted,
                raw: deletedLog,
            })
        },
        [formatAuditLog, onAuditLogChange]
    )

    return useSupabaseRealtime({
        table: 'audit_logs',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        dependencies: [onAuditLogChange],
    })
}

export const useNotificationsRealtime = ({ userId, onNotificationChange }) => {
    const handleInsert = useCallback(
        (newNotification) => {
            // Only process notifications for this user
            if (newNotification.user_id === userId) {
                onNotificationChange({
                    type: 'INSERT',
                    notification: newNotification,
                })
            }
        },
        [userId, onNotificationChange]
    )

    const handleUpdate = useCallback(
        (updatedNotification, oldNotification) => {
            // Only process notifications for this user
            if (updatedNotification.user_id === userId) {
                onNotificationChange({
                    type: 'UPDATE',
                    notification: updatedNotification,
                    oldNotification: oldNotification,
                })
            }
        },
        [userId, onNotificationChange]
    )

    const handleDelete = useCallback(
        (deletedNotification) => {
            // Only process notifications for this user
            if (deletedNotification.user_id === userId) {
                onNotificationChange({
                    type: 'DELETE',
                    notification: deletedNotification,
                })
            }
        },
        [userId, onNotificationChange]
    )

    return useSupabaseRealtime({
        table: 'notifications',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: userId ? `user_id=eq.${userId}` : null,
        dependencies: [onNotificationChange, userId],
    })
}

/**
 * Real-time hook for growth milestone measurements
 * Provides live updates for growth chart data and WHO standards tracking
 */
export const useAnthropometricMeasurementsRealtime = ({ patientId, onMeasurementChange }) => {
    const formatMeasurement = useCallback(
        (raw) => ({
            am_id: raw.am_id,
            patient_id: raw.patient_id,
            weight: raw.weight,
            height: raw.height,
            head_circumference: raw.head_circumference,
            chest_circumference: raw.chest_circumference,
            abdominal_circumference: raw.abdominal_circumference,
            measurement_date: raw.measurement_date,
            recorded_by: raw.recorded_by,
            recorded_at: raw.recorded_at,
        }),
        []
    )

    const handleInsert = useCallback(
        (newMeasurement) => {
            // Only process measurements for the specified patient
            if (!patientId || newMeasurement.patient_id === patientId) {
                const formatted = formatMeasurement(newMeasurement)
                onMeasurementChange({
                    type: 'INSERT',
                    measurement: formatted,
                    raw: newMeasurement,
                })

                // Dispatch custom event for immediate UI updates
                window.dispatchEvent(
                    new CustomEvent('growth-milestone-added', {
                        detail: {
                            patient_id: newMeasurement.patient_id,
                            data: formatted,
                        },
                    })
                )
            }
        },
        [patientId, formatMeasurement, onMeasurementChange]
    )

    const handleUpdate = useCallback(
        (updatedMeasurement, oldMeasurement) => {
            // Only process measurements for the specified patient
            if (!patientId || updatedMeasurement.patient_id === patientId) {
                const formatted = formatMeasurement(updatedMeasurement)
                onMeasurementChange({
                    type: 'UPDATE',
                    measurement: formatted,
                    raw: updatedMeasurement,
                    oldRaw: oldMeasurement,
                })

                // Dispatch custom event for immediate UI updates
                window.dispatchEvent(
                    new CustomEvent('anthropometric-measurement-updated', {
                        detail: {
                            patient_id: updatedMeasurement.patient_id,
                            data: formatted,
                        },
                    })
                )
            }
        },
        [patientId, formatMeasurement, onMeasurementChange]
    )

    const handleDelete = useCallback(
        (deletedMeasurement) => {
            // Only process measurements for the specified patient
            if (!patientId || deletedMeasurement.patient_id === patientId) {
                const formatted = formatMeasurement(deletedMeasurement)
                onMeasurementChange({
                    type: 'DELETE',
                    measurement: formatted,
                    raw: deletedMeasurement,
                })

                // Dispatch custom event for immediate UI updates
                window.dispatchEvent(
                    new CustomEvent('anthropometric-measurement-deleted', {
                        detail: {
                            patient_id: deletedMeasurement.patient_id,
                            data: formatted,
                        },
                    })
                )
            }
        },
        [patientId, formatMeasurement, onMeasurementChange]
    )

    // Create filter for patient-specific subscriptions
    const filter = patientId ? `patient_id=eq.${patientId}` : null

    return useSupabaseRealtime({
        table: 'anthropometric_measurements',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: filter,
        dependencies: [onMeasurementChange, patientId],
    })
}

/**
 * Real-time hook for medical documents
 * Provides live updates for document uploads, updates, and deletions
 */
export const useDocumentsRealtime = ({ patientId, onDocumentChange }) => {
    const formatDocument = useCallback(
        (raw) => ({
            document_id: raw.document_id,
            patient_id: raw.patient_id,
            facility_id: raw.facility_id,
            document_type: raw.document_type,
            document_name: raw.document_name,
            description: raw.description,
            storage_bucket: raw.storage_bucket,
            storage_path: raw.storage_path,
            file_size: raw.file_size,
            mime_type: raw.mime_type,
            version: raw.version,
            parent_document_id: raw.parent_document_id,
            is_current_version: raw.is_current_version,
            uploaded_by: raw.uploaded_by,
            uploaded_at: raw.uploaded_at,
            is_deleted: raw.is_deleted,
            deleted_at: raw.deleted_at,
            deleted_by: raw.deleted_by,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
        }),
        []
    )

    const handleInsert = useCallback(
        (newDocument) => {
            // Only process documents for the specified patient (if filter is set)
            if (!patientId || newDocument.patient_id === patientId) {
                // Don't show deleted documents
                if (!newDocument.is_deleted) {
                    const formatted = formatDocument(newDocument)
                    onDocumentChange({
                        type: 'INSERT',
                        document: formatted,
                        raw: newDocument,
                    })

                    // Dispatch custom event for immediate UI updates
                    window.dispatchEvent(
                        new CustomEvent('document-uploaded', {
                            detail: {
                                patientId: newDocument.patient_id,
                                document: formatted,
                            },
                        })
                    )
                }
            }
        },
        [patientId, formatDocument, onDocumentChange]
    )

    const handleUpdate = useCallback(
        (updatedDocument, oldDocument) => {
            // Only process documents for the specified patient (if filter is set)
            if (!patientId || updatedDocument.patient_id === patientId) {
                const formatted = formatDocument(updatedDocument)

                // If document was soft deleted, treat it as a DELETE event
                if (updatedDocument.is_deleted && !oldDocument.is_deleted) {
                    onDocumentChange({
                        type: 'DELETE',
                        document: formatted,
                        raw: updatedDocument,
                        oldRaw: oldDocument,
                    })

                    // Dispatch custom event
                    window.dispatchEvent(
                        new CustomEvent('document-deleted', {
                            detail: {
                                patientId: updatedDocument.patient_id,
                                documentId: updatedDocument.document_id,
                            },
                        })
                    )
                } else if (!updatedDocument.is_deleted) {
                    // Regular update
                    onDocumentChange({
                        type: 'UPDATE',
                        document: formatted,
                        raw: updatedDocument,
                        oldRaw: oldDocument,
                    })

                    // Dispatch custom event
                    window.dispatchEvent(
                        new CustomEvent('document-updated', {
                            detail: {
                                patientId: updatedDocument.patient_id,
                                document: formatted,
                            },
                        })
                    )
                }
            }
        },
        [patientId, formatDocument, onDocumentChange]
    )

    const handleDelete = useCallback(
        (deletedDocument) => {
            // Only process documents for the specified patient (if filter is set)
            if (!patientId || deletedDocument.patient_id === patientId) {
                const formatted = formatDocument(deletedDocument)
                onDocumentChange({
                    type: 'DELETE',
                    document: formatted,
                    raw: deletedDocument,
                })

                // Dispatch custom event
                window.dispatchEvent(
                    new CustomEvent('document-deleted', {
                        detail: {
                            patientId: deletedDocument.patient_id,
                            documentId: deletedDocument.document_id,
                        },
                    })
                )
            }
        },
        [patientId, formatDocument, onDocumentChange]
    )

    // Create filter for patient-specific subscriptions
    const filter = patientId ? `patient_id=eq.${patientId}` : null

    return useSupabaseRealtime({
        table: 'medical_documents',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        filter: filter,
        dependencies: [onDocumentChange, patientId],
    })
}

export { supabase }
