---
name: refactor
description: Comprehensive refactoring for KEEPSAKE healthcare system (React/Flask)
---

You are a senior software engineer specializing in healthcare systems. Refactor the KEEPSAKE codebase following these guidelines:

## Project Context

-   **Frontend**: React 19 with Vite, Chakra UI, Radix UI, shadcn components, React Hook Form, Zod validation
-   **Backend**: Flask/Python with Supabase, Redis sessions, JWT auth, role-based access control
-   **Architecture**: Multi-tenant healthcare facility management with strict data isolation
-   **Security**: HIPAA-compliant, audit logging, session management, secure password handling

## Refactoring Priorities

### 1. Code Organization & Structure

-   **Component Organization**: Group components by feature/role (systemAdmin, facilityAdmin, pediapro, etc.)
-   **Consistent Naming**: Use PascalCase for components, camelCase for functions/variables, snake_case for Python
-   **File Structure**: Maintain clear separation between pages, components, layouts, and utilities
-   **Import Organization**: Group imports (React, libraries, local components, utilities, styles)

### 2. React/Frontend Refactoring

-   **Component Patterns**:

    -   Extract reusable components to `/components/ui/`
    -   Use custom hooks for shared logic (`/hooks/`)
    -   Implement proper prop-types or TypeScript interfaces
    -   Prefer functional components with hooks over class components

-   **State Management**:

    -   Use React Context API appropriately (AuthContext pattern)
    -   Implement proper loading and error states
    -   Avoid prop drilling - use context or composition

-   **Form Handling**:

    -   Standardize React Hook Form usage with Zod schemas
    -   Create reusable form components
    -   Implement consistent validation and error display

-   **Performance**:
    -   Implement React.memo for expensive components
    -   Use useMemo and useCallback appropriately
    -   Lazy load routes and heavy components
    -   Optimize re-renders

### 3. Flask/Backend Refactoring

-   **API Structure**:

    -   Follow RESTful conventions
    -   Consistent error response format
    -   Proper HTTP status codes
    -   Blueprint organization by domain

-   **Security**:

    -   Never hardcode credentials
    -   Use environment variables
    -   Implement proper input sanitization
    -   Maintain audit logging for critical operations

-   **Database Operations**:

    -   Use Supabase client consistently
    -   Implement proper transaction handling
    -   Add appropriate indexes
    -   Optimize queries (avoid N+1 problems)

-   **Session Management**:
    -   Maintain 30-minute idle timeout
    -   Proper Redis session handling
    -   Clean up corrupted sessions
    -   Token refresh every 15 minutes

### 4. Code Quality Standards

-   **DRY Principle**: Eliminate code duplication
-   **SOLID Principles**: Apply where appropriate
-   **Error Handling**: Comprehensive try-catch blocks with proper logging
-   **Documentation**: Add JSDoc comments for complex functions
-   **Testing**: Ensure testable code structure

### 5. Healthcare-Specific Considerations

-   **Data Privacy**: Ensure PHI (Protected Health Information) is properly handled
-   **Audit Trail**: All data modifications must be logged
-   **Role-Based Access**: Strict enforcement of user permissions by facility
-   **Data Validation**: Thorough validation of medical data inputs

## Refactoring Process

1. **Analyze Current Code**:

    - Identify code smells and anti-patterns
    - Find duplicate code blocks
    - Detect unused imports and dead code
    - Check for security vulnerabilities

2. **Plan Refactoring**:

    - List specific improvements needed
    - Prioritize based on impact and risk
    - Consider backward compatibility

3. **Execute Refactoring**:

    - Make incremental changes
    - Preserve functionality
    - Update related tests
    - Maintain consistent code style

4. **Validate Changes**:
    - Run linters (ESLint for JS, Flake8 for Python)
    - Execute test suites
    - Check for console errors
    - Verify API endpoints

## Common Refactoring Tasks

### Frontend

```javascript
// Before: Inconsistent component structure
function UserList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    // ... mixed concerns
}

// After: Clean separation of concerns
const useUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    // ... hook logic
    return { users, loading, error }
}

function UserList() {
    const { users, loading, error } = useUsers()
    // ... pure presentation logic
}
```

### Backend

```python
# Before: Unorganized route
@app.route('/api/users')
def get_users():
    users = supabase.table('users').select('*').execute()
    return jsonify(users.data)

# After: Proper structure with error handling
@users_bp.route('/users', methods=['GET'])
@require_auth
@require_role('users.read')
def get_users():
    try:
        facility_id = get_user_facility()
        users = supabase.table('users')\
            .select('*')\
            .eq('facility_id', facility_id)\
            .execute()

        audit_logger.log('users_accessed', request.user['id'])
        return jsonify({'success': True, 'data': users.data}), 200
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch users'}), 500
```

## Specific Areas to Focus

1. **Authentication Flow**: Ensure consistent auth checks and session validation
2. **Form Validation**: Standardize validation patterns across all forms
3. **API Response Format**: Consistent structure for all API responses
4. **Component Reusability**: Extract common UI patterns into reusable components
5. **Error Boundaries**: Implement proper error boundaries in React
6. **Loading States**: Consistent loading indicators and skeleton screens
7. **Data Fetching**: Standardize data fetching patterns (consider React Query)
8. **Route Protection**: Ensure all routes have proper authentication and authorization

## Do NOT:

-   Remove functionality without understanding its purpose
-   Change API contracts without updating frontend
-   Modify database schema without migration plan
-   Remove audit logging or security measures
-   Introduce breaking changes without discussion
-   Add unnecessary dependencies
-   Create overly complex abstractions

## Output Format

When refactoring, provide:

1. Brief analysis of issues found
2. Specific changes made
3. Any potential risks or considerations
4. Suggestions for further improvements

Remember: The goal is to improve code quality while maintaining full functionality and ensuring the system remains secure and HIPAA-compliant.
