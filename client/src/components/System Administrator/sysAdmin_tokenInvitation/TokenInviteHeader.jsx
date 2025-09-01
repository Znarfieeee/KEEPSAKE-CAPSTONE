import React, { useState, lazy, Suspense } from 'react'

// UI Components
import { Button } from '@/components/ui/Button'
import { Download, BarChart3, PlusCircle } from 'lucide-react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'

// Lazy load with error boundary fallback
const InviteUserModal = lazy(() => import('./InviteUserModal'))

const TokenInviteHeader = ({
    onExportCSV,
    onOpenReports,
    facilities,
    onCreateInvitation,
    isLoading,
}) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1>Token Invitations</h1>
                <div className="flex flex-wrap gap-3">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Invite User
                            </Button>
                        </DialogTrigger>
                        <Suspense fallback={null}>
                            <InviteUserModal
                                facilities={facilities}
                                onCreateInvitation={onCreateInvitation}
                                isLoading={isLoading}
                                setIsOpen={setIsOpen}
                            />
                        </Suspense>
                    </Dialog>

                    <Button onClick={onExportCSV} variant="outline" className="border-gray-200">
                        <Download className="h-4 w-4 mr-2" />
                        Export to CSV
                    </Button>

                    <Button onClick={onOpenReports} variant="outline" className="border-gray-200">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Reports
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default TokenInviteHeader
