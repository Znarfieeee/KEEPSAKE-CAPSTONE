from flask import current_app
from utils.redis_client import get_redis_client

redis_client = get_redis_client()

# Cache keys and prefixes for different types
CACHE_KEYS = {
    'patient': {
        'all': "patient_records:all",
        'prefix': "patient_records:"
    },
    'facility': {
        'all': "healthcare_facilities:all",
        'prefix': "healthcare_facilities:"
    },
    'facility_users': {
        'all': "facility_users:all",
        'prefix': "facility_users:"
    },
    'users': {
        'all': "users:all",
        'prefix': "users:"
    },
    'patient_prescription': {
        'all': "patient_prescription:all",
        'prefix': "patient_prescription:"
    },
    'prescription_med': {
        'all': "prescription_med:all",
        'prefix': "prescription_med:"
    },
    'appointments': {
        'all': 'appointments_all',
        'prefix': 'appointments:'
    }
    
}

def invalidate_caches(cache_type, resource_id=None):
    """
    Smart cache invalidation for different types of resources.

    Args:
        cache_type (str): Type of cache to invalidate ('patient', 'facility', or 'facility_users')
        resource_id (str, optional): Specific resource ID to invalidate. If None, invalidates all caches of this type.
    """
    try:
        if cache_type not in CACHE_KEYS:
            raise ValueError(f"Invalid cache type: {cache_type}")

        cache_config = CACHE_KEYS[cache_type]

        # Always clear the main list cache
        redis_client.delete(cache_config['all'])

        if resource_id:
            # Clear specific resource cache
            resource_key = f"{cache_config['prefix']}{resource_id}"
            redis_client.delete(resource_key)

            # Clear any related pattern-based caches
            pattern_keys = redis_client.keys(f"{cache_config['prefix']}{resource_id}:*")
            if pattern_keys:
                redis_client.delete(*pattern_keys)
        else:
            # Clear ALL caches with this prefix (e.g., appointments:doctor:*, appointments:patient:*, etc.)
            # This ensures that doctor-specific, patient-specific, and facility-specific caches are all cleared
            pattern_keys = redis_client.keys(f"{cache_config['prefix']}*")
            if pattern_keys:
                redis_client.delete(*pattern_keys)
                current_app.logger.info(f"Cleared {len(pattern_keys)} pattern-based caches for {cache_type}")

        current_app.logger.info(f"Cache invalidated for {cache_type}: {resource_id or 'all'}")

    except Exception as e:
        current_app.logger.error(f"Cache invalidation failed: {str(e)}")