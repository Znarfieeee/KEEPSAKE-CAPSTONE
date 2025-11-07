'use client'

import * as React from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Tabs({ className, orientation = 'horizontal', ...props }) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            orientation={orientation}
            className={cn('flex', orientation === 'vertical' ? 'flex-row' : 'flex-col', className)}
            {...props}
        />
    )
}

function TabsList({ className, orientation = 'horizontal', ...props }) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'bg-muted text-muted-foreground/70 inline-flex items-center justify-center rounded-md p-0.5',
                orientation === 'vertical' ? 'flex-col h-fit' : 'w-fit',
                className
            )}
            {...props}
        />
    )
}

function TabsTrigger({ className, orientation = 'horizontal', ...props }) {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                'hover:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs [&_svg]:shrink-0',
                orientation === 'vertical' ? 'w-full' : '',
                className
            )}
            {...props}
        />
    )
}

function TabsContent({ className, orientation = 'horizontal', ...props }) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn(
                'flex-1 outline-none min-w-0 w-full',
                orientation === 'vertical' ? 'ml-4' : 'mt-2',
                className
            )}
            {...props}
        />
    )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
