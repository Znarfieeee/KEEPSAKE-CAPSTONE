import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'

const AuditLogDetailsDialog = ({ log, open, onOpenChange }) => {
    // Get action badge color
    const getActionBadgeColor = (action) => {
        const colors = {
            CREATE: 'bg-green-100 text-green-800 border-green-300',
            UPDATE: 'bg-blue-100 text-blue-800 border-blue-300',
            DELETE: 'bg-red-100 text-red-800 border-red-300',
            VIEW: 'bg-purple-100 text-purple-800 border-purple-300',
        }
        return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300'
    }

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '—'
        const date = new Date(timestamp)
        return date.toLocaleString()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Audit Log Details</DialogTitle>
                    <DialogDescription>
                        Complete information about this audit log entry
                    </DialogDescription>
                </DialogHeader>
                {log && (
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="font-bold">Log ID</Label>
                            <code className="block text-xs bg-gray-100 p-2 rounded mt-1">
                                {log.log_id}
                            </code>
                        </div>

                        <div>
                            <Label className="font-bold">Timestamp</Label>
                            <p className="text-sm mt-1">{formatTimestamp(log.action_timestamp)}</p>
                        </div>

                        <div>
                            <Label className="font-bold">User</Label>
                            <p className="text-sm mt-1">
                                {log.users?.firstname} {log.users?.lastname} ({log.users?.email})
                            </p>
                            <Badge className="mt-1 bg-purple-100 text-purple-800 border-purple-300">
                                {log.users?.role}
                            </Badge>
                        </div>

                        <div>
                            <Label className="font-bold">Action</Label>
                            <div className="mt-1">
                                <Badge
                                    variant="outline"
                                    className={getActionBadgeColor(log.action_type)}
                                >
                                    {log.action_type}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <Label className="font-bold">Table</Label>
                            <code className="block text-xs mt-1">{log.table_name}</code>
                        </div>

                        <div>
                            <Label className="font-bold">Record ID</Label>
                            <code className="block text-xs bg-gray-100 p-2 rounded mt-1">
                                {log.record_id}
                            </code>
                        </div>

                        <div>
                            <Label className="font-bold">IP Address</Label>
                            <p className="text-sm font-mono mt-1">{log.ip_address || '—'}</p>
                        </div>

                        {log.session_id && (
                            <div>
                                <Label className="font-bold">Session ID</Label>
                                <code className="block text-xs bg-gray-100 p-2 rounded mt-1">
                                    {log.session_id}
                                </code>
                            </div>
                        )}

                        {log.old_values && (
                            <div>
                                <Label className="font-bold">Old Values</Label>
                                <code className="block text-xs bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(log.old_values, null, 2)}
                                </code>
                            </div>
                        )}

                        {log.new_values && (
                            <div>
                                <Label className="font-bold">New Values</Label>
                                <code className="block text-xs bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(log.new_values, null, 2)}
                                </code>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default AuditLogDetailsDialog
