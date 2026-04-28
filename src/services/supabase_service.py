import os
from dotenv import load_dotenv
from supabase import create_client, Client


class SupabaseService:
    def __init__(self, family_id: str = "eef3fcba-7b07-4c18-82dc-50dfe60b97ac"):
        load_dotenv()
        supabase_url = os.getenv("SUPABASE_URL")
        # Service role key bypasses RLS — safe for backend-only use.
        # Falls back to ANON_PUBLIC_KEY only if SERVICE_ROLE_KEY is absent (dev without RLS).
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("ANON_PUBLIC_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables"
            )
        self.client: Client = create_client(supabase_url, supabase_key)
        self.family_id = family_id
