import os
from dotenv import load_dotenv
from supabase import create_client, Client


class SupabaseService:
    def __init__(self, family_id: str = "00000000-0000-0000-0000-000000000001"):
        load_dotenv()
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("ANON_PUBLIC_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("Missing SUPABASE_URL or ANON_PUBLIC_KEY in environment variables")
        self.client: Client = create_client(supabase_url, supabase_key)
        self.family_id = family_id


