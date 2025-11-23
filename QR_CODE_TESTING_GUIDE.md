# QR Code PIN Protection Testing Guide

## Overview
This guide provides comprehensive test cases for the QR code generation system with PIN protection, featuring the new configuration-first flow and enhanced Input-OTP UI.

## Table of Contents
- [Pre-Testing Setup](#pre-testing-setup)
- [Test Suite 1: Configuration-First Flow](#test-suite-1-configuration-first-flow)
- [Test Suite 2: PIN Input Component](#test-suite-2-pin-input-component)
- [Test Suite 3: Random PIN Generator](#test-suite-3-random-pin-generator)
- [Test Suite 4: Security Options](#test-suite-4-security-options)
- [Test Suite 5: QR Code Validation](#test-suite-5-qr-code-validation)
- [Test Suite 6: PrescriptionQRDialog](#test-suite-6-prescriptionqrdialog)
- [Edge Cases & Error Handling](#edge-cases--error-handling)
- [Visual Regression Testing](#visual-regression-testing)

---

## Pre-Testing Setup

### Required Accounts
- Parent account with at least 1 child patient
- Doctor account with access to patient prescriptions
- Two devices or browsers for QR scanning tests

### Test Data Needed
- Patient with medical records
- Patient with at least 1 prescription

### Browser Console
Keep browser console open (F12) to monitor:
- API calls to `/qr/generate`
- QR generation responses
- Validation errors

---

## Test Suite 1: Configuration-First Flow

### Test 1.1: BeautifulQRDialog Initial State
**Purpose:** Verify dialog opens without auto-generating QR

**Steps:**
1. Login as parent
2. Navigate to child's medical records
3. Click "Share via QR Code" button
4. Observe initial dialog state

**Expected Results:**
- ✅ Dialog opens immediately
- ✅ **NO QR code is displayed** (configuration-first)
- ✅ Configuration form is visible with default values:
  - PIN Protection: Unchecked
  - Expiration: 30 days selected
  - Max Uses: 100
- ✅ Recommendation banner shows: "Consider adding PIN protection"
- ✅ "Generate QR Code" button is enabled
- ✅ Button text: "Generate QR Code" (not "Enter PIN to Generate")

**Screenshot Checkpoint:** Initial state with configuration form

---

### Test 1.2: Quick Generate (No PIN)
**Purpose:** Verify users can quickly generate QR without PIN

**Steps:**
1. Open BeautifulQRDialog
2. Do NOT enable PIN protection
3. Keep default settings (30 days, 100 uses)
4. Click "Generate QR Code"

**Expected Results:**
- ✅ Loading state shows: "Generating QR Code..."
- ✅ QR code generates within 2 seconds
- ✅ QR code displays with patient data
- ✅ Security status badge shows: "🔓 No PIN" (gray badge)
- ✅ Recommendation banner STILL visible: "Consider adding PIN protection"
- ✅ "Generate New QR Code" button appears below QR
- ✅ Configuration form is HIDDEN

**API Verification:**
```json
POST /qr/generate
{
  "patient_id": "uuid",
  "share_type": "parent_access",
  "expires_in_days": 30,
  "max_uses": 100,
  "pin_code": undefined  // NO PIN
}
```

---

### Test 1.3: Generate New QR Code
**Purpose:** Verify regeneration flow returns to configuration

**Steps:**
1. After generating QR from Test 1.2
2. Click "Generate New QR Code" button
3. Observe state change

**Expected Results:**
- ✅ Generated QR code disappears
- ✅ Configuration form reappears
- ✅ All settings RESET to defaults:
  - PIN Protection: Unchecked
  - Expiration: 30 days
  - Max Uses: 100
- ✅ Ready to configure new QR code
- ✅ "Generate QR Code" button enabled

---

## Test Suite 2: PIN Input Component

### Test 2.1: Enable PIN Protection
**Purpose:** Verify PIN input component appears and functions

**Steps:**
1. Open BeautifulQRDialog
2. Check "Enable PIN Protection" checkbox
3. Observe PIN input component

**Expected Results:**
- ✅ 4 animated boxes appear (Input-OTP component)
- ✅ Each box has:
  - Gray border (border-gray-300)
  - White background
  - Rounded corners
  - Dot placeholder (gray circle) when empty
- ✅ Recommendation banner DISAPPEARS (PIN enabled)
- ✅ "Generate Random PIN" button appears with shuffle icon
- ✅ Helper text: "Pharmacists/Healthcare providers will need this PIN"

**Screenshot Checkpoint:** Empty PIN input boxes

---

### Test 2.2: PIN Entry - Single Digit
**Purpose:** Test individual digit entry

**Steps:**
1. Enable PIN protection
2. Click first PIN box
3. Type "1"

**Expected Results:**
- ✅ First box becomes active (blue border, ring effect)
- ✅ Digit "1" appears in first box
- ✅ First box turns green (border-green-500, bg-green-50)
- ✅ Focus automatically moves to second box
- ✅ Second box now has blue border (active state)
- ✅ "Generate QR Code" button DISABLED (only 1/4 digits)

**Visual:** First box green with "1", second box blue (active), third/fourth empty

---

### Test 2.3: PIN Entry - Complete 4 Digits
**Purpose:** Test full PIN entry experience

**Steps:**
1. Enable PIN protection
2. Type "1234" sequentially

**Expected Results:**
- ✅ Each box fills in sequence: 1 → 2 → 3 → 4
- ✅ All 4 boxes turn green when filled
- ✅ No active border on any box (entry complete)
- ✅ "Generate QR Code" button ENABLED
- ✅ Button text: "Generate Prescription QR Code" (full text, no warning)

**Screenshot Checkpoint:** All 4 green boxes filled with "1234"

---

### Test 2.4: PIN Entry - Backspace
**Purpose:** Test PIN editing

**Steps:**
1. Enter full PIN "1234"
2. Press Backspace key
3. Observe behavior

**Expected Results:**
- ✅ Last digit "4" is removed
- ✅ Fourth box now empty (gray border, dot placeholder)
- ✅ Focus moves to fourth box (active state)
- ✅ First three boxes remain green: "1", "2", "3"
- ✅ "Generate QR Code" button DISABLED (only 3/4 digits)

---

### Test 2.5: PIN Entry - Click to Edit
**Purpose:** Test clicking to edit middle digits

**Steps:**
1. Enter full PIN "1234"
2. Click on second box (digit "2")
3. Type "9"

**Expected Results:**
- ✅ Second box becomes active (blue border)
- ✅ Digit "2" is replaced with "9"
- ✅ PIN now reads: "1934"
- ✅ Box remains green after edit
- ✅ Focus stays on second box or moves to next

---

### Test 2.6: PIN Entry - Non-Numeric Input
**Purpose:** Verify only numbers are accepted

**Steps:**
1. Enable PIN protection
2. Try typing: "abcd", "!@#$", "12.5"

**Expected Results:**
- ✅ Letters are IGNORED (boxes remain empty)
- ✅ Special characters are IGNORED
- ✅ Decimal points are IGNORED
- ✅ Only numeric digits 0-9 are accepted

---

### Test 2.7: Disable PIN Protection
**Purpose:** Test unchecking PIN option

**Steps:**
1. Enable PIN protection
2. Enter PIN "1234"
3. Uncheck "Enable PIN Protection" checkbox

**Expected Results:**
- ✅ PIN input boxes DISAPPEAR
- ✅ "Generate Random PIN" button DISAPPEARS
- ✅ Helper text disappears
- ✅ Recommendation banner REAPPEARS
- ✅ "Generate QR Code" button ENABLED (no PIN required)

---

## Test Suite 3: Random PIN Generator

### Test 3.1: Generate Random PIN - Basic
**Purpose:** Test random PIN generation

**Steps:**
1. Open BeautifulQRDialog
2. Enable PIN protection (boxes appear empty)
3. Click "Generate Random PIN" button (shuffle icon)
4. Observe result

**Expected Results:**
- ✅ 4-digit PIN is auto-filled immediately
- ✅ All 4 boxes turn green
- ✅ PIN is numeric only (e.g., "7382", "1905", "4621")
- ✅ PIN is between 1000-9999 (no leading zeros like "0123")
- ✅ "Generate QR Code" button becomes ENABLED
- ✅ Recommendation banner HIDDEN

**Screenshot Checkpoint:** Auto-filled random PIN in green boxes

---

### Test 3.2: Generate Random PIN - Multiple Clicks
**Purpose:** Verify each click generates NEW random PIN

**Steps:**
1. Enable PIN protection
2. Click "Generate Random PIN" button
3. Note the PIN (e.g., "7382")
4. Click "Generate Random PIN" again
5. Note the new PIN

**Expected Results:**
- ✅ Each click generates a DIFFERENT PIN
- ✅ PINs are sufficiently random (not sequential like 1234, 5678)
- ✅ All PINs are 4 digits (1000-9999 range)

**Verification:** Click 10 times, verify no duplicates

---

### Test 3.3: Generate Random PIN - Override Manual Entry
**Purpose:** Test random generation over manually entered PIN

**Steps:**
1. Enable PIN protection
2. Manually type "1111"
3. Click "Generate Random PIN" button

**Expected Results:**
- ✅ Manual PIN "1111" is REPLACED
- ✅ New random PIN appears (e.g., "8274")
- ✅ All 4 boxes update with new PIN
- ✅ Boxes remain green

---

### Test 3.4: Random PIN - Copy to Clipboard (Optional Feature)
**Purpose:** Test if generated PIN can be copied

**Steps:**
1. Generate random PIN
2. Try to select PIN text in boxes
3. Right-click → Copy (or Ctrl+C)

**Expected Results:**
- ✅ PIN text CAN be selected (for sharing with pharmacist)
- ✅ PIN can be copied to clipboard
- ✅ Parent can paste PIN into messaging app

**Note:** This may require additional implementation if selection is disabled

---

## Test Suite 4: Security Options

### Test 4.1: Expiration Period - Change Value
**Purpose:** Test expiration period selector

**Steps:**
1. Open BeautifulQRDialog
2. Observe default: "30 days" is selected (blue background)
3. Click "7 days" button

**Expected Results:**
- ✅ "7 days" button turns blue (bg-blue-600, text-white)
- ✅ "30 days" button turns gray (deselected)
- ✅ Only ONE button selected at a time
- ✅ "Generate QR Code" button remains enabled

---

### Test 4.2: Expiration Period - All Options
**Purpose:** Test all expiration durations

**Steps:**
1. Click each expiration button: 1, 3, 7, 14, 30, 90 days
2. Observe visual feedback

**Expected Results:**
- ✅ Each button works (selectable)
- ✅ Selected button: blue background, white text
- ✅ Unselected buttons: white background, gray text, gray border
- ✅ Hover effect on unselected buttons (border-blue-600)

**Test Matrix:**
| Duration | Use Case |
|----------|----------|
| 1 day | Emergency/temporary |
| 3 days | Short-term |
| 7 days | One week |
| 14 days | Two weeks |
| 30 days | Default - One month |
| 90 days | Extended access |

---

### Test 4.3: Max Uses - Minimum Value
**Purpose:** Test max uses input constraints

**Steps:**
1. Open BeautifulQRDialog
2. Find "Maximum Uses" input (default: 100)
3. Try to enter "0"
4. Tab out or click away

**Expected Results:**
- ✅ Value automatically changes to "1" (minimum)
- ✅ Cannot save value less than 1
- ✅ Helper text: "times this QR code can be scanned"

---

### Test 4.4: Max Uses - Maximum Value
**Purpose:** Test max uses upper limit

**Steps:**
1. Change max uses to "999"
2. Tab out

**Expected Results:**
- ✅ Value automatically changes to "100" (maximum)
- ✅ Cannot exceed 100 uses

---

### Test 4.5: Max Uses - Non-Numeric Input
**Purpose:** Test invalid input handling

**Steps:**
1. Try to type "abc" in max uses field
2. Try to type "12.5"

**Expected Results:**
- ✅ Letters are IGNORED
- ✅ Decimal points are IGNORED
- ✅ Only integers 1-100 are accepted

---

### Test 4.6: Full Configuration with PIN
**Purpose:** Test complete configuration before generation

**Steps:**
1. Open BeautifulQRDialog
2. Enable PIN protection
3. Enter PIN "5678" manually
4. Select expiration: "7 days"
5. Set max uses: "25"
6. Click "Generate QR Code"

**Expected Results:**
- ✅ QR generates successfully
- ✅ Security badge: "🔒 PIN Protected" (green)
- ✅ Recommendation banner HIDDEN
- ✅ Download QR code image

**API Verification:**
```json
POST /qr/generate
{
  "patient_id": "uuid",
  "share_type": "parent_access",
  "expires_in_days": 7,
  "max_uses": 25,
  "pin_code": "5678",
  "metadata": {
    "shared_by": "parent",
    "requires_pin": true
  }
}
```

---

## Test Suite 5: QR Code Validation

### Test 5.1: Scan QR Without PIN
**Purpose:** Verify QR works without PIN protection

**Steps:**
1. Generate QR with PIN protection DISABLED
2. Download QR code image
3. Open QR Scanner on another device/browser
4. Scan the QR code

**Expected Results:**
- ✅ QR scans successfully
- ✅ NO PIN modal appears
- ✅ Patient data displays immediately:
  - Patient name
  - Allergies
  - Vaccinations
  - Medical records
- ✅ QR metadata shows: `use_count: 1`

---

### Test 5.2: Scan QR With PIN - Correct PIN
**Purpose:** Verify PIN protection works

**Steps:**
1. Generate QR with PIN "1234"
2. Download QR code
3. Scan QR on another device
4. PIN modal appears
5. Enter "1234" in PIN input

**Expected Results:**
- ✅ QR scans, shows PIN entry modal
- ✅ 4-box PIN input appears (same Input-OTP component)
- ✅ Modal text: "This QR code is PIN protected"
- ✅ Helper text: "Enter the 4-digit PIN to access patient information"
- ✅ After entering "1234", modal closes
- ✅ Patient data displays successfully
- ✅ Backend logs: PIN validated successfully

---

### Test 5.3: Scan QR With PIN - Wrong PIN
**Purpose:** Test PIN validation failure

**Steps:**
1. Generate QR with PIN "1234"
2. Scan QR code
3. Enter wrong PIN "9999"
4. Submit

**Expected Results:**
- ✅ Error message: "Invalid PIN"
- ✅ PIN input boxes shake or show red border
- ✅ Patient data does NOT display
- ✅ User can try again
- ✅ After 3 failed attempts, show warning

**Backend Response:**
```json
{
  "error": "Invalid PIN",
  "status": 401
}
```

---

### Test 5.4: Scan QR - Expired
**Purpose:** Test expiration validation

**Steps:**
1. Generate QR with 1-day expiration
2. Manually update database: set `expires_at` to yesterday
3. Scan QR code

**Expected Results:**
- ✅ Error message: "QR code has expired"
- ✅ No PIN modal appears
- ✅ Instructions: "Please request a new QR code from the parent"

**Backend Response:**
```json
{
  "error": "QR code has expired",
  "status": 403
}
```

---

### Test 5.5: Scan QR - Max Uses Exceeded
**Purpose:** Test max uses limit

**Steps:**
1. Generate QR with max_uses = 2
2. Scan QR twice successfully
3. Try to scan QR a third time

**Expected Results:**
- ✅ First scan: SUCCESS
- ✅ Second scan: SUCCESS (use_count = 2)
- ✅ Third scan: ERROR "Maximum uses exceeded"
- ✅ Instructions: "This QR code has been used the maximum number of times"

---

## Test Suite 6: PrescriptionQRDialog

### Test 6.1: Initial State Differences
**Purpose:** Verify prescription-specific defaults

**Steps:**
1. Login as doctor
2. View patient prescription
3. Click "Share via QR Code"

**Expected Results:**
- ✅ Dialog opens with configuration form (no QR yet)
- ✅ Default expiration: **30 days** (same as BeautifulQRDialog)
- ✅ Default max uses: **50** (lower than patient records)
- ✅ Prescription icon (pill) in dialog header
- ✅ Recommendation banner: "Recommended for sharing prescription information **outside trusted pharmacies**"

---

### Test 6.2: Generate Prescription QR Without PIN
**Purpose:** Test quick prescription sharing

**Steps:**
1. Open PrescriptionQRDialog
2. Keep PIN protection disabled
3. Keep defaults (30 days, 50 uses)
4. Click "Generate Prescription QR Code"

**Expected Results:**
- ✅ QR generates successfully
- ✅ Security badge: "🔓 No PIN"
- ✅ Recommendation banner visible
- ✅ Download includes prescription details:
  - Medication name, dosage, frequency
  - Doctor's notes
  - Prescription date

---

### Test 6.3: Generate Prescription QR With PIN
**Purpose:** Test secure prescription sharing

**Steps:**
1. Open PrescriptionQRDialog
2. Enable PIN protection
3. Use random PIN generator
4. Set expiration: 7 days
5. Set max uses: 10
6. Click "Generate Prescription QR Code"

**Expected Results:**
- ✅ QR generates with PIN
- ✅ Security badge: "🔒 PIN Protected"
- ✅ Download QR code
- ✅ Scan on pharmacy scanner
- ✅ PIN modal appears
- ✅ Pharmacist enters PIN
- ✅ Prescription details display

---

### Test 6.4: Prescription QR - Pharmacy Workflow
**Purpose:** Simulate real pharmacy use case

**Steps:**
1. Parent generates prescription QR with PIN "4567"
2. Parent shares QR + PIN with pharmacy via phone
3. Pharmacist scans QR code at pharmacy terminal
4. Pharmacist enters PIN "4567"
5. Pharmacist views prescription details

**Expected Results:**
- ✅ QR scans quickly (< 2 seconds)
- ✅ PIN entry is smooth (Input-OTP component)
- ✅ Prescription displays clearly:
  - Medication: "Amoxicillin 250mg"
  - Dosage: "1 teaspoon every 8 hours"
  - Duration: "10 days"
  - Doctor: "Dr. Smith"
- ✅ Pharmacist can fulfill prescription
- ✅ QR use count increments

---

## Edge Cases & Error Handling

### Edge Case 1: Network Failure During Generation
**Steps:**
1. Open BeautifulQRDialog
2. Configure settings
3. Disconnect internet
4. Click "Generate QR Code"

**Expected Results:**
- ✅ Loading state shows
- ✅ After timeout (5-10 seconds), error message:
  - "Failed to generate QR code"
  - "Please check your internet connection"
- ✅ User can retry after reconnecting

---

### Edge Case 2: Rapid Click on Generate Button
**Steps:**
1. Configure QR settings
2. Click "Generate QR Code" button 5 times rapidly

**Expected Results:**
- ✅ Button disables after first click
- ✅ Only ONE API call is made
- ✅ Loading state prevents duplicate requests
- ✅ Single QR code generates

---

### Edge Case 3: Close Dialog During Generation
**Steps:**
1. Click "Generate QR Code"
2. Immediately close dialog (X button)
3. Reopen dialog

**Expected Results:**
- ✅ Dialog resets to initial state
- ✅ No lingering loading state
- ✅ Configuration form shows defaults
- ✅ No generated QR persists

---

### Edge Case 4: PIN Protection Toggle During Entry
**Steps:**
1. Enable PIN protection
2. Enter 2 digits: "12"
3. Uncheck "Enable PIN Protection"
4. Re-check "Enable PIN Protection"

**Expected Results:**
- ✅ PIN input clears when unchecked
- ✅ Boxes reappear empty when re-checked
- ✅ Previous partial PIN "12" does NOT persist

---

### Edge Case 5: Browser Autofill on PIN Input
**Steps:**
1. Enable PIN protection
2. Observe if browser autofill triggers

**Expected Results:**
- ✅ Autofill should NOT suggest passwords
- ✅ Input-OTP component prevents autocomplete
- ✅ User must manually enter or generate PIN

---

## Visual Regression Testing

### Visual Test 1: PIN Input States
**Screenshot Checkpoints:**
1. Empty PIN boxes (gray borders, dot placeholders)
2. First box active (blue border, ring effect)
3. First box filled (green border, digit visible)
4. All boxes filled (all green)
5. Disabled state (opacity-50)

---

### Visual Test 2: Security Badges
**Screenshot Checkpoints:**
1. "🔓 No PIN" badge (gray background)
2. "🔒 PIN Protected" badge (green background)
3. Badge sizing and icon alignment

---

### Visual Test 3: Recommendation Banner
**Screenshot Checkpoints:**
1. Banner visible when PIN disabled (amber gradient)
2. Banner hidden when PIN enabled
3. Banner text and icon alignment

---

### Visual Test 4: Responsive Design
**Test at breakpoints:**
- Mobile (320px, 375px, 425px)
- Tablet (768px, 1024px)
- Desktop (1440px, 1920px)

**Expected:**
- ✅ PIN input boxes scale appropriately
- ✅ Configuration form stacks vertically on mobile
- ✅ Expiration buttons grid adapts (2 columns on mobile)
- ✅ QR code remains centered

---

## Accessibility Testing

### A11y Test 1: Keyboard Navigation
**Steps:**
1. Open dialog
2. Use Tab key to navigate through:
   - PIN protection checkbox
   - PIN input boxes
   - Random PIN button
   - Expiration buttons
   - Max uses input
   - Generate button

**Expected Results:**
- ✅ All interactive elements are focusable
- ✅ Focus indicators visible (ring/outline)
- ✅ Tab order is logical (top to bottom)
- ✅ Enter key activates buttons

---

### A11y Test 2: Screen Reader
**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through dialog

**Expected Results:**
- ✅ Checkbox announced: "Enable PIN Protection, checkbox, unchecked"
- ✅ PIN input announced: "Enter PIN, digit 1 of 4"
- ✅ Buttons have clear labels
- ✅ Helper text is associated with inputs (aria-describedby)

---

## Performance Testing

### Performance Test 1: QR Generation Speed
**Measure:**
- Time from "Generate QR Code" click to QR display

**Expected:**
- ✅ Without PIN: < 1 second
- ✅ With PIN: < 2 seconds
- ✅ Network latency accounts for most delay

---

### Performance Test 2: Random PIN Generation
**Measure:**
- Time from "Generate Random PIN" click to PIN display

**Expected:**
- ✅ < 100ms (instant feedback)
- ✅ No API call required (client-side generation)

---

## Browser Compatibility

### Browser Test Matrix
Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

**Focus on:**
- Input-OTP component rendering
- PIN input interaction
- QR code display
- Download functionality

---

## Security Testing

### Security Test 1: PIN Visibility
**Steps:**
1. Generate random PIN
2. Inspect page source
3. Check network requests

**Expected:**
- ✅ PIN is NOT stored in localStorage
- ✅ PIN is NOT visible in HTML source
- ✅ PIN is sent to backend over HTTPS
- ✅ PIN is hashed in database (not plaintext)

---

### Security Test 2: QR Token Validation
**Steps:**
1. Generate QR code
2. Extract token from QR data
3. Try to access `/qr/access?token=<token>` without PIN
4. Try to access with wrong PIN

**Expected:**
- ✅ Request without PIN: 401 Unauthorized
- ✅ Request with wrong PIN: 401 Invalid PIN
- ✅ Request with correct PIN: 200 Success

---

## Summary Checklist

### Before Release:
- [ ] All 6 test suites pass
- [ ] All edge cases handled
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] Performance benchmarks met
- [ ] Browser compatibility confirmed
- [ ] Security audit completed

### Known Issues:
- Document any issues found during testing
- Link to issue tracker
- Note workarounds or fixes applied

---

## Test Reporting Template

```markdown
## Test Session Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Local/Staging/Production]
**Browser:** [Chrome 120, Firefox 121, etc.]

### Tests Executed:
- [ ] Suite 1: Configuration-First Flow (12/12 passed)
- [ ] Suite 2: PIN Input Component (7/7 passed)
- [ ] Suite 3: Random PIN Generator (4/4 passed)
- [ ] Suite 4: Security Options (6/6 passed)
- [ ] Suite 5: QR Code Validation (5/5 passed)
- [ ] Suite 6: PrescriptionQRDialog (4/4 passed)

### Issues Found:
1. [Issue description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** ...
   - **Screenshot:** [link]

### Pass Rate: 38/38 (100%)
```

---

**Questions or Issues?**
- Check browser console for errors
- Verify backend `/qr/generate` and `/qr/access` endpoints
- Review PIN_PROTECTION_GUIDE.md for implementation details
- Test with Postman: `POST /qr/generate` with `pin_code` parameter
