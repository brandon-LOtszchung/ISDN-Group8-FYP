import json
import logging
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

from google import genai
from dotenv import load_dotenv
from PIL import Image

logger = logging.getLogger(__name__)

# ── Category normalisation (Change 1) ────────────────────────────────────────
# iOS app uses Title Case categories. Gemini may return lowercase or synonyms.
# Map everything to the 8 valid iOS categories before returning.

CATEGORY_MAP: Dict[str, str] = {
    # Protein
    "meat": "Protein", "poultry": "Protein", "chicken": "Protein",
    "beef": "Protein", "pork": "Protein", "fish": "Protein",
    "seafood": "Protein", "eggs": "Protein", "egg": "Protein",
    "tofu": "Protein", "legumes": "Protein",
    # Vegetable
    "vegetable": "Vegetable", "vegetables": "Vegetable",
    "greens": "Vegetable", "herbs": "Vegetable",
    # Fruit
    "fruit": "Fruit", "fruits": "Fruit",
    # Dairy
    "dairy": "Dairy", "milk": "Dairy", "cheese": "Dairy",
    "yogurt": "Dairy", "butter": "Dairy", "cream": "Dairy",
    # Grain
    "grain": "Grain", "grains": "Grain", "rice": "Grain",
    "bread": "Grain", "pasta": "Grain", "noodle": "Grain",
    "noodles": "Grain", "flour": "Grain", "cereal": "Grain",
    # Condiment
    "condiment": "Condiment", "condiments": "Condiment",
    "sauce": "Condiment", "oil": "Condiment", "spice": "Condiment",
    "seasoning": "Condiment", "vinegar": "Condiment",
    "snacks": "Condiment", "canned": "Condiment",
    # Beverage
    "beverage": "Beverage", "beverages": "Beverage",
    "drink": "Beverage", "juice": "Beverage", "water": "Beverage",
    "soda": "Beverage",
}

VALID_CATEGORIES = {
    "Protein", "Vegetable", "Fruit", "Dairy",
    "Grain", "Condiment", "Beverage", "Other",
}


def normalize_category(raw: str) -> str:
    """Map any Gemini category string to one of the 8 valid iOS categories."""
    if raw in VALID_CATEGORIES:          # already correct Title Case
        return raw
    return CATEGORY_MAP.get(raw.strip().lower(), "Other")


# ── Expiry date formatting (Fix 3) ───────────────────────────────────────────
# Category-based fallback shelf-life in days.
# Used when Gemini omits or returns a null expiry_date so the item is never dropped.

CATEGORY_DEFAULT_DAYS: Dict[str, int] = {
    "Protein":   4,
    "Vegetable": 7,
    "Fruit":     7,
    "Dairy":     10,
    "Grain":     365,
    "Condiment": 180,
    "Beverage":  60,
    "Other":     30,
}


def _try_parse_expiry(raw) -> Optional[str]:
    """Returns a formatted ISO8601 string, or None if raw is unparseable."""
    if isinstance(raw, datetime):
        return raw.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(raw, date):
        return datetime(raw.year, raw.month, raw.day, tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(raw, str):
        stripped = raw.strip()
        if not stripped or stripped.lower() in ("null", "none"):
            return None
        # Bare date like "2026-05-04" → add midnight UTC time
        if len(stripped) == 10 and stripped[4] == "-" and stripped[7] == "-":
            return f"{stripped}T00:00:00Z"
        return stripped   # assume already full ISO8601
    return None


def format_expiry(raw, category: str = "Other") -> str:
    """
    Always returns a valid ISO8601 UTC string.
    If Gemini provides a parseable date, use it.
    Otherwise fall back to today + category-based shelf-life days.
    Items are never dropped due to a missing expiry_date.
    """
    if raw:
        result = _try_parse_expiry(raw)
        if result:
            return result
    days = CATEGORY_DEFAULT_DAYS.get(category, 30)
    fallback = datetime.now(timezone.utc) + timedelta(days=days)
    logger.debug("Using %d-day fallback expiry for category '%s'", days, category)
    return fallback.strftime("%Y-%m-%dT%H:%M:%SZ")


class InitializationService:

    def __init__(self):
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)

    def analyze_fridge_images(
        self,
        image_paths: List[str],
        family_id: str = "eef3fcba-7b07-4c18-82dc-50dfe60b97ac",
    ) -> List[Dict]:
        """
        Analyze fridge photos with Gemini vision.
        Change 3: Does NOT insert into Supabase — iOS client handles insertion.
        Returns items with normalised categories and formatted expiry dates.
        """
        if not image_paths:
            return []

        images = [Image.open(p) for p in image_paths if Path(p).exists()]
        if not images:
            return []

        prompt = self._build_prompt()
        logger.info("Calling Gemini with %d image(s) for family %s", len(images), family_id)
        text = ""
        try:
            response = self.client.models.generate_content(
                model='gemini-3.1-pro-preview',
                contents=[prompt] + images,
            )
            logger.info("Gemini responded successfully")
            text = (response.text or "").strip()
            if text.startswith("```json"):
                text = text.split("```json", 1)[1].split("```", 1)[0].strip()
            elif text.startswith("```"):
                text = text.split("```", 1)[1].split("```", 1)[0].strip()
            parsed = json.loads(text)
            raw_items = parsed.get("items", [])
            if not isinstance(raw_items, list):
                raw_items = []
        except json.JSONDecodeError as e:
            logger.error("Gemini returned invalid JSON: %s | raw (first 800): %.800s", e, text)
            return []
        except Exception as e:
            logger.exception("Gemini image analysis failed: %s", e)
            return []

        result = []
        for item in raw_items:
            if not isinstance(item, dict):
                continue

            name = str(item.get("name", "")).strip()
            if not name:
                logger.warning("Skipping item with missing name: %s", item)
                continue

            # Change 1: normalize to iOS Title Case category
            raw_cat = str(item.get("category", "")).strip()
            category = normalize_category(raw_cat)

            raw_qty = item.get("quantity")
            if raw_qty is None:
                logger.warning("Item '%s' missing quantity — skipping", name)
                continue
            quantity = float(raw_qty)
            if quantity <= 0:
                logger.warning("Item '%s' non-positive quantity %s — skipping", name, quantity)
                continue

            # Fix 3: always get an expiry — category fallback if Gemini omits it
            expiry_date = format_expiry(item.get("expiry_date"), category=category)

            result.append({
                "id": str(uuid.uuid4()),   # Change 3: client uses this as the row ID on insert
                "family_id": family_id,
                "name": name,
                "category": category,
                "quantity": quantity,
                "expiry_date": expiry_date,
            })

        return result

    def _build_prompt(self) -> str:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return (
            "You are analyzing one or more photos of the SAME refrigerator taken from different angles.\n"
            "Return ONLY a valid JSON object — no markdown, no explanation, nothing before or after the JSON.\n\n"
            "=== OUTPUT FORMAT (follow exactly) ===\n"
            "{\n"
            '  "items": [\n'
            "    {\n"
            '      "name": "chicken breast",\n'
            '      "category": "Protein",\n'
            '      "quantity": 2.0,\n'
            f'      "expiry_date": "{today}T00:00:00Z"\n'
            "    },\n"
            "    {\n"
            '      "name": "milk",\n'
            '      "category": "Dairy",\n'
            '      "quantity": 1.0,\n'
            f'      "expiry_date": "{today}T00:00:00Z"\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "=== VALID CATEGORIES ===\n"
            "Return category as exactly one of: Protein, Vegetable, Fruit, Dairy, Grain, Condiment, Beverage, Other\n\n"
            "=== RULES ===\n"
            "1. DEDUPLICATION: photos may overlap — count each physical item ONCE across all photos.\n"
            "2. NAMES: specific food type, no brands, singular.\n"
            "   - Remove brand names, colors, and sizes — but keep the specific food type: 'Red Fuji Apple' → 'apple', 'Heinz Ketchup' → 'ketchup', 'Coca-Cola' → 'soda', 'Evian' → 'water' (NOT 'beverage', NOT 'condiment')\n"
            "   - Singular: 'eggs' → 'egg', 'apples' → 'apple', 'carrots' → 'carrot'\n"
            "   - Keep compound names: 'orange juice', 'chocolate milk', 'chicken breast'\n"
            "3. QUANTITY: count discrete items (3 eggs = 3.0) or volumes/packs as units (1 milk carton = 1.0).\n"
            "4. CATEGORY: assign the single best matching category from the 8 valid options above.\n"
            "5. EXPIRY DATE: you MUST provide a realistic estimate for EVERY item.\n"
            "   Format: YYYY-MM-DDTHH:MM:SSZ (UTC). Today is " + today + ".\n"
            "   Base your estimate on the item's VISUAL CONDITION in the photo:\n"
            "   - Fresh/sealed/unopened → use the longer end of the range below\n"
            "   - Slightly wilted/soft/open packaging → shorten the estimate\n"
            "   - Clearly spoiled → set expiry_date to today\n"
            "   Typical ranges by category:\n"
            "   - Protein (seafood): +2 to +3 days | Protein (meat/poultry): +3 to +5 days\n"
            "   - Dairy: +7 to +14 days\n"
            "   - Vegetable / Fruit: +5 to +10 days\n"
            "   - Beverage: +30 to +60 days\n"
            "   - Condiment: +90 to +365 days\n"
            "   - Grain / Other: +180 to +365 days\n"
            "   NEVER output null, 'null', an empty string, or omit expiry_date.\n"
            "6. EMPTY FRIDGE: return {\"items\": []}\n"
        )
