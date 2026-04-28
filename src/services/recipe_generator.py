import json
import logging
import os
from typing import Any, Dict, List

from google import genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

VALID_UNITS = {"g", "kg", "ml", "L", "tsp", "tbsp", "cup", "pcs", "cloves", "slice", "bunch"}


class RecipeGenerator:
    def __init__(self):
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)

    def generate(
        self,
        cuisine_style: str,
        meal_time_hkt: str,
        hkt_now_iso: str,
        member_constraints: str,
        inventory_context: str,
        count: int = 5,
    ) -> List[Dict[str, Any]]:
        prompt = self._build_prompt(
            cuisine_style, meal_time_hkt, hkt_now_iso,
            member_constraints, inventory_context, count,
        )
        resp = self.client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt,
        )
        text = (resp.text or "").strip()
        if text.startswith("```json"):
            text = text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif text.startswith("```"):
            text = text.split("```", 1)[1].split("```", 1)[0].strip()
        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("Gemini returned invalid JSON: %s | raw (first 800 chars): %.800s", e, text)
            raise
        recipes = data.get("recipes", [])
        return recipes if isinstance(recipes, list) else []

    def _build_prompt(
        self,
        cuisine_style: str,
        meal_time_hkt: str,
        hkt_now_iso: str,
        member_constraints: str,
        inventory_context: str,
        count: int,
    ) -> str:
        units_list = ", ".join(sorted(VALID_UNITS))
        return (
            "Return ONLY a valid JSON object. No markdown fences, no explanation.\n\n"
            f"Generate exactly {count} {cuisine_style} recipes suitable for {meal_time_hkt}.\n"
            "Maximise use of ingredients already in the inventory.\n"
            "Every ingredient must be checked against the MEMBER_CONSTRAINTS — "
            "exclude any recipe containing a restricted or allergenic ingredient.\n\n"
            "=== OUTPUT FORMAT (follow exactly) ===\n"
            "{\n"
            '  "recipes": [\n'
            "    {\n"
            '      "name": "Steamed Chicken with Ginger",\n'
            '      "calories": 420,\n'
            '      "ingredients": [\n'
            "        {\n"
            '          "name": "chicken breast",\n'
            '          "quantity": 300.0,\n'
            '          "unit": "g",\n'
            '          "required": true,\n'
            '          "alternatives": [],\n'
            '          "estimated_hkd_cost": 0.06\n'
            "        },\n"
            "        {\n"
            '          "name": "ginger",\n'
            '          "quantity": 20.0,\n'
            '          "unit": "g",\n'
            '          "required": true,\n'
            '          "alternatives": ["galangal", "ginger powder"],\n'
            '          "estimated_hkd_cost": 0.10\n'
            "        }\n"
            "      ],\n"
            '      "steps": [\n'
            '        "Clean and pat dry the chicken breast.",\n'
            '        "Slice ginger into thin strips and place under the chicken.",\n'
            '        "Steam over high heat for 12–15 minutes until cooked through."\n'
            "      ]\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "=== FIELD RULES ===\n"
            "calories:\n"
            "  - Per-serving estimate as an INTEGER (e.g. 420, not 420.0)\n"
            "  - Must be a positive integer — never 0, never null\n\n"
            "unit:\n"
            f"  - Must be exactly one of: {units_list}\n"
            "  - No other values allowed\n\n"
            "required:\n"
            "  - true  = essential ingredient (counts toward matched_count)\n"
            "  - false = optional garnish/topping\n\n"
            "alternatives:\n"
            "  - List of substitute ingredient names that work in the recipe\n"
            "  - Use [] when no good substitute exists — never omit this field\n\n"
            "estimated_hkd_cost:\n"
            "  - HKD cost per 1 unit of the ingredient's own unit\n"
            "  - For per-gram items: cost per 1 gram\n"
            "  - For pcs items: cost per 1 piece\n"
            "  - Must be a positive float — never 0, never null\n"
            "  - Reference prices (Hong Kong market):\n"
            "      chicken breast ~0.06/g, pork ~0.05/g, beef ~0.12/g,\n"
            "      egg ~2.50/pcs, milk ~0.018/ml, shrimp ~0.09/g,\n"
            "      tofu ~0.02/g, ginger ~0.10/g, garlic ~0.08/g,\n"
            "      soy sauce ~0.40/tbsp, sesame oil ~0.30/tsp,\n"
            "      rice ~0.01/g, noodle ~0.02/g, vegetable oil ~0.20/tbsp\n\n"
            "steps:\n"
            "  - Provide 5–8 concise cooking steps\n"
            "  - Start each step with an action verb (e.g. 'Slice', 'Heat', 'Mix')\n"
            "  - Each step should describe one clear action\n\n"
            "=== INPUTS ===\n"
            f"CUISINE_STYLE: {cuisine_style}\n"
            f"MEAL_TIME: {meal_time_hkt}\n"
            f"TIME: {hkt_now_iso}\n\n"
            f"MEMBER_CONSTRAINTS:\n{member_constraints}\n\n"
            f"CURRENT_INVENTORY:\n{inventory_context}\n"
        )
