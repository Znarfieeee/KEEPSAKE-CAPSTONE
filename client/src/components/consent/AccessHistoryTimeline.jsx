import React, { useState, useEffect, useCallback } from 'react'
import {
    getAccessHistory,
    getAccessLogs,
    formatDate,
    getShareTypeLabel
} from '@/api/consent'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
    FiClock,
    FiUser,
    FiMapPin,
    FiAlertTriangle,
    FiCheckCircle,
    FiXCircle,
    FiEye,
    FiRefreshCw,
    FiFilter,
    FiChevronDown,
    FiShield,
    FiActivity
} from 'react-icons/fi'
import { MdQrCode2 } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const AccessHistoryTimeline = ({ children: childrenList = [] }) => {
    const [history, setHistory] = useState([])
    const [accessLogs, setAccessLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedPatient, setSelectedPatient] = useState('all')
    const [activeView, setActiveView] = useState('history') // 'logs' or 'history' - default to history since logs may be empty
    const [limit] = useState(30)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)

    const fetchData = useCallback(async (reset = false) => {
        setLoading(true)
        setError(null)
        try {
            const patientId = selectedPatient === 'all' ? null : selectedPatient
            const currentOffset = reset ? 0 : offset

            if (activeView === 'logs') {
                const response = await getAccessLogs({ patientId, limit, offset: currentOffset })
                if (reset) {
                    setAccessLogs(response.logs || [])
                } else {
                    setAccessLogs(prev => [...prev, ...(response.logs || [])])
                }
                setHasMore((response.logs || []).length === limit)
            } else {
                const response = await getAccessHistory({ patientId, limit, offset: currentOffset })
                if (reset) {
                    setHistory(response.history || [])
                } else {
                    setHistory(prev => [...prev, ...(response.history || [])])
                }
                setHasMore((response.history || []).length === limit)
            }

            if (reset) setOffset(0)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [selectedPatient, activeView, limit, offset])

    useEffect(() => {
        fetchData(true)
    }, [selectedPatient, activeView])

    const loadMore = () => {
        setOffset(prev => prev + limit)
        fetchData()
    }

    const getActionIcon = (action) => {
        const icons = {
            'consent_granted': <FiCheckCircle className="text-green-500" />,
            'consent_revoked': <FiXCircle className="text-red-500" />,
            'qr_generated': <MdQrCode2 className="text-blue-500" />,
            'qr_accessed': <FiEye className="text-purple-500" />,
            'qr_revoked': <FiXCircle className="text-red-500" />,
            'qr_expired': <FiClock className="text-gray-500" />,
            'emergency_revoke_all': <FiAlertTriangle className="text-red-600" />,
            'access_attempt_blocked': <FiShield className="text-orange-500" />,
            'suspicious_activity_detected': <FiAlertTriangle className="text-red-600" />
        }
        return icons[action] || <FiActivity className="text-gray-500" />
    }

    const getActionColor = (action) => {
        const colors = {
            'consent_granted': 'border-green-200 bg-green-50',
            'consent_revoked': 'border-red-200 bg-red-50',
            'qr_generated': 'border-blue-200 bg-blue-50',
            'qr_accessed': 'border-purple-200 bg-purple-50',
            'qr_revoked': 'border-red-200 bg-red-50',
            'qr_expired': 'border-gray-200 bg-gray-50',
            'emergency_revoke_all': 'border-red-300 bg-red-100',
            'access_attempt_blocked': 'border-orange-200 bg-orange-50',
            'suspicious_activity_detected': 'border-red-300 bg-red-100'
        }
        return colors[action] || 'border-gray-200 bg-gray-50'
    }

    const data = activeView === 'logs' ? accessLogs : history

    if (loading && data.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <AiOutlineLoading3Quarters className="text-3xl text-primary animate-spin mr-3" />
                <span className="text-gray-600">Loading access history...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                    <FiAlertTriangle />
                    <span className="font-medium">Error loading history</span>
                </div>
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={() => fetchData(true)} variant="outline" size="sm" className="mt-3">
                    <FiRefreshCw className="mr-2" />
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FiClock className="text-primary" />
                        Access History
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Track who accessed your children's medical records
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveView('logs')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                activeView === 'logs'
                                    ? 'bg-white text-primary font-medium shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Access Logs
                        </button>
                        <button
                            onClick={() => setActiveView('history')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                activeView === 'history'
                                    ? 'bg-white text-primary font-medium shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Activity History
                        </button>
                    </div>

                    {/* Child filter */}
                    {childrenList.length > 1 && (
                        <div className="flex items-center gap-2">
                            <FiFilter className="text-gray-400" />
                            <select
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="all">All Children</option>
                                {childrenList.map(child => (
                                    <option key={child.patient_id} value={child.patient_id}>
                                        {child.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button onClick={() => fetchData(true)} variant="outline" size="sm">
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            {data.length === 0 ? (
                <Card className="p-8 text-center">
                    <FiClock className="text-4xl text-gray-400 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900">No History Yet</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        Access history will appear here when someone scans your shared QR codes.
                    </p>
                </Card>
            ) : (
                <>
                    {/* Timeline */}
                    <div className="space-y-4">
                        {activeView === 'logs' ? (
                            // Access Logs View
                            accessLogs.map((log) => (
                                <AccessLogCard key={log.log_id} log={log} />
                            ))
                        ) : (
                            // Activity History View
                            history.map((item) => (
                                <HistoryCard
                                    key={item.log_id}
                                    item={item}
                                    getActionIcon={getActionIcon}
                                    getActionColor={getActionColor}
                                />
                            ))
                        )}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center pt-4">
                            <Button
                                onClick={loadMore}
                                variant="outline"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <FiChevronDown className="mr-2" />
                                        Load More
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

const AccessLogCard = ({ log }) => {
    return (
        <Card className="p-4 border-l-4 border-l-purple-400">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                        <FiEye className="text-purple-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                                {log.patient_name}'s records accessed
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1">
                                <FiUser className="text-gray-400" />
                                {log.accessed_by}
                                {log.accessed_by_role && (
                                    <span className="text-xs text-gray-400">
                                        ({log.accessed_by_role})
                                    </span>
                                )}
                            </span>
                            {log.facility_name && (
                                <span className="flex items-center gap-1">
                                    <FiMapPin className="text-gray-400" />
                                    {log.facility_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                    <FiClock className="text-gray-400" />
                    {formatDate(log.accessed_at)}
                </div>
            </div>
        </Card>
    )
}

const HistoryCard = ({ item, getActionIcon, getActionColor }) => {
    return (
        <Card className={`p-4 border-l-4 ${getActionColor(item.action)}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full border">
                        {getActionIcon(item.action)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                                {item.action_label}
                            </span>
                            {item.patient_name && (
                                <span className="text-sm text-gray-600">
                                    - {item.patient_name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1">
                                <FiUser className="text-gray-400" />
                                {item.performed_by || 'System'}
                            </span>
                            {item.share_type && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                    {getShareTypeLabel(item.share_type)}
                                </span>
                            )}
                        </div>
                        {/* Show additional details if available */}
                        {item.details && Object.keys(item.details).length > 0 && (
                            <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                    View details
                                </summary>
                                <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(item.details, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <FiClock className="text-gray-400" />
                    {formatDate(item.performed_at)}
                </div>
            </div>
        </Card>
    )
}

export default AccessHistoryTimeline
