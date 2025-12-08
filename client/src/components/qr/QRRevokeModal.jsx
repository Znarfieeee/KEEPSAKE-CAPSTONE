import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const QRRevokeModal = ({ isOpen, qrCode, onClose, onConfirm, loading = false }) => {
    if (!qrCode) return null

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return dateString
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 rounded-full">
                            <FiAlertTriangle className="text-xl text-red-600" />
                        </div>
                        <DialogTitle>Revoke QR Code</DialogTitle>
                    </div>
                    <DialogDescription>
                        This action cannot be undone. The QR code will be immediately deactivated
                        and can no longer be used.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                        <div>
                            <p className="text-xs font-medium text-red-600">QR Code ID</p>
                            <p className="text-sm font-mono text-red-900">{qrCode.qr_id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs font-medium text-red-600">Share Type</p>
                                <p className="text-sm text-red-900 capitalize">
                                    {qrCode.share_type?.replace('_', ' ')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-red-600">Current Uses</p>
                                <p className="text-sm text-red-900">
                                    {qrCode.use_count || 0} / {qrCode.max_uses || '∞'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-red-600">Expires</p>
                            <p className="text-sm text-red-900">{formatDate(qrCode.expires_at)}</p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-red-600">Created</p>
                            <p className="text-sm text-red-900">{formatDate(qrCode.created_at)}</p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                            <FiAlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-900">Warning</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Once revoked, anyone who has this QR code will no longer be able
                                    to access the patient data. This is logged in the audit trail.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <AiOutlineLoading3Quarters className="animate-spin" />
                                Revoking...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <FiTrash2 />
                                Revoke QR Code
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default QRRevokeModal
