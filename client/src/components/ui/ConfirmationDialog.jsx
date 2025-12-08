import { useId, useState } from 'react'
import { CircleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

export default function ConfirmationDialog({
    open,
    onOpenChange,
    title = 'Confirm Action',
    description,
    confirmText,
    onConfirm,
    requireTyping = false,
    destructive = false,
    loading = false,
}) {
    const id = useId()
    const [inputValue, setInputValue] = useState('')

    const handleConfirm = () => {
        onConfirm()
        setInputValue('') // Reset input
    }

    const isConfirmDisabled = requireTyping ? inputValue !== confirmText : false

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl space-y-4" showCloseButton={false}>
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <CircleAlertIcon className="opacity-80" size={16} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="sm:text-center">{title}</DialogTitle>
                        <DialogDescription className="sm:text-center">
                            {description}
                            {requireTyping && confirmText && (
                                <>
                                    {' '}
                                    To confirm, please type{' '}
                                    <span className="text-foreground font-semibold">
                                        {confirmText}
                                    </span>
                                    .
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-5">
                    {requireTyping && confirmText && (
                        <div className="*:not-first:mt-2">
                            <Label htmlFor={id}>Confirmation text</Label>
                            <Input
                                id={id}
                                type="text"
                                placeholder={`Type "${confirmText}" to confirm`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>
                    )}
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="" className="flex-1">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={isConfirmDisabled || loading}
                            onClick={handleConfirm}
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
