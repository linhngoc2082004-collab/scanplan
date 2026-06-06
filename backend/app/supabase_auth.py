"""
Supabase Authentication helpers.

Uses httpx to call the Supabase Auth REST API directly.
This is a simple approach suitable for a student assignment.

NOTE: In production, you should validate the JWT access token locally.
This implementation calls Supabase Auth on every request for simplicity.
"""
import httpx
from .config import SUPABASE_URL, SUPABASE_ANON_KEY


class SupabaseAuthError(Exception):
    """Readable authentication error returned by Supabase."""


def _request(method: str, url: str, **kwargs) -> httpx.Response:
    """Call Supabase directly instead of inheriting a broken system proxy."""
    with httpx.Client(trust_env=False, timeout=15.0) as client:
        response = client.request(method, url, **kwargs)

    if response.is_error:
        try:
            error = response.json()
            message = error.get("msg") or error.get("message") or error.get("error_description")
        except ValueError:
            message = None
        raise SupabaseAuthError(message or f"Supabase authentication failed ({response.status_code})")

    return response


def _auth_headers() -> dict:
    """Return headers required for Supabase Auth REST API calls."""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }


def signup(email: str, password: str, full_name: str) -> dict:
    """
    Create a new user via Supabase Auth.

    Sends a POST to /auth/v1/signup with email, password,
    and full_name included in the 'data' field for user metadata.

    Returns the JSON response from Supabase.
    """
    url = f"{SUPABASE_URL}/auth/v1/signup"
    payload = {
        "email": email,
        "password": password,
        "data": {
            "full_name": full_name,
        },
    }
    response = _request("POST", url, json=payload, headers=_auth_headers())
    return response.json()


def login(email: str, password: str) -> dict:
    """
    Authenticate an existing user via Supabase Auth.

    Uses the password grant type to exchange credentials for tokens.

    Returns the JSON response containing access_token, refresh_token,
    expires_in, and user details.
    """
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {
        "email": email,
        "password": password,
    }
    response = _request("POST", url, json=payload, headers=_auth_headers())
    return response.json()


def get_user(access_token: str) -> dict:
    """
    Retrieve the authenticated user from Supabase Auth using the access token.

    NOTE: In production, validate the JWT locally instead of making an HTTP
    request on every API call. This approach is simpler for a student project.

    Returns the JSON response containing user data (including id, email).
    Raises an exception if the token is invalid or expired.
    """
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
    }
    response = _request("GET", url, headers=headers)
    return response.json()
