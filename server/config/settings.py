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
    """Return a Supabase client that uses the bearer token coming from the request
    so that Row-Level-Security policies are enforced with the caller's privileges.
    If no token is present we fall back to the anon key (read-only).
    """
    auth_header = request.headers.get("Authorization", "")
    jwt = None
    if auth_header.startswith("Bearer "):
        jwt = auth_header.removeprefix("Bearer ").strip()

    # When jwt is provided we use it as the api_key so Supabase recognizes the user
    return create_client(url, jwt or key)

try:
    if supabase:
        print("Successfully connected to supabase!")
    else:
        print("Error connecting to supabase!")
except Exception as e:
    print("Error: "+str(e))
