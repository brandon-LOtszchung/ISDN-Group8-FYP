import os
import logging
from typing import Optional
from fastapi import Request

logger = logging.getLogger(__name__)

FALLBACK_FAMILY_ID = "00000000-0000-0000-0000-000000000001"


def _extract_bearer(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


def get_family_id(request: Request, supabase_client=None) -> str:
    """
    Derive family_id from the Supabase JWT in the Authorization header.
    Falls back to FALLBACK_FAMILY_ID if:
      - No Authorization header present
      - JWT cannot be decoded
      - No family found for the user_id
    """
    token = _extract_bearer(request)
    if not token:
        logger.warning("family_id fallback: no Authorization bearer token on request %s %s", request.method, request.url.path)
        return FALLBACK_FAMILY_ID

    user_id = _decode_user_id(token)
    if not user_id:
        logger.warning("family_id fallback: JWT could not be decoded or missing 'sub' claim")
        return FALLBACK_FAMILY_ID

    if supabase_client is None:
        logger.warning("family_id fallback: supabase_client not provided for user %s", user_id)
        return FALLBACK_FAMILY_ID

    try:
        resp = supabase_client.table("families").select("id").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        if resp.data and len(resp.data) > 0:
            family_id = resp.data[0]["id"]
            logger.info("family_id resolved for user %s -> %s", user_id, family_id)
            return family_id
        logger.warning("family_id fallback: no families row found for user %s", user_id)
    except Exception as e:
        logger.warning("family_id fallback: lookup error for user %s: %s", user_id, e)

    return FALLBACK_FAMILY_ID


def _decode_user_id(token: str) -> Optional[str]:
    """Decode the JWT and return the 'sub' claim (user UUID)."""
    try:
        import jwt as pyjwt
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if jwt_secret:
            payload = pyjwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
            return payload.get("sub")
        else:
            # Decode without verification as fallback (not secure — use for dev only)
            payload = pyjwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
            return payload.get("sub")
    except Exception as e:
        logger.debug("JWT decode failed: %s", e)
        return None
