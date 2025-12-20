import logging
from typing import Any, Dict, List, Optional

from services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class RecipeRepository(SupabaseService):
    def insert_saved_recipe(
        self,
        cuisine_style: str,
        matched_count: int,
        total_count: int,
        recipe_data: Dict[str, Any],
    ) -> str:
        resp = (
            self.client.table("saved_recipes")
            .insert(
                {
                    "family_id": self.family_id,
                    "cuisine_style": cuisine_style,
                    "matched_count": matched_count,
                    "total_count": total_count,
                    "recipe_data": recipe_data,
                }
            )
            .select("id")
            .single()
            .execute()
        )
        return resp.data["id"]

    def get_saved_recipe(self, saved_recipe_id: str) -> Optional[Dict[str, Any]]:
        resp = (
            self.client.table("saved_recipes")
            .select("*")
            .eq("family_id", self.family_id)
            .eq("id", saved_recipe_id)
            .single()
            .execute()
        )
        return resp.data

    def upsert_shopping_list_items(self, items: List[Dict[str, Any]]) -> None:
        if not items:
            return
        self.client.table("shopping_list_items").upsert(
            items,
            on_conflict="family_id,name,unit",
            ignore_duplicates=False,
        ).execute()


