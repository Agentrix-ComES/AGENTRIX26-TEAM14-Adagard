"""Supabase Storage helper (private bucket + signed URLs). Owner: Person A.

The backend uploads citizen documents to a PRIVATE bucket using the service-role key and
serves them to officers via short-lived signed URLs (the bucket is never public). Requires
SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.
"""
import os
import uuid
from functools import lru_cache

SUPABASE_URL = os.getenv("SUPABASE_URL", "") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
# New Supabase keys (sb_secret_...) supersede the legacy service_role JWT; accept either.
SERVICE_KEY = os.getenv("SUPABASE_SECRET_KEY", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET = os.getenv("SUPABASE_BUCKET", "documents")
SIGNED_URL_TTL = int(os.getenv("SIGNED_URL_TTL", "3600"))  # seconds


def configured() -> bool:
    return bool(SUPABASE_URL and SERVICE_KEY)


@lru_cache(maxsize=1)
def _client():
    if not configured():
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use document storage."
        )
    from supabase import create_client
    return create_client(SUPABASE_URL, SERVICE_KEY)


def object_path(request_id: str, filename: str) -> str:
    """Namespace objects per request: <request_id>/<uuid>-<filename>."""
    safe = os.path.basename(filename or "file").replace(" ", "_")
    return f"{request_id}/{uuid.uuid4().hex[:8]}-{safe}"


def upload(path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to the private bucket; returns the stored object path."""
    _client().storage.from_(BUCKET).upload(
        path, data, {"content-type": content_type, "upsert": "true"}
    )
    return path


def download(path: str) -> bytes:
    """Fetch object bytes (used by the multimodal gap-check)."""
    return _client().storage.from_(BUCKET).download(path)


def signed_url(path: str, expires_in: int = SIGNED_URL_TTL) -> str:
    """Create a short-lived signed URL for officer viewing."""
    res = _client().storage.from_(BUCKET).create_signed_url(path, expires_in)
    return res.get("signedURL") or res.get("signedUrl") or res.get("signed_url", "")
