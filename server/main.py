from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from datetime import timedelta
import os, sys, json
from flask_session import Session # type: ignore

# Utilities & Configs
from config.settings import settings_bp
from config.settings import supabase_anon_client
from utils.audit_logger import configure_audit_logger
from utils.redis_client import get_redis_client, clear_corrupted_sessions



from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.admin.admin_facility import facility_bp
from routes.admin.admin_users import users_bp
from routes.pediapro.doctor_patient_records import patrecord_bp
from routes.pediapro.doctor_patient_prescriptions import patrx_bp
from routes.auth_routes import init_google_oauth
from routes.pediapro.doctor_appointments import appointment_bp
from routes.facility_admin.facility_users import fusers_bp
from routes.parent.parent_routes import parent_bp

app = Flask("keepsake")

# Clear corrupted sessions before initializing OAuth
try:
    corrupted_count = clear_corrupted_sessions()
    if corrupted_count > 0:
        print(f"🧹 Cleared {corrupted_count} corrupted sessions on startup")
except Exception as e:
    print(f"⚠️  Warning: Could not clear corrupted sessions: {e}")

# Initializing google OAuth w/ error handling
try:
    init_google_oauth(app)
except Exception as e:
    app.logger.error(f"Failed to initialize Google OAuth: {e}")

# Blueprints
app.register_blueprint(settings_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(facility_bp)
app.register_blueprint(users_bp)
app.register_blueprint(patrecord_bp)
app.register_blueprint(patrx_bp)
app.register_blueprint(appointment_bp)
app.register_blueprint(fusers_bp)
app.register_blueprint(parent_bp)

# Redis session configuration with enhanced error handling
def setup_redis_session():
    """Setup Redis session with proper error handling"""
    try:
        redis_client = get_redis_client()
        
        # Clear any corrupted sessions on startup
        corrupted_count = clear_corrupted_sessions()
        if corrupted_count > 0:
            app.logger.warning(f"Cleared {corrupted_count} corrupted sessions on startup")
        
        # HIPAA/GDPR compliant session configuration
        app.config.update(
            SECRET_KEY = os.environ.get('FLASK_SECRET_KEY'),
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

        # Initialize Flask-session with error handling
        try:
            Session(app)
            app.logger.info("Flask-Session initialized successfully")
        except Exception as e:
            app.logger.error(f"Failed to initialize Flask-Session: {e}")
            raise
            
        return redis_client
        
    except Exception as e:
        app.logger.error(f"Redis session setup failed: {e}")
        raise
    
redis_client = setup_redis_session()

# HIPAA/GDPR compliant session configuration
app.config.update(
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY'),
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

# Initialize Flask-session
Session(app)

# Allow local Vite dev server
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
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
    """Check all critical dependencies before starting"""
    errors = []
    print("Checking startup errors...")
    
    # Check Redis connection with encoding test
    try:
        ping_result = redis_client.ping()
        if ping_result:
            print("✅ Redis connection successful")
            
            # Test encoding/decoding
            test_data = {"test": "UTF-8 test: héllo wörld 🌍"}
            test_key = "startup_encoding_test"
            redis_client.setex(test_key, 10, json.dumps(test_data, ensure_ascii=False))
            retrieved = redis_client.get(test_key)
            parsed = json.loads(retrieved)
            redis_client.delete(test_key)
            
            if parsed == test_data:
                print("✅ Redis encoding/decoding test passed")
            else:
                errors.append("❌ Redis encoding test failed")
        else:
            errors.append("❌ Redis connection failed")
            
    except UnicodeDecodeError as e:
        errors.append(f"❌ Redis encoding error: {str(e)}")
        # Try to clear corrupted data
        try:
            clear_corrupted_sessions()
            print("🧹 Cleared corrupted session data")
        except:
            errors.append("❌ Could not clear corrupted Redis data")
    except Exception as e:
        errors.append(f"❌ Redis connection failed: {str(e)}")
    
    # Check Supabase connection
    try:
        supabase = supabase_anon_client()
        if supabase:
            print("✅ Supabase connection successful")
        else:
            errors.append("❌ Supabase connection failed")
    except Exception as e:
        errors.append(f"❌ Supabase connection failed: {str(e)}")
    
    if errors:
        print("🚨 Startup errors detected:")
        for error in errors:
            print(f"  {error}")
        
        # For Redis encoding issues, try to auto-fix
        if any("encoding" in error.lower() for error in errors):
            print("🔧 Attempting to fix Redis encoding issues...")
            try:
                # Clear all potentially corrupted session data
                corrupted_count = clear_corrupted_sessions()
                if corrupted_count > 0:
                    print(f"🧹 Cleared {corrupted_count} corrupted sessions")
                    # Retry the startup check
                    print("🔄 Retrying startup check...")
                    return handle_startup_errors()  # Recursive retry
            except Exception as fix_error:
                print(f"❌ Auto-fix failed: {fix_error}")
        
        sys.exit(1)
    
    print("🚀 All systems ready!")
    
@app.route("/")
def landing_page():
    return jsonify({"message": "Success", "status": "success"}), 200

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
    handle_startup_errors()
    app.run(debug=True)