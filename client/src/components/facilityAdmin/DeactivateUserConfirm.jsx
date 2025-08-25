import React from "react"

const DeactivateUserConfirm = ({ open, onClose, onConfirm }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
                <h2 className="text-xl font-bold mb-4">Deactivate User</h2>
                <p className="mb-4">
                    Are you sure you want to deactivate this user?
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        onClick={onConfirm}>
                        Deactivate
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

export default DeactivateUserConfirm
