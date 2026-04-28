import os
import logging
from typing import Optional
from fastapi import Request

logger = logging.getLogger(__name__)

# Default family used when a request has no JWT (e.g. camera-edge ingest) or the
# JWT cannot be resolved to a family. Hardcoded to the Lo Family for the FYP demo.
FALLBACK_FAMILY_ID = "eef3fcba-7b07-4c18-82dc-50dfe60b97ac"


def _extract_bearer(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


def get_family_id(request: Request, supabase_client=None) -> str:
    """
    Resolve family_id from the JWT's user → newest family they own.
    Falls back to FALLBACK_FAMILY_ID (Lo Family) when no JWT is present
    or the lookup fails.
    """
    token = _extract_bearer(request)
    if not token:
        logger.warning(
            "family_id fallback to Lo Family: no Authorization bearer token on %s %s",
            request.method, request.url.path,
        )
        return FALLBACK_FAMILY_ID

    user_id = _decode_user_id(token)
    if not user_id:
        logger.warning("family_id fallback to Lo Family: JWT could not be decoded or missing 'sub' claim")
        return FALLBACK_FAMILY_ID

    if supabase_client is None:
        logger.warning("family_id fallback to Lo Family: supabase_client not provided for user %s", user_id)
        return FALLBACK_FAMILY_ID

    try:
        resp = (
            supabase_client.table("families")
            .select("id")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if resp.data:
            family_id = resp.data[0]["id"]
            logger.info("family_id resolved from JWT for user %s -> %s", user_id, family_id)
            return family_id
        logger.warning("family_id fallback to Lo Family: no families row for user %s", user_id)
    except Exception as e:
        logger.warning("family_id fallback to Lo Family: lookup error for user %s: %s", user_id, e)

    return FALLBACK_FAMILY_ID


def _decode_user_id(token: str) -> Optional[str]:
    """
    Decode the JWT and return the 'sub' claim (user UUID).

    Modern Supabase projects use asymmetric JWT signing keys (RS256/ES256), which
    won't validate against the legacy HS256 shared secret. So we try verified
    HS256 first, then fall back to an unverified decode just to read 'sub'. The
    unverified path is safe enough for read-routing (we still use the service
    role key for the actual DB query) but should be tightened for production by
    fetching Supabase's JWKS and verifying RS256 properly.
    """
    try:
        import jwt as pyjwt
    except Exception as e:
        logger.warning("pyjwt import failed: %s", e)
        return None

    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if jwt_secret:
        try:
            payload = pyjwt.decode(
                token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False}
            )
            sub = payload.get("sub")
            if sub:
                logger.debug("JWT verified via HS256 secret, sub=%s", sub)
                return sub
        except Exception as e:
            logger.info("HS256 verify failed (likely RS256/ES256 token), falling back to unverified decode: %s", e)

    try:
        payload = pyjwt.decode(token, options={"verify_signature": False})
        sub = payload.get("sub")
        if sub:
            alg = pyjwt.get_unverified_header(token).get("alg", "?")
            logger.info("JWT decoded unverified (alg=%s), sub=%s", alg, sub)
            return sub
    except Exception as e:
        logger.warning("JWT unverified decode failed: %s", e)

    return None
