from config.settings import settings
import redis

def get_redis_client(db: int = 0):
    """Return a configured Redis client.

    Environment variables used (with their defaults):
      - REDIS_HOST  (default: localhost)
      - REDIS_PORT  (default: 6379)
      - REDIS_SSL   (default: false)
      - REDIS_DB    (only when not explicitly passing `db`)

    The optional `db` parameter allows consumers to select a different
    logical Redis database (e.g. 0 for general use, 1 for sessions).
    """
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=db,
        decode_responses=True,
        ssl=settings.REDIS_SSL,
    )


# Default client uses DB 0 for general-purpose caching/calls
redis_client = get_redis_client() 