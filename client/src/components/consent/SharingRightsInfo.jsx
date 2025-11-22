import React from 'react'
import { Card } from '@/components/ui/Card'
import {
    FiShield,
    FiLock,
    FiEye,
    FiXCircle,
    FiClock,
    FiAlertTriangle,
    FiCheckCircle,
    FiInfo,
    FiHelpCircle,
    FiMail,
    FiPhone,
    FiFileText,
    FiUsers,
    FiKey
} from 'react-icons/fi'
import { MdQrCode2, MdHealthAndSafety, MdGavel } from 'react-icons/md'

const SharingRightsInfo = () => {
    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                        <MdHealthAndSafety className="text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Your Rights as a Parent/Guardian</h2>
                        <p className="mt-2 text-blue-100">
                            As the parent or legal guardian of your child, you have full control over
                            who can access your child's medical information through KEEPSAKE.
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Rights Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                <RightCard
                    icon={<FiXCircle className="text-red-500" />}
                    title="Right to Revoke Access"
                    description="You can revoke any shared QR code at any time, immediately preventing further access to your child's medical information."
                    highlight="Immediate effect - no waiting period"
                />
                <RightCard
                    icon={<FiEye className="text-purple-500" />}
                    title="Right to Monitor Access"
                    description="View a complete history of who accessed your child's information, when, and from which healthcare facility."
                    highlight="Full transparency on all access"
                />
                <RightCard
                    icon={<FiLock className="text-orange-500" />}
                    title="Right to Control Scope"
                    description="Choose exactly what information is shared - from basic details to allergies, prescriptions, vaccinations, and more."
                    highlight="Granular control over data"
                />
                <RightCard
                    icon={<FiClock className="text-blue-500" />}
                    title="Right to Time-Limited Access"
                    description="Set expiration dates on all shared QR codes. Access automatically terminates when the time limit is reached."
                    highlight="Automatic expiration"
                />
            </div>

            {/* What You Can Share Section */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FiFileText className="text-primary" />
                    What Information Can Be Shared
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ScopeItem label="Basic Patient Info" description="Name, date of birth, blood type" />
                    <ScopeItem label="Allergies" description="Known allergies and reactions" />
                    <ScopeItem label="Prescriptions" description="Current and past medications" />
                    <ScopeItem label="Vaccinations" description="Immunization records" />
                    <ScopeItem label="Appointments" description="Scheduled and past visits" />
                    <ScopeItem label="Vitals & Measurements" description="Growth charts, BMI, vitals" />
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <FiInfo className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                            <strong>Important:</strong> You choose exactly which categories to include
                            when generating a QR code. Healthcare providers will only see the
                            information you explicitly authorize.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Security Features */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FiShield className="text-green-600" />
                    Security Features
                </h3>
                <div className="space-y-4">
                    <SecurityFeature
                        icon={<FiKey className="text-orange-500" />}
                        title="PIN Protection"
                        description="Add a 4-digit PIN to your QR codes for an extra layer of security. Recipients must enter the PIN to access the information."
                    />
                    <SecurityFeature
                        icon={<FiUsers className="text-blue-500" />}
                        title="Facility Restrictions"
                        description="Limit QR code access to specific healthcare facilities. Only authorized facilities can scan and view the information."
                    />
                    <SecurityFeature
                        icon={<FiClock className="text-purple-500" />}
                        title="Usage Limits"
                        description="Set a maximum number of times a QR code can be scanned. Once the limit is reached, the code becomes inactive."
                    />
                    <SecurityFeature
                        icon={<MdQrCode2 className="text-primary" />}
                        title="Encrypted QR Codes"
                        description="All QR codes use secure, encrypted tokens. The actual medical data is never stored in the QR code itself."
                    />
                    <SecurityFeature
                        icon={<FiAlertTriangle className="text-red-500" />}
                        title="Access Alerts"
                        description="Receive instant notifications whenever someone scans your child's QR code to access their medical information."
                    />
                </div>
            </Card>

            {/* Legal Rights */}
            <Card className="p-6 border-l-4 border-l-blue-500">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MdGavel className="text-blue-600" />
                    Your Legal Rights
                </h3>
                <div className="space-y-4 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>HIPAA Rights:</strong> Under the Health Insurance Portability and
                            Accountability Act (HIPAA), parents and legal guardians have the right to
                            access and control their minor child's protected health information (PHI).
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>Right to Access:</strong> You have the right to view and obtain
                            copies of your child's medical records at any time.
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>Right to Amend:</strong> You may request corrections to your
                            child's medical records if you believe there are errors.
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>Right to Restrict:</strong> You can request restrictions on how
                            your child's health information is used or disclosed.
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>Right to Accounting:</strong> You can request a list of
                            disclosures - who has accessed your child's medical information and when.
                        </div>
                    </div>
                </div>
            </Card>

            {/* Emergency Access */}
            <Card className="p-6 border-l-4 border-l-red-500">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FiAlertTriangle className="text-red-600" />
                    Emergency Access
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                    In emergency situations, you can optionally enable emergency access override
                    on your QR codes. This allows healthcare providers to access critical information
                    (allergies, current medications) even if they're not at a whitelisted facility,
                    provided they have the PIN code.
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <FiInfo className="text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-800">
                            <strong>Important:</strong> Emergency access is disabled by default.
                            You must explicitly enable it and the accessing provider must still
                            enter the PIN code to gain access.
                        </p>
                    </div>
                </div>
            </Card>

            {/* FAQ Section */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FiHelpCircle className="text-primary" />
                    Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                    <FAQItem
                        question="What happens when I revoke a QR code?"
                        answer="The QR code is immediately deactivated. Anyone who tries to scan it will receive a message that the code is no longer valid. They will not be able to access any information."
                    />
                    <FAQItem
                        question="Can I see who accessed my child's information?"
                        answer="Yes! The Access History tab shows a complete log of every access, including who accessed the information, when, and from which healthcare facility."
                    />
                    <FAQItem
                        question="What if I lose the QR code image?"
                        answer="The QR code is tied to a unique token in our system. If you lose the image, you can simply revoke the old code and generate a new one from the Share feature."
                    />
                    <FAQItem
                        question="Is my child's data stored in the QR code?"
                        answer="No. The QR code only contains an encrypted access token. The actual medical data is securely stored in our HIPAA-compliant database and is only retrieved when the token is validated."
                    />
                    <FAQItem
                        question="Can multiple facilities use the same QR code?"
                        answer="It depends on your settings. By default, QR codes can be used by any healthcare facility. You can restrict access to specific facilities if needed."
                    />
                </div>
            </Card>

            {/* Contact Section */}
            <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FiMail className="text-primary" />
                    Questions or Concerns?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    If you have questions about your rights or need assistance with consent
                    management, our support team is here to help.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a
                        href="mailto:support@keepsake.health"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <FiMail />
                        support@keepsake.health
                    </a>
                    <a
                        href="tel:+1-800-KEEPSAKE"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <FiPhone />
                        1-800-KEEPSAKE
                    </a>
                </div>
            </Card>
        </div>
    )
}

const RightCard = ({ icon, title, description, highlight }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
                <p className="text-xs text-primary font-medium mt-2">{highlight}</p>
            </div>
        </div>
    </Card>
)

const ScopeItem = ({ label, description }) => (
    <div className="p-3 bg-gray-50 rounded-lg">
        <div className="font-medium text-gray-900 text-sm">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
    </div>
)

const SecurityFeature = ({ icon, title, description }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="p-2 bg-white rounded-lg shadow-sm">
            {icon}
        </div>
        <div>
            <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        </div>
    </div>
)

const FAQItem = ({ question, answer }) => (
    <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-900 hover:text-primary">
            {question}
            <FiChevronDown className="transition-transform group-open:rotate-180" />
        </summary>
        <p className="mt-2 text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
            {answer}
        </p>
    </details>
)

const FiChevronDown = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 ${className}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
)

export default SharingRightsInfo
