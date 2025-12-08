import React from 'react'
import { PhoneIcon } from 'lucide-react'
import * as RPNInput from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const PhoneInput = ({ className, ...props }) => {
    return (
        <Input
            type="tel"
            data-slot="phone-input"
            className={cn(
                'flex-1 rounded-s-none border-s-0 bg-background ps-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring',
                className
            )}
            {...props}
        />
    )
}

PhoneInput.displayName = 'PhoneInput'

const CountrySelect = ({ disabled, value, onChange, options }) => {
    return (
        <Select
            disabled={disabled}
            value={value}
            onValueChange={onChange}
            data-slot="country-select"
        >
            <SelectTrigger className="min-w-[80px] gap-2 rounded-e-none border-e-0 bg-background text-sm">
                <FlagComponent country={value} countryName={value} />
                <span className="text-sm">{value ? value.toUpperCase() : ''}</span>
            </SelectTrigger>
            <SelectContent>
                {options
                    .filter((x) => x.value)
                    .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                                <FlagComponent country={option.value} countryName={option.label} />
                                <span className="text-sm">{option.value.toUpperCase()}</span>
                            </span>
                        </SelectItem>
                    ))}
            </SelectContent>
        </Select>
    )
}

const FlagComponent = ({ country, countryName }) => {
    const Flag = flags[country]
    return (
        <span className="w-5 overflow-hidden rounded-sm">
            {Flag ? <Flag title={countryName} /> : <PhoneIcon size={16} aria-hidden="true" />}
        </span>
    )
}

export const PhoneNumberInput = ({ value, onChange, placeholder, className, ...props }) => {
    return (
        <div className="relative">
            <RPNInput.default
                className={cn('flex w-full', className)}
                international
                defaultCountry="PH"
                countryCallingCodeEditable={false}
                countrySelectComponent={CountrySelect}
                inputComponent={PhoneInput}
                placeholder={placeholder || 'Enter phone number'}
                value={value}
                onChange={onChange}
                {...props}
            />
        </div>
    )
}
