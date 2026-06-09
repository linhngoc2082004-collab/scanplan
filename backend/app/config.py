"""
Configuration: load environment variables from .env file.

Uses python-dotenv to load variables so they are also available
when running locally without setting system environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip().rstrip("/")
