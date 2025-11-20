import React, { useState, useEffect } from "react"
import { getQRAuditHistory } from "../../api/qrCode"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import {
    FiClock,
    FiUser,
    FiMapPin,
    FiShield,
    FiAlertCircle,
    FiRefreshCw
} from "react-icons/fi"
import { MdHistory } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"

const QRAuditLog = ({ isOpen, qrId, onClose }) => {
    const [auditData, setAuditData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchAuditHistory = async () => {
        if (!qrId) return

        setLoading(true)
        setError(null)

        try {
            const response = await getQRAuditHistory(qrId)
            setAuditData(response)
        } catch (err) {
            setError(err.message || "Failed to load audit history")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && qrId) {
            fetchAuditHistory()
        }
    }, [isOpen, qrId])

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A"
        try {
            return new Date(dateString).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })
        } catch {
            return dateString
        }
    }

    const formatScope = (scope) => {
        const scopeLabels = {
            view_only: "Basic Info",
            allergies: "Allergies",
            prescriptions: "Prescriptions",
            vaccinations: "Vaccinations",
            appointments: "Appointments",
            vitals: "Vital Signs",
            full_access: "Full Access"
        }
        if (!Array.isArray(scope)) return "N/A"
        return scope.map(s => scopeLabels[s] || s).join(", ")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <MdHistory className="text-xl text-blue-600" />
                        </div>
                        <DialogTitle>QR Code Audit History</DialogTitle>
                    </div>
                    <DialogDescription>
                        View who accessed patient data using this QR code
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <AiOutlineLoading3Quarters className="text-3xl text-primary animate-spin" />
                            <span className="text-gray-600 mt-3">Loading audit history...</span>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <FiAlertCircle />
                                <span className="text-sm">{error}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAuditHistory}
                                className="mt-3"
                            >
                                <FiRefreshCw className="mr-2" />
                                Retry
                            </Button>
                        </div>
                    ) : auditData ? (
                        <div className="space-y-4">
                            {/* QR Code Details */}
                            <Card className="p-4 bg-blue-50 border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <FiShield />
                                    QR Code Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-blue-600">Share Type</p>
                                        <p className="font-medium text-blue-900 capitalize">
                                            {auditData.qr_code?.share_type?.replace("_", " ")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Scope</p>
                                        <p className="font-medium text-blue-900">
                                            {formatScope(auditData.qr_code?.scope)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Total Uses</p>
                                        <p className="font-medium text-blue-900">
                                            {auditData.qr_code?.use_count || 0} / {auditData.qr_code?.max_uses || "∞"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Status</p>
                                        <p className={`font-medium ${auditData.qr_code?.is_active ? "text-green-700" : "text-red-700"}`}>
                                            {auditData.qr_code?.is_active ? "Active" : "Revoked"}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Access Logs */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FiClock />
                                    Access Log ({auditData.access_logs?.length || 0} entries)
                                </h4>

                                {auditData.access_logs?.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {auditData.access_logs.map((log, index) => (
                                            <Card key={log.log_id || index} className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FiUser className="text-gray-500" />
                                                            <span className="font-medium text-gray-900">
                                                                {log.accessed_by_name || log.accessed_by || "Unknown User"}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <p className="text-gray-500">Time</p>
                                                                <p className="text-gray-700">
                                                                    {formatDateTime(log.accessed_at)}
                                                                </p>
                                                            </div>
                                                            {log.facility_name && (
                                                                <div>
                                                                    <p className="text-gray-500">Facility</p>
                                                                    <p className="text-gray-700 flex items-center gap-1">
                                                                        <FiMapPin className="text-xs" />
                                                                        {log.facility_name}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {log.access_method && (
                                                                <div>
                                                                    <p className="text-gray-500">Method</p>
                                                                    <p className="text-gray-700 capitalize">
                                                                        {log.access_method.replace("_", " ")}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {log.ip_address && (
                                                                <div>
                                                                    <p className="text-gray-500">IP Address</p>
                                                                    <p className="text-gray-700 font-mono text-xs">
                                                                        {log.ip_address}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="p-6 text-center bg-gray-50">
                                        <FiClock className="text-3xl text-gray-400 mx-auto mb-2" />
                                        <p className="font-medium text-gray-700">No Access Records</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            This QR code has not been used yet
                                        </p>
                                    </Card>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default QRAuditLog
