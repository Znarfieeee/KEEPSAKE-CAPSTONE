import React from "react"

const RoleFilterDropdown = ({ options }) => (
    <select className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Roles</option>
        {options.map(role => (
            <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
        ))}
    </select>
)

export default RoleFilterDropdown
