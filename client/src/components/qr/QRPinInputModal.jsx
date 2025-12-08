import React, { useState, useRef, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { FiLock, FiAlertCircle } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const QRPinInputModal = ({ isOpen, onClose, onSubmit, error, loading = false, maxLength = 4 }) => {
    const [pin, setPin] = useState(Array(maxLength).fill(''))
    const inputRefs = useRef([])

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus()
            setPin(Array(maxLength).fill(''))
        }
    }, [isOpen, maxLength])

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newPin = [...pin]
        newPin[index] = value
        setPin(newPin)

        // Auto-focus next input
        if (value && index < maxLength - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all digits are entered
        if (value && index === maxLength - 1 && newPin.every((digit) => digit !== '')) {
            onSubmit(newPin.join(''))
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            // Focus previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'Enter' && pin.every((digit) => digit !== '')) {
            // Submit on Enter if all digits filled
            onSubmit(pin.join(''))
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, maxLength)
        if (/^\d+$/.test(pastedData)) {
            const newPin = Array(maxLength).fill('')
            pastedData.split('').forEach((digit, i) => {
                if (i < maxLength) newPin[i] = digit
            })
            setPin(newPin)
            // Focus last filled input or submit if complete
            if (pastedData.length === maxLength) {
                onSubmit(pastedData)
            } else {
                inputRefs.current[pastedData.length]?.focus()
            }
        }
    }

    const handleSubmit = () => {
        if (pin.every((digit) => digit !== '')) {
            onSubmit(pin.join(''))
        }
    }

    const handleClear = () => {
        setPin(Array(maxLength).fill(''))
        inputRefs.current[0]?.focus()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <FiLock className="text-xl text-blue-600" />
                        </div>
                        <DialogTitle>Enter PIN Code</DialogTitle>
                    </div>
                    <DialogDescription>
                        This QR code is PIN protected. Please enter the {maxLength}-digit PIN to
                        access patient information.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {/* PIN Input Fields */}
                    <div className="flex justify-center gap-3">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                disabled={loading}
                                className={`
                                    w-14 h-16 text-center text-2xl font-bold
                                    border-2 rounded-lg transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    ${
                                        error
                                            ? 'border-red-400 bg-red-50'
                                            : 'border-gray-300 bg-white'
                                    }
                                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-600 justify-center">
                            <FiAlertCircle className="text-lg" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Helper Text */}
                    <p className="mt-4 text-xs text-center text-gray-500">
                        Enter the PIN provided by the person who shared this QR code
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        disabled={loading}
                        className="flex-1"
                    >
                        Clear
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || pin.some((digit) => digit === '')}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <AiOutlineLoading3Quarters className="animate-spin" />
                                Verifying...
                            </span>
                        ) : (
                            'Verify PIN'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default QRPinInputModal
