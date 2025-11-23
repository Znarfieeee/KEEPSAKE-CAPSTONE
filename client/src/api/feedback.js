/**
 * Feedback API Functions
 * Handles all feedback-related API calls
 */

import backendConnection from "./backendApi"
import axios from "axios"
import { axiosConfig } from "./axiosConfig"

/**
 * Submit new feedback
 * @param {Object} feedbackData - The feedback data to submit
 * @param {string} feedbackData.feedback_type - Type: bug_report, feature_suggestion, general_feedback, question
 * @param {string} feedbackData.subject - Subject of the feedback
 * @param {string} feedbackData.message - Detailed message
 * @param {string} feedbackData.category - Optional category
 * @param {boolean} feedbackData.is_anonymous - Whether to submit anonymously
 * @param {string} feedbackData.user_role - User's role (for context)
 * @returns {Promise<Object>} Response from the API
 */
export const submitFeedback = async (feedbackData) => {
    try {
        const response = await axios.post(
            `${backendConnection()}/feedback`,
            feedbackData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error("Error submitting feedback:", error)
        throw error.response?.data || {
            status: 'error',
            message: 'Failed to submit feedback. Please try again.'
        }
    }
}

/**
 * Get all feedback (Admin only)
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status
 * @param {string} params.type - Filter by feedback type
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Response with feedback data and pagination
 */
export const getAllFeedback = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams()

        if (params.status) queryParams.append('status', params.status)
        if (params.type) queryParams.append('type', params.type)
        if (params.page) queryParams.append('page', params.page)
        if (params.limit) queryParams.append('limit', params.limit)

        const queryString = queryParams.toString()
        const url = `${backendConnection()}/feedback${queryString ? `?${queryString}` : ''}`

        const response = await axios.get(url, axiosConfig)
        return response.data
    } catch (error) {
        console.error("Error fetching feedback:", error)
        throw error.response?.data || {
            status: 'error',
            message: 'Failed to fetch feedback.'
        }
    }
}

/**
 * Get single feedback by ID (Admin only)
 * @param {string} feedbackId - The feedback ID
 * @returns {Promise<Object>} Response with feedback data
 */
export const getFeedbackById = async (feedbackId) => {
    try {
        const response = await axios.get(
            `${backendConnection()}/feedback/${feedbackId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error("Error fetching feedback:", error)
        throw error.response?.data || {
            status: 'error',
            message: 'Failed to fetch feedback details.'
        }
    }
}

/**
 * Update feedback status and notes (Admin only)
 * @param {string} feedbackId - The feedback ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.status - New status
 * @param {string} updateData.admin_notes - Admin notes
 * @returns {Promise<Object>} Response with updated feedback
 */
export const updateFeedback = async (feedbackId, updateData) => {
    try {
        const response = await axios.patch(
            `${backendConnection()}/feedback/${feedbackId}`,
            updateData,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error("Error updating feedback:", error)
        throw error.response?.data || {
            status: 'error',
            message: 'Failed to update feedback.'
        }
    }
}

/**
 * Delete feedback (System Admin only)
 * @param {string} feedbackId - The feedback ID to delete
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deleteFeedback = async (feedbackId) => {
    try {
        const response = await axios.delete(
            `${backendConnection()}/feedback/${feedbackId}`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error("Error deleting feedback:", error)
        throw error.response?.data || {
            status: 'error',
            message: 'Failed to delete feedback.'
        }
    }
}

/**
 * Get feedback statistics (Admin only)
 * @returns {Promise<Object>} Response with feedback statistics
 */
export const getFeedbackStats = async () => {
    try {
        const response = await axios.get(
            `${backendConnection()}/feedback/stats`,
            axiosConfig
        )
        return response.data
    } catch (error) {
        console.error("Error fetching feedback stats:", error)
        throw error.response?.data || {
            status: 'error',
            message: 'Failed to fetch feedback statistics.'
        }
    }
}

/**
 * Helper function to get human-readable feedback type
 * @param {string} type - The feedback type code
 * @returns {string} Human-readable type name
 */
export const getFeedbackTypeName = (type) => {
    const typeNames = {
        'bug_report': 'Bug Report',
        'feature_suggestion': 'Feature Suggestion',
        'general_feedback': 'General Feedback',
        'question': 'Question'
    }
    return typeNames[type] || type
}

/**
 * Helper function to get human-readable status
 * @param {string} status - The status code
 * @returns {string} Human-readable status name
 */
export const getFeedbackStatusName = (status) => {
    const statusNames = {
        'submitted': 'Submitted',
        'under_review': 'Under Review',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed'
    }
    return statusNames[status] || status
}

/**
 * Helper function to get status color class
 * @param {string} status - The status code
 * @returns {string} Tailwind color class
 */
export const getFeedbackStatusColor = (status) => {
    const statusColors = {
        'submitted': 'bg-blue-100 text-blue-800',
        'under_review': 'bg-yellow-100 text-yellow-800',
        'in_progress': 'bg-purple-100 text-purple-800',
        'resolved': 'bg-green-100 text-green-800',
        'closed': 'bg-gray-100 text-gray-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Helper function to get feedback type icon name (for lucide-react)
 * @param {string} type - The feedback type code
 * @returns {string} Icon name
 */
export const getFeedbackTypeIcon = (type) => {
    const typeIcons = {
        'bug_report': 'Bug',
        'feature_suggestion': 'Lightbulb',
        'general_feedback': 'MessageSquare',
        'question': 'HelpCircle'
    }
    return typeIcons[type] || 'MessageSquare'
}
