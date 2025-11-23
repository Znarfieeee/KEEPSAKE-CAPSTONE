from dotenv import load_dotenv
load_dotenv()

from flask import Blueprint, g
from supabase import create_client, Client
import os

settings_bp = Blueprint('settings', __name__)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
service_role = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Global clients (for non-authenticated operations)
anon_client = create_client(url, key)
sr_client = create_client(url, service_role)

def supabase_anon_client() -> Client:
    """Returns the anonymous Supabase client (no user context)"""
    return anon_client

def supabase_service_role_client() -> Client:
    """Returns the service role client (bypasses RLS - use for admin operations only)"""
    return sr_client

def get_authenticated_client() -> Client:
    """
    Returns an authenticated Supabase client for the current request.
    Uses the user's JWT token from the request context to enable RLS policies.

    This should be called AFTER @require_auth decorator has validated the session.
    Falls back to anon client if no authenticated client is available.
    """
    # Check if we have an authenticated client stored in Flask's request context
    if hasattr(g, 'supabase_auth_client') and g.supabase_auth_client is not None:
        print("DEBUG: Using authenticated client from request context")
        return g.supabase_auth_client

    # Fall back to anon client (RLS will apply with anonymous context)
    print("DEBUG: WARNING - No authenticated client found, using anon client!")
    return anon_client

def set_authenticated_client(access_token: str) -> Client:
    """
    Creates and stores an authenticated Supabase client for the current request.
    Called by @require_auth decorator after validating the session.

    Args:
        access_token: The user's JWT access token from Supabase Auth

    Returns:
        The authenticated Supabase client
    """
    # Create a standard client with the anon key
    # Then use postgrest.auth() to set the JWT token for RLS policies
    # This is the recommended approach that works across supabase-py versions
    auth_client = create_client(url, key)

    # Set the JWT token for PostgREST requests - this enables auth.uid() in RLS
    auth_client.postgrest.auth(access_token)

    # Debug: Log that we're setting up authenticated client
    print(f"DEBUG: Setting authenticated client with token prefix: {access_token[:50]}...")

    # Store in Flask's g object for request-scoped access
    g.supabase_auth_client = auth_client

    return auth_client


# Default global supabase client (for backwards compatibility)
# NOTE: For authenticated operations, use get_authenticated_client() instead
try:
    supabase = supabase_anon_client()
    if supabase:
        print("Successfully connected to supabase!")
    else:
        print("Error connecting to supabase!")
except Exception as e:
    print("Error: "+str(e))
