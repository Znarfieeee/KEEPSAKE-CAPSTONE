/**
 * Centralized Error Handler for KEEPSAKE
 * Provides consistent error handling and user-friendly messages
 */

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
  [ErrorTypes.AUTH]: 'Authentication failed. Please log in again.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
}

/**
 * Determine error type from error object
 */
export function getErrorType(error) {
  if (!error) return ErrorTypes.UNKNOWN

  // Network errors
  if (error.message === 'Network Error' || !navigator.onLine) {
    return ErrorTypes.NETWORK
  }

  // HTTP status-based errors
  if (error.response) {
    const status = error.response.status
    if (status === 401 || status === 403) return ErrorTypes.AUTH
    if (status === 404) return ErrorTypes.NOT_FOUND
    if (status === 422 || status === 400) return ErrorTypes.VALIDATION
    if (status >= 500) return ErrorTypes.SERVER
  }

  // Supabase-specific errors
  if (error.code) {
    if (error.code === 'PGRST301') return ErrorTypes.NOT_FOUND
    if (error.code === '42501') return ErrorTypes.PERMISSION
  }

  return ErrorTypes.UNKNOWN
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error) {
  const errorType = getErrorType(error)

  // Use custom message if provided
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  if (error.message && !error.message.includes('Error:')) {
    return error.message
  }

  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorTypes.UNKNOWN]
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error, context = '') {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
  }

  // In production, you could send to error tracking service
  if (import.meta.env.PROD && window.errorTracker) {
    window.errorTracker.captureException(error, { context })
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error, context = '') {
  logError(error, context)

  const userMessage = getUserMessage(error)
  const errorType = getErrorType(error)

  return {
    message: userMessage,
    type: errorType,
    originalError: error
  }
}

/**
 * Format validation errors from backend
 */
export function formatValidationErrors(errors) {
  if (typeof errors === 'string') return errors

  if (Array.isArray(errors)) {
    return errors.map(err => err.message || err).join(', ')
  }

  if (typeof errors === 'object') {
    return Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ')
  }

  return 'Validation failed'
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Safe async wrapper that catches errors
 */
export function safeAsync(fn) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error, fn.name)
      throw handleApiError(error, fn.name)
    }
  }
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error, type) {
  return getErrorType(error) === type
}

export default {
  ErrorTypes,
  getErrorType,
  getUserMessage,
  logError,
  handleApiError,
  formatValidationErrors,
  retryWithBackoff,
  safeAsync,
  isErrorType
}
