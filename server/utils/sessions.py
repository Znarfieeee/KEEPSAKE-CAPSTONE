import datetime
import json
import logging
from typing import Optional, Dict, Any
from utils.redis_client import redis_client

SESSION_PREFIX = 'keepsake_session:'
SESSION_TIMEOUT = 1800  # 30 minutes

logger = logging.getLogger(__name__)

class SessionError(Exception):
    """Custom exception for session-related errors"""
    pass

def create_session_id() -> str:
    """Generate a secure session ID"""
    import secrets
    return secrets.token_urlsafe(32)

def store_session_data(session_id: str, user_data: Dict[str, Any]) -> str:
    """Store session data in Redis with expiration and proper error handling"""
    try:
        current_time = datetime.datetime.utcnow().isoformat()
        
        # Ensure all data is JSON serializable and properly encoded
        session_data = {
            'user_id': str(user_data.get('id', '')),
            'email': str(user_data.get('email', '')),
            'role': str(user_data.get('role', '')),
            'firstname': str(user_data.get('firstname', '')),
            'lastname': str(user_data.get('lastname', '')),
            'specialty': str(user_data.get('specialty', '')),
            'license_number': str(user_data.get('license_number', '')),
            'phone_number': str(user_data.get('phone_number', '')),
            'access_token': str(user_data.get('access_token', '')) if user_data.get('access_token') else None,
            'refresh_token': str(user_data.get('refresh_token', '')) if user_data.get('refresh_token') else None,
            'expires_at': str(user_data.get('expires_at', '')),
            'last_sign_in_at': str(user_data.get('last_sign_in_at', '')),
            'auth_provider': str(user_data.get('auth_provider', 'supabase')),
            'created_at': current_time,
            'last_activity': current_time
        }

        # Clean up any None values that might cause issues
        session_data = {k: v for k, v in session_data.items() if v is not None}
        
        # Serialize to JSON with explicit UTF-8 encoding
        session_json = json.dumps(session_data, ensure_ascii=False, separators=(',', ':'))
        
        # Store in Redis with error handling
        redis_key = f"{SESSION_PREFIX}{session_id}"
        redis_client.setex(redis_key, SESSION_TIMEOUT, session_json)
        
        logger.info(f"Session {session_id} stored successfully for user {session_data.get('email')}")
        return session_id
        
    except (redis.RedisError, json.JSONEncodeError, UnicodeError) as e:
        logger.error(f"Failed to store session data for session {session_id}: {e}")
        raise SessionError(f"Could not store session: {e}")
    except Exception as e:
        logger.error(f"Unexpected error storing session {session_id}: {e}")
        raise SessionError(f"Session storage failed: {e}")
    
def get_session_data(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve session data from Redis with comprehensive error handling"""
    if not session_id:
        return None
    
    try:
        redis_key = f"{SESSION_PREFIX}{session_id}"
        
        # Fetch the payload from Redis
        session_data = redis_client.get(redis_key)
        if not session_data:
            logger.debug(f"No session found for session_id: {session_id}")
            return None
        
        # Parse JSON data with error handling
        try:
            parsed_data = json.loads(session_data)
            logger.debug(f"Session retrieved successfully for session_id: {session_id}")
            return parsed_data
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in session {session_id}: {e}")
            # Delete corrupted session
            redis_client.delete(redis_key)
            return None
            
    except redis.RedisError as e:
        logger.error(f"Redis error retrieving session {session_id}: {e}")
        return None
    except UnicodeDecodeError as e:
        logger.error(f"Unicode decode error for session {session_id}: {e}")
        # Delete corrupted session
        try:
            redis_client.delete(f"{SESSION_PREFIX}{session_id}")
        except:
            pass  # Best effort cleanup
        return None
    except Exception as e:
        logger.error(f"Unexpected error retrieving session {session_id}: {e}")
        return None

def update_session_activity(session_id: str) -> bool:
    """Update last activity timestamp and extend session"""
    try:
        session_data = get_session_data(session_id)
        if not session_data:
            return False
        
        session_data['last_activity'] = datetime.datetime.utcnow().isoformat()
        
        # Re-serialize and store
        session_json = json.dumps(session_data, ensure_ascii=False, separators=(',', ':'))
        redis_client.setex(f"{SESSION_PREFIX}{session_id}", SESSION_TIMEOUT, session_json)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to update session activity for {session_id}: {e}")
        return False

def update_session_tokens(session_id: str, token_data: Dict[str, Any]) -> bool:
    """Update access/refresh tokens and expiry for an existing session in Redis."""
    try:
        session_data = get_session_data(session_id)
        if not session_data:
            logger.warning(f"Cannot update tokens - session {session_id} does not exist")
            return False

        # Merge new token fields with proper string conversion
        session_data.update({
            "access_token": str(token_data.get("access_token", "")) if token_data.get("access_token") else None,
            "refresh_token": str(token_data.get("refresh_token", "")) if token_data.get("refresh_token") else None,
            "expires_at": str(token_data.get("expires_at", "")) if token_data.get("expires_at") else None,
            "last_activity": datetime.datetime.utcnow().isoformat(),
        })

        # Clean up None values
        session_data = {k: v for k, v in session_data.items() if v is not None}
        
        # Re-serialize and store
        session_json = json.dumps(session_data, ensure_ascii=False, separators=(',', ':'))
        redis_client.setex(f"{SESSION_PREFIX}{session_id}", SESSION_TIMEOUT, session_json)
        
        logger.info(f"Tokens updated successfully for session {session_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to update session tokens for {session_id}: {e}")
        return False

def delete_session(session_id: str) -> bool:
    """Delete a session from Redis"""
    try:
        if not session_id:
            return False
        
        result = redis_client.delete(f"{SESSION_PREFIX}{session_id}")
        logger.info(f"Session {session_id} deleted: {bool(result)}")
        return bool(result)
        
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}")
        return False

def cleanup_expired_sessions() -> int:
    """Clean up any expired or corrupted sessions (utility function)"""
    try:
        pattern = f"{SESSION_PREFIX}*"
        keys = redis_client.keys(pattern)
        
        cleaned_count = 0
        for key in keys:
            try:
                # Try to get and validate each session
                session_data = redis_client.get(key)
                if session_data:
                    json.loads(session_data)  # Validate JSON
            except (json.JSONDecodeError, UnicodeDecodeError, redis.ResponseError):
                # Delete corrupted session
                redis_client.delete(key)
                cleaned_count += 1
                
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} corrupted sessions")
            
        return cleaned_count
        
    except Exception as e:
        logger.error(f"Error during session cleanup: {e}")
        return 0