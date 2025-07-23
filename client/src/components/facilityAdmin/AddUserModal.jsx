import React from "react"

const AddUserModal = ({ open, onClose, onSubmit }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New User</h2>
                <form onSubmit={onSubmit} className="space-y-3">
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="First Name"
                        name="first_name"
                    />
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Last Name"
                        name="last_name"
                    />
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Email"
                        name="email"
                        type="email"
                    />
                    <select
                        className="w-full border rounded px-3 py-2"
                        name="role">
                        <option value="">Select Role</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="parent">Parent</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="staff">Staff</option>
                    </select>
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Phone Number"
                        name="phone_number"
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Add User
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

export default AddUserModal
