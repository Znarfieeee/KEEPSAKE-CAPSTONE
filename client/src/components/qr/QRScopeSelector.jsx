import React from "react"
import { FiEye, FiAlertTriangle, FiFileText, FiActivity, FiCalendar, FiShield } from "react-icons/fi"
import { MdVaccines } from "react-icons/md"

const SCOPE_OPTIONS = [
    {
        id: "view_only",
        label: "Basic Info",
        description: "Name, date of birth, sex, blood type",
        icon: FiEye,
        color: "gray"
    },
    {
        id: "allergies",
        label: "Allergies",
        description: "Known allergies and reactions",
        icon: FiAlertTriangle,
        color: "red"
    },
    {
        id: "prescriptions",
        label: "Prescriptions",
        description: "Current and past prescriptions",
        icon: FiFileText,
        color: "blue"
    },
    {
        id: "vaccinations",
        label: "Vaccinations",
        description: "Immunization history",
        icon: MdVaccines,
        color: "green"
    },
    {
        id: "appointments",
        label: "Appointments",
        description: "Scheduled appointments",
        icon: FiCalendar,
        color: "purple"
    },
    {
        id: "vitals",
        label: "Vital Signs",
        description: "Anthropometric measurements",
        icon: FiActivity,
        color: "orange"
    },
    {
        id: "full_access",
        label: "Full Access",
        description: "Complete patient record",
        icon: FiShield,
        color: "indigo"
    }
]

const QRScopeSelector = ({
    selectedScopes = ["view_only"],
    onChange,
    disabled = false,
    allowFullAccess = false
}) => {
    const handleToggle = (scopeId) => {
        if (disabled) return

        let newScopes = [...selectedScopes]

        if (scopeId === "full_access") {
            // If selecting full access, clear other selections
            newScopes = ["full_access"]
        } else {
            // Remove full_access if selecting individual scopes
            newScopes = newScopes.filter(s => s !== "full_access")

            if (newScopes.includes(scopeId)) {
                // Remove scope
                newScopes = newScopes.filter(s => s !== scopeId)
                // Always keep at least view_only
                if (newScopes.length === 0) {
                    newScopes = ["view_only"]
                }
            } else {
                // Add scope
                newScopes.push(scopeId)
            }
        }

        onChange(newScopes)
    }

    const getColorClasses = (color, isSelected) => {
        if (!isSelected) {
            return "bg-gray-50 border-gray-200 hover:border-gray-300"
        }

        const colors = {
            gray: "bg-gray-100 border-gray-400 ring-2 ring-gray-200",
            red: "bg-red-50 border-red-400 ring-2 ring-red-100",
            blue: "bg-blue-50 border-blue-400 ring-2 ring-blue-100",
            green: "bg-green-50 border-green-400 ring-2 ring-green-100",
            purple: "bg-purple-50 border-purple-400 ring-2 ring-purple-100",
            orange: "bg-orange-50 border-orange-400 ring-2 ring-orange-100",
            indigo: "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-100"
        }
        return colors[color] || colors.gray
    }

    const getIconColorClass = (color) => {
        const colors = {
            gray: "text-gray-600",
            red: "text-red-600",
            blue: "text-blue-600",
            green: "text-green-600",
            purple: "text-purple-600",
            orange: "text-orange-600",
            indigo: "text-indigo-600"
        }
        return colors[color] || colors.gray
    }

    const filteredOptions = allowFullAccess
        ? SCOPE_OPTIONS
        : SCOPE_OPTIONS.filter(opt => opt.id !== "full_access")

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Data Access Scope
            </label>
            <p className="text-xs text-gray-500 mb-3">
                Select which patient data to share through this QR code
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredOptions.map((option) => {
                    const isSelected = selectedScopes.includes(option.id)
                    const Icon = option.icon

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleToggle(option.id)}
                            disabled={disabled}
                            className={`
                                relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200
                                ${getColorClasses(option.color, isSelected)}
                                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                ${isSelected ? "shadow-sm" : "hover:shadow-sm"}
                            `}
                        >
                            <div className={`mt-0.5 ${getIconColorClass(option.color)}`}>
                                <Icon className="text-xl" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm text-gray-900">
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <span className={`text-xs font-semibold ${getIconColorClass(option.color)}`}>
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {option.description}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Selected scopes summary */}
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-xs font-medium text-gray-600">
                    Selected: {selectedScopes.map(s => {
                        const opt = SCOPE_OPTIONS.find(o => o.id === s)
                        return opt?.label || s
                    }).join(", ")}
                </p>
            </div>
        </div>
    )
}

export default QRScopeSelector
