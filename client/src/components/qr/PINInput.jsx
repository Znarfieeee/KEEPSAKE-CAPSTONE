import React from 'react'
import { OTPInput } from 'input-otp'
import { cn } from '@/lib/utils'

const PINInput = ({ value, onChange, disabled = false, className = '' }) => {
    return (
        <OTPInput
            value={value}
            onChange={onChange}
            maxLength={4}
            disabled={disabled}
            containerClassName={cn(
                "flex items-center gap-2 has-[:disabled]:opacity-50",
                className
            )}
            render={({ slots }) => (
                <div className="flex gap-2">
                    {slots.map((slot, idx) => (
                        <Slot key={idx} {...slot} />
                    ))}
                </div>
            )}
        />
    )
}

function Slot(props) {
    return (
        <div
            className={cn(
                'relative flex size-12 items-center justify-center border-2 border-gray-300 bg-white rounded-lg font-mono text-2xl font-bold text-gray-900 shadow-sm transition-all',
                {
                    'border-primary ring-4 ring-primary/20 scale-105': props.isActive,
                    'border-green-500 bg-green-50': props.char !== null && !props.isActive
                }
            )}
        >
            {props.char !== null && <div>{props.char}</div>}
            {props.char === null && !props.isActive && (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
            )}
        </div>
    )
}

export default PINInput
