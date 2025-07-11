from dotenv import load_dotenv
load_dotenv()

from flask import Blueprint, request
from supabase import create_client
import os

settings_bp = Blueprint('settings', __name__)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
service_role = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def get_user_supabase_client() -> "supabase_py.Client":
    """Return a Supabase client that uses the caller's JWT (Authorization bearer or cookie)
    so that RLS policies are enforced with the user's privileges."""
    jwt = None
    # 1. Prefer Authorization header if present
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        jwt = auth_header.removeprefix("Bearer ").strip()

    # 2. Fallback to cookie set by backend (HttpOnly, Secure)
    if jwt is None:
        jwt = request.cookies.get("sb-access-token")

    # When jwt is provided we use it as the api_key so Supabase recognises the user
    return create_client(url, jwt or key)

try:
    if supabase:
        print("Successfully connected to supabase!")
    else:
        print("Error connecting to supabase!")
except Exception as e:
    print("Error: "+str(e))
