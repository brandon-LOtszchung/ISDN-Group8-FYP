import logging
from typing import Dict, List

from src.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class MemberService(SupabaseService):
    def get_members(self, member_ids: List[str]) -> List[Dict]:
        if not member_ids:
            return []
        resp = (
            self.client.table("family_members")
            .select("*")
            .in_("id", member_ids)
            .eq("family_id", self.family_id)
            .execute()
        )
        return resp.data or []


