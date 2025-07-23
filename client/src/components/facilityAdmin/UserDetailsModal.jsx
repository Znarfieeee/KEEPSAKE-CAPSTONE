import React from "react"

const UserDetailsModal = ({ open, onClose, user }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">User Details</h2>
                <div className="mb-2">
                    <strong>Name:</strong> {user?.full_info || "—"}
                </div>
                <div className="mb-2">
                    <strong>Role:</strong> {user?.role || "—"}
                </div>
                <div className="mb-2">
                    <strong>Email:</strong> {user?.email || "—"}
                </div>
                <div className="mb-2">
                    <strong>Assigned Facility:</strong>{" "}
                    {user?.assigned_facility || "—"}
                </div>
                <button
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={user?.onAuditLog}>
                    View Audit Log
                </button>
                <button
                    className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    )
}

export default UserDetailsModal
