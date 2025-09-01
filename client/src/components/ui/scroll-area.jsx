import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

const cn = (...classes) => classes.filter(Boolean).join(' ')

function ScrollArea({
    className,
    children,
    variant = 'default',
    showScrollbar = 'hover', // "always" | "hover" | "scroll"
    scrollbarStyle = 'modern',
    maxHeight,
    ...props
}) {
    const [isScrolling, setIsScrolling] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const scrollTimeoutRef = React.useRef(null)

    const handleScroll = React.useCallback(() => {
        setIsScrolling(true)
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false)
        }, 1000)
    }, [])

    React.useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [])

    const shouldShowScrollbar =
        showScrollbar === 'always' ||
        (showScrollbar === 'hover' && (isHovered || isScrolling)) ||
        (showScrollbar === 'scroll' && isScrolling)

    const variants = {
        default: 'relative',
        glass: 'relative backdrop-blur-sm bg-white/70',
        minimal: 'relative',
        bordered: 'relative border border-gray-200 rounded-lg',
    }

    return (
        <ScrollAreaPrimitive.Root
            className={cn('relative overflow-hidden', variants[variant], className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                className="w-full h-full rounded-[inherit] outline-none"
                style={{ maxHeight }}
                onScroll={handleScroll}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {children}
            </ScrollAreaPrimitive.Viewport>

            <ScrollBar
                orientation="vertical"
                scrollbarStyle={scrollbarStyle}
                shouldShow={shouldShowScrollbar}
            />
            <ScrollBar
                orientation="horizontal"
                scrollbarStyle={scrollbarStyle}
                shouldShow={shouldShowScrollbar}
            />

            <ScrollAreaPrimitive.Corner className="bg-transparent" />
        </ScrollAreaPrimitive.Root>
    )
}

function ScrollBar({
    className,
    orientation = 'vertical',
    scrollbarStyle = 'modern',
    shouldShow = true,
    ...props
}) {
    const scrollbarStyles = {
        modern: {
            track:
                orientation === 'vertical'
                    ? 'h-full w-1.5 border-l border-l-transparent p-0'
                    : 'h-1.5 w-full border-t border-t-transparent p-0',
            thumb: 'bg-gray-300/60 hover:bg-gray-400/80 rounded-full transition-all duration-300 ease-out',
        },
        minimal: {
            track:
                orientation === 'vertical'
                    ? 'h-full w-1 border-l border-l-transparent p-0'
                    : 'h-1 w-full border-t border-t-transparent p-0',
            thumb: 'bg-gray-400/50 hover:bg-gray-500/70 rounded-full transition-all duration-200',
        },
        glass: {
            track:
                orientation === 'vertical'
                    ? 'h-full w-2 border-l border-l-transparent p-0.5'
                    : 'h-2 w-full border-t border-t-transparent p-0.5',
            thumb: 'bg-white/60 border border-gray-200/50 backdrop-blur-sm hover:bg-white/80 rounded-full transition-all duration-300 shadow-sm',
        },
        gradient: {
            track:
                orientation === 'vertical'
                    ? 'h-full w-2 border-l border-l-transparent p-0.5'
                    : 'h-2 w-full border-t border-t-transparent p-0.5',
            thumb: 'bg-gradient-to-b from-blue-400/70 to-blue-600/70 hover:from-blue-500/80 hover:to-blue-700/80 rounded-full transition-all duration-300 shadow-md',
        },
        neon: {
            track:
                orientation === 'vertical'
                    ? 'h-full w-1.5 border-l border-l-transparent p-0'
                    : 'h-1.5 w-full border-t border-t-transparent p-0',
            thumb: 'bg-cyan-400/60 hover:bg-cyan-400/80 rounded-full transition-all duration-300 shadow-cyan-400/30 hover:shadow-cyan-400/50 shadow-md',
        },
    }

    const currentStyle = scrollbarStyles[scrollbarStyle] || scrollbarStyles.modern

    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            orientation={orientation}
            className={cn(
                'flex touch-none select-none transition-all duration-300 ease-out',
                currentStyle.track,
                shouldShow ? 'opacity-100' : 'opacity-0',
                'hover:opacity-100',
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                className={cn(
                    'relative flex-1',
                    currentStyle.thumb,
                    'hover:scale-110 active:scale-95'
                )}
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    )
}

export { ScrollArea, ScrollBar }
