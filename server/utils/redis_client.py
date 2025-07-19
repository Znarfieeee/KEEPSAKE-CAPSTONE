import os
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
        host=os.environ.get("REDIS_HOST", "localhost"),
        port=int(os.environ.get("REDIS_PORT", 6379)),
        db=db,
        decode_responses=True,
        ssl=os.environ.get("REDIS_SSL", "false").lower() == "true",
    )


# Default client uses DB 0 for general-purpose caching/calls
redis_client = get_redis_client() 