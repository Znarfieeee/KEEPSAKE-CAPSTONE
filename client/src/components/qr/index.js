// QR Code Components - Comprehensive QR Code System for KEEPSAKE

// Core Components
export { default as SecureQRGenerator } from './SecureQRGenerator'
export { default as QRScopeSelector } from './QRScopeSelector'
export { default as QRPinInputModal } from './QRPinInputModal'
export { default as BrandedQRCode } from './BrandedQRCode'

// Management Components
export { default as QRCodeList } from './QRCodeList'
export { default as QRAuditLog } from './QRAuditLog'
export { default as QRRevokeModal } from './QRRevokeModal'

// Integration Components
export { default as PatientQRShareButton } from './PatientQRShareButton'
export { default as ParentQRShareDialog } from './ParentQRShareDialog'
export { default as BeautifulQRDialog } from './BeautifulQRDialog'

/**
 * QR Code System Overview
 * =======================
 *
 * This system provides secure, token-based QR code generation and validation
 * for sharing patient medical records across healthcare facilities.
 *
 * Features:
 * - Cryptographically secure tokens (256-bit)
 * - Scope-based access control (view_only, allergies, prescriptions, etc.)
 * - PIN protection for sensitive data
 * - Expiration and usage limits
 * - Complete audit trail
 * - HIPAA-compliant (no PHI in QR code itself)
 * - Real-time notifications for parents/guardians
 *
 * Usage Examples:
 * ---------------
 *
 * 1. Quick Share Button (for patient records):
 * ```jsx
 * import { PatientQRShareButton } from '@/components/qr'
 *
 * <PatientQRShareButton
 *   patientId={patient.id}
 *   patientName={patient.name}
 *   shareType="medical_record"
 *   defaultScope={["view_only", "allergies"]}
 * />
 * ```
 *
 * 2. Inline Generator (for modals):
 * ```jsx
 * import { SecureQRGenerator } from '@/components/qr'
 *
 * <SecureQRGenerator
 *   patientId={patientId}
 *   shareType="prescription"
 *   defaultScope={["prescriptions", "allergies"]}
 *   compact={true}
 * />
 * ```
 *
 * 3. QR Code Management:
 * ```jsx
 * import { QRCodeList } from '@/components/qr'
 *
 * <QRCodeList patientId={patientId} />
 * ```
 *
 * 4. Scanner Integration:
 * The QrScanner page (/qr_scanner) automatically validates:
 * - Token-based QR codes via backend API
 * - Handles PIN-protected codes
 * - Displays scoped patient data
 * - Supports legacy direct QR codes
 *
 * Share Types:
 * - prescription: Share prescription details
 * - medical_record: General medical records
 * - referral: Cross-facility referrals
 * - emergency_access: Emergency medical access
 * - parent_access: Parent/guardian sharing
 * - vaccination: Immunization records
 * - appointment: Appointment information
 *
 * Scopes:
 * - view_only: Basic patient info
 * - allergies: Known allergies and reactions
 * - prescriptions: Current and past prescriptions
 * - vaccinations: Immunization history
 * - appointments: Scheduled appointments
 * - vitals: Anthropometric measurements
 * - full_access: Complete patient record
 */
