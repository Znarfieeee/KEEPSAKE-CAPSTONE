/**
 * FeedbackDetailModal Component
 * Modal for viewing and updating feedback details
 */

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
    Bug,
    Lightbulb,
    MessageSquare,
    HelpCircle,
    User,
    Clock,
    Calendar,
    Tag,
    Shield,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    XCircle,
} from 'lucide-react'
import {
    updateFeedback,
    getFeedbackTypeName,
    getFeedbackStatusName,
    getFeedbackStatusColor,
} from '@/api/feedback'
import { showToast } from '@/util/alertHelper'

// Type icons mapping
const TYPE_ICONS = {
    bug_report: Bug,
    feature_suggestion: Lightbulb,
    general_feedback: MessageSquare,
    question: HelpCircle,
}

// Type colors
const TYPE_COLORS = {
    bug_report: 'bg-red-100 text-red-800',
    feature_suggestion: 'bg-amber-100 text-amber-800',
    general_feedback: 'bg-cyan-100 text-cyan-800',
    question: 'bg-purple-100 text-purple-800',
}

// Status options
const STATUS_OPTIONS = [
    { value: 'submitted', label: 'Submitted', icon: Clock },
    { value: 'under_review', label: 'Under Review', icon: AlertCircle },
    { value: 'in_progress', label: 'In Progress', icon: Loader2 },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle },
    { value: 'closed', label: 'Closed', icon: XCircle },
]

/**
 * Info Row Component
 */
const InfoRow = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1">
            <p className="text-sm text-gray-500">{label}</p>
            <div className="font-medium text-gray-900">{children}</div>
        </div>
    </div>
)

/**
 * Main FeedbackDetailModal Component
 */
const FeedbackDetailModal = ({ feedback, isOpen, onClose, onUpdate }) => {
    // State
    const [status, setStatus] = useState('')
    const [adminNotes, setAdminNotes] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Initialize state when feedback changes
    useEffect(() => {
        if (feedback) {
            setStatus(feedback.status || 'submitted')
            setAdminNotes(feedback.admin_notes || '')
            setHasChanges(false)
        }
    }, [feedback])

    // Track changes
    useEffect(() => {
        if (feedback) {
            const statusChanged = status !== feedback.status
            const notesChanged = adminNotes !== (feedback.admin_notes || '')
            setHasChanges(statusChanged || notesChanged)
        }
    }, [status, adminNotes, feedback])

    // Handlers
    const handleSave = async () => {
        if (!feedback) return

        setIsSaving(true)
        try {
            const updateData = {}

            if (status !== feedback.status) {
                updateData.status = status
            }
            if (adminNotes !== (feedback.admin_notes || '')) {
                updateData.admin_notes = adminNotes
            }

            if (Object.keys(updateData).length === 0) {
                showToast('info', 'No changes to save.')
                return
            }

            await updateFeedback(feedback.feedback_id, updateData)

            showToast('success', 'Feedback has been updated successfully.')

            setHasChanges(false)
            if (onUpdate) onUpdate()
            onClose()
        } catch {
            showToast('Error', 'Failed to update feedback. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleClose = () => {
        if (hasChanges) {
            // Could add confirmation dialog here
        }
        onClose()
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (!feedback) return null

    const TypeIcon = TYPE_ICONS[feedback.feedback_type] || MessageSquare

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-lg ${
                                TYPE_COLORS[feedback.feedback_type] || 'bg-gray-100'
                            }`}
                        >
                            <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{feedback.subject}</DialogTitle>
                            <DialogDescription>
                                {getFeedbackTypeName(feedback.feedback_type)}
                                {feedback.category && ` • ${feedback.category.replace('_', ' ')}`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Status and Badges */}
                    <div className="flex flex-wrap gap-2">
                        <Badge className={getFeedbackStatusColor(feedback.status)}>
                            {getFeedbackStatusName(feedback.status)}
                        </Badge>
                        {feedback.is_anonymous && (
                            <Badge variant="outline">
                                <Shield className="h-3 w-3 mr-1" />
                                Anonymous
                            </Badge>
                        )}
                    </div>

                    {/* Feedback Message */}
                    <div>
                        <Label className="text-sm text-gray-500 mb-2 block">Message</Label>
                        <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {feedback.message}
                        </div>
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow icon={User} label="Submitted By">
                            {feedback.is_anonymous ? (
                                <span className="text-gray-500 italic">Anonymous</span>
                            ) : (
                                <span className="capitalize">
                                    {feedback.user_role?.replace('_', ' ') || 'Unknown'}
                                </span>
                            )}
                        </InfoRow>

                        <InfoRow icon={Tag} label="Category">
                            {feedback.category ? (
                                <span className="capitalize">
                                    {feedback.category.replace('_', ' ')}
                                </span>
                            ) : (
                                <span className="text-gray-500">Not specified</span>
                            )}
                        </InfoRow>

                        <InfoRow icon={Calendar} label="Submitted">
                            {formatDate(feedback.created_at)}
                        </InfoRow>

                        <InfoRow icon={Clock} label="Last Updated">
                            {formatDate(feedback.updated_at)}
                        </InfoRow>
                    </div>

                    <Separator />

                    {/* Admin Actions */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Admin Actions</h3>

                        {/* Status Update */}
                        <div>
                            <Label htmlFor="status" className="mb-2 block">
                                Update Status
                            </Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => {
                                        const StatusIcon = option.icon
                                        return (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className="h-4 w-4" />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Admin Notes */}
                        <div>
                            <Label htmlFor="admin-notes" className="mb-2 block">
                                Admin Notes
                            </Label>
                            <Textarea
                                id="admin-notes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add internal notes about this feedback..."
                                className="min-h-[100px] resize-y"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                These notes are only visible to administrators.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="bg-cyan-600 hover:bg-cyan-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default FeedbackDetailModal
