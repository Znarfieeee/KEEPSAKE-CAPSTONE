import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    getConsentStats,
    getActiveShares,
    revokeAllShares
} from '@/api/consent'
import ActiveSharesPanel from '@/components/consent/ActiveSharesPanel'
import AccessHistoryTimeline from '@/components/consent/AccessHistoryTimeline'
import SharingRightsInfo from '@/components/consent/SharingRightsInfo'
import ConsentPreferencesForm from '@/components/consent/ConsentPreferencesForm'
import {
    FiShare2,
    FiClock,
    FiShield,
    FiSettings,
    FiAlertTriangle,
    FiUsers,
    FiActivity,
    FiTrendingUp
} from 'react-icons/fi'
import { MdQrCode2 } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const ParentConsentManagement = () => {
    const [activeTab, setActiveTab] = useState('shares')
    const [stats, setStats] = useState(null)
    const [children, setChildren] = useState([])
    const [loadingStats, setLoadingStats] = useState(true)
    const [emergencyRevokeOpen, setEmergencyRevokeOpen] = useState(false)
    const [selectedChildForRevoke, setSelectedChildForRevoke] = useState(null)
    const [revoking, setRevoking] = useState(false)
    const [revokeError, setRevokeError] = useState(null)

    const fetchStats = useCallback(async () => {
        setLoadingStats(true)
        try {
            const [statsResponse, sharesResponse] = await Promise.all([
                getConsentStats(),
                getActiveShares()
            ])
            setStats(statsResponse.stats || {})
            setChildren(sharesResponse.children || [])
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        } finally {
            setLoadingStats(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const handleEmergencyRevoke = async () => {
        if (!selectedChildForRevoke) return

        setRevoking(true)
        setRevokeError(null)
        try {
            await revokeAllShares(selectedChildForRevoke.patient_id, 'Emergency revoke all from Settings')
            setEmergencyRevokeOpen(false)
            setSelectedChildForRevoke(null)
            await fetchStats()
        } catch (err) {
            setRevokeError(err.message)
        } finally {
            setRevoking(false)
        }
    }

    const openEmergencyRevoke = (child) => {
        setSelectedChildForRevoke(child)
        setEmergencyRevokeOpen(true)
        setRevokeError(null)
    }

    return (
        <div className="p-6 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<FiUsers className="text-blue-500" />}
                    label="Children"
                    value={stats?.total_children || 0}
                    loading={loadingStats}
                />
                <StatCard
                    icon={<MdQrCode2 className="text-green-500" />}
                    label="Active Shares"
                    value={stats?.total_active_shares || 0}
                    loading={loadingStats}
                    highlight={stats?.total_active_shares > 0}
                />
                <StatCard
                    icon={<FiActivity className="text-purple-500" />}
                    label="Total Accesses"
                    value={stats?.total_accesses || 0}
                    loading={loadingStats}
                />
                <StatCard
                    icon={<FiTrendingUp className="text-orange-500" />}
                    label="Recent Activity"
                    value={stats?.recent_activity_count || 0}
                    subtitle="Last 7 days"
                    loading={loadingStats}
                />
            </div>

            {/* Emergency Revoke Section */}
            {children.length > 0 && stats?.total_active_shares > 0 && (
                <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                                <FiAlertTriangle className="text-red-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-red-900">Emergency Revoke All</h4>
                                <p className="text-sm text-red-700 mt-0.5">
                                    Immediately revoke all active QR codes for a child if you suspect unauthorized access.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {children.map(child => (
                                <Button
                                    key={child.patient_id}
                                    onClick={() => openEmergencyRevoke(child)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-100"
                                >
                                    Revoke All for {child.name.split(' ')[0]}
                                </Button>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger
                        value="shares"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                    >
                        <FiShare2 className="text-sm" />
                        <span>Active Shares</span>
                        {stats?.total_active_shares > 0 && (
                            <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                                {stats.total_active_shares}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                    >
                        <FiClock className="text-sm" />
                        <span>Access History</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="rights"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                    >
                        <FiShield className="text-sm" />
                        <span>Your Rights</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                    >
                        <FiSettings className="text-sm" />
                        <span>Preferences</span>
                    </TabsTrigger>
                </TabsList>

                {/* Active Shares Tab */}
                <TabsContent value="shares" className="mt-0">
                    <ActiveSharesPanel onRefresh={fetchStats} />
                </TabsContent>

                {/* Access History Tab */}
                <TabsContent value="history" className="mt-0">
                    <AccessHistoryTimeline children={children} />
                </TabsContent>

                {/* Your Rights Tab */}
                <TabsContent value="rights" className="mt-0">
                    <SharingRightsInfo />
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="mt-0">
                    <ConsentPreferencesForm />
                </TabsContent>
            </Tabs>

            {/* Emergency Revoke Dialog */}
            <AlertDialog open={emergencyRevokeOpen} onOpenChange={setEmergencyRevokeOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <FiAlertTriangle />
                            Emergency Revoke All Shares
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                You are about to revoke <strong>ALL</strong> active QR code shares for{' '}
                                <strong>{selectedChildForRevoke?.name}</strong>.
                            </p>
                            <p>
                                This will immediately prevent anyone from accessing{' '}
                                {selectedChildForRevoke?.name}'s medical information through any
                                previously shared QR codes.
                            </p>
                            <p className="font-medium text-red-700">
                                This action cannot be undone. You will need to generate new QR codes
                                if you want to share the information again.
                            </p>
                            {revokeError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                    {revokeError}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEmergencyRevoke}
                            disabled={revoking}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {revoking ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                                    Revoking All...
                                </>
                            ) : (
                                <>
                                    <FiAlertTriangle className="mr-2" />
                                    Revoke All Shares
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

const StatCard = ({ icon, label, value, subtitle, loading, highlight }) => (
    <Card className={`p-4 ${highlight ? 'border-green-200 bg-green-50' : ''}`}>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
                {icon}
            </div>
            <div>
                {loading ? (
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                    <div className={`text-2xl font-bold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
                        {value}
                    </div>
                )}
                <div className="text-sm text-gray-500">{label}</div>
                {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
            </div>
        </div>
    </Card>
)

export default ParentConsentManagement
