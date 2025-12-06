# Stripe Payment Integration Setup Guide

## Overview
This guide will help you configure Stripe for KEEPSAKE's Premium subscription payment system (±299/month).

## Prerequisites
- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- Access to server/.env file

---

## Step 1: Get Your Stripe API Keys

### 1.1 Login to Stripe Dashboard
Go to https://dashboard.stripe.com and login to your account.

### 1.2 Get Your Secret Key
1. Click **Developers** in the left sidebar
2. Click **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...` for test mode)
   - **Secret key** (starts with `sk_test_...` for test mode) - Click "Reveal test key"

### 1.3 Copy Your Keys
- **Publishable Key**: Already configured in `client/.env`
- **Secret Key**: Copy this for the next step

---

## Step 2: Configure Server Environment Variables

### 2.1 Open `server/.env`
Replace the placeholder values with your actual Stripe keys:

```env
# Replace this with your actual Stripe Secret Key
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_SECRET_KEY_HERE"

# Replace this with your webhook secret (see Step 3)
STRIPE_WEBHOOK_SECRET="whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE"
```

**IMPORTANT**:
- Remove the `PLEASE_REPLACE` placeholders
- Use your **actual** Stripe secret key from Step 1.2

---

## Step 3: Set Up Stripe Webhook

Webhooks allow Stripe to notify your server when payments succeed.

### 3.1 Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** ’ **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - **Local Development**: `http://localhost:5000/webhooks/stripe`
   - **Production**: `https://yourdomain.com/webhooks/stripe`

### 3.2 Select Events to Listen
Select the following event:
-  `payment_intent.succeeded`

Click **Add endpoint**

### 3.3 Get Webhook Signing Secret
1. After creating the endpoint, click on it
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Paste it in `server/.env` as `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Verify Configuration

### 4.1 Check Client .env
Ensure `client/.env` has:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### 4.2 Check Server .env
Ensure `server/.env` has:
```env
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"
```

### 4.3 Restart Server
After updating .env files, restart your Flask server:
```bash
cd server
python main.py
```

---

## Step 5: Test Payment Flow

### 5.1 Test Cards
Use these test cards from Stripe:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Failed Payment (Declined):**
- Card: `4000 0000 0000 0002`

**Insufficient Funds:**
- Card: `4000 0000 0000 9995`

### 5.2 Test Flow
1. Login as a parent user
2. Go to Reports page
3. Click "Upgrade to Premium" on the overlay
4. You'll be redirected to `/checkout`
5. Fill in payment details with test card
6. Submit payment
7. Should redirect to `/payment/success`
8. Check `users` table - `is_subscribed` should be `true` and `subscription_expires` should be 30 days from now

### 5.3 Verify Webhook
1. Go to Stripe Dashboard ’ **Developers** ’ **Webhooks**
2. Click on your webhook endpoint
3. Check the **Attempts** tab - you should see successful `payment_intent.succeeded` events

---

## Step 6: Enable GCash (Optional)

GCash is available through Stripe's GrabPay integration.

### 6.1 Enable GrabPay
1. Go to Stripe Dashboard ’ **Settings** ’ **Payment methods**
2. Find **GrabPay** and click **Enable**
3. Set **Country**: Philippines
4. Set **Currency**: PHP

### 6.2 Test GCash
When testing on `/checkout`, you should see two payment tabs:
- **Card** (Visa, Mastercard, Amex)
- **GrabPay** (GCash)

---

## Production Deployment

### 7.1 Switch to Live Mode
1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Get your **live** API keys (start with `pk_live_...` and `sk_live_...`)
3. Update environment variables with live keys
4. Create new webhook endpoint with production URL

### 7.2 Production Checklist
- [ ] Replace test keys with live keys in both client and server .env
- [ ] Update webhook URL to production domain
- [ ] Test with small real payment (±1 or ±10)
- [ ] Verify webhook is receiving events in production
- [ ] Enable GCash/GrabPay for Philippines
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test subscription activation flow end-to-end

### 7.3 Security Best Practices
-  Never commit .env files to git
-  Use environment variables, not hardcoded keys
-  Validate webhook signatures (already implemented)
-  Use HTTPS in production
-  Regularly rotate API keys
-  Monitor Stripe Dashboard for suspicious activity

---

## Troubleshooting

### Issue: "Payment system not configured"
**Solution**: Ensure `STRIPE_SECRET_KEY` is set in `server/.env` and server is restarted.

### Issue: Webhook not receiving events
**Solutions**:
- Check webhook URL is correct
- Ensure server is accessible (use ngrok for local testing)
- Verify webhook secret matches in .env
- Check Stripe Dashboard ’ Webhooks ’ Attempts for errors

### Issue: Payment succeeds but subscription not activated
**Solutions**:
- Check webhook is configured correctly
- View server logs for errors in webhook handler
- Verify `payment_intent.succeeded` event is selected
- Check database `users` table for updates

### Issue: Stripe.js not loading
**Solution**: Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `client/.env` and starts with `pk_test_` or `pk_live_`

---

## Support

### Stripe Documentation
- API Reference: https://stripe.com/docs/api
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks
- Payment Intents: https://stripe.com/docs/payments/payment-intents

### Stripe Support
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com

---

## Summary

 Configure API keys in `server/.env`
 Set up webhook endpoint
 Test with Stripe test cards
 Verify subscription activation
 Enable GCash for Philippines users
 Switch to live mode for production

Your Stripe integration is now production-ready!
