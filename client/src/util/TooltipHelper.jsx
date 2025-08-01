import React from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * A reusable tooltip component that wraps any element
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The trigger element that will show the tooltip
 * @param {string} props.content - The tooltip content
 * @param {string} props.side - The side of the tooltip (top, right, bottom, left)
 * @param {string} props.align - The alignment of the tooltip (start, center, end)
 * @returns {JSX.Element} - The tooltip component
 */
export const TooltipHelper = ({
    children,
    content,
    side = "top",
    align = "center",
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side={side} align={align} className="bg-white">
                    <p>{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default TooltipHelper
