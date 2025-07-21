import datetime, json
from utils.redis_client import redis_client

SESSION_PREFIX = 'keepsake_session:'
SESSION_TIMEOUT = 1800  # 30 minutes

def create_session_id():
    """Generate a secure session ID"""
    import secrets
    return secrets.token_urlsafe(32)

def store_session_data(session_id, user_data):
    """Store session data in Redis with expiration"""
    session_data = {
        'user_id': user_data.get('id'),
        'email': user_data.get('email'),
        'role': user_data.get('role'),
        'firstname': user_data.get('firstname'),
        'lastname': user_data.get('lastname'),
        'specialty': user_data.get('specialty'),
        'access_token': user_data.get('access_token'),
        'refresh_token': user_data.get('refresh_token'),
        'expires_at': user_data.get('expires_at'),
        'created_at': datetime.datetime.utcnow().isoformat(),
        'last_activity': datetime.datetime.utcnow().isoformat()
    }
    
    # Use the shared Redis client configured for the app
    redis_client.setex(
        f"{SESSION_PREFIX}{session_id}",
        SESSION_TIMEOUT,
        json.dumps(session_data)
    )
    
    return session_id

def get_session_data(session_id):
    """Retrieve session data from Redis"""
    if not session_id:
        return None
    
    # Fetch the payload from Redis (returns None if key expired)
    session_data = redis_client.get(f"{SESSION_PREFIX}{session_id}")
    if not session_data:
        return None
    
    try:
        return json.loads(session_data)
    except json.JSONDecodeError:
        return None

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

def update_session_tokens(session_id, token_data):
    """Update access/refresh tokens and expiry for an existing session in Redis."""
    session_data = get_session_data(session_id)
    if not session_data:
        return False  # Session does not exist

    # Merge new token fields
    session_data.update({
        "access_token": token_data.get("access_token"),
        "refresh_token": token_data.get("refresh_token"),
        "expires_at": token_data.get("expires_at"),
        "last_activity": datetime.datetime.utcnow().isoformat(),
    })

    redis_client.setex(
        f"{SESSION_PREFIX}{session_id}",
        SESSION_TIMEOUT,
        json.dumps(session_data)
    )
    return True