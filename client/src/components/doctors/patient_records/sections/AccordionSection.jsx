import { Info, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const AccordionSection = ({
    title,
    icon: Icon,
    isOpen,
    onToggle,
    children,
    info,
    isIncluded,
    onIncludeToggle,
}) => (
    <div className="border rounded-lg overflow-hidden bg-card">
        <div
            className={cn(
                'flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors',
                isOpen && 'bg-primary/10'
            )}
            onClick={onToggle}
        >
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                    {isOpen ? (
                        <ChevronDown size={20} className="text-muted-foreground" />
                    ) : (
                        <ChevronRight size={20} className="text-muted-foreground" />
                    )}
                    <Icon size={20} className="text-primary" />
                </div>
                <span className="font-medium text-foreground">{title}</span>
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={isIncluded}
                    onChange={(e) => {
                        e.stopPropagation()
                        onIncludeToggle()
                    }}
                    className="h-4 w-4 text-primary focus:ring-primary/20 border-input rounded"
                />
                <span className="text-sm text-muted-foreground">Include</span>
            </div>
        </div>
        {isOpen && (
            <div className="p-6 border-t bg-background">
                {!isIncluded && (
                    <div className="mb-4 p-3 bg-primary/10 border-l-4 border-primary rounded">
                        <div className="flex items-center">
                            <Info size={16} className="text-primary mr-2" />
                            <p className="text-sm text-muted-foreground">
                                This section will only be included if you check the box above.
                            </p>
                        </div>
                    </div>
                )}
                {children}
            </div>
        )}
    </div>
)

export default AccordionSection
