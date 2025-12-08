# Error Handling Guide - KEEPSAKE

This guide explains the error handling improvements and utilities available in the KEEPSAKE Healthcare System.

## Overview

The codebase now includes:
1. **Centralized Error Handler** (Frontend)
2. **Structured Logging** (Backend)
3. **Error Boundary Component** (React)
4. **Consistent Error Messages**
5. **Production-Safe Logging**

---

## Frontend Error Handling

### Error Handler Utility (`client/src/utils/errorHandler.js`)

#### Basic Usage

```javascript
import { handleApiError, logError, getUserMessage } from '@/utils/errorHandler'

// In your API calls
try {
  const response = await axios.post('/api/login', data)
  return response.data
} catch (error) {
  const handledError = handleApiError(error, 'Login')
  // handledError contains: { message, type, originalError }
  setError(handledError.message)
}
```

#### Error Types

```javascript
import { ErrorTypes } from '@/utils/errorHandler'

// Available error types:
ErrorTypes.NETWORK      // Network/connection errors
ErrorTypes.AUTH         // Authentication errors (401, 403)
ErrorTypes.VALIDATION   // Validation errors (400, 422)
ErrorTypes.SERVER       // Server errors (500+)
ErrorTypes.NOT_FOUND    // Resource not found (404)
ErrorTypes.PERMISSION   // Permission denied
ErrorTypes.UNKNOWN      // Unknown errors
```

#### Retry with Backoff

```javascript
import { retryWithBackoff } from '@/utils/errorHandler'

// Automatically retry failed requests
const data = await retryWithBackoff(
  () => fetchPatientData(patientId),
  3,        // maxRetries
  1000      // initialDelay (ms)
)
```

#### Safe Async Wrapper

```javascript
import { safeAsync } from '@/utils/errorHandler'

// Wrap async functions for automatic error handling
const safeFetchData = safeAsync(async (id) => {
  const response = await api.get(`/data/${id}`)
  return response.data
})

// Usage - errors are automatically caught and formatted
try {
  const data = await safeFetchData(123)
} catch (error) {
  // error is already formatted with user-friendly message
  setError(error.message)
}
```

#### Development vs Production Logging

```javascript
import { logError } from '@/utils/errorHandler'

// Automatically logs only in development
logError(error, 'ComponentName')

// In production, sends to error tracking service (if configured)
```

### Error Boundary Component

#### Wrap Your App

```javascript
// src/main.jsx or App.jsx
import ErrorBoundary from '@/components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  )
}
```

#### Custom Fallback UI

```javascript
<ErrorBoundary
  fallback={({ error, resetError }) => (
    <div>
      <h1>Oops! Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )}
  onReset={() => {
    // Custom reset logic
    window.location.reload()
  }}
>
  <YourComponent />
</ErrorBoundary>
```

#### Granular Error Boundaries

```javascript
// Wrap specific components
function Dashboard() {
  return (
    <div>
      <ErrorBoundary fallback={<DashboardError />}>
        <DashboardContent />
      </ErrorBoundary>

      <ErrorBoundary fallback={<SidebarError />}>
        <Sidebar />
      </ErrorBoundary>
    </div>
  )
}
```

---

## Backend Error Handling

### Logger Configuration (`server/utils/logger_config.py`)

#### Setup in Flask App

```python
from utils.logger_config import setup_logging

app = Flask(__name__)
logger = setup_logging(app)

logger.info("Application started")
```

#### Using Logger in Routes

```python
from flask import current_app

@app.route('/api/data')
def get_data():
    try:
        current_app.logger.info("Fetching data")
        data = fetch_data()
        return jsonify(data), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching data: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch data"}), 500
```

#### Using Logger in Utility Files

```python
from utils.logger_config import get_logger

logger = get_logger('auth_utils')

def validate_token(token):
    try:
        logger.debug(f"Validating token")
        # validation logic
        logger.info("Token validated successfully")
    except Exception as e:
        logger.error(f"Token validation failed: {str(e)}", exc_info=True)
        raise
```

#### Logger Mixin for Classes

```python
from utils.logger_config import LoggerMixin

class PaymentProcessor(LoggerMixin):
    def process_payment(self, amount):
        self.logger.info(f"Processing payment: ${amount}")
        try:
            # payment logic
            self.logger.info("Payment successful")
        except Exception as e:
            self.logger.error(f"Payment failed: {str(e)}", exc_info=True)
            raise
```

#### Log Levels

```python
logger.debug("Detailed debug information")      # Development only
logger.info("General information")              # Normal operations
logger.warning("Warning - something unexpected") # Potential issues
logger.error("Error occurred")                  # Errors that need attention
logger.critical("Critical failure")             # System-level failures
```

#### Sanitize Sensitive Data

```python
from utils.logger_config import sanitize_log_data

user_data = {
    'email': 'user@example.com',
    'password': 'secret123',
    'name': 'John Doe'
}

# Remove sensitive fields before logging
safe_data = sanitize_log_data(user_data)
logger.info(f"User data: {safe_data}")
# Output: User data: {'email': 'user@example.com', 'password': '***REDACTED***', 'name': 'John Doe'}
```

#### Log API Requests/Responses

```python
from utils.logger_config import log_api_request, log_api_response
import time

@app.before_request
def before_request():
    request.start_time = time.time()
    log_api_request(current_app.logger, request)

@app.after_request
def after_request(response):
    if hasattr(request, 'start_time'):
        duration = (time.time() - request.start_time) * 1000
        log_api_response(current_app.logger, request, response, duration)
    return response
```

---

## Best Practices

### Frontend

1. **Always use error boundaries** for route components
2. **Use handleApiError** for all API calls
3. **Provide user-friendly messages** - never show raw error objects to users
4. **Log errors only in development** - use logError() utility
5. **Implement loading and error states** for all async operations
6. **Validate user input** before sending to backend
7. **Handle network failures gracefully** - show offline message

### Backend

1. **Use structured logging** - always use logger, never print()
2. **Set appropriate log levels** - DEBUG for development, INFO for production
3. **Sanitize sensitive data** before logging
4. **Log exceptions with context** - include relevant information
5. **Return consistent error responses** - use standard format
6. **Don't expose internal errors** to clients
7. **Use try-except blocks** for all external operations (DB, API, file I/O)

---

## Common Patterns

### API Call with Error Handling (Frontend)

```javascript
import { useState } from 'react'
import { handleApiError } from '@/utils/errorHandler'
import { login } from '@/api/auth'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (data) => {
    setLoading(true)
    setError(null)

    try {
      const response = await login(data)
      // Success handling
    } catch (err) {
      const handledError = handleApiError(err, 'Login')
      setError(handledError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorAlert message={error} />}
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### API Endpoint with Error Handling (Backend)

```python
from flask import current_app, jsonify, request
from utils.logger_config import sanitize_log_data

@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        current_app.logger.info("Creating user", extra={
            'data': sanitize_log_data(data)
        })

        # Validate input
        if not data.get('email'):
            current_app.logger.warning("Missing email in user creation")
            return jsonify({"error": "Email is required"}), 400

        # Business logic
        user = create_user_in_db(data)

        current_app.logger.info(f"User created successfully: {user['id']}")
        return jsonify(user), 201

    except ValidationError as e:
        current_app.logger.warning(f"Validation error: {str(e)}")
        return jsonify({"error": str(e)}), 422

    except DatabaseError as e:
        current_app.logger.error(f"Database error: {str(e)}", exc_info=True)
        return jsonify({"error": "Database operation failed"}), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500
```

---

## Configuration

### Environment Variables

```bash
# Backend (.env)
LOG_LEVEL=INFO              # DEBUG, INFO, WARNING, ERROR, CRITICAL
FLASK_ENV=production        # production, development

# Frontend (vite)
VITE_ENV=production         # Controls console.log visibility
```

### Log Files (Backend)

Logs are stored in `server/logs/`:
- `app.log` - All logs (DEBUG and above)
- `error.log` - Error logs only (ERROR and above)

Files rotate at 10MB, keeping 10 backup files.

---

## Migration from Console.log/Print

### Before (Frontend)

```javascript
// ❌ Don't do this
console.log('User data:', userData)
console.log('Error:', error)
```

### After (Frontend)

```javascript
// ✅ Do this instead
import { logError } from '@/utils/errorHandler'

// Logs only in development
logError(error, 'UserComponent')

// Or for success tracking in development
if (import.meta.env.DEV) {
  console.log('User data:', userData)
}
```

### Before (Backend)

```python
# ❌ Don't do this
print(f"User logged in: {user_id}")
print(f"Error: {error}")
```

### After (Backend)

```python
# ✅ Do this instead
from flask import current_app

current_app.logger.info(f"User logged in: {user_id}")
current_app.logger.error(f"Error: {str(error)}", exc_info=True)
```

---

## Testing Error Handling

### Test Error Boundary

```javascript
// Create a component that throws an error
function BrokenComponent() {
  throw new Error('Test error')
}

// Wrap in error boundary
<ErrorBoundary>
  <BrokenComponent />
</ErrorBoundary>

// Should display fallback UI
```

### Test API Error Handling

```javascript
import { handleApiError, ErrorTypes } from '@/utils/errorHandler'

// Simulate 401 error
const error401 = {
  response: { status: 401, data: { message: 'Unauthorized' } }
}

const handled = handleApiError(error401)
expect(handled.type).toBe(ErrorTypes.AUTH)
expect(handled.message).toBe('Unauthorized')
```

---

## Troubleshooting

### Frontend

**Issue:** Errors not showing in production
- **Solution:** Check that error boundaries are properly set up
- **Solution:** Verify error states are being rendered in UI

**Issue:** Console logs still appearing
- **Solution:** Ensure `import.meta.env.DEV` checks are in place
- **Solution:** Build production bundle and verify

### Backend

**Issue:** Logs not appearing
- **Solution:** Check `LOG_LEVEL` environment variable
- **Solution:** Verify `logs/` directory exists and is writable

**Issue:** Too many logs in production
- **Solution:** Set `LOG_LEVEL=WARNING` or `LOG_LEVEL=ERROR`
- **Solution:** Review and reduce INFO level logs

---

## Future Enhancements

1. **Error Tracking Service Integration**
   - Sentry, Rollbar, or similar
   - Automatic error reporting
   - Error grouping and trends

2. **User Feedback**
   - Allow users to report errors
   - Attach screenshots
   - Collect browser/device info

3. **Performance Monitoring**
   - Track slow API calls
   - Monitor component render times
   - Alert on performance degradation

4. **Advanced Logging**
   - Structured JSON logs
   - Log aggregation (ELK stack)
   - Real-time log monitoring

---

## Resources

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Python Logging Documentation](https://docs.python.org/3/library/logging.html)
- [Flask Logging](https://flask.palletsprojects.com/en/latest/logging/)
- [Error Handling Best Practices](https://www.toptal.com/javascript/handling-errors-gracefully)

---

**Last Updated:** December 08, 2025
