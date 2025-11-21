# PIN Protection Guide for QR Codes

## Overview

The KEEPSAKE QR code system now supports optional PIN protection, allowing parents and healthcare providers to add an extra layer of security when sharing medical records and prescriptions via QR codes.

## Features

### Hybrid UX Flow
- **Quick Generate**: QR codes auto-generate with sensible defaults (no PIN)
- **Advanced Options**: Expandable section for customization
- **PIN Recommendation**: Visual banner suggesting PIN protection for enhanced security
- **Security Indicators**: Clear badges showing PIN status (🔒 PIN Protected / 🔓 No PIN)

### Configurable Options
1. **PIN Protection**: Optional 4-digit numeric PIN
2. **Expiration Period**: 1, 3, 7, 14, 30, or 90 days
3. **Maximum Uses**: 1-100 scans per QR code

## Components with PIN Support

### 1. BeautifulQRDialog (Patient Medical Records)
**Location**: `client/src/components/qr/BeautifulQRDialog.jsx`

**Default Settings**:
- PIN: Disabled (with recommendation)
- Expiration: 30 days
- Max Uses: 100

**Usage**:
```jsx
import { BeautifulQRDialog } from '@/components/qr'

<BeautifulQRDialog
    isOpen={showDialog}
    onClose={() => setShowDialog(false)}
    patientId={patient.id}
    patientName={patient.name}
/>
```

### 2. PrescriptionQRDialog (Prescriptions)
**Location**: `client/src/components/qr/PrescriptionQRDialog.jsx`

**Default Settings**:
- PIN: Disabled (with recommendation)
- Expiration: 30 days
- Max Uses: 50 (lower for prescriptions)

**Usage**:
```jsx
import { PrescriptionQRDialog } from '@/components/qr'

<PrescriptionQRDialog
    isOpen={showDialog}
    onClose={() => setShowDialog(false)}
    prescription={prescriptionData}
/>
```

## User Flow

### Step 1: Auto-Generation
When the dialog opens:
1. QR code generates immediately with default settings
2. "Ready to share!" indicator appears
3. PIN recommendation banner displays (if no PIN)

### Step 2: View Security Status
Users see clear security indicators:
- 🔒 **PIN Protected** (green badge) - if PIN is enabled
- 🔓 **No PIN** (gray badge) - if PIN is disabled
- ⚠️ **Recommendation Banner** - "Consider adding PIN protection"

### Step 3: Advanced Options (Optional)
Users can expand "Advanced Security Options" to:

#### Enable PIN Protection
1. Toggle "Enable PIN Protection" checkbox
2. Enter 4-digit numeric PIN (e.g., 1234)
3. See validation hint: "Healthcare providers will need this PIN"

#### Adjust Expiration
Choose from preset durations:
- 1 day (emergency/temporary)
- 3 days (short-term)
- 7 days (one week)
- 14 days (two weeks)
- 30 days (default - one month)
- 90 days (extended)

#### Set Maximum Uses
- Numeric input from 1-100
- Default: 100 (patient records), 50 (prescriptions)
- Limits how many times QR can be scanned

### Step 4: Regenerate (If Settings Changed)
When any setting changes:
1. "Regenerate QR Code with New Settings" button appears
2. Click to generate new QR with updated settings
3. Loading state during regeneration
4. New QR replaces old one

## Security Implementation

### Frontend Validation
```javascript
// PIN must be exactly 4 digits
if (usePinProtection && (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode))) {
    setError("PIN must be exactly 4 digits")
    return
}
```

### Backend Storage
QR codes with PINs are stored securely:
```javascript
// QR data sent to backend
const qrData = {
    patient_id: patientId,
    share_type: "parent_access",
    expires_in_days: expiresInDays,
    scope: ["view_only", "allergies", "vaccinations"],
    max_uses: maxUses,
    pin_code: usePinProtection ? pinCode : undefined,  // Only if enabled
    metadata: {
        shared_by: "parent",
        requires_pin: usePinProtection
    }
}
```

### QR Access Validation
When scanning a PIN-protected QR code:

**Backend**: `server/routes/qr_routes.py` - `/qr/access` endpoint
1. Extract token from QR code
2. Validate token exists and is active
3. Check if PIN protection is enabled
4. If PIN required, verify provided PIN matches
5. Return patient data only if validation succeeds

**Frontend**: QR Scanner page
1. Scan QR code to get token
2. Check if PIN is required
3. Show PIN input modal if needed
4. Submit token + PIN to backend
5. Display patient data if authorized

## Visual Design

### Security Status Badge
```jsx
{/* PIN Protected */}
<div className="bg-green-50 border border-green-200 rounded-lg">
    <FiLock className="text-green-600" />
    <span>PIN Protected</span>
</div>

{/* No PIN */}
<div className="bg-gray-50 border border-gray-200 rounded-lg">
    <FiUnlock className="text-gray-500" />
    <span>No PIN</span>
</div>
```

### PIN Recommendation Banner
```jsx
{!generatedQR.hasPinProtection && (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <FiAlertCircle className="text-amber-600" />
        <p>Consider adding PIN protection</p>
        <p>Recommended when sharing outside trusted healthcare providers</p>
    </div>
)}
```

### Advanced Options Section
```jsx
<button onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
    <span>Advanced Security Options</span>
    <FiChevronDown className={showAdvancedOptions ? 'rotate-180' : ''} />
</button>

{showAdvancedOptions && (
    <div className="space-y-4">
        {/* PIN Toggle */}
        {/* Expiration Buttons */}
        {/* Max Uses Input */}
        {/* Regenerate Button */}
    </div>
)}
```

## Testing Guide

### Test 1: Quick Share (No PIN)
1. Open BeautifulQRDialog or PrescriptionQRDialog
2. Verify QR generates automatically
3. Check "No PIN" badge appears
4. Verify recommendation banner shows
5. Download QR code
6. Scan QR code (should work without PIN)

### Test 2: Enable PIN Protection
1. Open dialog
2. Expand "Advanced Security Options"
3. Toggle "Enable PIN Protection"
4. Enter PIN: `1234`
5. Verify "Regenerate" button appears
6. Click "Regenerate QR Code with New Settings"
7. Check "PIN Protected" badge appears (green)
8. Recommendation banner should hide

### Test 3: PIN Validation
1. Generate QR with PIN `1234`
2. Download QR code
3. Scan QR code on another device
4. Verify PIN input modal appears
5. Try wrong PIN: `9999` - should fail
6. Try correct PIN: `1234` - should succeed
7. Verify patient data displays

### Test 4: Change Expiration/Max Uses
1. Open dialog
2. Expand advanced options
3. Select "7 days" expiration
4. Change max uses to `25`
5. Click "Regenerate"
6. Verify new QR generates
7. Check expiration date in QR metadata

### Test 5: Settings Persistence
1. Generate QR with PIN `5678`
2. Close dialog
3. Reopen dialog
4. Verify settings reset to defaults
5. New QR should auto-generate without PIN

## Backend Integration

### QR Generation Endpoint
**POST** `/qr/generate`

```json
{
    "patient_id": "uuid",
    "share_type": "parent_access",
    "expires_in_days": 30,
    "scope": ["view_only", "allergies"],
    "max_uses": 100,
    "pin_code": "1234",  // Optional
    "metadata": {
        "shared_by": "parent",
        "requires_pin": true
    }
}
```

**Response**:
```json
{
    "qr_id": "uuid",
    "token": "secure-token",
    "access_url": "http://localhost:3000/qr_scanner?token=...",
    "expires_at": "2025-12-21T00:00:00Z",
    "has_pin": true
}
```

### QR Validation Endpoint
**GET** `/qr/access?token=TOKEN&pin=1234`

**Headers**:
```
Authorization: Bearer <user-jwt>
```

**Response (Success)**:
```json
{
    "success": true,
    "patient_data": {
        "patient_id": "uuid",
        "firstname": "John",
        "lastname": "Doe",
        "allergies": [...],
        "prescriptions": [...]
    },
    "qr_metadata": {
        "qr_id": "uuid",
        "use_count": 1,
        "max_uses": 100,
        "expires_at": "2025-12-21T00:00:00Z"
    }
}
```

**Response (Wrong PIN)**:
```json
{
    "error": "Invalid PIN",
    "status": 401
}
```

**Response (Expired)**:
```json
{
    "error": "QR code has expired",
    "status": 403
}
```

## Security Best Practices

### When to Recommend PIN
1. **Sharing outside trusted network**: Parent sharing with new pharmacy
2. **Sensitive data**: Prescriptions with controlled substances
3. **Long expiration**: QR codes valid for 30+ days
4. **High max uses**: QR codes that can be scanned many times

### When PIN May Be Optional
1. **Trusted providers**: Regular doctor's office
2. **Short-term sharing**: 1-3 day expiration
3. **Limited use**: Max 5-10 scans
4. **Emergency situations**: Immediate access needed

### User Education
The recommendation banner educates users:
- "Consider adding PIN protection"
- "Recommended when sharing outside trusted healthcare providers"
- "Pharmacists will need this PIN to access prescription details"

## Troubleshooting

### Issue: "PIN must be exactly 4 digits"
**Cause**: PIN validation failed
**Solutions**:
- Ensure PIN is numeric only
- Check PIN length is exactly 4 characters
- Remove any spaces or special characters

### Issue: QR not regenerating after settings change
**Cause**: Settings change detection not triggering
**Solutions**:
- Verify `settingsChanged` state is updating
- Check `useEffect` dependencies include all settings
- Ensure default values match initial generation

### Issue: PIN not being sent to backend
**Cause**: PIN not included in QR data
**Solutions**:
- Verify `usePinProtection` is true
- Check `pinCode` is not empty
- Ensure PIN is added to `qrData` before API call

### Issue: PIN input modal not appearing on scan
**Cause**: Backend not indicating PIN required
**Solutions**:
- Check `has_pin` flag in QR validation response
- Verify QR was generated with `pin_code` field
- Ensure scanner checks for PIN requirement before displaying data

## Code Snippets

### Complete PIN Protection Flow
```jsx
// 1. State management
const [usePinProtection, setUsePinProtection] = useState(false)
const [pinCode, setPinCode] = useState("")
const [settingsChanged, setSettingsChanged] = useState(false)

// 2. Track changes
useEffect(() => {
    if (generatedQR) {
        const hasChanges =
            (usePinProtection && pinCode.length === 4) !== generatedQR.hasPinProtection
        setSettingsChanged(hasChanges)
    }
}, [usePinProtection, pinCode, generatedQR])

// 3. Validate and generate
const handleGenerate = async () => {
    if (usePinProtection && (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode))) {
        setError("PIN must be exactly 4 digits")
        return
    }

    const qrData = {
        // ... other fields
        pin_code: usePinProtection ? pinCode : undefined
    }

    const response = await generateQRCode(qrData)
    setGeneratedQR({
        ...response,
        hasPinProtection: usePinProtection && !!pinCode
    })
}

// 4. UI components
<input
    type="checkbox"
    checked={usePinProtection}
    onChange={(e) => setUsePinProtection(e.target.checked)}
/>
{usePinProtection && (
    <input
        type="text"
        maxLength={4}
        value={pinCode}
        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
        placeholder="Enter 4-digit PIN"
    />
)}
```

## Files Modified

### Frontend
- ✅ `client/src/components/qr/BeautifulQRDialog.jsx`
  - Added advanced options state
  - Added PIN validation
  - Added security status badges
  - Added recommendation banner
  - Added collapsible advanced options UI

- ✅ `client/src/components/qr/PrescriptionQRDialog.jsx`
  - Same features as BeautifulQRDialog
  - Prescription-specific defaults (50 max uses)
  - Pharmacy-focused messaging

### Backend (Already Supports PIN)
- ✅ `server/routes/qr_routes.py`
  - `/qr/generate` accepts `pin_code` parameter
  - `/qr/access` validates PIN if required
  - Stores PIN securely in database

### Documentation
- ✅ `PIN_PROTECTION_GUIDE.md` (this file)
- ✅ `PRESCRIPTION_QR_IMPLEMENTATION.md` (updated)

## Summary

The PIN protection feature provides:
- **Flexibility**: Optional security for sensitive sharing
- **User Education**: Recommendations guide parents
- **Quick Access**: Auto-generate for trusted scenarios
- **Enhanced Security**: 4-digit PIN for external sharing
- **Visual Clarity**: Badges and banners show security status
- **Smooth UX**: Hybrid approach balances speed and control

Parents can now confidently share medical records with the assurance that sensitive data is protected when needed, while maintaining quick access for trusted healthcare providers.

---

**Questions or Issues?**
- Test with Postman using PIN parameter: `/qr/access?token=TOKEN&pin=1234`
- Check browser console for validation errors
- Verify backend supports `pin_code` in QR generation
- Review QR metadata to confirm PIN protection status
