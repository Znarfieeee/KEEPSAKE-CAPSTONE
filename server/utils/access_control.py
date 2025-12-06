# Built-ins / stdlib
from functools import wraps
from typing import Iterable
import datetime, json

# Third-party
from flask import request, jsonify, current_app

# Local modules
from config.settings import supabase, set_authenticated_client
from utils.sessions import (
    get_session_data,
    update_session_activity,
    SESSION_PREFIX,
    SESSION_TIMEOUT,
)
from utils.token_utils import verify_supabase_jwt, SupabaseJWTError
from utils.redis_client import redis_client

# Valid roles in the system – keep this in sync with your database / Supabase metadata
VALID_ROLES = {
    "admin",
    "system_admin",
    "facility_admin",
    "doctor",
    "pediapro",  # Doctor role alias used in frontend
    "nurse",
    "vital_custodian",  # Nurse/staff role alias
    "staff",
    "parent",
    "guardian",
    "keepsaker"  # Parent portal user (alias for parent role)
}

def _normalize_roles(roles: Iterable[str]):
    """Return a set of lower-cased role names, filtering out unknowns."""
    return {str(r).lower() for r in roles if str(r).lower() in VALID_ROLES}

def check_session():
    """Check if the current session is valid and return user data"""
    session_id = request.cookies.get('session_id')
    if not session_id:
        current_app.logger.warning("No session cookie found")
        return None

    session_data = get_session_data(session_id)
    if not session_data:
        current_app.logger.warning(f"No session data found for ID: {session_id}")
        return None

    # Update session activity
    update_session_activity(session_id)
    return session_data


def require_role(*required_roles: str):
    """Flask route decorator enforcing that the current user has one of *required_roles*.

    Usage::

        @app.route("/secure")
        @require_role("facility_admin")
        def secure_route():
            ...

    """
    normalized_required = _normalize_roles(required_roles or [])

    if not normalized_required:
        raise ValueError("require_role decorator needs at least one valid role")

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_role = (getattr(request, "current_user", {}) or {}).get("role", "").lower()

            # Always allow admins
            # if user_role == "admin" or user_role in normalized_required:
            
            if user_role in normalized_required:
                return f(*args, **kwargs)

            # Unauthorized – log and respond
            current_app.logger.warning(
                "AUDIT: User %s attempted unauthorized access (required %s, had %s) from IP %s",
                getattr(request, "current_user", {}).get("id"),
                ",".join(sorted(normalized_required)),
                user_role,
                request.remote_addr,
            )
            return jsonify({"message": "You dont have permission to access this route", "status": "error"}), 403

        return decorated

    return decorator


# ---------------------------------------------------------------------------
# Premium subscription decorator
# ---------------------------------------------------------------------------

def require_premium_subscription(f):
    """Decorator that ensures the parent user has an active premium subscription.

    This decorator should be used AFTER @require_auth and @require_role('parent').
    It checks if the user has an active premium subscription by querying the users table.

    Usage::

        @app.route("/premium-feature")
        @require_auth
        @require_role("parent")
        @require_premium_subscription
        def premium_route():
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = getattr(request, "current_user", {}).get("id")

        if not user_id:
            current_app.logger.warning("No user_id found in require_premium_subscription")
            return jsonify({"message": "Authentication required", "status": "error"}), 401

        try:
            from config.settings import get_authenticated_client
            from datetime import datetime
            supabase = get_authenticated_client()

            # Check if user has an active premium subscription in users table
            user_response = supabase.table('users')\
                .select('user_id, is_subscribed, subscription_expires')\
                .eq('user_id', user_id)\
                .execute()

            if not user_response.data or len(user_response.data) == 0:
                current_app.logger.warning(f"User {user_id} not found in database")
                return jsonify({
                    "message": "User not found",
                    "status": "error"
                }), 404

            user = user_response.data[0]
            is_subscribed = user.get('is_subscribed', False)
            subscription_expires = user.get('subscription_expires')

            # Check if subscription is active and not expired
            is_active = False
            if is_subscribed and subscription_expires:
                try:
                    expiry_date = datetime.strptime(subscription_expires, '%Y-%m-%d').date()
                    is_active = expiry_date >= datetime.now().date()
                except:
                    is_active = False

            if not is_active:
                current_app.logger.warning(
                    f"AUDIT: Parent {user_id} attempted to access premium feature without active subscription from IP {request.remote_addr}"
                )
                return jsonify({
                    "message": "This feature requires an active Premium subscription",
                    "status": "error",
                    "premium_required": True
                }), 403

            # Attach subscription info to request for downstream use
            request.subscription = {
                "is_subscribed": is_subscribed,
                "subscription_expires": subscription_expires
            }  # type: ignore[attr-defined]

            return f(*args, **kwargs)

        except Exception as e:
            current_app.logger.error(f"Error checking premium subscription: {str(e)}")
            return jsonify({
                "message": "Error verifying subscription status",
                "status": "error"
            }), 500

    return decorated


# ---------------------------------------------------------------------------
# Authentication decorator
# ---------------------------------------------------------------------------

def require_auth(f):
    """Decorator that ensures the caller has a valid session.

    The decorator expects the `session_id` cookie to be present. It validates
    the Supabase *access token* stored in Redis, transparently attempting to
    refresh it with the *refresh token* if it has expired.  When the session
    is valid, ``request.current_user`` and ``request.session_data`` are
    populated so that downstream code can rely on them.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Extract session identifier from the cookie
        session_id = request.cookies.get("session_id")
        if not session_id:
            current_app.logger.warning(f"No session_id cookie found")
            return jsonify({"error": "Authentication required"}), 401

        # 2. Retrieve the session payload from Redis
        session_data = get_session_data(session_id)
        if not session_data:
            current_app.logger.warning(f"No session data found for session_id: {session_id}")
            return jsonify({"error": "Invalid or expired session"}), 401

        access_token = session_data.get("access_token")

        if access_token:
            try:
                # 3. Validate the JWT locally (no network trip)
                verify_supabase_jwt(access_token)

                # 4. Touch the session so it does not expire due to inactivity
                update_session_activity(session_id)

                # 5. Populate request-scoped helpers for downstream code
                request.session_data = session_data  # type: ignore[attr-defined]
                request.current_user = {
                    "id": session_data.get("user_id"),
                    "email": session_data.get("email"),
                    "role": session_data.get("role"),
                    "firstname": session_data.get("firstname"),
                    "lastname": session_data.get("lastname"),
                    "specialty": session_data.get("specialty"),
                    "facility_id": session_data.get("facility_id"),
                }  # type: ignore[attr-defined]

                # Create a per-request authenticated Supabase client
                # This ensures auth.uid() works correctly in RLS policies
                set_authenticated_client(access_token)

                return f(*args, **kwargs)

            except SupabaseJWTError as jwt_err:
                # 6. Token expired – attempt a silent refresh
                current_app.logger.warning(f"JWT verification failed: {str(jwt_err)}")
                refresh_token = session_data.get("refresh_token")
                if refresh_token:
                    try:
                        refreshed = supabase.auth.refresh_session(refresh_token)

                        # 7. Persist refreshed tokens and bump expiry
                        session_data.update(
                            {
                                "access_token": refreshed.session.access_token,
                                "refresh_token": refreshed.session.refresh_token,
                                "expires_at": refreshed.session.expires_at,
                                "last_activity": datetime.datetime.utcnow().isoformat(),
                            }
                        )

                        redis_client.setex(
                            f"{SESSION_PREFIX}{session_id}",
                            SESSION_TIMEOUT,
                            json.dumps(session_data),
                        )

                        # Create a per-request authenticated Supabase client with refreshed token
                        set_authenticated_client(refreshed.session.access_token)

                        # Re-populate request helpers
                        request.session_data = session_data  # type: ignore[attr-defined]
                        request.current_user = {
                            "id": session_data.get("user_id"),
                            "email": session_data.get("email"),
                            "role": session_data.get("role"),
                            "firstname": session_data.get("firstname"),
                            "lastname": session_data.get("lastname"),
                            "specialty": session_data.get("specialty"),
                            "facility_id": session_data.get("facility_id"),
                        }  # type: ignore[attr-defined]

                        return f(*args, **kwargs)

                    except Exception as refresh_err:
                        # Refresh failed – clean up and require re-login
                        current_app.logger.error(f"Token refresh failed: {str(refresh_err)}")
                        redis_client.delete(f"{SESSION_PREFIX}{session_id}")
                        return jsonify({"error": "Session expired, please login again"}), 401
                else:
                    current_app.logger.warning("No refresh token available for expired JWT")
                    return jsonify({"error": "Session expired, please login again"}), 401

        # Fallback – no valid access token present
        current_app.logger.warning("No access token in session data")
        return jsonify({"error": "Invalid session"}), 401

    return decorated

def update_session_activity(session_id):
    """Update last activity timestamp and extend session"""
    session_data = get_session_data(session_id)
    if session_data:
        session_data['last_activity'] = datetime.datetime.utcnow().isoformat()
        redis_client.setex(
            f"{SESSION_PREFIX}{session_id}",
            SESSION_TIMEOUT,
            json.dumps(session_data)
        )