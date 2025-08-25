/**
 * Sanitizes user input to prevent XSS attacks and SQL injection
 * @param {string} input - The user input to sanitize
 * @returns {string} - The sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== "string") {
        return input
    }

    return (
        input
            // Remove HTML tags
            .replace(/<[^>]*>/g, "")
            // Replace special characters
            .replace(/[&<>"'`=\/]/g, "")
            // Remove SQL injection attempts
            .replace(/(\b)(on\S+)(\s*)=/g, "") // Remove JS event handlers
            .replace(/(javascript|script|eval|trustedTypes)/gi, "")
            .replace(
                /(([\0-\x08,\x0B,\x0C,\x0E-\x1F,\x7F]|^-|#|--|;|\\|\/\*|\*\/|\+)+)/g,
                ""
            ) // Remove SQL special chars
            .trim()
    )
}

/**
 * Sanitizes an object's string values recursively
 * @param {Object} obj - The object containing values to sanitize
 * @returns {Object} - A new object with sanitized values
 */
export function sanitizeObject(obj) {
    if (typeof obj !== "object" || obj === null) {
        return sanitizeInput(obj)
    }

    return Object.keys(obj).reduce(
        (acc, key) => {
            if (typeof obj[key] === "object" && obj[key] !== null) {
                acc[key] = sanitizeObject(obj[key])
            } else {
                acc[key] = sanitizeInput(obj[key])
            }
            return acc
        },
        Array.isArray(obj) ? [] : {}
    )
}

/**
 * Sanitizes form data from an event
 * @param {Event} event - The form submission event
 * @returns {Object} - An object containing the sanitized form data
 */
export function sanitizeFormData(event) {
    const formData = new FormData(event.target)
    const sanitizedData = {}

    for (let [key, value] of formData.entries()) {
        sanitizedData[key] = sanitizeInput(value)
    }

    return sanitizedData
}
