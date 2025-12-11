from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from datetime import timedelta
import os, sys, json
from flask_session import Session # type: ignore
from dotenv import load_dotenv

# Utilities & Configs
from config.settings import settings_bp
from config.settings import supabase_anon_client
from utils.audit_logger import configure_audit_logger
from utils.redis_client import get_redis_client, clear_corrupted_sessions

from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.admin.admin_facility import facility_bp
from routes.admin.admin_users import users_bp
from routes.admin.admin_audit import audit_bp
from routes.admin.admin_subscription import subscription_bp
from routes.admin.admin_reports import reports_bp
from routes.pediapro.doctor_patient_records import patrecord_bp
from routes.pediapro.doctor_patient_prescriptions import patrx_bp
from routes.pediapro.doctor_vaccinations import vaccinations_bp
from routes.pediapro.doctor_reports import doctor_reports_bp
from routes.vital_custodian.nurse_reports import nurse_reports_bp
from routes.auth_routes import init_google_oauth
from routes.pediapro.doctor_appointments import appointment_bp
from routes.facility_admin.facility_users import fusers_bp
from routes.user_settings import settings_bp as user_settings_bp
from routes.qr_routes import qr_bp
from routes.notification_routes import notification_bp
from routes.parent.parent_routes import parent_bp
from routes.parent.parent_reports import parent_reports_bp
from routes.parent.parent_subscription import parent_subscription_bp
from routes.medical_documents.document_routes import documents_bp
from routes.parent_consent_routes import parent_consent_bp
from routes.feedback_routes import feedback_bp
from routes.facility_contact import facility_contact_bp
from routes.admin.admin_parent_subscription import admin_parent_subscription_bp
from routes.public_routes import public_bp
from routes.password_reset_routes import password_reset_bp

app = Flask("keepsake")
load_dotenv()

# Clear corrupted sessions before initializing OAuth
try:
    corrupted_count = clear_corrupted_sessions()
    if corrupted_count > 0:
        print(f"[CLEANUP] Cleared {corrupted_count} corrupted sessions on startup")
except Exception as e:
    print(f"[WARNING] Could not clear corrupted sessions: {e}")

# Initializing google OAuth w/ error handling
try:
    init_google_oauth(app)
except Exception as e:
    app.logger.error(f"Failed to initialize Google OAuth: {e}")

# Blueprints
app.register_blueprint(settings_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(public_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(facility_bp)
app.register_blueprint(users_bp)
app.register_blueprint(audit_bp)
app.register_blueprint(subscription_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(patrecord_bp)
app.register_blueprint(patrx_bp)
app.register_blueprint(vaccinations_bp)
app.register_blueprint(doctor_reports_bp)
app.register_blueprint(nurse_reports_bp)
app.register_blueprint(appointment_bp)
app.register_blueprint(fusers_bp)
app.register_blueprint(documents_bp)
app.register_blueprint(user_settings_bp)
app.register_blueprint(qr_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(parent_bp)
app.register_blueprint(parent_reports_bp)
app.register_blueprint(parent_subscription_bp)
app.register_blueprint(parent_consent_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(facility_contact_bp)
app.register_blueprint(admin_parent_subscription_bp)
app.register_blueprint(password_reset_bp)

# Redis session configuration with enhanced error handling
def setup_redis_session():
    """Setup Redis session with proper error handling"""
    try:
        print("Attempting to connect to Redis...")
        redis_client = get_redis_client()

        # Test Redis connection with timeout
        try:
            redis_client.ping()
            print("[OK] Redis connection successful")
        except Exception as ping_error:
            print(f"[WARNING] Redis ping failed: {ping_error}")
            print("[INFO] Continuing without Redis session store...")
            return None

        # Clear any corrupted sessions on startup (non-blocking)
        try:
            corrupted_count = clear_corrupted_sessions()
            if corrupted_count > 0:
                print(f"[CLEANUP] Cleared {corrupted_count} corrupted sessions on startup")
        except Exception as cleanup_error:
            print(f"[WARNING] Session cleanup failed: {cleanup_error}")

        return redis_client

    except Exception as e:
        print(f"[ERROR] Redis session setup failed: {e}")
        print("[INFO] Application will start without Redis session store")
        return None

print("Setting up Redis session...")
redis_client = setup_redis_session()

# HIPAA/GDPR compliant session configuration
print("Configuring Flask session...")
if redis_client:
    app.config.update(
        SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production'),
        SESSION_TYPE = 'redis',
        SESSION_REDIS = redis_client,
        SESSION_PERMANENT = False,
        SESSION_USE_SIGNER = True,
        SESSION_KEY_PREFIX = 'flask_session:',
        SESSION_COOKIE_NAME = 'flask_session',
        SESSION_COOKIE_HTTPONLY = True,
        SESSION_COOKIE_SECURE = True if os.environ.get('FLASK_ENV') == 'production' else False,
        SESSION_COOKIE_SAMESITE = 'Lax',
        PERMANENT_SESSION_LIFETIME = timedelta(minutes=30), #30 minutes timeout
        SESSION_COOKIE_DOMAIN = os.environ.get('COOKIE_DOMAIN')
    )
    try:
        Session(app)
        print("[OK] Flask-Session initialized with Redis")
    except Exception as session_error:
        print(f"[ERROR] Failed to initialize Flask-Session: {session_error}")
        print("[INFO] Falling back to filesystem session")
        app.config.update(
            SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production'),
            SESSION_TYPE = 'filesystem',
            SESSION_PERMANENT = False
        )
        Session(app)
else:
    print("[INFO] Using filesystem session (Redis unavailable)")
    app.config.update(
        SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production'),
        SESSION_TYPE = 'filesystem',
        SESSION_PERMANENT = False
    )
    Session(app)
    
allowed_origins = [
    'https://keepsake-pi.vercel.app',
    'localhost:5379',
    'localhost:5000',
]

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True,
)

# Configure logging for HIPAA audit trail
if not app.debug:
    # Centralized audit logger setup (attaches handlers to app.logger)
    configure_audit_logger(attach_to_logger=app.logger)
    app.logger.info('Keepsake medical app startup')

def handle_startup_errors():
    """Check all critical dependencies before starting - Non-blocking for development"""
    warnings = []
    print("\n" + "="*60)
    print("KEEPSAKE Backend - Startup Check")
    print("="*60)

    # Check Redis connection (non-blocking in development)
    if redis_client:
        try:
            redis_client.ping()
            print("[✓] Redis: Connected")

            # Quick encoding test
            test_key = "startup_test"
            redis_client.setex(test_key, 5, "test")
            redis_client.get(test_key)
            redis_client.delete(test_key)
            print("[✓] Redis: Encoding test passed")

        except Exception as e:
            warnings.append(f"Redis issue: {str(e)}")
            print(f"[!] Redis: Connection issue - {str(e)[:50]}")
    else:
        warnings.append("Redis not configured")
        print("[!] Redis: Not configured (using fallback)")

    # Check Supabase connection (non-blocking)
    try:
        supabase = supabase_anon_client()
        if supabase:
            print("[✓] Supabase: Connected")
        else:
            warnings.append("Supabase client returned None")
            print("[!] Supabase: Client initialization issue")
    except Exception as e:
        warnings.append(f"Supabase error: {str(e)}")
        print(f"[!] Supabase: {str(e)[:50]}")

    # Check environment variables
    required_env_vars = ['FLASK_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_KEY']
    missing_vars = [var for var in required_env_vars if not os.environ.get(var)]

    if missing_vars:
        warnings.append(f"Missing env vars: {', '.join(missing_vars)}")
        print(f"[!] Environment: Missing variables - {', '.join(missing_vars)}")
    else:
        print("[✓] Environment: All required variables present")

    print("="*60)

    if warnings:
        print(f"\n[WARNING] {len(warnings)} issue(s) detected (non-critical for development):")
        for warning in warnings:
            print(f"  • {warning}")
        print("\n[INFO] Starting server anyway (development mode)")
    else:
        print("[✓] All systems ready!")

    print("="*60 + "\n")

@app.route("/")
def landing_page():
    return jsonify({"message": "Success", "status": "success"}), 200

@app.route("/test-cookies")
def test_cookies():
    """Test endpoint to verify cookies are working"""
    cookies_received = dict(request.cookies)
    return jsonify({
        "status": "success",
        "cookies_received": cookies_received,
        "cookie_count": len(cookies_received),
        "headers": dict(request.headers)
    }), 200

# Health check endpoint
@app.route("/health")
def health_check():
    """Health check endpoint for load balancers"""
    health_status = {
        "status": "healthy",
        "service": "keepsake-api",
        "redis": "unknown",
        "session_store": "unknown"
    }

    status_code = 200

    try:
        # Test basic Redis connection
        redis_client.ping()
        health_status["redis"] = "connected"

        # Test session functionality
        test_key = "health_check_test"
        test_value = "test_data"
        redis_client.setex(test_key, 10, test_value)
        retrieved_value = redis_client.get(test_key)
        redis_client.delete(test_key)

        if retrieved_value == test_value:
            health_status["session_store"] = "operational"
        else:
            health_status["session_store"] = "degraded"
            health_status["status"] = "degraded"
            status_code = 503

    except UnicodeDecodeError as e:
        health_status["redis"] = "encoding_error"
        health_status["status"] = "unhealthy"
        health_status["error"] = f"Redis encoding error: {str(e)}"
        status_code = 503
    except Exception as e:
        health_status["redis"] = "disconnected"
        health_status["status"] = "unhealthy"
        health_status["error"] = str(e)
        status_code = 503

    return jsonify(health_status), status_code

# Add a route for manual session cleanup (admin use)
@app.route("/admin/cleanup-sessions", methods=['POST'])
def manual_session_cleanup():
    """Manual endpoint to clean up corrupted sessions"""
    try:
        from utils.access_control import require_auth, require_role
        # This would normally be protected by auth decorators
        # Simplified for demonstration

        corrupted_count = clear_corrupted_sessions()

        return jsonify({
            "status": "success",
            "message": f"Cleaned up {corrupted_count} corrupted sessions",
            "cleaned_count": corrupted_count
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"Cleanup failed: {str(e)}"
        }), 500

@app.errorhandler(UnicodeDecodeError)
def handle_unicode_error(e):
    """Handle Unicode decode errors that might occur with corrupted Redis data"""
    app.logger.error(f"Unicode decode error: {e}")

    # Try to clear corrupted sessions
    try:
        clear_corrupted_sessions()
    except:
        pass  # Best effort

    return jsonify({
        "status": "error",
        "message": "Session data corrupted. Please log in again."
    }), 400

# Configure logging for HIPAA audit trail
if not app.debug:
    # Centralized audit logger setup (attaches handlers to app.logger)
    configure_audit_logger(attach_to_logger=app.logger)
    app.logger.info('Keepsake medical app startup')

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Credentials", "true")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS,PATCH")
        response.headers.add("Access-Control-Allow-Origin", request.headers.get("Origin", "*"))
        return response

@app.after_request
def add_security_headers(response):
    """Add security headers for HIPAA compliance"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    response.headers.pop('Server', None)

    return response

if __name__ == "__main__":
    try:
        handle_startup_errors()
    except Exception as startup_error:
        print(f"[ERROR] Startup check failed: {startup_error}")
        print("[INFO] Starting server anyway (development mode)")

    app.run(
        debug=False
    )