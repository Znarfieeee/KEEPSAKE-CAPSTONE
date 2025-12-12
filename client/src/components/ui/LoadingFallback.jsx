/**
 * LoadingFallback Component
 *
 * Reusable loading fallback for React.lazy() and Suspense boundaries.
 * Provides consistent loading UI across the application.
 */

import React from 'react'

export const LoadingFallback = ({
  message = 'Loading...',
  size = 'default',
  className = ''
}) => {
  const sizes = {
    small: 'h-4 w-4 border',
    default: 'h-6 w-6 border-2',
    large: 'h-8 w-8 border-2'
  }

  const spinnerSize = sizes[size] || sizes.default

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div
        className={`animate-spin rounded-full ${spinnerSize} border-blue-600 border-t-transparent`}
        role="status"
        aria-label={message}
      />
      {message && (
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      )}
    </div>
  )
}

export const ModalLoadingFallback = () => (
  <LoadingFallback message="Loading modal..." size="default" />
)

export const ComponentLoadingFallback = () => (
  <LoadingFallback message="" size="small" className="p-4" />
)

export default LoadingFallback
