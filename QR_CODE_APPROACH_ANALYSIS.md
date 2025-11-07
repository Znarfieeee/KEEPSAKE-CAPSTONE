# QR Code Approach Analysis for Pediatric Medical Records

## Executive Summary

This document analyzes two approaches for implementing QR code-based patient record access in the KEEPSAKE pediatric healthcare system:

1. **Token-Based QR Codes** - Generate a secure token/link, store it in the database, and encode the URL in the QR code
2. **Data-Embedded QR Codes** - Encode patient data directly in the QR code as JSONB

Based on the system architecture, database relationships, and healthcare security requirements, **Token-Based QR Codes are strongly recommended** for this use case.

---

## System Context

### Current Architecture
- **Multi-tenant system** with facility-based data isolation
- **PostgreSQL database** via Supabase with strict RLS policies
- **JWT-based authentication** with Redis session management
- **Audit logging** for all critical operations
- **Real-time updates** using Supabase subscriptions

### Key Database Tables
- `patients` - Core patient records
- `facility_patients` - Junction table linking patients to facilities
- `qr_codes` - QR code metadata and access control (already exists!)
- `prescriptions`, `appointments`, `vaccinations` - Patient medical data
- `audit_logs` - System audit trail

### Existing QR Code Infrastructure
The system **already has a `qr_codes` table** with comprehensive fields:
```sql
qr_codes:
  - qr_id (uuid, PK)
  - token_hash (varchar, unique) ✓ Token storage
  - patient_id (uuid, FK to patients)
  - generated_by (uuid, FK to users)
  - facility_id (uuid, FK to healthcare_facilities)
  - share_type (varchar) - e.g., 'medical_record'
  - scope (jsonb) - Access permissions
  - expires_at (timestamptz) ✓ Time-based expiry
  - max_uses (integer) ✓ Usage limits
  - use_count (integer) ✓ Track accesses
  - pin_code (varchar) ✓ Optional PIN protection
  - target_facilities (uuid[]) ✓ Facility whitelisting
  - metadata (jsonb) - Additional context
  - last_accessed_at (timestamptz)
  - last_accessed_by (uuid, FK to users)
  - created_at (timestamptz)
  - is_active (boolean) ✓ Revocation support
```

---

## Approach 1: Token-Based QR Codes (RECOMMENDED)

### How It Works
1. Doctor/facility generates a QR code for a patient
2. Backend creates a secure token (UUID or cryptographic hash)
3. Token metadata stored in `qr_codes` table with access rules
4. QR code encodes a URL: `https://keepsake.app/patient/access?token=abc123...`
5. When scanned:
   - Validate token exists and is active
   - Check expiry, max uses, facility permissions
   - Authenticate scanning user
   - Grant temporary access to patient records
   - Log access in audit_logs

### Pros ✅

#### Security (Critical for Healthcare)
- **Revocable Access**: Can instantly deactivate QR codes via `is_active = false`
- **Audit Trail**: Every scan logged with user_id, timestamp, IP address
- **Fine-Grained Permissions**: `scope` field controls what data is accessible (view_only, prescriptions_only, etc.)
- **Expiration Control**: Automatic expiry via `expires_at` timestamp
- **Usage Limits**: Prevent token reuse via `max_uses` and `use_count`
- **PIN Protection**: Optional `pin_code` for additional security layer
- **Facility Whitelisting**: `target_facilities` restricts which facilities can access
- **No PHI Exposure**: QR code only contains a meaningless token, not patient data
- **HIPAA Compliance**: Centralized access control meets healthcare privacy standards

#### Flexibility
- **Dynamic Data**: Always shows current patient data, not stale snapshot
- **Granular Scope**: Can share specific records (prescriptions only, allergies only, etc.)
- **Multi-Facility Support**: Can grant access to multiple facilities via `target_facilities[]`
- **Temporary Access**: Perfect for referrals, second opinions, emergency access
- **Share Type Flexibility**: `share_type` field supports different use cases (medical_record, prescription, referral)

#### Operational Benefits
- **Real-Time Updates**: Scanned data reflects current database state
- **Usage Analytics**: Track how often QR codes are used via `use_count`, `last_accessed_at`
- **User Attribution**: Know exactly who accessed what via `last_accessed_by`
- **Revocation Without Re-Issue**: Deactivate compromised tokens without new QR codes
- **Minimal QR Code Size**: Short URL = smaller, easier-to-scan QR code

#### Technical Benefits
- **Consistent with System Architecture**: Uses existing facility isolation, RLS, auth
- **Database-Driven**: Leverages PostgreSQL strengths (foreign keys, constraints, indexes)
- **Scalable**: Token validation is fast (indexed lookups)
- **Integration-Ready**: Works with existing audit logging, session management
- **Future-Proof**: Easy to add new features (notifications, access requests, etc.)

### Cons ❌

#### Infrastructure Requirements
- **Backend Dependency**: Requires API endpoint to validate tokens and serve data
- **Network Required**: Scanner must have internet connection to validate token
- **Database Query**: Each scan triggers database lookup (mitigated by Redis caching)

#### Complexity
- **Additional Backend Logic**: Need routes for token generation, validation, revocation
- **Token Management**: Must handle expiry, cleanup of old tokens
- **State Management**: More moving parts than static QR codes

### Implementation Outline

```python
# Backend Routes Needed
POST   /api/qr/generate              # Generate QR code for patient
GET    /api/qr/access?token=xxx      # Validate token and return patient data
POST   /api/qr/revoke                # Revoke QR code access
GET    /api/qr/audit/<qr_id>         # View access history

# QR Code Generation Flow
1. Doctor selects patient, clicks "Generate QR Code"
2. Backend creates qr_codes record:
   - Generate cryptographically secure token (uuid_generate_v4() or SHA256 hash)
   - Set patient_id, facility_id, generated_by
   - Set scope: ["view_only"] or ["prescriptions", "allergies"]
   - Set expires_at: now() + 30 days
   - Set max_uses: 1 (for one-time access) or NULL (unlimited)
   - Optional: Set target_facilities (for referrals)
3. Return URL: https://keepsake.app/access?token={token_hash}
4. Frontend generates QR code from URL
5. Display/print/share QR code

# QR Code Scanning Flow
1. Scan QR code → Extract token from URL
2. GET /api/qr/access?token=abc123
3. Backend validates:
   - Token exists in qr_codes table
   - is_active = true
   - expires_at > now()
   - use_count < max_uses (if max_uses is set)
   - Scanning user is authenticated
   - Scanning user's facility in target_facilities (if restricted)
4. If valid:
   - Increment use_count
   - Set last_accessed_at, last_accessed_by
   - Insert audit_log record
   - Return patient data based on scope
5. Frontend displays patient information
```

---

## Approach 2: Data-Embedded QR Codes

### How It Works
1. Doctor generates QR code for patient
2. Backend queries patient data (demographics, prescriptions, allergies, etc.)
3. Data encoded directly in QR code as JSONB/JSON
4. QR code contains: `{"patient_id": "...", "name": "...", "allergies": [...], "prescriptions": [...]}`
5. When scanned:
   - QR reader extracts JSON data
   - Display data directly (no backend call)
   - Optionally verify signature/checksum

### Pros ✅

#### Offline Capability
- **No Network Required**: Works in areas without internet connectivity
- **Instant Access**: No API latency, immediate data display
- **Backend Independence**: Functions even if server is down

#### Simplicity
- **Minimal Backend Logic**: Just data serialization at generation time
- **Stateless**: No database lookups during scanning
- **Self-Contained**: All data in the QR code itself

### Cons ❌ (Critical Issues for Healthcare)

#### Security Risks (DEALBREAKERS)
- **PHI Exposure**: Patient health information physically encoded in QR code
  - Anyone with camera can capture sensitive medical data
  - Screenshots/photos contain full patient records
  - Lost/stolen QR codes = data breach
  - HIPAA violation risk: unsecured PHI transmission
- **No Revocation**: Cannot invalidate QR code once generated
  - If patient revokes consent, QR code still works
  - If data is incorrect, cannot recall QR codes
  - No way to deactivate compromised QR codes
- **No Audit Trail**: Cannot track who scanned, when, or where
  - Impossible to investigate unauthorized access
  - No compliance evidence
  - No accountability
- **No Access Control**: Anyone with QR code has full access
  - No authentication of scanner
  - No facility restrictions
  - No scope limitations (all or nothing)

#### Data Integrity Issues
- **Stale Data**: QR code shows snapshot from generation time
  - New prescriptions won't appear
  - Updated allergies not reflected
  - Patient data changes invisible
- **Data Tampering**: No guarantee data hasn't been modified
  - Could edit JSON and re-encode
  - Even with signatures, verification is complex
- **Large QR Codes**: More data = larger, harder-to-scan QR codes
  - Pediatric records can be extensive (vaccinations, growth charts, etc.)
  - QR codes become unwieldy with full medical history

#### Operational Problems
- **No Usage Tracking**: Cannot monitor access patterns
- **No Expiration**: QR codes work forever (privacy risk)
- **Version Control**: No way to update shared information
- **Multi-Facility Nightmare**: Each facility would have different QR codes for same patient

#### Compliance Issues
- **HIPAA Non-Compliant**: Encoding PHI in QR codes violates security standards
- **No Minimum Necessary**: Cannot limit access to only required data
- **Breach Notification**: Lost QR code = data breach reporting requirement
- **Data Retention**: Old QR codes violate data minimization principles

### Implementation Outline (NOT RECOMMENDED)

```python
# QR Code Generation Flow
1. Doctor selects patient
2. Backend queries:
   - Patient demographics
   - Allergies
   - Current prescriptions
   - Recent vitals
3. Serialize to JSON (limit to ~2KB for scannable QR)
4. Optionally: Sign with HMAC/JWT for integrity
5. Encode JSON in QR code
6. Display/print QR code

# QR Code Scanning Flow
1. Scan QR code → Extract JSON
2. Parse JSON data
3. Display in read-only view
4. No backend interaction
```

---

## Side-by-Side Comparison

| Feature | Token-Based ✅ | Data-Embedded ❌ |
|---------|---------------|------------------|
| **Security** | ✅ Excellent - No PHI in QR | ❌ Poor - PHI exposed |
| **Revocation** | ✅ Instant via `is_active` flag | ❌ Impossible |
| **Audit Trail** | ✅ Full logging in `audit_logs` | ❌ None |
| **Access Control** | ✅ Fine-grained via `scope` | ❌ All or nothing |
| **Expiration** | ✅ Automatic via `expires_at` | ❌ None |
| **Data Freshness** | ✅ Real-time from database | ❌ Stale snapshot |
| **Network Requirement** | ⚠️ Required for validation | ✅ Offline capable |
| **QR Code Size** | ✅ Small (just URL) | ❌ Large (full data) |
| **HIPAA Compliance** | ✅ Yes | ❌ Questionable |
| **Facility Isolation** | ✅ Enforced via RLS & `target_facilities` | ❌ Not enforced |
| **Usage Tracking** | ✅ `use_count`, `last_accessed_at` | ❌ None |
| **Tamper Resistance** | ✅ Database is source of truth | ❌ Data can be modified |
| **Multi-Facility Support** | ✅ `target_facilities[]` array | ❌ Complex |
| **Implementation Complexity** | ⚠️ Moderate (backend routes) | ✅ Simple (serialize JSON) |
| **Integration with System** | ✅ Uses existing auth, RLS, audit | ❌ Bypasses all security |
| **Scalability** | ✅ Indexed lookups, cacheable | ✅ No backend load |
| **Emergency Access** | ✅ Can grant temporary access | ⚠️ Requires pre-generation |
| **Data Scope Control** | ✅ Granular (allergies only, etc.) | ❌ All or nothing |

---

## Recommended Use Cases

### Token-Based QR Codes ✅ (RECOMMENDED)
- **Patient referrals** to other facilities
- **Emergency access** for temporary providers
- **Second opinions** - share specific records
- **Parent/guardian access** to child's records
- **Inter-facility transfers** with access control
- **Temporary consultation access** with expiration
- **Controlled data sharing** with specific scope

### Data-Embedded QR Codes ❌ (NOT RECOMMENDED)
- ~~Emergency medical cards (offline access)~~ → Use Token-Based with long expiry + PIN
- ~~Patient-held vaccination records~~ → Use official vaccination cards or Token-Based
- ~~Printed summary sheets~~ → Print PDF instead, don't use QR codes

---

## Recommendation: Token-Based QR Codes

### Why This Is The Clear Winner

1. **Existing Infrastructure**: The `qr_codes` table already exists with all necessary fields
2. **Security First**: Healthcare data demands highest security - Token approach delivers
3. **Compliance**: HIPAA and healthcare regulations require access control and audit trails
4. **System Consistency**: Uses existing auth, facility isolation, RLS policies
5. **Revocation**: Critical for healthcare - must be able to revoke access instantly
6. **Audit Requirements**: Healthcare regulations require detailed access logging
7. **Future-Proof**: Easy to extend with notifications, access requests, time-limited shares

### Implementation Priority

**Phase 1: Core Token System** (Week 1-2)
- QR code generation endpoint
- Token validation and patient data retrieval
- Basic audit logging
- QR code display in patient records UI

**Phase 2: Access Control** (Week 3)
- Scope-based permissions (view_only, prescriptions, allergies)
- Facility whitelisting via `target_facilities`
- PIN code protection
- Usage limits enforcement

**Phase 3: Management UI** (Week 4)
- View active QR codes for patient
- Revoke QR codes
- Access history/audit view
- Bulk QR code generation (for referrals)

**Phase 4: Advanced Features** (Future)
- QR code access notifications (email/SMS)
- Access request workflow (patient approves via QR)
- Time-limited emergency access
- QR code templates (referral, emergency, parent access)

---

## Access Control Modes

The token-based approach supports **three access control modes** to handle different sharing scenarios:

### Mode 1: Restricted Access (Facility Whitelisting)
**Use Case**: Scheduled referrals, planned transfers, pre-approved facilities

```python
# QR Code with target_facilities specified
{
  "target_facilities": ["facility-uuid-1", "facility-uuid-2"],
  "share_type": "referral",
  "scope": ["view_only"]
}
```

**Validation**: Scanner's `facility_id` MUST be in `target_facilities[]` array
- ✅ Facility A (in list) can scan → Access granted
- ❌ Facility B (not in list) cannot scan → Access denied

### Mode 2: Open Access (Any Authenticated Facility)
**Use Case**: Emergency care, parent-controlled sharing, travel scenarios

```python
# QR Code with NO target_facilities restriction
{
  "target_facilities": NULL,  # or empty array []
  "share_type": "emergency_access",
  "scope": ["view_only", "allergies", "prescriptions"],
  "pin_code": "1234"  # Optional PIN for additional security
}
```

**Validation**: ANY authenticated facility user can scan → Access granted
- ✅ Facility A can scan
- ✅ Facility B can scan
- ✅ Facility C can scan
- ⚠️ All access is logged in `audit_logs`

**Real-World Scenario - Parent A's Vacation Emergency**:
1. Parent A normally uses Facility A (home facility)
2. Parent A goes on vacation to another city
3. Child gets sick, needs urgent care at Facility B
4. Parent A shows QR code (generated earlier with open access mode)
5. Facility B staff scans QR code:
   - ✅ Token is valid and active
   - ✅ `target_facilities` is NULL → Any facility allowed
   - ✅ Optional PIN verified (if set)
   - ✅ Facility B user is authenticated
   - ✅ Access granted to patient records
   - ✅ Audit log created: `facility_B_user accessed patient_A records via QR code`
6. Facility B automatically registers patient to their facility via `facility_patients` table
7. Facility B can now treat the child with access to medical history

### Mode 3: Hybrid Access (Default + On-Demand)
**Use Case**: Home facility + emergency override

```python
# QR Code with default facility but allows expansion
{
  "target_facilities": ["home-facility-uuid"],
  "metadata": {
    "allow_emergency_access": true,
    "requires_pin": true
  },
  "pin_code": "1234"
}
```

**Validation**:
- If `facility_id` in `target_facilities` → Access granted immediately
- If `facility_id` NOT in list but `allow_emergency_access = true` → Require PIN
- Log all non-primary facility access as "emergency access"

### Choosing the Right Mode

| Scenario | Recommended Mode | target_facilities | PIN |
|----------|-----------------|-------------------|-----|
| Scheduled referral to specific clinic | Restricted | Set to specific facilities | Optional |
| Parent needs emergency access anywhere | Open | NULL or [] | Recommended |
| Travel with planned clinic visits | Restricted | Set to travel destinations | Optional |
| Share with family member's facility | Restricted | Set to that facility | Optional |
| Child with chronic condition (frequent ER) | Open | NULL | Required |
| Temporary access for second opinion | Restricted | Set to consulting doctor's facility | Optional |

## Security Considerations

### Token Generation
```python
import secrets
import hashlib

# Option 1: Use UUID (built-in Postgres)
token = uuid_generate_v4()  # Already in DB schema

# Option 2: Cryptographically secure random token
token = secrets.token_urlsafe(32)  # 256 bits of entropy

# Option 3: Hash-based token
patient_data = f"{patient_id}:{facility_id}:{timestamp}"
token = hashlib.sha256(patient_data.encode()).hexdigest()
```

### Token Validation Checklist
1. ✅ Token exists in `qr_codes` table
2. ✅ `is_active = true`
3. ✅ `expires_at > now()`
4. ✅ `use_count < max_uses` (if set)
5. ✅ Scanner is authenticated (has valid session)
6. ✅ **Access Control Check**:
   - If `target_facilities` is NULL/empty → Allow any authenticated facility
   - If `target_facilities` has values → Scanner's `facility_id` must be in array
   - If PIN required → Verify `pin_code` matches
7. ✅ Patient record exists and is active
8. ✅ Auto-register patient to scanning facility (via `facility_patients` table)
9. ✅ Log access in `audit_logs` with facility context

### Validation Logic Example

```python
def validate_qr_access(token, scanning_user):
    """
    Validates QR code access with flexible facility control
    """
    # 1. Get QR code record
    qr = supabase.table('qr_codes')\
        .select('*')\
        .eq('token_hash', token)\
        .eq('is_active', True)\
        .single()\
        .execute()

    if not qr.data:
        return {"error": "Invalid or expired QR code", "status": 404}

    qr_data = qr.data

    # 2. Check expiration
    if datetime.now() > datetime.fromisoformat(qr_data['expires_at']):
        return {"error": "QR code has expired", "status": 403}

    # 3. Check usage limits
    if qr_data['max_uses'] and qr_data['use_count'] >= qr_data['max_uses']:
        return {"error": "QR code usage limit reached", "status": 403}

    # 4. FLEXIBLE FACILITY ACCESS CONTROL
    target_facilities = qr_data.get('target_facilities')
    scanning_facility_id = scanning_user.get('facility_id')

    # Mode 1: Open Access (NULL or empty target_facilities)
    if not target_facilities or len(target_facilities) == 0:
        # Any authenticated facility can access
        access_granted = True
        access_type = "open_access"

        # If PIN is set, require verification
        if qr_data.get('pin_code'):
            provided_pin = request.args.get('pin')
            if provided_pin != qr_data['pin_code']:
                return {"error": "Invalid PIN", "status": 403}

    # Mode 2: Restricted Access (specific facilities whitelisted)
    else:
        if scanning_facility_id in target_facilities:
            access_granted = True
            access_type = "whitelisted_facility"
        else:
            # Check for emergency access override
            metadata = qr_data.get('metadata', {})
            if metadata.get('allow_emergency_access'):
                # Require PIN for emergency access
                provided_pin = request.args.get('pin')
                if provided_pin and provided_pin == qr_data.get('pin_code'):
                    access_granted = True
                    access_type = "emergency_access"
                else:
                    return {"error": "PIN required for emergency access", "status": 403}
            else:
                return {"error": "Facility not authorized to access this patient", "status": 403}

    # 5. Get patient data based on scope
    patient_id = qr_data['patient_id']
    scope = qr_data.get('scope', ['view_only'])

    patient_data = get_patient_data_by_scope(patient_id, scope)

    # 6. Auto-register patient to this facility (if not already)
    ensure_patient_facility_registration(
        patient_id=patient_id,
        facility_id=scanning_facility_id,
        registered_by=scanning_user['id'],
        registration_method='qr_code_scan'
    )

    # 7. Update QR code usage
    supabase.table('qr_codes').update({
        'use_count': qr_data['use_count'] + 1,
        'last_accessed_at': datetime.now().isoformat(),
        'last_accessed_by': scanning_user['id']
    }).eq('qr_id', qr_data['qr_id']).execute()

    # 8. Create audit log
    create_audit_log({
        'user_id': scanning_user['id'],
        'action_type': 'VIEW',
        'table_name': 'qr_codes',
        'patient_id': patient_id,
        'qr_id': qr_data['qr_id'],
        'ip_address': request.remote_addr,
        'new_values': {
            'access_type': access_type,
            'scanning_facility': scanning_facility_id,
            'is_cross_facility': scanning_facility_id != qr_data['facility_id']
        }
    })

    return {
        "status": 200,
        "access_type": access_type,
        "patient_data": patient_data,
        "qr_metadata": {
            "share_type": qr_data['share_type'],
            "generated_by_facility": qr_data['facility_id'],
            "expires_at": qr_data['expires_at']
        }
    }
```

### Audit Logging
Every QR code scan should create an audit log entry:
```python
audit_log = {
    "user_id": scanning_user_id,
    "action_type": "VIEW",
    "table_name": "qr_codes",
    "record_id": qr_id,
    "patient_id": patient_id,
    "session_id": session_id,
    "ip_address": request.remote_addr,
    "qr_id": qr_id,
    "old_values": None,
    "new_values": {
        "use_count": use_count + 1,
        "last_accessed_at": now(),
        "last_accessed_by": scanning_user_id,
        "access_type": "open_access|whitelisted_facility|emergency_access",
        "is_cross_facility": scanning_facility_id != qr_facility_id
    }
}
```

---

## Database Relationships & Data Flow

### QR Code Generation
```
User (doctor/facility_admin)
  ↓ authenticated request
Backend Route: POST /api/qr/generate
  ↓ validates facility_id matches user
patients table
  ← checks patient exists
qr_codes table
  ← INSERT new record
    - token_hash: generated
    - patient_id: from request
    - facility_id: from user session
    - generated_by: user_id
    - scope: from request (default: view_only)
    - expires_at: now() + 30 days
    - is_active: true
  ↓ returns qr_id, token_hash
Frontend
  ↓ generates QR code from URL
QR Code Image (displayed/printed)
```

### QR Code Scanning
```
User scans QR code
  ↓ extracts token from URL
Backend Route: GET /api/qr/access?token=xxx
  ↓ validates user authentication
qr_codes table
  ← SELECT WHERE token_hash = xxx
  ↓ validates (active, not expired, usage limits, facility access)
patients table
  ← SELECT patient data
facility_patients table
  ← validates patient-facility relationship
prescriptions, allergies, vaccinations
  ← SELECT based on qr_codes.scope
audit_logs table
  ← INSERT access log
qr_codes table
  ← UPDATE use_count, last_accessed_at, last_accessed_by
  ↓ returns patient data (filtered by scope)
Frontend
  ↓ displays patient information
```

### Data Isolation Flow
The token-based approach maintains the system's critical **facility-based data isolation**:

1. QR code links to specific `facility_id` (generation facility)
2. `target_facilities[]` can whitelist additional facilities
3. When scanned, validates scanner's `facility_id` against allowed facilities
4. Patient data fetched through existing RLS policies
5. Audit log captures cross-facility access

This is **impossible with data-embedded QR codes**, which would bypass all facility isolation.

---

## Conclusion

**Token-Based QR Codes are the only viable approach** for the KEEPSAKE pediatric healthcare system.

The system already has the `qr_codes` table infrastructure in place, making implementation straightforward. The security, compliance, and operational benefits far outweigh the minor complexity of backend token validation.

Data-embedded QR codes pose significant security risks, compliance violations, and operational limitations that make them unsuitable for healthcare applications handling pediatric patient data.

### UI/UX for QR Code Generation

Here's how the QR code generation would work in the application:

#### For Doctors/Facility Admins (Professional Use)
```
Patient Record Page → [Generate QR Code] button

Modal: "Generate Patient Access QR Code"
├─ Share Type: [dropdown]
│  ├─ Referral to another facility
│  ├─ Emergency access (travel)
│  ├─ Parent/Guardian access
│  └─ Second opinion
│
├─ Access Mode: [radio buttons]
│  ├─ ○ Specific facilities only (Restricted)
│  │   └─ [Facility Selector - Multi-select]
│  │       ✓ City General Hospital
│  │       ✓ Children's Clinic Downtown
│  │
│  ├─ ● Any authenticated facility (Open) ← Selected for travel
│  │   └─ ⚠️ Warning: This allows any KEEPSAKE facility to access
│  │       records. Recommended for emergency/travel situations.
│  │
│  └─ ○ Home facility + Emergency override (Hybrid)
│      └─ Emergency requires PIN
│
├─ Data Scope: [checkboxes]
│  ✓ Basic information (name, DOB, allergies)
│  ✓ Prescriptions
│  ✓ Vaccination records
│  ☐ Full medical history
│
├─ Security Options:
│  ├─ PIN Code: [____] (Optional but recommended for open access)
│  ├─ Expires: [30 days ▼] (7 days, 30 days, 90 days, Custom)
│  └─ Usage Limit: [Unlimited ▼] (1 time, 5 times, Unlimited)
│
└─ [Cancel] [Generate QR Code]
```

**Result**:
- QR code displayed with download/print options
- Show QR metadata: "Valid until Dec 1, 2025 • Any facility • PIN: 1234"
- Copy link option: `https://keepsake.app/access?token=abc123`

#### For Parents/Guardians (Consumer Use)
```
My Child's Profile → [Medical Access] tab → [Share Records]

Simple Mode: "Share Medical Records"
├─ Why are you sharing? [dropdown]
│  ├─ Emergency access (vacation/travel) ← Selected
│  ├─ Visit to specific clinic
│  └─ Family member access
│
├─ [Based on selection, show simple options]
│  "For emergency access, we recommend:"
│  ✓ Any medical facility can access
│  ✓ Require PIN for security
│  ✓ Valid for 30 days
│
├─ Create PIN: [____] [____] [____] [____]
│
└─ [Cancel] [Create Access Code]
```

**Result**:
- User-friendly QR code with instructions:
  "Show this QR code to medical staff in case of emergency.
   Share PIN (1234) when they scan the code.
   Expires: Dec 1, 2025"

#### In the Patient Records Table
```
Patient Name | Age | Actions
─────────────────────────────────────────
Emma Watson  | 5y  | [👁️ View] [✏️ Edit] [🔗 QR Codes (2 active)]
                                          └─ Click to see:
                                             - Emergency Access QR (expires Dec 1)
                                             - Grandma's Clinic QR (expires Nov 15)
                                             [+ Generate New QR]
```

### Next Steps
1. Review and approve this analysis
2. Design QR code generation UI/UX (see mockups above)
3. Implement backend routes for token generation and validation
4. Build QR code scanner component (or integrate camera library)
5. Add access management UI (view/revoke QR codes)
6. Test with real-world scenarios:
   - Parent A vacation emergency (open access mode)
   - Scheduled referral (restricted mode)
   - Second opinion request (restricted mode)
7. Security audit and penetration testing
8. Deploy with comprehensive audit logging

---

**Document Version**: 1.0
**Date**: 2025-10-04
**System**: KEEPSAKE Healthcare Management System
**Database**: PostgreSQL via Supabase
**Authentication**: JWT + Redis Sessions
