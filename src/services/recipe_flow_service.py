import logging
from typing import Any, Dict, List, Optional

from datetime import datetime
from zoneinfo import ZoneInfo

from services.inventory_service import InventoryService
from services.member_service import MemberService
from services.recipe_generator import RecipeGenerator
from services.recipe_repository import RecipeRepository
from utils.text_normalizer import normalize_food_name

logger = logging.getLogger(__name__)


class RecipeFlowService:
    FAMILY_ID = "00000000-0000-0000-0000-000000000001"

    def __init__(self):
        self.inventory = InventoryService(family_id=self.FAMILY_ID)
        self.members = MemberService(family_id=self.FAMILY_ID)
        self.generator = RecipeGenerator()
        self.repo = RecipeRepository(family_id=self.FAMILY_ID)

    def recommend_and_save(self, member_ids: List[str], cuisine_style: str) -> List[Dict[str, Any]]:
        members = self.members.get_members(member_ids)
        if len(members) != len(set(member_ids)):
            raise ValueError("One or more member_ids not found")

        inventory_items = self.inventory.get_inventory()
        inventory_context = self.inventory.format_inventory_for_prompt()
        constraints = self._format_member_constraints(members)

        hkt_now_iso = datetime.now(ZoneInfo("Asia/Hong_Kong")).isoformat()
        meal_time = self._infer_meal_time_hkt(hkt_now_iso)

        raw_recipes = self.generator.generate(
            cuisine_style=cuisine_style,
            meal_time_hkt=meal_time,
            hkt_now_iso=hkt_now_iso,
            member_constraints=constraints,
            inventory_context=inventory_context,
            count=5,
        )

        inv_names = {normalize_food_name(i.get("name", "")) for i in inventory_items if i.get("quantity", 0) and i.get("name")}

        cards: List[Dict[str, Any]] = []
        for r in raw_recipes[:5]:
            name = str(r.get("name", "")).strip()
            ingredients = r.get("ingredients", []) if isinstance(r.get("ingredients"), list) else []
            steps = r.get("steps", []) if isinstance(r.get("steps"), list) else []

            ing_norm = []
            missing = []
            matched = 0
            total = 0
            for ing in ingredients:
                if not isinstance(ing, dict):
                    continue
                ing_name = str(ing.get("name", "")).strip()
                unit = str(ing.get("unit", "")).strip() or "unit"
                qty = float(ing.get("quantity", 1) or 1)
                required = bool(ing.get("required", True))
                if not ing_name:
                    continue
                total += 1 if required else 0
                n = normalize_food_name(ing_name)
                if required and n in inv_names:
                    matched += 1
                elif required:
                    missing.append({"name": ing_name, "quantity": qty, "unit": unit, "alternatives": ing.get("alternatives")})
                ing_norm.append({"name": ing_name, "quantity": qty, "unit": unit, "required": required})

            recipe_data = {
                "name": name,
                "cuisine_style": cuisine_style,
                "meal_time_hkt": meal_time,
                "hkt_now_iso": hkt_now_iso,
                "member_ids": member_ids,
                "ingredients": ing_norm,
                "steps": [str(s) for s in steps if str(s).strip()],
                "missing_ingredients": missing,
            }

            saved_id = self.repo.insert_saved_recipe(
                cuisine_style=cuisine_style,
                matched_count=matched,
                total_count=total,
                recipe_data=recipe_data,
            )

            cards.append(
                {
                    "saved_recipe_id": saved_id,
                    "name": name,
                    "cuisine_style": cuisine_style,
                    "matched_count": matched,
                    "total_count": total,
                    "missing_count": max(0, total - matched),
                }
            )

        cards.sort(key=lambda c: (c["matched_count"], -c["missing_count"]), reverse=True)
        return cards

    def get_saved_recipe_detail(self, saved_recipe_id: str) -> Optional[Dict[str, Any]]:
        row = self.repo.get_saved_recipe(saved_recipe_id)
        if not row:
            return None
        data = row.get("recipe_data") or {}
        return {
            "saved_recipe_id": row["id"],
            "name": data.get("name", ""),
            "cuisine_style": row.get("cuisine_style") or data.get("cuisine_style") or "",
            "matched_count": int(row.get("matched_count") or 0),
            "total_count": int(row.get("total_count") or 0),
            "ingredients": data.get("ingredients", []) or [],
            "steps": data.get("steps", []) or [],
            "missing_ingredients": data.get("missing_ingredients", []) or [],
        }

    def add_missing_to_shopping_list(self, saved_recipe_id: str) -> Optional[List[Dict[str, Any]]]:
        row = self.repo.get_saved_recipe(saved_recipe_id)
        if not row:
            return None
        data = row.get("recipe_data") or {}
        missing = data.get("missing_ingredients") or []
        items = []
        added = []
        for m in missing:
            if not isinstance(m, dict):
                continue
            name = str(m.get("name", "")).strip()
            unit = str(m.get("unit", "")).strip() or "unit"
            qty = float(m.get("quantity", 1) or 1)
            alts = m.get("alternatives") or []
            if not name:
                continue
            items.append(
                {
                    "family_id": self.FAMILY_ID,
                    "name": name,
                    "quantity": qty,
                    "unit": unit,
                    "alternatives": alts,
                    "is_purchased": False,
                }
            )
            added.append({"name": name, "quantity": qty, "unit": unit, "alternatives": alts})

        self.repo.upsert_shopping_list_items(items)
        return added

    def _format_member_constraints(self, members: List[Dict[str, Any]]) -> str:
        allergies = set()
        restrictions = set()
        for m in members:
            for a in (m.get("allergies") or []):
                allergies.add(str(a))
            for r in (m.get("dietary_restrictions") or []):
                restrictions.add(str(r))
        parts = []
        if restrictions:
            parts.append("DIETARY_RESTRICTIONS: " + ", ".join(sorted(restrictions)))
        if allergies:
            parts.append("ALLERGIES: " + ", ".join(sorted(allergies)))
        if not parts:
            return "None"
        return "\n".join(parts)

    def _infer_meal_time_hkt(self, hkt_now_iso: str) -> str:
        dt = datetime.fromisoformat(hkt_now_iso)
        hour = dt.hour
        if 5 <= hour < 11:
            return "breakfast"
        if 11 <= hour < 17:
            return "lunch"
        return "dinner"


