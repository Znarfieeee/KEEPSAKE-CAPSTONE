from dotenv import load_dotenv
load_dotenv()

import redis
import os
import json
import logging

logger = logging.getLogger(__name__)

def get_redis_client():
    """Return a configured Redis client with proper encoding."""

    # Get Redis configuration from environment variables with proper type conversion
    host = os.environ.get("REDIS_HOST")
    port = int(os.environ.get("REDIS_PORT"))
    ssl = os.environ.get("REDIS_SSL").lower() == "true"
    password = os.environ.get("REDIS_PASSWORD")

    return redis.Redis(
        host=host,
        port=port,
        password=password,
        db=1,
        decode_responses=True,
        # encoding='utf-8',
        # encoding_errors='replace',  # Replace invalid UTF-8 bytes instead of crashing
        ssl=ssl,
        # socket_connect_timeout=5,
        # socket_keepalive=True
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
        
def delete_keys_by_pattern(pattern):
    try:
        client = get_redis_client()
        keys = []
        for key in client.scan_iter(match=pattern, count=1000):
            keys.append(key)
            
        if not keys:
            logger.info(f"No keys found for pattern: {pattern}")
            return 0
        
        client.delete(*keys)
        logger.info(f"Deleted {len(keys)} keys for pattern: {pattern}")    
            
    except Exception as e:
        logger.error(f"Error deleting keys by pattern '{pattern}': {e}")
        return 0        
        
def clear_patient_cache(patient_id=None, facility_id=None):
    patterns = []
    if patient_id:
        patterns.append(f"patient_records:{patient_id}*")
    if facility_id:
        patterns.append(f"patient_records:facility:{facility_id}*")
    if not patterns:
        patterns.append("patient_records*")
        
    total_deleted = 0 
    for p in patterns:
        total_deleted += delete_keys_by_pattern(p)
        
    logger.info(f"Cleared total {total_deleted} patient cache keys for patterns: {patterns}")
    return total_deleted
        
redis_client = get_redis_client() 
