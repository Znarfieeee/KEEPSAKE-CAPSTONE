import React from "react"
// Placeholder for Shadcn Table and Button components

const mockUsers = [
    {
        id: 1,
        name: "Dr. Alice Smith",
        email: "alice@hospital.com",
        role: "doctor",
        status: "active",
        last_login: "2024-06-01",
        is_active: true,
    },
    {
        id: 2,
        name: "Nurse Bob Lee",
        email: "bob@nursing.com",
        role: "nurse",
        status: "inactive",
        last_login: "2024-05-28",
        is_active: false,
    },
]

const UserTable = ({
    users = mockUsers,
    onView,
    onEditRole,
    onDeactivate,
    onReactivate,
    onResetPassword,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                            Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                            Email
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                            Role
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                            Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                            Last Login
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">
                                {user.name}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                                {user.email}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                                {user.role}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                        user.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-200 text-gray-500"
                                    }`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                                {user.last_login}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                                <button
                                    className="text-blue-600 hover:underline"
                                    onClick={() => onView?.(user)}>
                                    View
                                </button>
                                <button
                                    className="text-yellow-600 hover:underline"
                                    onClick={() => onEditRole?.(user)}>
                                    Edit Role
                                </button>
                                {user.is_active ? (
                                    <button
                                        className="text-red-600 hover:underline"
                                        onClick={() => onDeactivate?.(user)}>
                                        Deactivate
                                    </button>
                                ) : (
                                    <button
                                        className="text-green-600 hover:underline"
                                        onClick={() => onReactivate?.(user)}>
                                        Reactivate
                                    </button>
                                )}
                                <button
                                    className="text-indigo-600 hover:underline"
                                    onClick={() => onResetPassword?.(user)}>
                                    Reset Password
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default UserTable
