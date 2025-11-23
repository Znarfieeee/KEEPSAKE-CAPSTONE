# Postman Tests for QR Code Generation

## Setup

1. **Base URL**: `http://localhost:5000`
2. **Authentication**: Required for all requests
3. **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer <your_jwt_token>`

---

## Getting Authentication Token

### Step 1: Login First

**POST** `http://localhost:5000/auth/login`

**Body (raw JSON):**
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "your_email@example.com",
    "role": "parent",
    "firstname": "John",
    "lastname": "Doe"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "..."
}
```

**Important:** Copy the `access_token` and use it in the Authorization header for subsequent requests.

---

## Test 1: Parent User - Generate QR Code

### Prerequisites
- Must be logged in as a **parent** user
- Must have access to a child/patient
- Patient must be registered at a facility

### Request

**POST** `http://localhost:5000/qr/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body (raw JSON):**
```json
{
  "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
  "share_type": "parent_access",
  "expires_in_days": 30,
  "scope": ["view_only", "allergies", "vaccinations", "appointments"],
  "max_uses": 100,
  "allow_emergency_access": false,
  "metadata": {
    "shared_by": "parent",
    "patient_name": "John Michael Dave",
    "notes": "Shared for school health records"
  }
}
```

### Expected Success Response (200)

```json
{
  "status": "success",
  "qr_id": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
  "token": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
  "access_url": "http://localhost:5173/qr/access?token=x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
  "expires_at": "2025-12-20T10:30:00.000Z"
}
```

### Possible Error Responses

**400 - Patient Not Registered:**
```json
{
  "error": "Patient not registered at any facility",
  "status": 400
}
```

**404 - Patient Not Found:**
```json
{
  "error": "Patient not found",
  "status": 404
}
```

**500 - Database Error:**
```json
{
  "error": "Database insert failed",
  "details": "RLS policy violation or invalid data",
  "status": 500
}
```

---

## Test 2: Doctor User - Generate QR Code

### Prerequisites
- Must be logged in as a **doctor** (pediapro role)
- Must have facility_id in user record
- Must have access to the patient through facility

### Request

**POST** `http://localhost:5000/qr/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body (raw JSON):**
```json
{
  "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
  "share_type": "referral",
  "expires_in_days": 7,
  "scope": ["full_access"],
  "max_uses": 5,
  "target_facilities": ["facility-uuid-1", "facility-uuid-2"],
  "pin_code": "8239",
  "allow_emergency_access": true,
  "metadata": {
    "shared_by": "doctor",
    "referral_reason": "Specialist consultation",
    "urgency": "high",
    "patient_name": "John Michael Dave"
  }
}
```

### Expected Success Response (200)

```json
{
  "status": "success",
  "qr_id": "b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "access_url": "http://localhost:5173/qr/access?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "expires_at": "2025-11-27T10:30:00.000Z"
}
```

---

## Test 3: Facility Admin - Generate Emergency QR Code

### Prerequisites
- Must be logged in as **facility_admin**
- Must have facility_id in user record

### Request

**POST** `http://localhost:5000/qr/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body (raw JSON):**
```json
{
  "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
  "share_type": "emergency_access",
  "expires_in_days": 90,
  "scope": ["full_access"],
  "max_uses": 50,
  "pin_code": "1234",
  "allow_emergency_access": true,
  "metadata": {
    "shared_by": "facility_admin",
    "emergency_contact": "parent",
    "patient_name": "John Michael Dave",
    "created_for": "Emergency medical card"
  }
}
```

### Expected Success Response (200)

```json
{
  "status": "success",
  "qr_id": "c3d4e5f6-7g8h-9i0j-1k2l-m3n4o5p6q7r8",
  "token": "z0y9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4i3h2g1",
  "access_url": "http://localhost:5173/qr/access?token=z0y9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4i3h2g1",
  "expires_at": "2026-02-18T10:30:00.000Z"
}
```

---

## Test 4: Prescription Sharing

### Use Case: Share prescription QR code with pharmacy

### Request

**POST** `http://localhost:5000/qr/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body (raw JSON):**
```json
{
  "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
  "share_type": "prescription",
  "expires_in_days": 3,
  "scope": ["prescriptions", "allergies"],
  "max_uses": 3,
  "metadata": {
    "shared_by": "doctor",
    "prescription_id": "rx-uuid-here",
    "patient_name": "John Michael Dave",
    "pharmacy_name": "HealthPlus Pharmacy"
  }
}
```

### Expected Success Response (200)

```json
{
  "status": "success",
  "qr_id": "d4e5f6g7-8h9i-0j1k-2l3m-n4o5p6q7r8s9",
  "token": "p0q9r8s7t6u5v4w3x2y1z0a9b8c7d6e5f4g3h2i1",
  "access_url": "http://localhost:5173/qr/access?token=p0q9r8s7t6u5v4w3x2y1z0a9b8c7d6e5f4g3h2i1",
  "expires_at": "2025-11-23T10:30:00.000Z"
}
```

---

## Test 5: Vaccination Record Sharing

### Use Case: Share vaccination records for school enrollment

### Request

**POST** `http://localhost:5000/qr/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body (raw JSON):**
```json
{
  "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
  "share_type": "vaccination",
  "expires_in_days": 14,
  "scope": ["vaccinations", "view_only"],
  "max_uses": 10,
  "metadata": {
    "shared_by": "parent",
    "patient_name": "John Michael Dave",
    "purpose": "School enrollment requirement",
    "school_name": "Sunshine Elementary"
  }
}
```

### Expected Success Response (200)

```json
{
  "status": "success",
  "qr_id": "e5f6g7h8-9i0j-1k2l-3m4n-o5p6q7r8s9t0",
  "token": "j0k9l8m7n6o5p4q3r2s1t0u9v8w7x6y5z4a3b2c1",
  "access_url": "http://localhost:5173/qr/access?token=j0k9l8m7n6o5p4q3r2s1t0u9v8w7x6y5z4a3b2c1",
  "expires_at": "2025-12-04T10:30:00.000Z"
}
```

---

## Postman Collection Setup

### Creating Environment Variables

1. **Create a new environment in Postman**
2. **Add these variables:**

```
base_url: http://localhost:5000
frontend_url: http://localhost:5173
access_token: (leave empty, will be set after login)
patient_id: 504410b4-9ee0-45e5-89d4-cad487db33e0
```

### Pre-request Script for Auth

Add this to your requests that need authentication:

```javascript
// Automatically use the access_token from environment
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('access_token')
});
```

### Test Script to Save Token

Add this to your login request:

```javascript
// Save access token to environment
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set('access_token', jsonData.access_token);
    console.log('Token saved:', jsonData.access_token);
}
```

---

## Testing Checklist

### For Parent Users:
- [ ] Login as parent
- [ ] Get patient_id from parent_access table
- [ ] Generate QR with parent_access share_type
- [ ] Verify facility_id is auto-resolved
- [ ] Verify QR code contains KEEPSAKE logo
- [ ] Test download functionality
- [ ] Test copy link functionality

### For Doctor Users:
- [ ] Login as doctor
- [ ] Use patient from same facility
- [ ] Generate QR with referral share_type
- [ ] Test with target_facilities
- [ ] Test with PIN protection
- [ ] Verify full_access scope works

### For All Users:
- [ ] Test expiration (expires_in_days)
- [ ] Test usage limits (max_uses)
- [ ] Test different scopes
- [ ] Test invalid patient_id (should return 404)
- [ ] Test without authentication (should return 401)
- [ ] Test with invalid scope values

---

## Common Error Scenarios to Test

### 1. Missing Patient ID
```json
{
  "share_type": "parent_access",
  "expires_in_days": 30
}
```
**Expected:** 400 - Missing required fields

### 2. Invalid Patient ID
```json
{
  "patient_id": "invalid-uuid",
  "share_type": "parent_access",
  "expires_in_days": 30
}
```
**Expected:** 404 - Patient not found

### 3. No Authentication
Remove Authorization header
**Expected:** 401 - Unauthorized

### 4. Expired Token
Use an old/expired token
**Expected:** 401 - Token expired

### 5. Parent Without Child Access
Use parent account with different child
**Expected:** 403 - No permission

---

## Response Time Expectations

| Endpoint | Expected Time | Maximum Time |
|----------|--------------|--------------|
| /qr/generate | < 300ms | 1000ms |
| Database insert | < 100ms | 500ms |
| Token generation | < 10ms | 50ms |

---

## Sample Postman Collection JSON

```json
{
  "info": {
    "name": "KEEPSAKE QR Code Generation",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"parent@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "QR Generation",
      "item": [
        {
          "name": "Parent - Generate QR",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"patient_id\": \"{{patient_id}}\",\n  \"share_type\": \"parent_access\",\n  \"expires_in_days\": 30,\n  \"scope\": [\"view_only\", \"allergies\", \"vaccinations\", \"appointments\"],\n  \"max_uses\": 100,\n  \"allow_emergency_access\": false,\n  \"metadata\": {\n    \"shared_by\": \"parent\",\n    \"patient_name\": \"John Michael Dave\"\n  }\n}"
            },
            "url": {
              "raw": "{{base_url}}/qr/generate",
              "host": ["{{base_url}}"],
              "path": ["qr", "generate"]
            }
          }
        },
        {
          "name": "Doctor - Generate Referral QR",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"patient_id\": \"{{patient_id}}\",\n  \"share_type\": \"referral\",\n  \"expires_in_days\": 7,\n  \"scope\": [\"full_access\"],\n  \"max_uses\": 5,\n  \"pin_code\": \"8239\",\n  \"allow_emergency_access\": true,\n  \"metadata\": {\n    \"shared_by\": \"doctor\",\n    \"referral_reason\": \"Specialist consultation\"\n  }\n}"
            },
            "url": {
              "raw": "{{base_url}}/qr/generate",
              "host": ["{{base_url}}"],
              "path": ["qr", "generate"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Quick Test Commands (cURL)

### Parent User Test
```bash
curl -X POST http://localhost:5000/qr/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
    "share_type": "parent_access",
    "expires_in_days": 30,
    "scope": ["view_only", "allergies", "vaccinations", "appointments"],
    "max_uses": 100,
    "allow_emergency_access": false,
    "metadata": {
      "shared_by": "parent",
      "patient_name": "John Michael Dave"
    }
  }'
```

### Doctor User Test
```bash
curl -X POST http://localhost:5000/qr/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "patient_id": "504410b4-9ee0-45e5-89d4-cad487db33e0",
    "share_type": "referral",
    "expires_in_days": 7,
    "scope": ["full_access"],
    "max_uses": 5,
    "pin_code": "8239",
    "metadata": {
      "shared_by": "doctor",
      "referral_reason": "Specialist consultation"
    }
  }'
```

---

## Troubleshooting

### Issue: 401 Unauthorized
- **Check:** Token is valid and not expired
- **Check:** Authorization header format: `Bearer <token>`
- **Solution:** Login again to get fresh token

### Issue: 404 Patient Not Found
- **Check:** patient_id is correct UUID
- **Check:** Patient exists in database
- **Solution:** Use valid patient_id from your database

### Issue: 500 Database Error
- **Check:** Parent user's child is registered at a facility
- **Check:** RLS policies allow insert for authenticated users
- **Solution:** Check facility_patients table for patient registration

### Issue: 400 Missing Fields
- **Check:** All required fields present: patient_id, share_type, expires_in_days
- **Solution:** Add missing fields to request body

---

**Ready to test! Import the collection into Postman and start testing the QR generation system! 🚀**
