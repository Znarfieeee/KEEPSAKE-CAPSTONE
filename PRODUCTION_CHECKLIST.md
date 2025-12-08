# KEEPSAKE Production Deployment Checklist

Use this checklist before deploying to production to ensure all requirements are met.

## Pre-Deployment Checklist

### 1. Code Review
- [ ] All features tested locally
- [ ] No console.log statements in production code
- [ ] All TODO comments resolved or documented
- [ ] Code follows project conventions
- [ ] No hardcoded credentials or API keys
- [ ] Error handling implemented for all critical paths

### 2. Environment Configuration

#### Backend (.env)
- [ ] `FLASK_ENV=production`
- [ ] `FLASK_SECRET_KEY` - Random, secure, 32+ characters
- [ ] `BACKEND_URL` - Production backend URL
- [ ] `FRONTEND_URL` - Production frontend URL
- [ ] `SUPABASE_URL` - Production Supabase URL
- [ ] `SUPABASE_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service key
- [ ] `SUPABASE_JWT_SECRET` - Production JWT secret
- [ ] `REDIS_HOST` - Production Redis host
- [ ] `REDIS_PORT` - Production Redis port
- [ ] `REDIS_SSL=True`
- [ ] `SESSION_TIMEOUT=1800`
- [ ] `STRIPE_SECRET_KEY` - Live key (if using)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `SMTP_EMAIL` - Production email
- [ ] `SMTP_PASSWORD` - App-specific password
- [ ] `LOG_LEVEL=INFO`

#### Frontend (.env.production)
- [ ] `VITE_API_URL` - Production backend URL
- [ ] `VITE_SUPABASE_URL` - Production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Production anon key
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Live publishable key

### 3. Database Setup

- [ ] Supabase project created
- [ ] All migrations applied
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies configured correctly
- [ ] Storage buckets created (avatars, documents, prescriptions)
- [ ] Storage bucket policies configured
- [ ] Database backup configured
- [ ] Sample data removed (if any)

### 4. Security

- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured for production domains only
- [ ] No development/test credentials in production
- [ ] API rate limiting configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented
- [ ] CSRF protection enabled
- [ ] Session timeout configured
- [ ] Password strength requirements enforced
- [ ] 2FA system tested
- [ ] Sensitive data encrypted at rest
- [ ] Audit logging enabled

### 5. Performance

- [ ] Database queries optimized
- [ ] Indexes created on frequently queried columns
- [ ] Images optimized and compressed
- [ ] Frontend bundle size checked and optimized
- [ ] CDN configured for static assets
- [ ] Caching strategy implemented
- [ ] Connection pooling configured
- [ ] Lazy loading implemented for large components

### 6. Monitoring & Logging

- [ ] Error tracking service configured (e.g., Sentry)
- [ ] Application logs configured
- [ ] Database slow query logging enabled
- [ ] Uptime monitoring set up
- [ ] Performance monitoring configured
- [ ] Alert thresholds defined
- [ ] Log retention policy configured

### 7. Testing

#### Backend Tests
- [ ] Authentication flow tested
- [ ] API endpoints return correct responses
- [ ] Error handling works correctly
- [ ] Database operations complete successfully
- [ ] Email sending works
- [ ] Stripe webhooks tested (if using)
- [ ] QR code generation/scanning works
- [ ] Session management works
- [ ] Password reset flow works
- [ ] 2FA flow tested

#### Frontend Tests
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] Authentication flow works
- [ ] Navigation works across all routes
- [ ] Responsive design works on mobile/tablet
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] Real-time updates work

#### Integration Tests
- [ ] Login flow end-to-end
- [ ] Patient registration flow
- [ ] Prescription creation and viewing
- [ ] QR code sharing and access
- [ ] Payment flow (if applicable)
- [ ] Email notifications received
- [ ] File uploads work

### 8. Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] User guide available
- [ ] Admin guide available
- [ ] Troubleshooting guide available

### 9. Compliance & Legal

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie policy configured
- [ ] GDPR compliance verified (if applicable)
- [ ] HIPAA compliance verified
- [ ] Data retention policy defined
- [ ] User consent mechanisms in place
- [ ] Data export functionality available

### 10. Backup & Recovery

- [ ] Database backup automated
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Redis persistence configured
- [ ] File storage backup configured
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

### 11. Deployment

- [ ] Deployment pipeline configured
- [ ] Rollback plan prepared
- [ ] Zero-downtime deployment strategy
- [ ] Health check endpoint working
- [ ] DNS configured correctly
- [ ] SSL certificates valid
- [ ] CDN configured and tested
- [ ] Load balancer configured (if applicable)

### 12. Post-Deployment

- [ ] Health check passes
- [ ] All critical features tested in production
- [ ] Performance baseline established
- [ ] Monitoring dashboards reviewed
- [ ] Error rates acceptable
- [ ] Response times acceptable
- [ ] Database connections stable
- [ ] Redis connections stable
- [ ] Email delivery working
- [ ] Stripe webhooks receiving events
- [ ] User registration working
- [ ] Login working
- [ ] Data persistence verified

---

## Deployment Day Checklist

**Before Deployment:**
1. [ ] Notify team of deployment window
2. [ ] Create database backup
3. [ ] Tag release in Git
4. [ ] Review all environment variables
5. [ ] Test deployment in staging (if available)

**During Deployment:**
1. [ ] Deploy backend first
2. [ ] Verify backend health check
3. [ ] Deploy frontend
4. [ ] Verify frontend loads
5. [ ] Run smoke tests

**After Deployment:**
1. [ ] Monitor error logs for 30 minutes
2. [ ] Test critical user flows
3. [ ] Verify database connections
4. [ ] Check Redis connections
5. [ ] Verify email sending
6. [ ] Test payment processing (if applicable)
7. [ ] Notify team of successful deployment

**If Issues Occur:**
1. [ ] Check error logs immediately
2. [ ] Review recent code changes
3. [ ] Roll back if critical issues found
4. [ ] Notify team of rollback
5. [ ] Document issue for post-mortem

---

## Environment-Specific Settings

### Development
- Debug mode: ON
- CORS: Allow all origins
- SSL: Optional
- Email: Use test credentials
- Stripe: Test keys
- Logging: DEBUG level

### Staging (Optional)
- Debug mode: OFF
- CORS: Staging domains only
- SSL: Required
- Email: Test credentials or real with prefix
- Stripe: Test keys
- Logging: INFO level

### Production
- Debug mode: OFF
- CORS: Production domains only
- SSL: Required (HTTPS only)
- Email: Production credentials
- Stripe: Live keys
- Logging: INFO or WARNING level

---

## Quick Verification Script

Run this script after deployment to verify critical functionality:

```bash
#!/bin/bash

BACKEND_URL="https://your-backend-url.com"
FRONTEND_URL="https://your-frontend-url.com"

echo "🔍 Starting post-deployment verification..."

# Check backend health
echo "✓ Checking backend health..."
curl -f $BACKEND_URL/health || echo "❌ Backend health check failed"

# Check frontend loads
echo "✓ Checking frontend..."
curl -f $FRONTEND_URL || echo "❌ Frontend failed to load"

# Check database connectivity
echo "✓ Checking database..."
curl -f $BACKEND_URL/api/test-db || echo "❌ Database connection failed"

# Check Redis connectivity
echo "✓ Checking Redis..."
curl -f $BACKEND_URL/api/test-redis || echo "❌ Redis connection failed"

echo "✅ Verification complete!"
```

---

## Rollback Plan

If critical issues are found after deployment:

1. **Immediate Actions:**
   - Stop new deployments
   - Assess impact and severity
   - Notify stakeholders

2. **Rollback Steps:**
   ```bash
   # Backend rollback (Railway/Render)
   # Use platform's rollback feature or:
   git revert HEAD
   git push

   # Frontend rollback (Vercel/Netlify)
   # Use platform's rollback feature
   ```

3. **Post-Rollback:**
   - Verify system stability
   - Document what went wrong
   - Schedule post-mortem meeting
   - Plan fix and re-deployment

---

## Support Contacts

**Technical Issues:**
- DevOps Lead: devops@keepsake.com
- Backend Lead: backend@keepsake.com
- Frontend Lead: frontend@keepsake.com

**Infrastructure:**
- Supabase Support: support@supabase.com
- Redis Provider: [Your provider support]
- Hosting Provider: [Your provider support]

**Business:**
- Product Manager: pm@keepsake.com
- Operations: ops@keepsake.com

---

## Notes

- Keep this checklist updated with each deployment
- Review and improve checklist based on learnings
- Archive completed checklists for audit trail
- Use version control for checklist changes

---

**Last Updated:** December 08, 2025
**Next Review:** [Set date for next review]
