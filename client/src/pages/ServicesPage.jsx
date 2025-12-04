import React from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/pages/components/landing/PageHeader'
import SectionContainer from '@/pages/components/landing/SectionContainer'
import Footer4Col from '@/components/mvpblocks/footer-4col'
import { Button } from '@/components/ui/Button'
import {
    Baby,
    Heart,
    TrendingUp,
    Calendar,
    Bell,
    Award,
    Building2,
    Users,
    BarChart3,
    ClipboardList,
    FileText,
    Stethoscope,
    Pill,
    Syringe,
    Clock,
    Smartphone,
} from 'lucide-react'

const ServicesPage = () => {
    const parentFeatures = [
        {
            icon: <FileText className="h-8 w-8 text-blue-600" />,
            title: 'View Medical Reports',
            description: "Access your baby's complete medical history anytime, anywhere",
        },
        {
            icon: <Heart className="h-8 w-8 text-rose-600" />,
            title: 'QR Code Sharing',
            description:
                'Share medical records securely with any healthcare provider using QR codes',
        },
        {
            icon: <TrendingUp className="h-8 w-8 text-green-600" />,
            title: 'Growth Tracking',
            description: "Monitor your baby's growth milestones and development progress",
        },
        {
            icon: <Calendar className="h-8 w-8 text-purple-600" />,
            title: 'Appointment Management',
            description: 'Schedule and manage doctor appointments with ease',
        },
        {
            icon: <Syringe className="h-8 w-8 text-cyan-600" />,
            title: 'Vaccination Tracking',
            description: 'Keep track of all vaccinations and receive timely reminders',
        },
        {
            icon: <Award className="h-8 w-8 text-orange-600" />,
            title: 'Milestone Recording',
            description: 'Document and celebrate important developmental milestones',
        },
    ]

    const clinicFeatures = [
        {
            icon: <Building2 className="h-8 w-8 text-blue-600" />,
            title: 'Patient Management',
            description: 'Comprehensive system for managing patient records and visits',
        },
        {
            icon: <Users className="h-8 w-8 text-green-600" />,
            title: 'Multi-Doctor Support',
            description: 'Manage multiple doctors and staff within your facility',
        },
        {
            icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
            title: 'Analytics Dashboard',
            description: 'Track clinic performance with detailed analytics and reports',
        },
        {
            icon: <Calendar className="h-8 w-8 text-cyan-600" />,
            title: 'Appointment System',
            description: 'Efficient appointment scheduling and queue management',
        },
        {
            icon: <ClipboardList className="h-8 w-8 text-orange-600" />,
            title: 'Digital Prescriptions',
            description: 'Create and manage digital prescriptions for all patients',
        },
    ]

    const doctorFeatures = [
        {
            icon: <Stethoscope className="h-8 w-8 text-blue-600" />,
            title: 'Digital Prescriptions',
            description: 'Create, manage, and track patient prescriptions digitally',
        },
        {
            icon: <FileText className="h-8 w-8 text-green-600" />,
            title: 'Patient Records Access',
            description: 'Access comprehensive patient medical history instantly',
        },
        {
            icon: <Syringe className="h-8 w-8 text-rose-600" />,
            title: 'Vaccination Management',
            description: 'Track and manage patient vaccination schedules',
        },
        {
            icon: <Clock className="h-8 w-8 text-purple-600" />,
            title: 'Appointment Schedule',
            description: 'View and manage your daily appointment schedule',
        },
        {
            icon: <Smartphone className="h-8 w-8 text-cyan-600" />,
            title: 'Mobile Access',
            description: 'Access patient information on-the-go from any device',
        },
    ]

    const renderFeatureSection = (title, subtitle, features, bgColor) => (
        <SectionContainer background={bgColor}>
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-gray-600">{feature.description}</p>
                    </div>
                ))}
            </div>
        </SectionContainer>
    )

    return (
        <>
            <PageHeader
                title="Our Services"
                subtitle="Comprehensive healthcare management solutions for families and medical professionals"
            />

            {/* For Parents */}
            {renderFeatureSection(
                'For Parents',
                "Everything you need to manage your baby's health journey with confidence",
                parentFeatures,
                'bg-blue-50'
            )}

            {/* For Clinics */}
            {renderFeatureSection(
                'For Clinics',
                'Streamline your clinic operations with our comprehensive management system',
                clinicFeatures,
                'bg-white'
            )}

            {/* For Doctors */}
            {renderFeatureSection(
                'For Doctors',
                'Professional tools designed to enhance patient care and workflow efficiency',
                doctorFeatures,
                'bg-green-50'
            )}

            {/* CTA Section */}
            <SectionContainer background="bg-gradient-to-r bg-primary">
                <div className="text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join KEEPSAKE today and experience the future of healthcare management
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/login">
                            <Button
                                variant="default"
                                className="px-8 py-4 text-lg bg-white text-primary hover:bg-gray-100 hover:scale-105 transition-all duration-300"
                            >
                                Get Started
                            </Button>
                        </Link>
                        <Link to="/pricing">
                            <Button
                                variant="outline"
                                className="px-8 py-4 text-lg bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary hover:scale-105 transition-all duration-300"
                            >
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                </div>
            </SectionContainer>

            <Footer4Col />
        </>
    )
}

export default ServicesPage
