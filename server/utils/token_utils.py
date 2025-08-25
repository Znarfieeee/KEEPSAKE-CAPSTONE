from __future__ import annotations

"""Utility helpers for verifying Supabase-issued JWT access tokens on the backend
without an additional network round-trip to Supabase Auth.

This module can be imported from Flask route handlers to validate the
`access_token` cookie (or Authorization bearer) quickly and securely.

Dependencies:
    pip install PyJWT cryptography requests
"""

import os
import time
from functools import lru_cache
from typing import Any, Dict

import jwt
from jwt import PyJWKClient  # type: ignore

__all__ = [
    "SupabaseJWTError",
    "verify_supabase_jwt",
]


class SupabaseJWTError(Exception):
    """Raised when a Supabase JWT cannot be verified or is otherwise invalid."""


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    """Return a cached PyJWKClient pointing at the project JWKS endpoint."""
    supabase_url = os.environ.get("SUPABASE_URL")
    if not supabase_url:
        raise RuntimeError("SUPABASE_URL environment variable not set.")

    # Ensure we don't end with a slash so the path concat works correctly
    supabase_url = supabase_url.rstrip("/")
    jwks_url = f"{supabase_url}/auth/v1/keys"

    return PyJWKClient(jwks_url)


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """Verify the signature and expiry of a Supabase access token.

    Parameters
    ----------
    token:
        The JWT access token issued by Supabase.

    Returns
    -------
    dict
        The decoded JWT claims if verification succeeds.

    Raises
    ------
    SupabaseJWTError
        If the token is invalid, expired, or cannot be verified.
    """

    try:
        # First attempt RS256 verification (JWKS)
        signing_key = _jwks_client().get_signing_key_from_jwt(token).key

        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"require": ["exp", "sub"], "verify_aud": False},
        )

        return claims

    except Exception:
        # If RS256 fails (e.g., project uses HS256) attempt HS256
        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET") or os.environ.get("JWT_SECRET")
        if not jwt_secret:
            raise SupabaseJWTError("SUPABASE_JWT_SECRET not set and RS256 verification failed.")

        try:
            claims = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"require": ["exp", "sub"], "verify_aud": False},
            )
            return claims
        except Exception as exc:
            raise SupabaseJWTError(f"Failed to verify Supabase JWT: {exc}") from exc 