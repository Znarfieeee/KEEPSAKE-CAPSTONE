import React from "react"

const EditRoleModal = ({ open, onClose, onSubmit, isFacilityAdmin }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit User Role</h2>
                {!isFacilityAdmin && (
                    <div className="mb-4 text-red-500">
                        Only facility admins can edit roles.
                    </div>
                )}
                <form onSubmit={onSubmit} className="space-y-3">
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="User ID"
                        name="user_id"
                        disabled
                    />
                    <select
                        className="w-full border rounded px-3 py-2"
                        name="new_role">
                        <option value="">Select New Role</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="parent">Parent</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="staff">Staff</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        disabled={!isFacilityAdmin}>
                        Update Role
                    </button>
                </form>
                <button
                    className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 w-full"
                    onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default EditRoleModal
