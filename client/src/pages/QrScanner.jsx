import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Context
import { useAuth } from '@/context/auth'

// UI Components
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

/**
 * QR Scanner Redirect Page
 *
 * This page redirects users to their role-specific QR scanner page.
 * Legacy route `/qr_scanner` is maintained for backward compatibility.
 *
 * Role-specific routes:
 * - Doctor (pediapro): /pediapro/qr-scanner
 * - Nurse (vital_custodian): /vital_custodian/qr-scanner
 * - Parent (keepsaker): /parent/qr-scanner
 * - Facility Admin: /facility_admin/qr-scanner
 */
const QrScanner = () => {
    const navigate = useNavigate()
    const { user, isAuthenticated, loading } = useAuth()

    useEffect(() => {
        // Wait for auth to be resolved
        if (loading) return

        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            navigate('/login', { replace: true })
            return
        }

        // Redirect to role-specific QR scanner page
        const role = user?.role
        let targetPath = '/login' // Default fallback

        switch (role) {
            case 'pediapro':
            case 'doctor':
                targetPath = '/pediapro/qr_scanner'
                break
            case 'vital_custodian':
            case 'nurse':
                targetPath = '/vital_custodian/qr_scanner'
                break
            case 'keepsaker':
            case 'parent':
                targetPath = '/parent/qr_scanner'
                break
            case 'facility_admin':
                targetPath = '/facility_admin/qr_scanner'
                break
            case 'admin':
            case 'system_admin':
                // System admins can use the facility admin scanner
                targetPath = '/admin'
                break
            default:
                // If role is unknown, redirect to login
                targetPath = '/login'
        }

        // Replace current history entry to prevent back button issues
        navigate(targetPath, { replace: true })
    }, [user, isAuthenticated, loading, navigate])

    // Show loading state while redirecting
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <AiOutlineLoading3Quarters className="text-5xl text-primary animate-spin" />
                <p className="text-gray-600 font-medium">Redirecting to QR Scanner...</p>
                <p className="text-sm text-gray-400">Please wait</p>
            </div>
        </div>
    )
}

export default QrScanner
