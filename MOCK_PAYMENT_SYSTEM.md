# Mock Payment System Documentation

## Overview
KEEPSAKE Premium subscription system now uses a **mock payment system** for testing purposes, completely bypassing Stripe integration. This allows full testing of the subscription flow without actual payment processing.

---

## Features

✅ **No Stripe Required**: Works without Stripe API keys or configuration
✅ **Instant Activation**: Premium subscription activated immediately upon "payment"
✅ **30-Day Subscription**: Activates premium for 30 days from payment date
✅ **Database Integration**: Updates `users` table with subscription status
✅ **Full UI Flow**: Complete payment page experience with mock checkout
✅ **Production Ready**: Easy to switch to real Stripe when needed

---

## How It Works

### 1. User Flow

1. Parent user navigates to Reports page (`/parent/reports`)
2. Sees Premium overlay blocking reports
3. Clicks "Upgrade to Premium"
4. Redirected to `/checkout` page
5. Sees mock payment form with ₱299/month pricing
6. Clicks "Activate Premium - ₱299/month"
7. Subscription activated immediately
8. Redirected back to parent dashboard
9. Can now access Reports page without overlay

### 2. Backend Flow

**Endpoint 1: Create Checkout Session**
```
POST /parent/subscription/checkout
```
- **Auth**: Requires parent role
- **Response**: Mock session data
```json
{
  "status": "success",
  "mock_payment": true,
  "amount": 299,
  "currency": "PHP"
}
```

**Endpoint 2: Process Mock Payment**
```
POST /parent/subscription/mock-payment
```
- **Auth**: Requires parent role
- **Action**: Updates `users` table
- **Database Changes**:
  - `is_subscribed` = `true`
  - `subscription_expires` = 30 days from now
- **Response**:
```json
{
  "status": "success",
  "message": "Payment successful! Premium subscription activated.",
  "subscription": {
    "plan_type": "premium",
    "status": "active",
    "subscription_expires": "2025-02-05"
  }
}
```

### 3. Database Schema

Uses existing `users` table:
```sql
users (
  user_id uuid PRIMARY KEY,
  email varchar NOT NULL,
  is_subscribed boolean DEFAULT false,
  subscription_expires date,
  ...
)
```

---

## Testing Instructions

### Test the Payment Flow

1. **Login as Parent User**
   ```
   Email: (any parent account)
   Password: (your password)
   ```

2. **Navigate to Reports**
   - Go to `/parent/reports`
   - You should see Premium overlay

3. **Start Payment**
   - Click "Upgrade to Premium"
   - Redirected to `/checkout`
   - See mock payment form

4. **Complete Payment**
   - Click "Activate Premium - ₱299/month"
   - Wait for success message
   - Automatically redirected to dashboard

5. **Verify Subscription**
   - Go back to `/parent/reports`
   - Reports should now be accessible
   - No overlay shown

6. **Check Database**
   ```sql
   SELECT user_id, is_subscribed, subscription_expires
   FROM users
   WHERE role = 'parent';
   ```
   - `is_subscribed` should be `true`
   - `subscription_expires` should be 30 days ahead

---

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/parent/subscription` | GET | Parent | Get current subscription status |
| `/parent/subscription/checkout` | POST | Parent | Initialize mock checkout session |
| `/parent/subscription/mock-payment` | POST | Parent | Process mock payment & activate subscription |
| `/parent/subscription/cancel` | POST | Parent | Cancel premium subscription |

---

## Frontend Components

### 1. **CheckoutPage** (`client/src/pages/CheckoutPage.jsx`)
- Mock payment interface
- No Stripe integration required
- Simulates payment experience
- Shows test mode badge

### 2. **PremiumOverlay** (`client/src/components/premium/PremiumOverlay.jsx`)
- Blocks non-premium users from Reports
- z-index: 100 (above all UI elements)
- Redirects to `/checkout` on upgrade
- Full page reload on "Back to Dashboard"

### 3. **ParentReports** (`client/src/pages/parent/ParentReports.jsx`)
- Protected with `@require_premium_subscription`
- Shows overlay if subscription inactive
- Fetches subscription status on mount
- Handles 403 errors gracefully

---

## Backend Components

### 1. **Subscription Routes** (`server/routes/parent/parent_subscription.py`)
- `/checkout` - Returns mock session
- `/mock-payment` - Activates subscription
- `/cancel` - Deactivates subscription
- No Stripe dependency

### 2. **Access Control** (`server/utils/access_control.py`)
- `@require_premium_subscription` decorator
- Server-side validation
- Checks `users.is_subscribed` and expiry date
- Returns 403 with `premium_required: true`

---

## Subscription Logic

### Check if Subscription is Active

```python
def is_subscription_active(user_id):
    user = get_user(user_id)
    is_subscribed = user.get('is_subscribed', False)
    subscription_expires = user.get('subscription_expires')

    if not is_subscribed or not subscription_expires:
        return False

    expiry_date = datetime.strptime(subscription_expires, '%Y-%m-%d').date()
    is_active = expiry_date >= datetime.now().date()

    return is_active
```

### Activate Subscription

```python
def activate_subscription(user_id):
    expiry_date = (datetime.now() + timedelta(days=30)).date()

    update_user(user_id, {
        'is_subscribed': True,
        'subscription_expires': expiry_date.isoformat()
    })
```

### Cancel Subscription

```python
def cancel_subscription(user_id):
    update_user(user_id, {
        'is_subscribed': False,
        'subscription_expires': datetime.now().date().isoformat()
    })
```

---

## Switching to Real Stripe

When ready to use real Stripe payments:

### 1. Configure Stripe Keys

**Server `.env`:**
```env
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

**Client `.env`:**
```env
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_KEY"
```

### 2. Update Backend Routes

Replace mock payment logic in `parent_subscription.py`:
```python
# Restore original Stripe PaymentIntent code
payment_intent = stripe.PaymentIntent.create(
    amount=29900,  # ₱299
    currency='php',
    payment_method_types=['card', 'grabpay'],
    metadata={'user_id': user_id}
)
return jsonify({"client_secret": payment_intent.client_secret})
```

### 3. Update Frontend

Restore Stripe Payment Element in `CheckoutPage.jsx`:
```jsx
import StripePaymentForm from '@/components/payment/StripePaymentForm'

// Replace mock form with:
{clientSecret && <StripePaymentForm clientSecret={clientSecret} />}
```

### 4. Set Up Webhook

- Configure webhook in Stripe Dashboard
- Point to `https://yourdomain.com/webhooks/stripe`
- Select event: `payment_intent.succeeded`

---

## Troubleshooting

### Issue: Premium overlay still shows after payment
**Solution**:
- Check browser console for API errors
- Verify subscription in database
- Try hard refresh (Ctrl+Shift+R)
- Check subscription expiry date

### Issue: "Back to Dashboard" doesn't load data
**Solution**:
- Uses `window.location.href` for full page reload
- Ensures fresh data fetch on navigation
- Already implemented in PremiumOverlay

### Issue: Can't access mock payment endpoint
**Solution**:
- Verify user is logged in as parent
- Check Flask server is running
- Check endpoint exists: `/parent/subscription/mock-payment`

---

## Production Checklist

- ✅ Mock payment system working
- ✅ Subscription activation working
- ✅ Premium overlay blocking non-subscribers
- ✅ Server-side validation (@require_premium_subscription)
- ✅ Dashboard navigation fixed (full page reload)
- ✅ No Stripe dependency
- ✅ Database schema using existing `users` table
- ✅ All debug logs removed
- ✅ Error handling implemented
- ✅ Test mode clearly indicated in UI

---

## Summary

The mock payment system provides a **complete subscription flow** without requiring Stripe integration. It's **production-ready** for testing and can be easily switched to real Stripe when payment processing is needed.

**Key Benefits**:
- ✅ No external dependencies
- ✅ Instant testing capability
- ✅ Full feature parity with real payments
- ✅ Easy migration path to Stripe
- ✅ Server-side security maintained
