from dotenv import load_dotenv
load_dotenv()

import redis
import os

def get_redis_client(db: int = 0):
    """Return a configured Redis client."""
    
    return redis.Redis(
        host=os.environ.get("REDIS_HOST"),
        port=os.environ.get("REDIS_PORT"),
        db=db,
        decode_responses=True,
        ssl=os.environ.get("REDIS_SSL"),
    )
    
redis_client = get_redis_client() 