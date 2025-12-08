import React from 'react'
import PageHeader from '@/pages/components/landing/PageHeader'
import SectionContainer from '@/pages/components/landing/SectionContainer'
import TeamGallery3D from '@/pages/components/landing/TeamGallery3D'
import Footer4Col from '@/components/mvpblocks/footer-4col'
import { Target, Eye, Heart, Shield, Users, Lightbulb, Phone, Mail, MapPin } from 'lucide-react'

import devOne from '@/assets/11.jpg'
import devTwo from '@/assets/22.jpg'
import devThree from '@/assets/33.jpg'
import devFour from '@/assets/44.jpg'

const AboutPage = () => {
    // Team data - Replace with actual team member information
    const teamMembers = [
        {
            name: 'Mari Franz H. Espelita',
            role: 'Project Manager',
            bio: "Passionate about creating healthcare solutions that make a difference in families' lives.",
            image: devOne,
            linkedin: 'https://linkedin.com',
        },
        {
            name: 'Eldrin A. Trapa',
            role: 'Full Stack Developer',
            bio: 'Specialized in building secure and scalable healthcare management systems.',
            image: devTwo,
            linkedin: 'https://linkedin.com',
        },
        {
            name: 'Chad Rv G. Abcede',
            role: 'UI/UX Designer',
            bio: 'Focused on creating intuitive and beautiful user experiences for healthcare applications.',
            image: devThree,
            linkedin: 'https://linkedin.com',
        },
        {
            name: 'Rolly C. Alonso',
            role: 'Database Manager',
            bio: 'Expert in database architecture and API development for healthcare systems.',
            image: devFour,
            linkedin: 'https://linkedin.com',
        },
    ]

    const values = [
        {
            icon: <Heart className="h-10 w-10 text-rose-600" />,
            title: 'Care First',
            description: 'We prioritize the health and wellbeing of families above all else',
        },
        {
            icon: <Shield className="h-10 w-10 text-blue-600" />,
            title: 'Security & Privacy',
            description: 'Your data is protected with industry-leading security measures',
        },
        {
            icon: <Users className="h-10 w-10 text-green-600" />,
            title: 'Collaboration',
            description: 'Connecting families, doctors, and clinics for better care',
        },
        {
            icon: <Lightbulb className="h-10 w-10 text-orange-600" />,
            title: 'Innovation',
            description: 'Continuously improving healthcare through technology',
        },
        {
            icon: <Target className="h-10 w-10 text-purple-600" />,
            title: 'Excellence',
            description: 'Committed to delivering the highest quality service',
        },
        {
            icon: <Eye className="h-10 w-10 text-cyan-600" />,
            title: 'Transparency',
            description: 'Clear communication and honest practices in everything we do',
        },
    ]

    return (
        <>
            <PageHeader
                title="About KEEPSAKE"
                subtitle="Transforming healthcare management for families and medical professionals"
            />

            {/* Mission & Vision */}
            <SectionContainer background="bg-white">
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Target className="h-8 w-8 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            To empower families with easy access to their children's health records
                            and provide healthcare professionals with efficient tools to deliver
                            exceptional care. We believe every child deserves the best possible
                            start in life, supported by technology that makes healthcare management
                            simple and secure.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="h-8 w-8 text-green-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            To become the leading healthcare management platform that transforms how
                            families and medical professionals collaborate. We envision a future
                            where every child's health journey is documented, accessible, and used
                            to provide personalized, proactive care that helps them thrive.
                        </p>
                    </div>
                </div>
            </SectionContainer>

            {/* Company Story */}
            <SectionContainer background="bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
                        Our Story
                    </h2>
                    <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                        <p>
                            KEEPSAKE was born from a simple observation: managing a baby's health
                            records shouldn't be complicated. As parents ourselves, we experienced
                            firsthand the challenges of keeping track of vaccinations, medical
                            appointments, growth milestones, and medical reports across multiple
                            healthcare providers.
                        </p>
                        <p>
                            We recognized that while technology had transformed many aspects of our
                            lives, healthcare record management remained fragmented and inefficient.
                            Parents struggled with paper records, doctors worked with disconnected
                            systems, and valuable health information often got lost in the shuffle.
                        </p>
                        <p>
                            That's why we created KEEPSAKE – a comprehensive platform that brings
                            together families, clinics, and doctors in one secure ecosystem. Our
                            solution makes it easy to store, access, and share medical information,
                            ensuring that every child's health journey is well-documented and
                            accessible when needed.
                        </p>
                        <p>
                            Today, we're proud to serve families and healthcare facilities across
                            the Philippines, helping them provide better care through better
                            technology. This is just the beginning of our journey, and we're
                            committed to continuously improving and expanding our services to meet
                            the evolving needs of modern healthcare.
                        </p>
                    </div>
                </div>
            </SectionContainer>

            {/* Meet Our Team */}
            <div className="w-full bg-white overflow-x-hidden">
                <div className="mx-auto px-4 sm:px-6 py-16 md:py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Meet Our Development Team
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            The talented individuals behind KEEPSAKE, dedicated to creating
                            innovative healthcare solutions
                        </p>
                    </div>

                    {/* 3D Team Gallery with Text on Cards */}
                    <TeamGallery3D teamMembers={teamMembers} />
                </div>
            </div>

            {/* Our Values */}
            <SectionContainer background="bg-gradient-to-b from-blue-50 to-white">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Our Values
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        The principles that guide everything we do
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {values.map((value, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300"
                        >
                            <div className="mb-4">{value.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                            <p className="text-gray-600">{value.description}</p>
                        </div>
                    ))}
                </div>
            </SectionContainer>

            {/* Contact Information */}
            <SectionContainer background="bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Get In Touch
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Have questions? We'd love to hear from you
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                                <Phone className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Phone</h3>
                            <a
                                href="tel:+63123456789"
                                className="text-gray-300 hover:text-blue-400 transition-colors"
                            >
                                +63 123 456 789
                            </a>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                                <Mail className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
                            <a
                                href="mailto:hello@keepsake.com"
                                className="text-gray-300 hover:text-green-400 transition-colors"
                            >
                                hello@keepsake.com
                            </a>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                                <MapPin className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                            <p className="text-gray-300">Cebu City, Cebu, Philippines</p>
                        </div>
                    </div>
                </div>
            </SectionContainer>

            <Footer4Col />
        </>
    )
}

export default AboutPage
