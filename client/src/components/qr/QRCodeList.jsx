import React, { useState, useEffect } from "react"
import { listQRCodes, revokeQRCode, getQRAuditHistory } from "../../api/qrCode"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import {
    FiClock,
    FiHash,
    FiLock,
    FiUnlock,
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiAlertCircle,
    FiCheckCircle,
    FiXCircle
} from "react-icons/fi"
import { MdQrCode2 } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import QRRevokeModal from "./QRRevokeModal"
import QRAuditLog from "./QRAuditLog"

const QRCodeList = ({ patientId = null, onRefresh = null }) => {
    const [qrCodes, setQrCodes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Modal state
    const [selectedQRForRevoke, setSelectedQRForRevoke] = useState(null)
    const [selectedQRForAudit, setSelectedQRForAudit] = useState(null)
    const [revokeLoading, setRevokeLoading] = useState(false)

    const fetchQRCodes = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await listQRCodes(patientId)
            setQrCodes(response.qr_codes || [])
        } catch (err) {
            setError(err.message || "Failed to load QR codes")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQRCodes()
    }, [patientId])

    const handleRevoke = async (qrId) => {
        setRevokeLoading(true)
        try {
            await revokeQRCode(qrId)
            // Update local state
            setQrCodes(prev =>
                prev.map(qr =>
                    qr.qr_id === qrId ? { ...qr, is_active: false } : qr
                )
            )
            setSelectedQRForRevoke(null)
            if (onRefresh) onRefresh()
        } catch (err) {
            setError(err.message || "Failed to revoke QR code")
        } finally {
            setRevokeLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return "N/A"
        try {
            return new Date(dateString).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        } catch {
            return dateString
        }
    }

    const isExpired = (expiresAt) => {
        if (!expiresAt) return false
        return new Date(expiresAt) < new Date()
    }

    const getStatusBadge = (qrCode) => {
        if (!qrCode.is_active) {
            return (
                <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                    <FiXCircle />
                    Revoked
                </span>
            )
        }
        if (isExpired(qrCode.expires_at)) {
            return (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                    <FiClock />
                    Expired
                </span>
            )
        }
        if (qrCode.use_count >= qrCode.max_uses) {
            return (
                <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                    <FiHash />
                    Limit Reached
                </span>
            )
        }
        return (
            <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <FiCheckCircle />
                Active
            </span>
        )
    }

    const formatScope = (scope) => {
        const scopeLabels = {
            view_only: "Basic",
            allergies: "Allergies",
            prescriptions: "Rx",
            vaccinations: "Vaccines",
            appointments: "Appointments",
            vitals: "Vitals",
            full_access: "Full"
        }
        if (!Array.isArray(scope)) return "N/A"
        return scope.map(s => scopeLabels[s] || s).join(", ")
    }

    if (loading) {
        return (
            <Card className="p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <AiOutlineLoading3Quarters className="text-3xl text-primary animate-spin" />
                    <span className="text-gray-600">Loading QR codes...</span>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MdQrCode2 className="text-2xl text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        QR Code Management
                    </h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchQRCodes}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} />
                    Refresh
                </Button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <FiAlertCircle className="text-red-600" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {/* QR Code List */}
            {qrCodes.length === 0 ? (
                <Card className="p-8 text-center">
                    <MdQrCode2 className="text-4xl text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-700">No QR Codes Found</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        {patientId
                            ? "No QR codes have been generated for this patient yet."
                            : "No QR codes have been generated for this facility yet."}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {qrCodes.map((qrCode) => (
                        <Card
                            key={qrCode.qr_id}
                            className={`p-4 ${!qrCode.is_active ? "opacity-60" : ""}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStatusBadge(qrCode)}
                                        <span className="text-xs text-gray-500 font-mono">
                                            ID: {qrCode.qr_id?.slice(0, 8)}...
                                        </span>
                                        {qrCode.pin_code && (
                                            <span className="flex items-center gap-1 text-xs text-orange-600">
                                                <FiLock />
                                                PIN Protected
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500">Share Type</p>
                                            <p className="font-medium capitalize">
                                                {qrCode.share_type?.replace("_", " ")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Scope</p>
                                            <p className="font-medium">
                                                {formatScope(qrCode.scope)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Uses</p>
                                            <p className="font-medium">
                                                {qrCode.use_count || 0} / {qrCode.max_uses || "∞"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Expires</p>
                                            <p className="font-medium">
                                                {formatDate(qrCode.expires_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {qrCode.created_at && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Created: {formatDate(qrCode.created_at)}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedQRForAudit(qrCode.qr_id)}
                                        className="text-blue-600 hover:bg-blue-50"
                                    >
                                        <FiEye className="mr-1" />
                                        Audit
                                    </Button>
                                    {qrCode.is_active && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedQRForRevoke(qrCode)}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            <FiTrash2 className="mr-1" />
                                            Revoke
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Revoke Modal */}
            <QRRevokeModal
                isOpen={!!selectedQRForRevoke}
                qrCode={selectedQRForRevoke}
                onClose={() => setSelectedQRForRevoke(null)}
                onConfirm={() => handleRevoke(selectedQRForRevoke?.qr_id)}
                loading={revokeLoading}
            />

            {/* Audit Log Modal */}
            <QRAuditLog
                isOpen={!!selectedQRForAudit}
                qrId={selectedQRForAudit}
                onClose={() => setSelectedQRForAudit(null)}
            />
        </div>
    )
}

export default QRCodeList
