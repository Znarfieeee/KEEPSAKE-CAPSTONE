/**
 * FAQAccordion Component
 * Accessible, elder-friendly accordion for displaying FAQ items
 */

import React from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_INFO, ROLE_LABELS } from '@/data/faqContent'
import ReactMarkdown from 'react-markdown'

/**
 * Single FAQ Item component with markdown support
 */
const FAQItem = ({ faq, isExpanded, onToggle }) => {
    return (
        <AccordionItem
            value={faq.id}
            className="border border-gray-200 rounded-lg mb-3 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
        >
            <AccordionTrigger
                className="px-4 sm:px-6 py-4 sm:py-5 text-left hover:no-underline hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset"
                style={{ minHeight: '56px' }}
            >
                <div className="flex flex-col gap-2 w-full pr-2 sm:pr-4">
                    <span className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed">
                        {faq.question}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {faq.category && CATEGORY_INFO[faq.category] && (
                            <Badge
                                variant="secondary"
                                className="text-xs font-medium bg-cyan-100 text-cyan-800"
                            >
                                {CATEGORY_INFO[faq.category].label}
                            </Badge>
                        )}
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    <ReactMarkdown
                        components={{
                            // Style headings for better readability
                            h1: ({ children }) => (
                                <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-3">{children}</h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">{children}</h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-2">{children}</h3>
                            ),
                            // Style paragraphs with larger text for elderly users
                            p: ({ children }) => (
                                <p className="text-base leading-relaxed mb-4 text-gray-700">{children}</p>
                            ),
                            // Style lists with better spacing
                            ul: ({ children }) => (
                                <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                            ),
                            li: ({ children }) => (
                                <li className="text-base text-gray-700 leading-relaxed">{children}</li>
                            ),
                            // Style strong text
                            strong: ({ children }) => (
                                <strong className="font-bold text-gray-900">{children}</strong>
                            ),
                            // Style code blocks
                            code: ({ children }) => (
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-cyan-700">
                                    {children}
                                </code>
                            ),
                        }}
                    >
                        {faq.answer}
                    </ReactMarkdown>
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

/**
 * Main FAQAccordion component
 * @param {Array} faqs - Array of FAQ items to display
 * @param {boolean} allowMultiple - Allow multiple items to be expanded
 */
const FAQAccordion = ({ faqs = [], allowMultiple = true }) => {
    if (!faqs || faqs.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                <div className="text-gray-500 text-lg">
                    No FAQs found matching your criteria.
                </div>
                <p className="text-gray-400 mt-2">
                    Try adjusting your search or selecting a different category.
                </p>
            </div>
        )
    }

    return (
        <Accordion
            type={allowMultiple ? "multiple" : "single"}
            collapsible={!allowMultiple}
            className="space-y-2"
        >
            {faqs.map((faq) => (
                <FAQItem key={faq.id} faq={faq} />
            ))}
        </Accordion>
    )
}

export default FAQAccordion
