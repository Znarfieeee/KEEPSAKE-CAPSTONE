# Google Authentication Setup Guide

This guide will help you set up Google OAuth authentication for the KEEPSAKE healthcare system.

## Prerequisites

- Google Cloud Platform account
- KEEPSAKE application already configured with basic environment variables

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "NEW PROJECT"
4. Enter project name: `KEEPSAKE-Healthcare` (or your preferred name)
5. Click "CREATE"

## Step 2: Enable Google+ API

1. In your Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "ENABLE"
4. Also enable "Google Identity Toolkit API" if available

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "CREATE"
4. Fill in the required information:
   - **App name**: KEEPSAKE Healthcare System
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "SAVE AND CONTINUE"
6. On the Scopes page, click "SAVE AND CONTINUE" (default scopes are sufficient)
7. On Test users page, add your email for testing
8. Click "SAVE AND CONTINUE"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter name: `KEEPSAKE Web Client`
5. Under "Authorized JavaScript origins", add:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:5000
   http://127.0.0.1:5000
   ```
6. Under "Authorized redirect URIs", add:
   ```
   http://localhost:5000/auth/google/callback
   http://127.0.0.1:5000/auth/google/callback
   ```
7. Click "CREATE"
8. Copy your **Client ID** and **Client Secret** - you'll need these!

## Step 5: Configure Environment Variables

### Backend (Server)

1. Navigate to your `server` directory
2. Create or update your `.env` file
3. Add the following variables:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

### Frontend (Client)

No additional frontend configuration needed - the client uses the backend API.

## Step 6: Verify Installation

### Check Server Logs

1. Start your Flask backend server:
   ```bash
   cd server
   python main.py
   ```

2. Look for this message in the console:
   ```
   Google OAuth initialized successfully
   ```

3. If you see this warning instead:
   ```
   Google OAuth credentials not configured - Google sign-in will be disabled
   ```
   Then check your environment variables.

### Test Google Sign-In

1. Start your React frontend:
   ```bash
   cd client
   npm run dev
   ```

2. Navigate to the login page (http://localhost:5173/login)
3. Click "Continue with Google" button
4. A popup window should open with Google's login screen
5. Sign in with a Google account that has access in your system
6. You should be redirected to the appropriate dashboard

## Troubleshooting

### Error: "Google Sign-In is not configured on this server"

**Solution**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env` file
- Restart the Flask server after adding environment variables
- Check server logs for initialization errors

### Error: "redirect_uri_mismatch"

**Solution**:
- Verify the redirect URI in Google Cloud Console matches exactly: `http://localhost:5000/auth/google/callback`
- Make sure there are no trailing slashes
- Check that the URI is in the "Authorized redirect URIs" list

### Error: "Popup was blocked"

**Solution**:
- Allow popups for localhost in your browser settings
- Check browser console for popup blocker messages
- Try disabling popup blockers temporarily

### Error: "Account not found"

**Solution**:
- The Google account must already exist in the KEEPSAKE users database
- Contact your system administrator to create an account first
- Google OAuth only authenticates existing users, it doesn't create new accounts

### Error: "Account is inactive"

**Solution**:
- Contact your system administrator to activate the account
- Check the users table in Supabase to verify `is_active` status

## Security Considerations

1. **Never commit credentials**: Keep `.env` files out of version control
2. **Use HTTPS in production**: Update redirect URIs to use HTTPS
3. **Restrict domains**: Only add necessary domains to authorized origins
4. **Rotate secrets**: Periodically rotate your Client Secret
5. **Monitor usage**: Check Google Cloud Console for unusual API usage

## Production Deployment

When deploying to production:

1. Update authorized origins and redirect URIs in Google Cloud Console:
   ```
   https://yourdomain.com
   https://yourdomain.com/auth/google/callback
   ```

2. Update environment variables with production values

3. Set `FLASK_ENV=production` in your server environment

4. Ensure SSL/TLS certificates are properly configured

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Authlib Documentation](https://docs.authlib.org/en/latest/)
- [Flask OAuth Integration](https://docs.authlib.org/en/latest/client/flask.html)

## Support

If you encounter issues not covered in this guide:
1. Check the Flask server logs for detailed error messages
2. Check browser console for client-side errors
3. Verify all environment variables are correctly set
4. Contact the development team for assistance
