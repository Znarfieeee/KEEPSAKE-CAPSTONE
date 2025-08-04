from flask import Flask, jsonify, request, make_response
from config.settings import settings_bp
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.admin.admin_facility import facility_bp
from routes.admin.admin_users import users_bp
from flask_cors import CORS
from datetime import timedelta
import os
import logging
import sys
import traceback
from flask_session import Session # type: ignore
from utils.redis_client import get_redis_client
from config.settings import supabase_anon_client
from utils.audit_logger import configure_audit_logger

app = Flask("keepsake")

# Blueprints
app.register_blueprint(settings_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(facility_bp)
app.register_blueprint(users_bp)

# Redis session configuration (DB 1 reserved for web sessions)
redis_client = get_redis_client()

# HIPAA/GDPR compliant session configuration
app.config.update(
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY'),
    SESSION_TYPE = 'redis',
    SESSION_REDIS = redis_client,
    SESSION_PERMANENT = False,
    SESSION_USE_SIGNER = True,
    SESSION_KEY_PREFIX = 'keepsake_session:',
    SESSION_COOKIE_NAME = 'keepsake_session',
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

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Credentials", "true")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Origin", request.headers.get("Origin", "*"))
        return response

# Configure logging for HIPAA audit trail
if not app.debug:
    # Centralized audit logger setup (attaches handlers to app.logger)
    configure_audit_logger(attach_to_logger=app.logger)
    app.logger.info('Keepsake medical app startup')

# Health check endpoint
@app.route("/health")
def health_check():
    """Health check endpoint for load balancers"""
    try:
        # Test Redis connection
        redis_client.ping()
        return jsonify({
            "status": "healthy",
            "service": "keepsake-api",
            "redis": "connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy", 
            "error": str(e)
        }), 503

@app.route("/")
def landing_page():
    return jsonify({"message": "Success", "status": "success"}), 200

# Add this right after your imports in main.py
def handle_startup_errors():
    """Check all critical dependencies before starting"""
    errors = []
    print("Checking startup errors...")
    
    # Check Redis connection
    try:
        ping = redis_client.ping()
        supabase = supabase_anon_client()
        if ping:
            print("✅ Redis connection successful")
        else:
            errors.append("❌ Redis connection failed")
            
        if supabase:
            print("✅ Supabase connection successful")
        else:
            errors.append("❌ Supabase connection failed")
            
    except Exception as e:
        errors.append(f"❌ Connections failed!: {str(e)}")
    
    if errors:
        print("🚨 Startup errors detected:")
        for error in errors:
            print(f"  {error}")
        sys.exit(1)
    
    print("🚀 All systems ready!")

# Security headers middleware
@app.after_request
def add_security_headers(response):
    """Add security headers for HIPAA compliance"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Remove server header for security
    response.headers.pop('Server', None)
    
    return response

if __name__ == "__main__":
    handle_startup_errors()
    app.run(debug=True)