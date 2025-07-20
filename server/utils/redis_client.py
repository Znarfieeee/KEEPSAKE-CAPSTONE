from dotenv import load_dotenv
load_dotenv()

import redis
import os

def get_redis_client():
    """Return a configured Redis client."""
    
    # Get Redis configuration from environment variables with proper type conversion
    host = os.environ.get("REDIS_HOST", "localhost")
    port = int(os.environ.get("REDIS_PORT", 6379))
    ssl = os.environ.get("REDIS_SSL", "false").lower() == "true"
    
    return redis.Redis(
        host=host,
        port=port,
        db=1,
        decode_responses=True,
        ssl=ssl
    )
    
redis_client = get_redis_client() 