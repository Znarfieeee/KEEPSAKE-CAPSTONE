# KEEPSAKE Troubleshooting Guide

## Google OAuth Issues

### Error: `UnicodeDecodeError: 'utf-8' codec can't decode byte 0x81`

**Symptoms:**
- Google OAuth callback fails with a Unicode decode error
- Error appears in Flask server console
- User sees "Authentication failed" in popup

**Root Cause:**
Corrupted session data in Redis that contains invalid UTF-8 bytes.

**Solutions:**

#### Option 1: Automatic Cleanup (Recommended)
The server now automatically cleans corrupted sessions on startup. Simply restart the Flask server:

```bash
cd server
python main.py
```

Look for this message:
```
🧹 Cleared X corrupted sessions on startup
```

#### Option 2: Manual Cleanup Script
Run the cleanup script while the server is running or stopped:

```bash
cd server
python cleanup_sessions.py
```

#### Option 3: Via API Endpoint
Make a POST request to the cleanup endpoint:

```bash
curl -X POST http://localhost:5000/auth/cleanup-sessions
```

Or use the browser console:
```javascript
fetch('http://localhost:5000/auth/cleanup-sessions', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

#### Option 4: Clear All Redis Data (Nuclear Option)
If all else fails, clear all Redis data:

```bash
# Connect to Redis CLI
redis-cli -h your_redis_host -p 6379

# Authenticate if needed
AUTH your_password

# Select database 1 (used by KEEPSAKE)
SELECT 1

# Delete all session keys
KEYS keepsake_session:*
# Then delete them one by one or use:
FLUSHDB
```

**Prevention:**
The Redis client now includes `encoding_errors='replace'` which prevents future Unicode errors.

---

### Error: "Google Sign-In is not configured on this server"

**Symptoms:**
- Popup shows error message
- Server logs: "Google OAuth not initialized - missing credentials"

**Root Cause:**
Missing Google OAuth credentials in environment variables.

**Solution:**
1. Follow the setup guide in `GOOGLE_AUTH_SETUP.md`
2. Add credentials to `server/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```
3. Restart the Flask server

---

### Error: "Account not found"

**Symptoms:**
- User successfully authenticates with Google
- Popup shows "Account not found. Please contact your administrator."

**Root Cause:**
The Google email doesn't exist in the KEEPSAKE users database.

**Solution:**
1. Google OAuth only authenticates existing users - it doesn't create new accounts
2. A system administrator must first create the user account in KEEPSAKE
3. The email in Supabase must match the Google account email exactly

**For Administrators:**
Create the user in the system first, then they can use Google Sign-In.

---

### Error: "Account is inactive"

**Symptoms:**
- User exists in database but can't log in
- Popup shows "Account is inactive"

**Root Cause:**
The user's `is_active` status is set to `false` in the database.

**Solution:**
1. System administrator needs to activate the account
2. Check Supabase `users` table
3. Set `is_active = true` for the user

---

### Error: "redirect_uri_mismatch"

**Symptoms:**
- Google OAuth page shows redirect URI error
- Can't complete authentication

**Root Cause:**
The redirect URI in your request doesn't match what's registered in Google Cloud Console.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client
4. Under "Authorized redirect URIs", add:
   ```
   http://localhost:5000/auth/google/callback
   http://127.0.0.1:5000/auth/google/callback
   ```
5. Save and try again (changes may take a few minutes to propagate)

---

### Error: "Popup was blocked"

**Symptoms:**
- Google login button does nothing
- Browser console shows popup blocked message

**Solution:**
1. Allow popups for `localhost:5173` in your browser
2. Chrome: Click the popup icon in the address bar
3. Firefox: Click the preferences icon in the address bar
4. Try the login again

---

## Session Issues

### Error: "Session expired. Please log in again."

**Symptoms:**
- User gets logged out unexpectedly
- Toast notification about expired session

**Root Cause:**
- 30 minutes of inactivity
- Session data corrupted in Redis
- Redis connection lost

**Solution:**
1. Log in again
2. If persistent, run session cleanup script
3. Check Redis connection

---

### Error: "Session validation failed after authentication"

**Symptoms:**
- Google OAuth succeeds but user isn't logged in
- Error message in GoogleButton component

**Root Cause:**
Session cookie not being set or read properly.

**Solution:**
1. Clear browser cookies for localhost
2. Restart both frontend and backend servers
3. Check CORS settings in `server/main.py`
4. Verify `allowed_origins` in both client and server match

---

## Redis Connection Issues

### Error: "Redis connection failed"

**Symptoms:**
- Server fails to start
- Health check fails
- Error: "Redis connection failed"

**Solution:**
1. Verify Redis credentials in `server/.env`:
   ```env
   REDIS_HOST=your_host
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password
   REDIS_SSL=true
   ```
2. Test Redis connection:
   ```bash
   redis-cli -h your_host -p 6379 -a your_password ping
   ```
3. Check if Redis server is running
4. Verify firewall rules allow connection

---

## Development Tips

### Enable Debug Logging

For more detailed error messages, enable debug mode:

```python
# server/main.py
app.run(debug=True)
```

### Check Server Logs

Always check the Flask console for detailed error messages:
```bash
cd server
python main.py
# Watch for errors in the console output
```

### Check Browser Console

Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for failed API requests
- Application tab for cookies and storage

### Test API Endpoints Manually

Use curl or Postman to test endpoints:

```bash
# Test session
curl http://localhost:5000/session -H "Cookie: session_id=your_session_id"

# Test cleanup
curl -X POST http://localhost:5000/auth/cleanup-sessions

# Test health
curl http://localhost:5000/health
```

---

## Getting Help

If you've tried everything and still have issues:

1. **Collect Information:**
   - Flask server console output
   - Browser console errors
   - Network tab showing failed requests
   - Redis connection test results

2. **Check Recent Changes:**
   - Did you recently update environment variables?
   - Any database migrations?
   - Changes to CORS or cookie settings?

3. **Reset to Clean State:**
   ```bash
   # Clear Redis sessions
   python server/cleanup_sessions.py

   # Clear browser data
   # In browser: Settings > Privacy > Clear browsing data

   # Restart everything
   # Terminal 1:
   cd server
   python main.py

   # Terminal 2:
   cd client
   npm run dev
   ```

4. **Contact Support:**
   - Provide the collected information
   - Include steps to reproduce the issue
   - Note what solutions you've already tried
