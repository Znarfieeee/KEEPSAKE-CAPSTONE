# KEEPSAKE Healthcare System - Deployment Guide

This guide provides step-by-step instructions for deploying the KEEPSAKE Healthcare System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required Accounts & Services

- **Supabase Account** - Database and authentication
- **Redis Cloud** or **Redis instance** - Session management
- **Stripe Account** - Payment processing (optional for premium features)
- **Domain Name** - For production deployment
- **Hosting Platform** - Choose one:
  - **Backend**: Railway, Render, Heroku, DigitalOcean, AWS, Google Cloud
  - **Frontend**: Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront

### Required Tools

- Node.js 18+ and npm
- Python 3.10+
- Git
- PostgreSQL client (optional, for database management)

---

## Backend Deployment

### Option 1: Deploy to Railway (Recommended)

#### 1. Prepare the Backend

```bash
cd server
```

#### 2. Create a Procfile (if not exists)

```bash
echo "web: gunicorn main:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120" > Procfile
```

#### 3. Create runtime.txt (specify Python version)

```bash
echo "python-3.11.0" > runtime.txt
```

#### 4. Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Select "Deploy from GitHub repo"
4. Connect your KEEPSAKE repository
5. Set root directory to `server`
6. Configure environment variables (see [Environment Configuration](#environment-configuration))
7. Deploy

**Railway Environment Variables:**
- Add all variables from `.env`
- Set `PORT` (Railway provides this automatically)
- Set `FLASK_ENV=production`

#### 5. Set up Redis on Railway

1. In your Railway project, click "New Service"
2. Select "Redis"
3. Copy the Redis connection URL
4. Update your environment variables:
   - `REDIS_HOST` → Use Railway Redis internal URL
   - `REDIS_PORT` → Railway will provide
   - `REDIS_SSL=True`

---

### Option 2: Deploy to Render

#### 1. Create render.yaml

Create `server/render.yaml`:

```yaml
services:
  - type: web
    name: keepsake-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app --bind 0.0.0.0:$PORT --workers 4
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: FLASK_ENV
        value: production
```

#### 2. Deploy to Render

1. Go to [Render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repository
4. Set root directory to `server`
5. Configure environment variables
6. Deploy

#### 3. Add Redis on Render

1. Create a new Redis instance on Render
2. Copy the Internal Redis URL
3. Update environment variables

---

### Option 3: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create new app
heroku create keepsake-backend

# Add Redis addon
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SUPABASE_URL=your_supabase_url
# ... add all other env vars

# Deploy
git subtree push --prefix server heroku main

# Scale dynos
heroku ps:scale web=1
```

---

### Backend Environment Variables

Required environment variables for production:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Backend URL
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Flask Configuration
FLASK_SECRET_KEY=your_random_secret_key_here
FLASK_ENV=production

# Redis Configuration
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_SSL=True

# Session Configuration
SESSION_TIMEOUT=1800

# Stripe (if using premium features)
STRIPE_PUB_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email Configuration (for password reset)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@keepsake.com
SMTP_FROM_NAME=KEEPSAKE

# Logging
LOG_LEVEL=INFO
```

---

## Frontend Deployment

### Option 1: Deploy to Vercel (Recommended)

#### 1. Prepare the Frontend

```bash
cd client
```

#### 2. Create Production Environment File

Create `client/.env.production`:

```bash
VITE_API_URL=https://your-backend-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

#### 3. Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `client`
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add environment variables from `.env.production`
8. Deploy

---

### Option 2: Deploy to Netlify

#### 1. Create netlify.toml

Create `client/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### 2. Deploy to Netlify

1. Go to [Netlify.com](https://netlify.com)
2. Import from GitHub
3. Set base directory to `client`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables
7. Deploy

---

### Option 3: Deploy to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
cd client
npm run build
wrangler pages deploy dist
```

---

## Database Setup

### Supabase Configuration

#### 1. Create Supabase Project

1. Go to [Supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning

#### 2. Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Manual Migration (Alternative):**

1. Go to Supabase Dashboard → SQL Editor
2. Run all migration files in `server/migrations/` in order:
   - `create_2fa_verification_system.sql`
   - `add_password_reset_tables.sql`
   - Any other migration files

#### 3. Set up Row Level Security (RLS)

Ensure RLS is enabled on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

#### 4. Configure Storage Buckets

1. Go to Supabase Dashboard → Storage
2. Create buckets:
   - `avatars` - User profile pictures
   - `documents` - Medical documents
   - `prescriptions` - Prescription files

3. Set bucket policies for appropriate access control

---

## Environment Configuration

### Generating Secure Keys

```bash
# Generate Flask Secret Key
python -c "import secrets; print(secrets.token_hex(32))"

# Generate JWT Secret (if not using Supabase's)
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### CORS Configuration

Update `server/main.py` CORS settings for production:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://your-frontend-domain.com",
            "https://www.your-frontend-domain.com"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
```

---

## Post-Deployment

### 1. Health Check

Test your backend health endpoint:

```bash
curl https://your-backend-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T10:30:00Z"
}
```

### 2. Test Authentication

1. Navigate to your frontend URL
2. Try registering a new user
3. Test login functionality
4. Verify session persistence

### 3. Test Database Connectivity

```bash
curl https://your-backend-domain.com/api/test-db
```

### 4. Configure DNS

1. Point your domain to the deployed services:
   - Frontend: Add CNAME record pointing to Vercel/Netlify
   - Backend: Add A/CNAME record pointing to Railway/Render

2. Enable SSL certificates (automatic on most platforms)

### 5. Set up Monitoring

**Backend Monitoring:**
- Railway/Render provide built-in logging
- Set up error tracking (e.g., Sentry)

**Frontend Monitoring:**
- Vercel Analytics (automatic)
- Google Analytics (optional)

### 6. Configure Stripe Webhooks (if using payments)

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend-domain.com/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to environment variables

### 7. Test Email Functionality

Send a test password reset email:

```bash
curl -X POST https://your-backend-domain.com/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 8. Security Checklist

- ✅ All environment variables set to production values
- ✅ HTTPS enabled on both frontend and backend
- ✅ CORS configured for production domains only
- ✅ Database RLS policies enabled
- ✅ Redis password/SSL configured
- ✅ Session timeout configured (30 minutes recommended)
- ✅ Rate limiting enabled (if applicable)
- ✅ API keys rotated from development values
- ✅ Debug mode disabled (`FLASK_ENV=production`)
- ✅ Sensitive data not logged in production

---

## Troubleshooting

### Backend Issues

**Issue:** 500 Internal Server Error

```bash
# Check logs
railway logs  # For Railway
heroku logs --tail  # For Heroku
```

**Issue:** Redis connection failed

- Verify Redis SSL settings match your provider
- Check Redis host/port in environment variables
- Ensure Redis instance is running

**Issue:** Database connection timeout

- Verify Supabase credentials
- Check if Supabase project is paused (free tier)
- Review connection pool settings

### Frontend Issues

**Issue:** API calls failing with CORS error

- Update backend CORS configuration
- Ensure `VITE_API_URL` points to correct backend
- Check browser console for exact error

**Issue:** Environment variables not working

- Ensure all variables start with `VITE_`
- Rebuild the application after changing env vars
- Clear browser cache

**Issue:** Authentication not persisting

- Check if cookies are enabled
- Verify session timeout configuration
- Check Redis connectivity

---

## Scaling Considerations

### Backend Scaling

**Horizontal Scaling:**
```bash
# Railway: Increase replicas
# Render: Increase instance count
# Heroku: Scale dynos
heroku ps:scale web=3
```

**Vertical Scaling:**
- Upgrade to higher-tier hosting plan
- Increase worker processes in gunicorn:
  ```bash
  gunicorn main:app --workers 8 --threads 4
  ```

### Database Scaling

- Upgrade Supabase plan for more connections
- Implement connection pooling
- Add read replicas for analytics queries

### Caching Strategy

- Use Redis for session data (already implemented)
- Implement CDN for static assets (Cloudflare)
- Cache frequently accessed database queries

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check Redis memory usage
- Review API response times

**Weekly:**
- Review Supabase database size
- Check backup status
- Update dependencies (security patches)

**Monthly:**
- Rotate API keys
- Review access logs
- Performance optimization
- Cost analysis

### Backup Strategy

**Database Backups:**
- Supabase provides automatic daily backups (paid plans)
- Set up manual backup script:

```bash
# Backup Supabase database
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" > backup.sql
```

**Redis Backups:**
- Most Redis providers offer automatic snapshots
- Configure persistence settings

---

## Support

For issues or questions:
- Email: support@keepsake.com
- Documentation: www.keepsake.com/docs
- GitHub Issues: https://github.com/your-org/keepsake/issues

---

## License

Proprietary - All rights reserved. See LICENSE file for details.
