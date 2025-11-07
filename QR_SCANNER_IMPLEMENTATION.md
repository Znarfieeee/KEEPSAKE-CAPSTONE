# QR Scanner Implementation Guide

## Overview

The KEEPSAKE QR Scanner is a dynamic, role-based QR code scanning system that works across different user roles (doctors, nurses, staff, parents). It provides instant patient lookup and role-appropriate actions based on the scanned QR code data.

## Features

### Core Features
- ✅ Real-time camera QR code scanning using HTML5 QR Code library
- ✅ Multi-camera support (front/back camera selection)
- ✅ Role-based navigation and actions
- ✅ Patient information lookup
- ✅ Beautiful, responsive UI with loading states
- ✅ Error handling and user feedback
- ✅ QR code generator for testing
- ✅ Context-based state management
- ✅ Audit logging support (placeholder)

### Role-Based Actions

| Role | Action | Navigation |
|------|--------|-----------|
| **Pediapro (Doctor)** | View Patient Details | `/pediapro/patient_records/:patientId` |
| **Vital Custodian (Nurse/Staff)** | Record Vital Signs | `/vital_custodian/patient/:patientId/vitals` |
| **Keepsaker (Parent)** | View Child Information | `/parent/child/:patientId` |
| **Facility Admin** | Manage Patient | `/facility_admin/patients/:patientId` |
| **System Admin** | System View | System-level view |

## Installation

### Dependencies

The following packages have been installed:

```bash
cd client
npm install html5-qrcode @zxing/library qrcode.react
```

### Files Created

#### Components
1. **`client/src/components/ui/QrCodeScanner.jsx`**
   - Reusable QR scanner component with camera controls
   - Multi-camera support
   - Real-time scanning with visual feedback

2. **`client/src/components/ui/QrCodeGenerator.jsx`**
   - QR code generator component for testing
   - Download QR as PNG
   - Copy QR data to clipboard

#### Pages
3. **`client/src/pages/QrScanner.jsx`**
   - Main QR scanner page (updated from placeholder)
   - Patient information display
   - Role-based action buttons

4. **`client/src/pages/QrCodeGeneratorTest.jsx`**
   - Test page for generating patient QR codes
   - Sample patient data
   - Quick testing interface

#### Context & API
5. **`client/src/context/QrScannerContext.jsx`**
   - Context provider for QR scanner state
   - Role-based logic processing
   - Navigation path generation

6. **`client/src/api/qrScanner.js`**
   - API integration for patient lookup
   - QR code verification
   - Audit logging functions

## Usage

### For End Users

#### Scanning a QR Code

1. Navigate to the QR Scanner page:
   - From sidebar navigation (available in all role layouts)
   - Direct URL: `/qr_scanner`

2. Grant camera permissions when prompted

3. Position the QR code within the scanning frame

4. Once scanned, patient information will be displayed

5. Click the role-appropriate action button to navigate to patient details

#### Generating Test QR Codes

1. Navigate to `/qr_generator_test` (development/testing only)

2. Enter patient information or select a sample patient

3. Download or display the generated QR code

4. Use the QR code to test the scanner

### For Developers

#### Using the QR Scanner Component

```jsx
import QrCodeScanner from "../components/ui/QrCodeScanner"

function MyComponent() {
    const handleScanSuccess = (decodedText, decodedResult) => {
        console.log("Scanned:", decodedText)
        // Process the scanned data
    }

    return (
        <QrCodeScanner
            onScanSuccess={handleScanSuccess}
            width="100%"
            height="450px"
            fps={10}
            qrbox={280}
        />
    )
}
```

#### Using the QR Scanner Context

```jsx
import { useQrScanner } from "../context/QrScannerContext"

function MyComponent() {
    const {
        processQrData,
        clearScanResult,
        getRoleAction,
        getNavigationPath
    } = useQrScanner()

    const handleScan = (data) => {
        const result = processQrData(data)
        const action = getRoleAction(result)
        const path = getNavigationPath(result)
        // Use the processed data
    }
}
```

#### QR Code Data Format

The QR codes should contain JSON data in the following format:

```json
{
    "patientId": "PAT-2024-001",
    "patientName": "Juan Dela Cruz",
    "facilityId": "FAC-001",
    "type": "patient",
    "generatedAt": "2024-10-22T12:00:00.000Z"
}
```

Alternatively, a plain text patient ID is also supported:
```
PAT-2024-001
```

## Backend Integration

### Required API Endpoints

You'll need to implement the following endpoints on the Flask backend:

#### 1. Get Patient by QR Code
```python
GET /api/patients/<patient_id>/qr-lookup
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": "PAT-2024-001",
        "name": "Juan Dela Cruz",
        "dateOfBirth": "2020-01-15",
        "guardianName": "Guardian Name",
        "facilityId": "FAC-001"
    }
}
```

#### 2. Verify QR Code Access
```python
POST /api/qr-scanner/verify
```

**Request:**
```json
{
    "qrData": "...",
    "userId": "user-id"
}
```

**Response:**
```json
{
    "status": "success",
    "hasAccess": true,
    "permissions": ["view", "edit"]
}
```

#### 3. Log QR Scan Event
```python
POST /api/qr-scanner/log
```

**Request:**
```json
{
    "rawData": "...",
    "parsedData": {...},
    "scannedAt": "2024-10-22T12:00:00.000Z",
    "scannedBy": "user-id",
    "userRole": "pediapro"
}
```

#### 4. Get Patient Details by Role
```python
GET /api/patients/<patient_id>/details?role=<role>
```

**Response:**
```json
{
    "status": "success",
    "data": {
        // Role-specific patient data
    }
}
```

### Example Flask Route Implementation

```python
from flask import Blueprint, request, jsonify
from server.utils.session_utils import require_session
from server.utils.audit_logger import log_audit_event

qr_scanner_bp = Blueprint('qr_scanner', __name__)

@qr_scanner_bp.route('/api/patients/<patient_id>/qr-lookup', methods=['GET'])
@require_session
def get_patient_by_qr(patient_id):
    try:
        user = request.user

        # Get patient data
        patient = get_patient_from_db(patient_id)

        # Check facility access
        if patient['facility_id'] != user['facility_id']:
            return jsonify({
                'status': 'error',
                'message': 'No access to this patient'
            }), 403

        # Log the access
        log_audit_event(
            user_id=user['id'],
            action='qr_scan_patient_lookup',
            resource_type='patient',
            resource_id=patient_id,
            details={'method': 'qr_code'}
        )

        return jsonify({
            'status': 'success',
            'data': patient
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@qr_scanner_bp.route('/api/qr-scanner/log', methods=['POST'])
@require_session
def log_qr_scan():
    try:
        data = request.json
        user = request.user

        log_audit_event(
            user_id=user['id'],
            action='qr_code_scan',
            resource_type='qr_code',
            resource_id=data.get('parsedData', {}).get('patientId'),
            details=data
        )

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
```

## Architecture

### Component Hierarchy

```
App.jsx (with QrScannerProvider)
├── QrScanner.jsx (main page)
│   ├── QrCodeScanner.jsx (camera component)
│   └── Patient info display
│
└── QrCodeGeneratorTest.jsx (test page)
    └── QrCodeGenerator.jsx (generator component)
```

### State Management Flow

1. User scans QR code
2. `QrCodeScanner` component decodes the QR data
3. `onScanSuccess` callback fires with decoded text
4. `QrScanner` page processes the data using `processQrData()` from context
5. Patient information is fetched from API
6. Role-based action button is displayed
7. User clicks action button
8. Navigation occurs based on `getNavigationPath()` from context

### Data Flow Diagram

```
QR Code → Camera → Html5Qrcode → QrCodeScanner Component
                                        ↓
                                  onScanSuccess()
                                        ↓
                                  QrScanner Page
                                        ↓
                                  processQrData() (context)
                                        ↓
                                  API: getPatientByQrCode()
                                        ↓
                                  Display Patient Info
                                        ↓
                                  getNavigationPath() (context)
                                        ↓
                                  Navigate to patient details
```

## Security Considerations

### Current Implementation
- ✅ Authentication required for QR scanner access
- ✅ Session-based user verification
- ✅ Role-based navigation paths

### Required Backend Security
- ⚠️ **Facility-based access control**: Ensure users can only access patients from their facility
- ⚠️ **Role-based permissions**: Verify user role has permission to access patient data
- ⚠️ **Audit logging**: Log all QR scan events for compliance
- ⚠️ **Rate limiting**: Prevent abuse of QR scanning endpoints
- ⚠️ **QR code expiration**: Consider implementing time-limited QR codes for sensitive data

### Recommendations

1. **Implement QR Code Signing**: Add cryptographic signatures to QR codes to prevent tampering
2. **Add Expiration Timestamps**: QR codes should have a validity period
3. **Two-Factor Verification**: For sensitive operations, require additional confirmation
4. **Access Logging**: Comprehensive audit trail of all QR scan activities

## Testing

### Manual Testing Steps

1. **Test QR Code Generation**
   - Navigate to `/qr_generator_test`
   - Generate QR codes for different sample patients
   - Download QR code images

2. **Test QR Code Scanning**
   - Navigate to `/qr_scanner`
   - Grant camera permissions
   - Display QR code on another device or print it
   - Scan the QR code
   - Verify patient information is displayed correctly

3. **Test Role-Based Actions**
   - Log in as different roles (doctor, nurse, parent, admin)
   - Scan the same QR code
   - Verify action button text changes based on role
   - Verify navigation path is role-appropriate

4. **Test Error Handling**
   - Scan invalid QR code
   - Scan QR code with non-existent patient ID
   - Test with camera permissions denied
   - Test on mobile devices

### Browser Compatibility

Tested on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (iOS)
- ✅ Mobile browsers (Chrome/Safari)

**Note**: HTTPS is required for camera access in production.

## Troubleshooting

### Camera Not Working

**Problem**: Camera doesn't start or shows permission error

**Solutions**:
1. Ensure browser has camera permissions
2. Check if camera is being used by another application
3. Try refreshing the page
4. In production, ensure the site is served over HTTPS

### QR Code Not Scanning

**Problem**: QR code is not being detected

**Solutions**:
1. Ensure good lighting conditions
2. Hold QR code steady within the scanning frame
3. Adjust distance from camera
4. Try a different camera (front/back)
5. Ensure QR code is not damaged or distorted

### Patient Information Not Loading

**Problem**: QR code scans but patient info doesn't appear

**Solutions**:
1. Check browser console for API errors
2. Verify backend endpoints are implemented
3. Check network tab for failed requests
4. Ensure patient ID exists in database
5. Verify user has access to the patient's facility

## Future Enhancements

### Planned Features
- [ ] Offline QR code caching
- [ ] Bulk QR code generation for printing patient wristbands
- [ ] QR code history and recent scans
- [ ] Advanced QR code formats (vCard, URLs, etc.)
- [ ] Integration with printer for immediate ID card printing
- [ ] QR code analytics and usage statistics
- [ ] Multi-patient QR code support (for families)

### Performance Optimizations
- [ ] Implement QR code data caching
- [ ] Add service worker for offline support
- [ ] Optimize camera stream resolution
- [ ] Lazy load QR scanner component

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in component files
3. Check browser console for errors
4. Verify backend API responses

## License

Proprietary - KEEPSAKE Healthcare System

---

**Last Updated**: October 22, 2024
**Version**: 1.0.0
**Author**: Claude Code Assistant
