/**
 * FeedbackForm Component
 * Comprehensive feedback submission form with accessibility features
 */

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Send, Loader2, EyeOff, Eye, CheckCircle } from 'lucide-react'
import FeedbackTypeSelector from './FeedbackTypeSelector'
import { submitFeedback } from '@/api/feedback'
import { showToast } from '@/util/alertHelper'

// Form validation schema
const feedbackSchema = z.object({
    feedback_type: z.string().min(1, 'Please select a feedback type'),
    category: z.string().optional(),
    subject: z
        .string()
        .min(5, 'Subject must be at least 5 characters')
        .max(255, 'Subject must be less than 255 characters'),
    message: z
        .string()
        .min(20, 'Please provide more detail (at least 20 characters)')
        .max(5000, 'Message must be less than 5000 characters'),
    is_anonymous: z.boolean().default(false),
})

// Category options based on feedback type
const CATEGORY_OPTIONS = {
    bug_report: [
        { value: 'login_issues', label: 'Login / Authentication' },
        { value: 'page_errors', label: 'Page Errors' },
        { value: 'data_issues', label: 'Data Not Displaying' },
        { value: 'slow_performance', label: 'Slow Performance' },
        { value: 'mobile_issues', label: 'Mobile / Tablet Issues' },
        { value: 'other', label: 'Other' },
    ],
    feature_suggestion: [
        { value: 'new_feature', label: 'New Feature Request' },
        { value: 'improvement', label: 'Improve Existing Feature' },
        { value: 'usability', label: 'Usability / Design' },
        { value: 'integration', label: 'Integration Request' },
        { value: 'other', label: 'Other' },
    ],
    general_feedback: [
        { value: 'compliment', label: 'Compliment' },
        { value: 'concern', label: 'Concern' },
        { value: 'suggestion', label: 'General Suggestion' },
        { value: 'other', label: 'Other' },
    ],
    question: [
        { value: 'how_to', label: 'How Do I...?' },
        { value: 'account', label: 'Account Question' },
        { value: 'feature', label: 'Feature Question' },
        { value: 'billing', label: 'Billing / Access' },
        { value: 'other', label: 'Other' },
    ],
}

/**
 * FeedbackForm - Main feedback submission form
 * @param {string} userRole - Current user's role for context
 * @param {Function} onSuccess - Callback after successful submission
 */
const FeedbackForm = ({ userRole = 'unknown', onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const form = useForm({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            feedback_type: '',
            category: '',
            subject: '',
            message: '',
            is_anonymous: false,
        },
    })

    const selectedType = form.watch('feedback_type')
    const isAnonymous = form.watch('is_anonymous')
    const categoryOptions = CATEGORY_OPTIONS[selectedType] || []

    const handleTypeChange = (type) => {
        form.setValue('feedback_type', type)
        form.setValue('category', '') // Reset category when type changes
    }

    const onSubmit = async (data) => {
        setIsSubmitting(true)

        try {
            const feedbackData = {
                ...data,
                user_role: userRole,
            }

            await submitFeedback(feedbackData)

            setIsSubmitted(true)
            showToast('success', 'Thank you for your feedback. We appreciate your input.')

            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            console.error('Error submitting feedback:', error)
            showToast('error', error.message || 'Failed to submit feedback. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        form.reset()
        setIsSubmitted(false)
    }

    // Success state
    if (isSubmitted) {
        return (
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="py-12 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-green-100 rounded-full">
                            <CheckCircle className="h-16 w-16 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                        Your feedback has been submitted successfully. We review all submissions and
                        use them to improve KEEPSAKE.
                    </p>
                    <Button onClick={resetForm} size="lg" className="min-h-[48px] px-8 text-base">
                        Submit Another Feedback
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Feedback Type Selection */}
                <FormField
                    control={form.control}
                    name="feedback_type"
                    render={({ field }) => (
                        <FormItem>
                            <FeedbackTypeSelector
                                selectedType={field.value}
                                onTypeChange={handleTypeChange}
                            />
                            <FormMessage className="text-base mt-2" />
                        </FormItem>
                    )}
                />

                {/* Show rest of form only after type is selected */}
                {selectedType && (
                    <>
                        {/* Category Selection */}
                        {categoryOptions.length > 0 && (
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-medium">
                                            Category (Optional)
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 text-base">
                                                    <SelectValue placeholder="Select a category..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categoryOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                        className="text-base py-3"
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-sm">
                                            Help us categorize your feedback for faster response.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Subject Field */}
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-medium">
                                        Subject <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Brief summary of your feedback..."
                                            className="h-14 text-base"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-sm">
                                        A short title describing your feedback.
                                    </FormDescription>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />

                        {/* Message Field */}
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-medium">
                                        Details <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Please provide as much detail as possible..."
                                            className="min-h-[200px] text-base leading-relaxed resize-y"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-sm">
                                        Include any relevant details, steps to reproduce (for bugs),
                                        or examples that would help us understand your feedback.
                                    </FormDescription>
                                    <FormMessage className="text-base" />
                                    <div className="text-right text-sm text-gray-500 mt-1">
                                        {field.value?.length || 0} / 5000 characters
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Anonymous Toggle */}
                        <FormField
                            control={form.control}
                            name="is_anonymous"
                            render={({ field }) => (
                                <FormItem>
                                    <Card
                                        className={`border-2 ${
                                            field.value
                                                ? 'border-amber-300 bg-amber-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`p-2 rounded-full ${
                                                            field.value
                                                                ? 'bg-amber-100'
                                                                : 'bg-gray-100'
                                                        }`}
                                                    >
                                                        {field.value ? (
                                                            <EyeOff className="h-6 w-6 text-amber-600" />
                                                        ) : (
                                                            <Eye className="h-6 w-6 text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor="anonymous-toggle"
                                                            className="text-base font-medium cursor-pointer"
                                                        >
                                                            Submit Anonymously
                                                        </Label>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {field.value
                                                                ? 'Your identity will not be attached to this feedback.'
                                                                : 'Your name will be visible to administrators.'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        id="anonymous-toggle"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="scale-125"
                                                    />
                                                </FormControl>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FormItem>
                            )}
                        />

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="min-h-[56px] px-8 text-lg font-semibold"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Submit Feedback
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </Form>
    )
}

export default FeedbackForm
