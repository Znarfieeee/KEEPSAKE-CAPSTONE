import { useNavigate } from 'react-router-dom'
import { XCircle, ArrowLeft, RotateCcw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PaymentCancel = () => {
    const navigate = useNavigate()

    const handleTryAgain = () => {
        navigate('/pricing')
    }

    const handleBackToDashboard = () => {
        navigate('/parent')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <XCircle className="h-20 w-20 text-orange-500 mx-auto" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">Payment Canceled</h1>
                        <p className="text-lg text-gray-600">
                            Your payment was not processed
                        </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                        <p className="text-orange-800 font-medium">No charges were made</p>
                        <p className="text-orange-700 text-sm">
                            You can try again when you&apos;re ready to upgrade to Premium
                        </p>
                    </div>

                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={handleTryAgain}
                            className="w-full"
                            variant="default"
                            size="lg"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>

                        <Button
                            onClick={handleBackToDashboard}
                            className="w-full"
                            variant="outline"
                            size="lg"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-gray-200 space-y-3">
                        <p className="text-sm text-gray-600">Need help with your payment?</p>
                        <a
                            href="mailto:support@keepsake.health"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <Mail className="h-4 w-4" />
                            Contact Support
                        </a>
                    </div>

                    <div className="pt-4">
                        <p className="text-xs text-gray-500">
                            Common payment issues: expired card, insufficient funds, or incorrect
                            billing information
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentCancel
