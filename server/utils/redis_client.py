from dotenv import load_dotenv
load_dotenv()

import redis
import os
import json
import logging

logger = logging.getLogger(__name__)

def get_redis_client():
    """Return a configured Redis client."""
    
    # Get Redis configuration from environment variables with proper type conversion
    host = os.environ.get("REDIS_HOST")
    port = int(os.environ.get("REDIS_PORT"))
    ssl = os.environ.get("REDIS_SSL").lower() == "true"
    
    return redis.Redis(
        host=host,
        port=port,
        db=1,
        decode_responses=True,
        ssl=ssl
    )
    
def clear_corrupted_sessions():
    try:
        client = get_redis_client()
        pattern = "keepsake_session:*"
        
        keys = client.keys(pattern)    
        
        corrupted_keys = []
        for key in keys:
            try:
                value = client.get(key)
                if value:
                    json.loads(value)
            except (UnicodeDecodeError, json.JSONDecodeError, redis.ResponseError):
                corrupted_keys.append(key)
                
        if corrupted_keys:
            client.delete(*corrupted_keys)
            logger.info(f"Cleared {len(corrupted_keys)} corrupted session keys")
            
        return len(corrupted_keys)
    
    except Exception as e:
        logger.error(f"Error clearing corrupted sessions: {e}")
        
        return 0
        
redis_client = get_redis_client() 
