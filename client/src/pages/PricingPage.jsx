import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, ArrowRight, Mail, Phone, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/auth'
import PaymentModal from '@/components/payment/PaymentModal'
import { showToast } from '@/util/alertHelper'

const PricingPage = () => {
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const [selectedTab, setSelectedTab] = useState('parents')
    const [contactFormOpen, setContactFormOpen] = useState(false)
    const [selectedFacilityPlan, setSelectedFacilityPlan] = useState(null)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

    // Parent Plans Configuration
    const parentPlans = [
        {
            name: 'Free',
            price: '₱0',
            period: 'forever',
            description: 'Perfect for getting started with basic features',
            features: [
                'View medical reports',
                'Access vaccination records',
                'View growth charts',
                'Basic health tracking',
                'QR code sharing with doctors',
                'Appointment scheduling',
            ],
            limitations: [
                'Reports view only (no advanced analytics)',
                'Limited report history (6 months)',
            ],
            cta: 'Get Started Free',
            popular: false,
            action: () => navigate('/login'),
        },
        {
            name: 'Premium',
            price: '₱299',
            period: '/month',
            description: 'For parents who want comprehensive health insights',
            features: [
                'Advanced analytics & insights',
                'Growth predictions & trends',
                'Unlimited report history',
                'Milestone tracking & alerts',
                'Priority customer support',
                'Export medical records (PDF)',
                'Multiple children support',
                'Health recommendations',
            ],
            limitations: [],
            cta: 'Upgrade to Premium',
            popular: true,
            action: () => {
                if (isAuthenticated && user?.role === 'parent') {
                    setPaymentModalOpen(true)
                } else if (!isAuthenticated) {
                    navigate('/login?upgrade=premium')
                } else {
                    showToast('error', 'Premium plan is for parents only')
                }
            },
        },
    ]

    // Facility Plans Configuration
    const facilityPlans = [
        {
            name: 'Standard',
            price: '₱5,544',
            period: '/month',
            description: 'Ideal for small clinics and practices',
            features: [
                'Up to 50 active patients',
                'Basic patient management',
                'Appointment scheduling system',
                'Medical records storage',
                'QR code generation',
                'Email support',
                '2 staff accounts included',
                'Basic reporting',
            ],
            popular: false,
        },
        {
            name: 'Premium',
            price: '₱11,144',
            period: '/month',
            description: 'Perfect for growing healthcare facilities',
            features: [
                'Up to 200 active patients',
                'Advanced patient management',
                'Multi-doctor support (up to 5)',
                'Advanced analytics dashboard',
                'Custom report generation',
                'Priority email & phone support',
                'API access for integrations',
                'Automated appointment reminders',
                'Prescription management',
                'Vaccination tracking',
            ],
            popular: true,
        },
        {
            name: 'Enterprise',
            price: '₱22,344',
            period: '/month',
            description: 'For large hospitals and healthcare networks',
            features: [
                'Unlimited patients',
                'Unlimited staff accounts',
                'Multi-facility support',
                'Custom integrations & workflows',
                'Dedicated account manager',
                '24/7 priority support',
                'On-site training included',
                'SLA guarantees (99.9% uptime)',
                'Advanced security & compliance',
                'Custom feature development',
                'White-label options',
            ],
            popular: false,
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 py-16 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Simple, transparent pricing for parents and healthcare facilities. No hidden
                    fees, cancel anytime.
                </p>

                {/* Tab Selector */}
                <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-12 shadow-inner">
                    <button
                        onClick={() => setSelectedTab('parents')}
                        className={`px-8 py-3 rounded-lg font-medium transition-all ${
                            selectedTab === 'parents'
                                ? 'bg-white text-primary shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        For Parents
                    </button>
                    <button
                        onClick={() => setSelectedTab('facilities')}
                        className={`px-8 py-3 rounded-lg font-medium transition-all ${
                            selectedTab === 'facilities'
                                ? 'bg-white text-primary shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        For Facilities
                    </button>
                </div>
            </section>

            {/* Parent Plans */}
            {selectedTab === 'parents' && (
                <section className="max-w-7xl mx-auto px-6 pb-20">
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {parentPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl ${
                                    plan.popular ? 'ring-2 ring-primary relative scale-105' : ''
                                }`}
                            >
                                {plan.popular && (
                                    <div className="bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold py-2 px-4 text-center">
                                        ⭐ MOST POPULAR
                                    </div>
                                )}

                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-600 mb-6">{plan.description}</p>

                                    <div className="mb-8">
                                        <span className="text-5xl font-bold text-gray-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-600 ml-2 text-lg">
                                            {plan.period}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{feature}</span>
                                            </div>
                                        ))}
                                        {plan.limitations.map((limitation, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 text-gray-400"
                                            >
                                                <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                <span>{limitation}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={plan.action}
                                        className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                                            plan.popular
                                                ? 'bg-primary hover:bg-accent text-white shadow-lg'
                                                : 'bg-gray-800 hover:bg-gray-900 text-white'
                                        }`}
                                    >
                                        {plan.cta}
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Section for Parents */}
                    <div className="mt-20 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-6">
                            <FAQItem
                                question="Can I upgrade from Free to Premium anytime?"
                                answer="Yes! You can upgrade to Premium at any time. Your subscription starts immediately with full access to all Premium features."
                            />
                            <FAQItem
                                question="What payment methods do you accept?"
                                answer="We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment gateway."
                            />
                            <FAQItem
                                question="Can I cancel my Premium subscription?"
                                answer="Yes, you can cancel anytime from your account settings. Your Premium features will remain active until the end of your current billing period."
                            />
                            <FAQItem
                                question="Is my data secure?"
                                answer="Absolutely! We use bank-level encryption and comply with healthcare data protection standards. Your family's medical information is always secure and private."
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Facility Plans */}
            {selectedTab === 'facilities' && (
                <section className="max-w-7xl mx-auto px-6 pb-20">
                    <div className="grid md:grid-cols-3 gap-8">
                        {facilityPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl ${
                                    plan.popular ? 'ring-2 ring-primary md:scale-105' : ''
                                }`}
                            >
                                {plan.popular && (
                                    <div className="bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold py-2 px-4 text-center">
                                        ⭐ RECOMMENDED
                                    </div>
                                )}

                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-600 mb-6 min-h-[48px]">
                                        {plan.description}
                                    </p>

                                    <div className="mb-8">
                                        <span className="text-4xl font-bold text-gray-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-600 ml-2">{plan.period}</span>
                                    </div>

                                    <div className="space-y-3 mb-8 min-h-[320px]">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700 text-sm">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedFacilityPlan(plan.name.toLowerCase())
                                            setContactFormOpen(true)
                                        }}
                                        className="w-full py-3 px-6 bg-primary hover:bg-accent text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
                                    >
                                        Contact Sales
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Custom Enterprise CTA */}
                    <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border border-blue-100">
                        <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">
                            Need a Custom Solution?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-lg">
                            For hospitals and large healthcare organizations, we offer tailored
                            enterprise solutions with custom pricing, dedicated support, and
                            specialized features for your unique needs.
                        </p>
                        <Button
                            onClick={() => {
                                setSelectedFacilityPlan('enterprise')
                                setContactFormOpen(true)
                            }}
                            variant="outline"
                            size="xl"
                            className="px-8 py-3 bg-white font-semibold hover:shadow-lg transition-shadow border-2 border-accent"
                        >
                            Schedule a Demo
                        </Button>
                    </div>
                </section>
            )}

            {/* Contact Form Modal */}
            {contactFormOpen && (
                <FacilityContactModal
                    isOpen={contactFormOpen}
                    onClose={() => {
                        setContactFormOpen(false)
                        setSelectedFacilityPlan(null)
                    }}
                    selectedPlan={selectedFacilityPlan}
                />
            )}

            {/* Payment Modal */}
            {paymentModalOpen && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    planType="premium"
                    amount={299}
                />
            )}
        </div>
    )
}

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900">{question}</span>
                <span className="text-2xl text-gray-400">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
                <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
                    {answer}
                </div>
            )}
        </div>
    )
}

// Facility Contact Modal Component
const FacilityContactModal = ({ isOpen, onClose, selectedPlan }) => {
    const [formData, setFormData] = useState({
        facility_name: '',
        contact_person: '',
        email: '',
        phone: '',
        plan_interest: selectedPlan || 'standard',
        message: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/facility-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                setSubmitted(true)
                setTimeout(() => {
                    onClose()
                    setSubmitted(false)
                    setFormData({
                        facility_name: '',
                        contact_person: '',
                        email: '',
                        phone: '',
                        plan_interest: 'standard',
                        message: '',
                    })
                }, 3000)
            } else {
                setError(data.message || 'Failed to submit request')
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            setError('Network error. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    if (submitted) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">
                        We've received your request. Our sales team will contact you within 24
                        hours.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Contact Our Sales Team</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Fill out the form below and our team will get in touch to discuss how KEEPSAKE
                    can transform your facility's healthcare management.
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Facility Name *
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.facility_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, facility_name: e.target.value })
                                }
                                placeholder="e.g., Manila Medical Center"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Person *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.contact_person}
                                onChange={(e) =>
                                    setFormData({ ...formData, contact_person: e.target.value })
                                }
                                placeholder="Your full name"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    placeholder="+63 XXX XXX XXXX"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Interested Plan
                        </label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.plan_interest}
                            onChange={(e) =>
                                setFormData({ ...formData, plan_interest: e.target.value })
                            }
                        >
                            <option value="standard">Standard (₱5,544/month)</option>
                            <option value="premium">Premium (₱11,144/month)</option>
                            <option value="enterprise">Enterprise (₱22,344/month)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message (Optional)
                        </label>
                        <textarea
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us about your facility, number of patients, specific requirements, etc."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 px-6 bg-primary hover:bg-accent text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PricingPage
