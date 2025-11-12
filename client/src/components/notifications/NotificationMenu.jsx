import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Check, MailOpen, Archive, Trash2 } from 'lucide-react'

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

    const handleAction = (action, e) => {
        e.stopPropagation()
        action()
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Ellipsis Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="More options"
            >
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="py-1">
                        {/* Mark as Read/Unread */}
                        {notification.is_read ? (
                            <button
                                onClick={(e) => handleAction(() => onMarkAsUnread(notification.notification_id), e)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <MailOpen className="h-4 w-4" />
                                Mark as unread
                            </button>
                        ) : (
                            <button
                                onClick={(e) => handleAction(() => onMarkAsRead(notification.notification_id), e)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <Check className="h-4 w-4" />
                                Mark as read
                            </button>
                        )}

                        {/* Archive */}
                        <button
                            onClick={(e) => handleAction(() => onArchive(notification.notification_id), e)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                            <Archive className="h-4 w-4" />
                            Archive
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        {/* Delete */}
                        <button
                            onClick={(e) => handleAction(() => onDelete(notification.notification_id), e)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationMenu
