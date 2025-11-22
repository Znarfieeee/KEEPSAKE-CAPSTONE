import React, { useState, useEffect, useCallback } from 'react'
import {
    getActiveShares,
    revokeShare,
    formatScopeLabels,
    getShareTypeLabel,
    getStatusColor,
    formatDate,
    getTimeRemaining
} from '@/api/consent'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    FiTrash2,
    FiClock,
    FiShield,
    FiUsers,
    FiAlertTriangle,
    FiCheckCircle,
    FiLock,
    FiMapPin,
    FiRefreshCw,
    FiFilter
} from 'react-icons/fi'
import { MdQrCode2 } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const ActiveSharesPanel = ({ onRefresh }) => {
    const [shares, setShares] = useState([])
    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedPatient, setSelectedPatient] = useState('all')
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
    const [shareToRevoke, setShareToRevoke] = useState(null)
    const [revoking, setRevoking] = useState(false)

    const fetchShares = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const patientId = selectedPatient === 'all' ? null : selectedPatient
            const response = await getActiveShares(patientId)
            setShares(response.shares || [])
            setChildren(response.children || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [selectedPatient])

    useEffect(() => {
        fetchShares()
    }, [fetchShares])

    const handleRevokeClick = (share) => {
        setShareToRevoke(share)
        setRevokeDialogOpen(true)
    }

    const handleRevokeConfirm = async () => {
        if (!shareToRevoke) return

        setRevoking(true)
        try {
            await revokeShare(shareToRevoke.qr_id, 'Revoked by parent from Settings')
            setShares(prev => prev.filter(s => s.qr_id !== shareToRevoke.qr_id))
            setRevokeDialogOpen(false)
            setShareToRevoke(null)
            if (onRefresh) onRefresh()
        } catch (err) {
            setError(err.message)
        } finally {
            setRevoking(false)
        }
    }

    const activeShares = shares.filter(s => s.effective_status === 'active')
    const inactiveShares = shares.filter(s => s.effective_status !== 'active')

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <AiOutlineLoading3Quarters className="text-3xl text-primary animate-spin mr-3" />
                <span className="text-gray-600">Loading active shares...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                    <FiAlertTriangle />
                    <span className="font-medium">Error loading shares</span>
                </div>
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={fetchShares} variant="outline" size="sm" className="mt-3">
                    <FiRefreshCw className="mr-2" />
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MdQrCode2 className="text-primary" />
                        Active Shares
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeShares.length} active share{activeShares.length !== 1 ? 's' : ''} across {children.length} child{children.length !== 1 ? 'ren' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Child filter */}
                    {children.length > 1 && (
                        <div className="flex items-center gap-2">
                            <FiFilter className="text-gray-400" />
                            <select
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="all">All Children</option>
                                {children.map(child => (
                                    <option key={child.patient_id} value={child.patient_id}>
                                        {child.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button onClick={fetchShares} variant="outline" size="sm">
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Active Shares */}
            {activeShares.length === 0 ? (
                <Card className="p-8 text-center">
                    <FiCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900">No Active Shares</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        There are currently no active QR code shares for your children.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {activeShares.map(share => (
                        <ShareCard
                            key={share.qr_id}
                            share={share}
                            onRevoke={() => handleRevokeClick(share)}
                        />
                    ))}
                </div>
            )}

            {/* Inactive/Expired Shares (collapsed by default) */}
            {inactiveShares.length > 0 && (
                <details className="mt-6">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <span>Show {inactiveShares.length} expired/revoked share{inactiveShares.length !== 1 ? 's' : ''}</span>
                    </summary>
                    <div className="grid gap-4 mt-4 opacity-60">
                        {inactiveShares.map(share => (
                            <ShareCard
                                key={share.qr_id}
                                share={share}
                                disabled
                            />
                        ))}
                    </div>
                </details>
            )}

            {/* Revoke Confirmation Dialog */}
            <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <FiAlertTriangle className="text-red-500" />
                            Revoke Access
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke this QR code share for{' '}
                            <strong>{shareToRevoke?.patient_name}</strong>?
                            <br /><br />
                            This will immediately prevent anyone from accessing the shared
                            medical information using this QR code. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevokeConfirm}
                            disabled={revoking}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {revoking ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                                    Revoking...
                                </>
                            ) : (
                                <>
                                    <FiTrash2 className="mr-2" />
                                    Revoke Access
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

const ShareCard = ({ share, onRevoke, disabled }) => {
    const timeRemaining = getTimeRemaining(share.expires_at)
    const scopeLabels = formatScopeLabels(share.scope)
    const statusColor = getStatusColor(share.effective_status)

    return (
        <Card className={`p-4 ${disabled ? 'opacity-60' : ''}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{share.patient_name}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColor}`}>
                                    {share.effective_status === 'active' ? 'Active' :
                                     share.effective_status === 'expired' ? 'Expired' :
                                     share.effective_status === 'limit_reached' ? 'Limit Reached' :
                                     'Revoked'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {getShareTypeLabel(share.share_type)}
                            </p>
                        </div>

                        {/* Security Badges */}
                        <div className="flex items-center gap-2">
                            {share.has_pin && (
                                <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                    <FiLock className="text-xs" />
                                    PIN Protected
                                </span>
                            )}
                            {share.has_facility_restriction && (
                                <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    <FiMapPin className="text-xs" />
                                    Facility Restricted
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {/* Time Remaining */}
                        <div className="flex items-center gap-2">
                            <FiClock className={`text-${timeRemaining.isExpired ? 'gray' : timeRemaining.days < 3 ? 'orange' : 'green'}-500`} />
                            <div>
                                <span className="text-gray-500">Expires:</span>
                                <span className={`ml-1 font-medium ${timeRemaining.isExpired ? 'text-gray-600' : timeRemaining.days < 3 ? 'text-orange-600' : 'text-gray-900'}`}>
                                    {timeRemaining.label}
                                </span>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="flex items-center gap-2">
                            <FiUsers className="text-purple-500" />
                            <div>
                                <span className="text-gray-500">Used:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                    {share.use_count}{share.max_uses ? `/${share.max_uses}` : ''} times
                                </span>
                            </div>
                        </div>

                        {/* Created By */}
                        <div className="flex items-center gap-2">
                            <FiShield className="text-blue-500" />
                            <div>
                                <span className="text-gray-500">By:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                    {share.generated_by || 'You'}
                                </span>
                            </div>
                        </div>

                        {/* Created Date */}
                        <div className="flex items-center gap-2">
                            <FiClock className="text-gray-400" />
                            <div>
                                <span className="text-gray-500">Created:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                    {formatDate(share.created_at, { hour: undefined, minute: undefined })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scope Badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {scopeLabels.map(scope => (
                            <span
                                key={scope.value}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                                {scope.label}
                            </span>
                        ))}
                    </div>

                    {/* Last Accessed */}
                    {share.last_accessed_at && (
                        <p className="text-xs text-gray-500">
                            Last accessed: {formatDate(share.last_accessed_at)}
                        </p>
                    )}
                </div>

                {/* Action Button */}
                {!disabled && share.effective_status === 'active' && onRevoke && (
                    <div className="flex-shrink-0">
                        <Button
                            onClick={onRevoke}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                            <FiTrash2 className="mr-2" />
                            Revoke
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default ActiveSharesPanel
