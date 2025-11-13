import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Check, MailOpen, Archive, Trash2, Loader2 } from 'lucide-react'

/**
 * NotificationMenu Component
 * Dropdown menu with ellipsis icon for notification actions
 */
const NotificationMenu = ({
    notification,
    onMarkAsRead,
    onMarkAsUnread,
    onArchive,
    onDelete,
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const menuRef = useRef(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleAction = async (action, e, loadingSetter) => {
        e.stopPropagation()
        if (loadingSetter) {
            loadingSetter(true)
        }
        try {
            await action()
        } finally {
            if (loadingSetter) {
                loadingSetter(false)
            }
            setIsOpen(false)
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Ellipsis Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                title="More options"
            >
                <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="py-1">
                        {/* Mark as Read/Unread */}
                        {notification.is_read ? (
                            <button
                                onClick={(e) => handleAction(() => onMarkAsUnread(notification.notification_id), e, null)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                            >
                                <MailOpen className="h-4 w-4" />
                                Mark as unread
                            </button>
                        ) : (
                            <button
                                onClick={(e) => handleAction(() => onMarkAsRead(notification.notification_id), e, null)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                            >
                                <Check className="h-4 w-4" />
                                Mark as read
                            </button>
                        )}

                        {/* Archive */}
                        <button
                            onClick={(e) => handleAction(() => onArchive(notification.notification_id), e, setIsArchiving)}
                            disabled={isArchiving}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isArchiving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Archive className="h-4 w-4" />
                            )}
                            {isArchiving ? 'Archiving...' : 'Archive'}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-1"></div>

                        {/* Delete */}
                        <button
                            onClick={(e) => handleAction(() => onDelete(notification.notification_id), e, setIsDeleting)}
                            disabled={isDeleting}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationMenu
