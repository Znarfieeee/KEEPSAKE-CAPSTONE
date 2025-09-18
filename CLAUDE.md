# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KEEPSAKE is a healthcare facility management system with a React/Vite frontend and Flask/Python backend. The system manages healthcare facilities, users with role-based access control, patient records, appointments, and prescriptions.

## Development Commands

### Frontend (Client)
```bash
cd client
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (Server)
```bash
cd server
pip install -r requirements.txt    # Install dependencies
python main.py                      # Run Flask development server
```

## Architecture Overview

### Authentication & Session Management
- JWT-based authentication with Supabase integration
- Redis for session management with 30-minute idle timeout
- Token refresh every 15 minutes
- Google OAuth integration available
- Session verification on all protected routes

### Database Structure
- PostgreSQL via Supabase
- Key tables: users, facilities, patients, appointments, prescriptions, allergies, anthropometric_measurements
- User roles: system_admin, facility_admin, doctor (pediapro), vital_custodian, keepsaker
- Facility-based multi-tenancy

### API Architecture
The Flask backend uses blueprints for route organization:
- `auth_routes.py` - Authentication, session management, password reset
- `admin_routes.py` - System admin functionality
- `admin/admin_facility.py` - Facility management
- `admin/admin_users.py` - User management
- `pediapro/doctor_appointments.py` - Doctor appointment scheduling
- `pediapro/doctor_patient_records.py` - Patient record management
- `pediapro/doctor_patient_prescriptions.py` - Prescription management

All routes require authentication except login/register endpoints. User permissions are checked based on role and facility association.

### Frontend State Management
- React Context API for authentication state (`AuthContext`)
- Protected routes based on user roles
- Automatic session refresh and idle detection
- Component organization by feature/role (systemAdmin, facilityAdmin, pediapro, etc.)

### Key Technical Patterns
1. **Error Handling**: Centralized error responses with audit logging
2. **Audit Trail**: All critical operations logged via `audit_logger.py`
3. **Password Security**: Auto-generated secure passwords for new users
4. **CORS Configuration**: Configured for local development
5. **Component Libraries**: Chakra UI, Radix UI, shadcn components
6. **Form Handling**: React Hook Form with Zod validation

## Testing Approach
Check package.json for test scripts. The project uses React Testing Library for frontend tests. Backend testing approach should be verified in the codebase.

## Environment Variables
Both client and server require `.env` files with:
- Supabase credentials (URL, anon key, service key)
- Redis configuration (host, port, SSL)
- Google OAuth credentials (if using)

## Important Considerations
- This is a proprietary system with strict licensing
- All database operations go through Supabase client
- Facility isolation is critical - users can only access data from their assigned facility
- Session management uses Redis with automatic cleanup of corrupted sessions