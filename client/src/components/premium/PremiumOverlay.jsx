import { Link, useNavigate } from 'react-router-dom'
import { Lock, TrendingUp, Star, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PremiumOverlay = () => {
    const navigate = useNavigate()

    const premiumFeatures = [
        'Advanced analytics & insights',
        'Growth predictions & trends',
        'Unlimited report history',
        'Export medical records (PDF)',
        'Priority customer support',
        'Multiple children support',
    ]

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 -mr-32 -mt-32"></div>

                {/* Lock Icon */}
                <div className="relative flex justify-center mb-6">
                    <div className="bg-primary rounded-full p-6 shadow-lg">
                        <Lock className="h-12 w-12 text-white" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6 relative">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Premium Feature Locked
                    </h2>
                    <p className="text-lg text-gray-600">
                        Upgrade to Premium to unlock detailed health reports and analytics
                    </p>
                </div>

                {/* Features List */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 relative">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            What you'll get with Premium
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {premiumFeatures.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6 relative">
                    <div className="inline-flex items-baseline gap-2 bg-white border-2 border-blue-200 rounded-lg px-6 py-3 shadow-sm">
                        <span className="text-4xl font-bold text-primary">₱299</span>
                        <span className="text-gray-600 text-lg">/month</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Cancel anytime, no commitments</p>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 relative">
                    <Button
                        onClick={() => navigate('/checkout')}
                        className="w-full py-4 text-lg font-semibold bg-gradient-to-r bg-primary hover:bg-accent text-white shadow-lg flex items-center justify-center gap-2"
                    >
                        <TrendingUp className="h-5 w-5" />
                        Upgrade to Premium
                        <ArrowRight className="h-5 w-5" />
                    </Button>

                    <Link to={-1}>
                        <Button
                            variant="outline"
                            className="w-full py-3 text-base border-2 border-gray-300 hover:bg-gray-50"
                        >
                            Go Back
                        </Button>
                    </Link>
                </div>

                {/* Money-back guarantee badge */}
                <div className="mt-6 text-center relative">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Secure payment powered by Stripe
                    </p>
                </div>
            </div>
        </div>
    )
}

export default PremiumOverlay
