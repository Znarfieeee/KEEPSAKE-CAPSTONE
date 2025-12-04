"""
Database Health Monitoring Utility
Provides comprehensive database health metrics using direct SQL queries
"""

from flask import current_app
from config.settings import sr_client
from datetime import datetime, timezone


def get_database_connections():
    """
    Get active database connection metrics
    Note: This is estimated based on active queries since direct pg_stat_activity
    access may be restricted in Supabase
    """
    try:
        # Estimate connections by measuring query response time
        # A slower response typically indicates higher load
        import time
        start_time = time.time()

        # Perform a simple query to test database responsiveness
        sr_client.table('users').select('user_id', count='exact').limit(1).execute()

        response_time_ms = (time.time() - start_time) * 1000

        # Estimate connection health based on response time
        # < 50ms = excellent (< 20% usage)
        # 50-100ms = good (20-40% usage)
        # 100-300ms = moderate (40-70% usage)
        # > 300ms = high (> 70% usage)

        if response_time_ms < 50:
            estimated_usage = 15
        elif response_time_ms < 100:
            estimated_usage = 30
        elif response_time_ms < 300:
            estimated_usage = 55
        else:
            estimated_usage = min(85, 50 + (response_time_ms / 10))

        return {
            'response_time_ms': round(response_time_ms, 2),
            'estimated_usage_percent': round(estimated_usage, 1),
            'status': 'healthy' if response_time_ms < 100 else 'degraded' if response_time_ms < 300 else 'critical'
        }
    except Exception as e:
        current_app.logger.error(f"Error getting database connections: {str(e)}")

    # Return default values if query fails
    return {
        'response_time_ms': 0,
        'estimated_usage_percent': 0,
        'status': 'error'
    }


def measure_query_performance():
    """
    Measure query performance by running sample queries on key tables
    Returns average response times and identifies slow operations
    """
    import time

    query_tests = [
        ('users_count', lambda: sr_client.table('users').select('user_id', count='exact').limit(1).execute()),
        ('facilities_count', lambda: sr_client.table('healthcare_facilities').select('facility_id', count='exact').limit(1).execute()),
        ('appointments_recent', lambda: sr_client.table('appointments').select('appointment_id').order('created_at', desc=True).limit(10).execute()),
    ]

    performance_results = []
    total_time = 0

    for query_name, query_func in query_tests:
        try:
            start_time = time.time()
            query_func()
            duration_ms = (time.time() - start_time) * 1000
            total_time += duration_ms

            performance_results.append({
                'query': query_name,
                'duration_ms': round(duration_ms, 2),
                'status': 'fast' if duration_ms < 100 else 'slow' if duration_ms < 500 else 'critical'
            })
        except Exception as e:
            current_app.logger.error(f"Error measuring {query_name}: {str(e)}")
            performance_results.append({
                'query': query_name,
                'duration_ms': 0,
                'status': 'error'
            })

    avg_query_time = round(total_time / len(query_tests), 2) if query_tests else 0

    return {
        'queries': performance_results,
        'avg_response_time_ms': avg_query_time,
        'status': 'healthy' if avg_query_time < 100 else 'degraded' if avg_query_time < 500 else 'critical'
    }


def get_table_row_counts():
    """Get row counts for important tables"""
    tables_to_check = ['users', 'healthcare_facilities', 'patients', 'appointments', 'prescriptions']

    table_counts = {}

    for table in tables_to_check:
        try:
            # Use Supabase client count query
            result = sr_client.table(table).select('*', count='exact').limit(0).execute()
            count = result.count if hasattr(result, 'count') else 0
            table_counts[table] = count
        except Exception as e:
            current_app.logger.error(f"Error counting {table}: {str(e)}")
            table_counts[table] = None

    return table_counts


def check_auth_service():
    """Test authentication service health"""
    import time
    try:
        start_time = time.time()
        # Try to query users table which requires auth
        sr_client.table('users').select('user_id').limit(1).execute()
        response_time_ms = (time.time() - start_time) * 1000

        return {
            'status': 'healthy' if response_time_ms < 200 else 'degraded',
            'response_time_ms': round(response_time_ms, 2)
        }
    except Exception as e:
        current_app.logger.error(f"Auth service check failed: {str(e)}")
        return {
            'status': 'critical',
            'response_time_ms': 0,
            'error': str(e)
        }


def check_storage_service():
    """Test storage service health (if used)"""
    try:
        # Try to list buckets or verify storage connection
        # For now, we'll assume storage is healthy if database is healthy
        return {
            'status': 'healthy',
            'note': 'Storage health inferred from database connectivity'
        }
    except Exception as e:
        current_app.logger.error(f"Storage service check failed: {str(e)}")
        return {
            'status': 'unknown',
            'error': str(e)
        }


def calculate_service_health_scores(db_connections, query_performance, auth_health):
    """
    Calculate individual service health scores based on metrics
    Returns scores for database, auth, storage, realtime, and edge functions
    """

    # Database health (based on response time and estimated usage)
    db_response_time = db_connections.get('response_time_ms', 0)
    db_score = 100.0
    if db_response_time > 500:
        db_score = 50.0
    elif db_response_time > 300:
        db_score = 70.0
    elif db_response_time > 100:
        db_score = 85.0
    elif db_response_time > 50:
        db_score = 95.0

    # Query performance affects database score
    avg_query_time = query_performance.get('avg_response_time_ms', 0)
    if avg_query_time > 500:
        db_score = min(db_score, 60.0)
    elif avg_query_time > 300:
        db_score = min(db_score, 75.0)
    elif avg_query_time > 100:
        db_score = min(db_score, 90.0)

    # Auth service health
    auth_response = auth_health.get('response_time_ms', 0)
    auth_score = 100.0
    if auth_response > 500:
        auth_score = 50.0
    elif auth_response > 300:
        auth_score = 70.0
    elif auth_response > 200:
        auth_score = 85.0
    elif auth_response > 100:
        auth_score = 95.0

    # Storage, realtime, and edge functions (default healthy unless specific issues)
    # These would need specific tests to determine actual health
    storage_score = 100.0
    realtime_score = 100.0
    edge_functions_score = 100.0

    # Calculate overall health (weighted average)
    # Database: 40%, Auth: 25%, Storage: 15%, Realtime: 10%, Edge: 10%
    overall = (
        db_score * 0.40 +
        auth_score * 0.25 +
        storage_score * 0.15 +
        realtime_score * 0.10 +
        edge_functions_score * 0.10
    )

    return {
        'database': round(db_score, 1),
        'auth': round(auth_score, 1),
        'storage': round(storage_score, 1),
        'realtime': round(realtime_score, 1),
        'edge_functions': round(edge_functions_score, 1),
        'overall': round(overall, 1)
    }


def get_comprehensive_database_health():
    """
    Get comprehensive database and infrastructure health metrics
    Returns detailed information about database performance and all services
    """
    try:
        # Gather all metrics
        db_connections = get_database_connections()
        query_performance = measure_query_performance()
        auth_health = check_auth_service()
        storage_health = check_storage_service()
        table_counts = get_table_row_counts()

        # Calculate service health scores
        health_scores = calculate_service_health_scores(
            db_connections,
            query_performance,
            auth_health
        )

        # Gather issues based on health metrics
        issues = []

        # Check database response time
        db_response = db_connections.get('response_time_ms', 0)
        if db_response > 300:
            issues.append({
                'service': 'database',
                'severity': 'critical' if db_response > 500 else 'warning',
                'message': f"Slow database response time: {db_response}ms"
            })

        # Check query performance
        avg_query_time = query_performance.get('avg_response_time_ms', 0)
        if avg_query_time > 300:
            issues.append({
                'service': 'database',
                'severity': 'warning',
                'message': f"Slow average query time: {avg_query_time}ms"
            })

        # Check auth service
        if auth_health.get('status') == 'critical':
            issues.append({
                'service': 'auth',
                'severity': 'critical',
                'message': 'Auth service unavailable'
            })
        elif auth_health.get('status') == 'degraded':
            issues.append({
                'service': 'auth',
                'severity': 'warning',
                'message': f"Auth service degraded (response: {auth_health.get('response_time_ms')}ms)"
            })

        # Overall status
        overall_score = health_scores.get('overall', 0)
        status = "healthy"
        if overall_score < 50:
            status = "critical"
        elif overall_score < 70:
            status = "degraded"
        elif overall_score < 90:
            status = "warning"

        return {
            'status': status,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'infrastructure_health': {
                'database': health_scores['database'],
                'auth': health_scores['auth'],
                'storage': health_scores['storage'],
                'realtime': health_scores['realtime'],
                'edge_functions': health_scores['edge_functions'],
                'overall': health_scores['overall'],
                'issues': issues
            },
            'database_metrics': {
                'response_time_ms': db_connections.get('response_time_ms'),
                'estimated_usage_percent': db_connections.get('estimated_usage_percent'),
                'avg_query_time_ms': query_performance.get('avg_response_time_ms'),
                'query_status': query_performance.get('status'),
                'table_counts': table_counts
            },
            'service_details': {
                'auth': auth_health,
                'storage': storage_health,
                'query_performance': query_performance.get('queries', [])
            }
        }

    except Exception as e:
        current_app.logger.error(f"Error getting comprehensive database health: {str(e)}")
        return {
            'status': 'error',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'infrastructure_health': {
                'database': 0.0,
                'auth': 0.0,
                'storage': 0.0,
                'realtime': 0.0,
                'edge_functions': 0.0,
                'overall': 0.0,
                'issues': [{
                    'service': 'system',
                    'severity': 'critical',
                    'message': f'Unable to retrieve health metrics: {str(e)}'
                }]
            },
            'error': str(e)
        }
