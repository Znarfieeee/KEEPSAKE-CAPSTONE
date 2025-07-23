import React from "react"

const StatusFilterDropdown = ({ options }) => (
    <select className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Status</option>
        {options.map(status => (
            <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
        ))}
    </select>
)

export default StatusFilterDropdown
