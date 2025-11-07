from dotenv import load_dotenv
load_dotenv()

from flask import Blueprint, request
from supabase import create_client
import os

settings_bp = Blueprint('settings', __name__)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
service_role = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

anon_client = create_client(url,key)
sr_client = create_client(url,service_role)

def supabase_anon_client() -> "supabase_py.Client":
    return anon_client

def supabase_service_role_client() -> "supabase_py.Client":
    return sr_client


try:
    # Use anon client by default to enforce RLS policies
    # The JWT token will be set per-request in the @require_auth decorator
    # Use service role client ONLY for admin operations that need to bypass RLS
    supabase = supabase_anon_client()
    if supabase:
        print("Successfully connected to supabase!")
    else:
        print("Error connecting to supabase!")
except Exception as e:
    print("Error: "+str(e))
