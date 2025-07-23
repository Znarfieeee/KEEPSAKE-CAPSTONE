import React from "react"

const ResetPasswordModal = ({ open, onClose, onReset }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
                <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                <p className="mb-4">Send a password reset link to this user?</p>
                <div className="flex justify-center gap-4">
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={onReset}>
                        Send Link
                    </button>
                    <button
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordModal
