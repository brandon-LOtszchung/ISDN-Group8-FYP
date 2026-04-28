import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from zoneinfo import ZoneInfo

from src.services.inventory_service import InventoryService
from src.services.member_service import MemberService
from src.services.recipe_generator import RecipeGenerator
from src.services.recipe_repository import RecipeRepository
from src.utils.text_normalizer import normalize_food_name

logger = logging.getLogger(__name__)

# ── HKD unit cost lookup (Change 6) ──────────────────────────────────────────
# Used by add-to-shopping-list to populate estimated_unit_cost.
# Values are HKD per 1 unit of each unit type.

HKD_PER_UNIT: Dict[str, float] = {
    "g":      0.05,
    "kg":     50.0,
    "ml":     0.02,
    "L":      20.0,
    "tsp":    0.30,
    "tbsp":   0.80,
    "cup":    3.0,
    "pcs":    5.0,
    "cloves": 0.50,
    "slice":  1.0,
    "bunch":  8.0,
}


def estimate_hkd_cost(unit: str) -> Optional[float]:
    """Return HKD cost per 1 unit, or None if unit is unknown."""
    return HKD_PER_UNIT.get(unit)


class RecipeFlowService:
    DEFAULT_FAMILY_ID = "eef3fcba-7b07-4c18-82dc-50dfe60b97ac"

    def __init__(self, family_id: str = "eef3fcba-7b07-4c18-82dc-50dfe60b97ac"):
        self.family_id = family_id
        self.inventory = InventoryService(family_id=family_id)
        self.members = MemberService(family_id=family_id)
        self.generator = RecipeGenerator()
        self.repo = RecipeRepository(family_id=family_id)

    # ── Recommend ──────────────────────────────────────────────────────────

    def recommend_and_save(self, member_ids: List[str], cuisine_style: str) -> List[Dict[str, Any]]:
        members = self.members.get_members(member_ids)
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

        # Case-insensitive inventory name set for matching
        inv_names = {
            normalize_food_name(i.get("name", "")).lower()
            for i in inventory_items
            if i.get("quantity", 0) and i.get("name")
        }

        cards: List[Dict[str, Any]] = []
        for r in raw_recipes[:5]:
            name = str(r.get("name", "")).strip()
            if not name:
                continue

            ingredients_raw = r.get("ingredients", [])
            if not isinstance(ingredients_raw, list):
                continue
            steps_raw = r.get("steps", [])
            if not isinstance(steps_raw, list):
                steps_raw = []

            raw_kcal = r.get("calories")
            if not raw_kcal:
                logger.warning("Recipe '%s' missing calories from Gemini — skipping", name)
                continue
            try:
                calories: int = int(raw_kcal)
            except (ValueError, TypeError):
                logger.warning("Recipe '%s' non-integer calories '%s' — skipping", name, raw_kcal)
                continue

            # Change 4: build ingredients list (no alternatives inline)
            # and collect alternatives into a top-level dict keyed by ingredient name
            ingredients: List[Dict] = []
            alternatives_map: Dict[str, List[str]] = {}
            matched = 0
            total = 0

            for ing in ingredients_raw:
                if not isinstance(ing, dict):
                    continue
                ing_name = str(ing.get("name", "")).strip()
                if not ing_name:
                    continue
                unit = str(ing.get("unit", "")).strip() or "pcs"
                qty = float(ing.get("quantity", 1) or 1)
                required = bool(ing.get("required", True))

                # Collect alternatives into top-level dict
                alts = ing.get("alternatives") or []
                if not isinstance(alts, list):
                    alts = []
                if alts:
                    alternatives_map[ing_name] = alts

                ingredients.append({
                    "name": ing_name,
                    "quantity": qty,
                    "unit": unit,
                    "required": required,
                })

                if required:
                    total += 1
                    n = normalize_food_name(ing_name).lower()
                    if n in inv_names:
                        matched += 1

            # Change 4: recipe_data structure with top-level alternatives dict
            recipe_data: Dict[str, Any] = {
                "name": name,
                "cuisine_style": cuisine_style,
                "calories": calories,
                "meal_time_hkt": meal_time,
                "member_ids": member_ids,
                "ingredients": ingredients,
                "steps": [str(s) for s in steps_raw if str(s).strip()],
                "alternatives": alternatives_map,
                # missing_ingredients is NOT stored — recomputed live from inventory
            }

            saved_id = self.repo.insert_saved_recipe(
                cuisine_style=cuisine_style,
                matched_count=matched,
                total_count=total,
                recipe_data=recipe_data,
            )

            cards.append({
                "saved_recipe_id": saved_id,
                "name": name,
                "cuisine_style": cuisine_style,
                "matched_count": matched,
                "total_count": total,
                "missing_count": max(0, total - matched),
                "calories": calories,
            })

        cards.sort(key=lambda c: c["missing_count"])
        return cards

    # ── Detail ─────────────────────────────────────────────────────────────

    def get_saved_recipe_detail(self, saved_recipe_id: str) -> Optional[Dict[str, Any]]:
        """
        Change 5: Recompute matched_count and missing_ingredients from
        the family's LIVE inventory instead of returning the snapshotted values.
        """
        row = self.repo.get_saved_recipe(saved_recipe_id)
        if not row:
            return None

        data = row.get("recipe_data") or {}
        ingredients = data.get("ingredients") or []

        # Support both new (top-level dict) and old (per-ingredient list) formats
        alternatives_map: Dict[str, List[str]] = {}
        top_level_alts = data.get("alternatives")
        if isinstance(top_level_alts, dict):
            alternatives_map = top_level_alts
        else:
            # Backward compat: alternatives were stored inside each ingredient
            for ing in ingredients:
                alts = ing.get("alternatives")
                if isinstance(alts, list) and alts:
                    alternatives_map[ing.get("name", "")] = alts

        # Recompute from live inventory
        inventory_items = self.inventory.get_inventory()
        inv_names = {
            normalize_food_name(i.get("name", "")).lower()
            for i in inventory_items
            if i.get("quantity", 0) and i.get("name")
        }

        matched = 0
        total = 0
        missing_ingredients = []

        clean_ingredients = []
        for ing in ingredients:
            if not isinstance(ing, dict):
                continue
            ing_name = str(ing.get("name", "")).strip()
            if not ing_name:
                continue
            unit = str(ing.get("unit", "unit"))
            qty = float(ing.get("quantity", 1) or 1)
            required = bool(ing.get("required", True))

            clean_ingredients.append({
                "name": ing_name,
                "quantity": qty,
                "unit": unit,
                "required": required,
            })

            if required:
                total += 1
                n = normalize_food_name(ing_name).lower()
                if n in inv_names:
                    matched += 1
                else:
                    missing_ingredients.append({
                        "name": ing_name,
                        "quantity": qty,
                        "unit": unit,
                        "alternatives": alternatives_map.get(ing_name) or [],
                    })

        return {
            "saved_recipe_id": row["id"],
            "name": data.get("name", ""),
            "cuisine_style": row.get("cuisine_style") or data.get("cuisine_style") or "",
            "matched_count": matched,
            "total_count": total,
            "calories": data.get("calories"),
            "ingredients": clean_ingredients,
            "steps": data.get("steps") or [],
            "missing_ingredients": missing_ingredients,
        }

    # ── Shopping list ───────────────────────────────────────────────────────

    def add_missing_to_shopping_list(self, saved_recipe_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Change 6: Recompute missing from LIVE inventory (not stored snapshot).
        Uses HKD_PER_UNIT lookup table for estimated_unit_cost.
        Upserts on (family_id, name, recipe_name) to prevent duplicates.
        """
        row = self.repo.get_saved_recipe(saved_recipe_id)
        if not row:
            return None

        data = row.get("recipe_data") or {}
        recipe_name = data.get("name", "Unknown Recipe")
        ingredients = data.get("ingredients") or []

        # Alternatives map (top-level dict or per-ingredient fallback)
        alternatives_map: Dict[str, List[str]] = {}
        top_level_alts = data.get("alternatives")
        if isinstance(top_level_alts, dict):
            alternatives_map = top_level_alts
        else:
            for ing in ingredients:
                alts = ing.get("alternatives")
                if isinstance(alts, list) and alts:
                    alternatives_map[ing.get("name", "")] = alts

        # Recompute missing from live inventory
        inventory_items = self.inventory.get_inventory()
        inv_names = {
            normalize_food_name(i.get("name", "")).lower()
            for i in inventory_items
            if i.get("quantity", 0) and i.get("name")
        }

        items_to_upsert = []
        added = []

        for ing in ingredients:
            if not isinstance(ing, dict):
                continue
            ing_name = str(ing.get("name", "")).strip()
            if not ing_name:
                continue
            required = bool(ing.get("required", True))
            if not required:
                continue   # only add required ingredients

            n = normalize_food_name(ing_name).lower()
            if n in inv_names:
                continue   # already have it — skip

            unit = str(ing.get("unit", "")).strip() or "pcs"
            qty = float(ing.get("quantity", 1) or 1)
            alts = alternatives_map.get(ing_name) or []
            if not isinstance(alts, list):
                alts = []

            items_to_upsert.append({
                "family_id": self.family_id,
                "name": ing_name,
                "quantity": qty,
                "unit": unit,
                "alternatives": alts,
                "is_purchased": False,
                "estimated_unit_cost": estimate_hkd_cost(unit),
                "recipe_name": recipe_name,
            })
            added.append({"name": ing_name, "quantity": qty, "unit": unit, "alternatives": alts})

        if items_to_upsert:
            self.repo.upsert_shopping_list_items(items_to_upsert)
        return added

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _format_member_constraints(self, members: List[Dict[str, Any]]) -> str:
        allergies: set = set()
        restrictions: set = set()
        health: set = set()
        for m in members:
            for a in (m.get("allergies") or []):
                allergies.add(str(a))
            for r in (m.get("dietary_restrictions") or []):
                restrictions.add(str(r))
            for h in (m.get("health_conditions") or []):
                health.add(str(h))
        parts = []
        if restrictions:
            parts.append("DIETARY_RESTRICTIONS: " + ", ".join(sorted(restrictions)))
        if allergies:
            parts.append("ALLERGIES: " + ", ".join(sorted(allergies)))
        if health:
            parts.append("HEALTH_CONDITIONS: " + ", ".join(sorted(health)))
        return "\n".join(parts) if parts else "None"

    def _infer_meal_time_hkt(self, hkt_now_iso: str) -> str:
        dt = datetime.fromisoformat(hkt_now_iso)
        if 5 <= dt.hour < 11:
            return "breakfast"
        if 11 <= dt.hour < 17:
            return "lunch"
        return "dinner"
