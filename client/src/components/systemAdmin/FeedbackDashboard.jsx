/**
 * FeedbackDashboard Component
 * Admin dashboard for viewing and managing user feedback
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    MessageSquare,
    Bug,
    Lightbulb,
    HelpCircle,
    Search,
    RefreshCw,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    Loader2,
    BarChart3,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
} from 'lucide-react'
import {
    getAllFeedback,
    getFeedbackStats,
    deleteFeedback,
    getFeedbackTypeName,
    getFeedbackStatusName,
    getFeedbackStatusColor,
} from '@/api/feedback'
import FeedbackDetailModal from './FeedbackDetailModal'
import { showToast } from '@/util/alertHelper'
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

// Type icons mapping
const TYPE_ICONS = {
    bug_report: Bug,
    feature_suggestion: Lightbulb,
    general_feedback: MessageSquare,
    question: HelpCircle,
}

// Status icons mapping
const STATUS_ICONS = {
    submitted: Clock,
    under_review: AlertCircle,
    in_progress: Loader2,
    resolved: CheckCircle,
    closed: XCircle,
}

/**
 * Stats Card Component
 */
const StatsCard = ({ title, value, icon: Icon, color = 'cyan', subtitle }) => {
    const colorClasses = {
        cyan: 'bg-cyan-100 text-cyan-600',
        amber: 'bg-amber-100 text-amber-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600',
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Main FeedbackDashboard Component
 */
const FeedbackDashboard = () => {
    // State
    const [feedbackList, setFeedbackList] = useState([])
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Filters
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10

    // Modal states
    const [selectedFeedback, setSelectedFeedback] = useState(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [feedbackToDelete, setFeedbackToDelete] = useState(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Fetch feedback data
    const fetchFeedback = useCallback(async () => {
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
            }

            if (statusFilter !== 'all') params.status = statusFilter
            if (typeFilter !== 'all') params.type = typeFilter

            const response = await getAllFeedback(params)

            if (response.status === 'success') {
                setFeedbackList(response.data || [])
                setTotalPages(response.pagination?.total_pages || 1)
                setTotalItems(response.pagination?.total || 0)
            }
        } catch (error) {
            console.error('Error fetching feedback:', error)
            showToast('error', 'Failed to load feedback. Please try again.')
        }
    }, [currentPage, statusFilter, typeFilter, showToast])

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await getFeedbackStats()
            if (response.status === 'success') {
                setStats(response.data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }, [])

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([fetchFeedback(), fetchStats()])
            setIsLoading(false)
        }
        loadData()
    }, [fetchFeedback, fetchStats])

    // Refresh when filters change
    useEffect(() => {
        if (!isLoading) {
            fetchFeedback()
        }
    }, [currentPage, statusFilter, typeFilter])

    // Handlers
    const handleRefresh = async () => {
        setIsRefreshing(true)
        await Promise.all([fetchFeedback(), fetchStats()])
        setIsRefreshing(false)
    }

    const handleViewDetails = (feedback) => {
        setSelectedFeedback(feedback)
        setIsDetailModalOpen(true)
    }

    const handleDeleteClick = (feedback) => {
        setFeedbackToDelete(feedback)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!feedbackToDelete) return

        setIsDeleting(true)
        try {
            await deleteFeedback(feedbackToDelete.feedback_id)
            showToast('success', 'Feedback has been deleted successfully.')
            await handleRefresh()
        } catch {
            showToast('error', 'Failed to delete feedback.')
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
            setFeedbackToDelete(null)
        }
    }

    const handleFeedbackUpdate = () => {
        fetchFeedback()
        fetchStats()
    }

    // Filter feedback by search term (client-side)
    const filteredFeedback = feedbackList.filter((item) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
            item.subject?.toLowerCase().includes(term) ||
            item.message?.toLowerCase().includes(term) ||
            item.user_role?.toLowerCase().includes(term)
        )
    })

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
                    <p className="text-gray-600">View and manage user feedback and suggestions</p>
                </div>
                <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatsCard
                        title="Total Feedback"
                        value={stats.total}
                        icon={BarChart3}
                        color="cyan"
                    />
                    <StatsCard
                        title="Bug Reports"
                        value={stats.by_type?.bug_report || 0}
                        icon={Bug}
                        color="red"
                    />
                    <StatsCard
                        title="Feature Requests"
                        value={stats.by_type?.feature_suggestion || 0}
                        icon={Lightbulb}
                        color="amber"
                    />
                    <StatsCard
                        title="Pending Review"
                        value={
                            (stats.by_status?.submitted || 0) + (stats.by_status?.under_review || 0)
                        }
                        icon={Clock}
                        color="purple"
                    />
                    <StatsCard
                        title="Resolved"
                        value={stats.by_status?.resolved || 0}
                        icon={CheckCircle}
                        color="green"
                    />
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                        {/* Search */}
                        <div className="flex-1 relative max-w-2xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search feedback..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col sm:flex-row">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="under_review">Under Review</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Type Filter */}
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="bug_report">Bug Reports</SelectItem>
                                    <SelectItem value="feature_suggestion">
                                        Feature Suggestions
                                    </SelectItem>
                                    <SelectItem value="general_feedback">
                                        General Feedback
                                    </SelectItem>
                                    <SelectItem value="question">Questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
                {filteredFeedback.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12 text-gray-500">
                            No feedback found matching your criteria.
                        </CardContent>
                    </Card>
                ) : (
                    filteredFeedback.map((feedback) => {
                        const TypeIcon = TYPE_ICONS[feedback.feedback_type] || MessageSquare
                        const StatusIcon = STATUS_ICONS[feedback.status] || Clock

                        return (
                            <Card key={feedback.feedback_id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <TypeIcon className="h-5 w-5 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-600">
                                                {getFeedbackTypeName(feedback.feedback_type)}
                                            </span>
                                        </div>
                                        <Badge className={getFeedbackStatusColor(feedback.status)}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {getFeedbackStatusName(feedback.status)}
                                        </Badge>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {feedback.subject}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                                        <span className="capitalize">
                                            {feedback.user_role?.replace('_', ' ') || 'Unknown'}
                                        </span>
                                        {feedback.is_anonymous && (
                                            <Badge variant="outline" className="text-xs">
                                                Anonymous
                                            </Badge>
                                        )}
                                        <span>•</span>
                                        <span>{formatDate(feedback.created_at)}</span>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetails(feedback)}
                                            className="flex-1"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(feedback)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden lg:block">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Type</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="w-[120px]">Role</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFeedback.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-12 text-gray-500"
                                    >
                                        No feedback found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFeedback.map((feedback) => {
                                    const TypeIcon =
                                        TYPE_ICONS[feedback.feedback_type] || MessageSquare
                                    const StatusIcon = STATUS_ICONS[feedback.status] || Clock

                                    return (
                                        <TableRow
                                            key={feedback.feedback_id}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <TypeIcon className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {
                                                            getFeedbackTypeName(
                                                                feedback.feedback_type
                                                            ).split(' ')[0]
                                                        }
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate max-w-[300px]">
                                                        {feedback.subject}
                                                    </p>
                                                    {feedback.is_anonymous && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs mt-1"
                                                        >
                                                            Anonymous
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize text-sm text-gray-600">
                                                    {feedback.user_role?.replace('_', ' ') ||
                                                        'Unknown'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={getFeedbackStatusColor(
                                                        feedback.status
                                                    )}
                                                >
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {getFeedbackStatusName(feedback.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatDate(feedback.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(feedback)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(feedback)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination - Works for both mobile and desktop */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white rounded-lg border mt-4">
                    <p className="text-sm text-gray-500 text-center sm:text-left">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="min-w-[44px] min-h-[44px]"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="min-w-[44px] min-h-[44px]"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <FeedbackDetailModal
                feedback={selectedFeedback}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedFeedback(null)
                }}
                onUpdate={handleFeedbackUpdate}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this feedback? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default FeedbackDashboard
