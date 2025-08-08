import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../util/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-white shadow-xs hover:bg-primary/70 transition duration-300 delay-20 ease-in-out",
                destructive:
                    "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 transition duration-300 delay-20 ease-in-out",
                outline:
                    "border-1 bg-gray-100 shadow-sm hover:bg-gray-300/80 hover:text-accent-foreground transition duration-300 delay-20 ease-in-out",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 transition duration-300 delay-20 ease-in-out",
                ghost: "hover:bg-gray-200 hover:text-accent-foreground transition duration-300 delay-20 ease-in-out",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                xl: "h-14 rounded-lg px-8 has-[>svg]:px-8",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? Slot : "button"
    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button }
