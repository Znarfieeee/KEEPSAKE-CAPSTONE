import React from 'react'
import { Calendar } from 'lucide-react'

const MonthSelector = ({ value, onChange }) => {
    const generateMonthOptions = () => {
        const options = []
        const now = new Date()
        const minDate = new Date(2024, 0, 1) // January 2024
        let current = new Date(now.getFullYear(), now.getMonth(), 1)

        while (current >= minDate) {
            const yearMonth = `${current.getFullYear()}-${String(
                current.getMonth() + 1
            ).padStart(2, '0')}`
            const label = current.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
            })
            options.push({ value: yearMonth, label })
            current.setMonth(current.getMonth() - 1)
        }

        return options
    }

    return (
        <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-600" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {generateMonthOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default MonthSelector
