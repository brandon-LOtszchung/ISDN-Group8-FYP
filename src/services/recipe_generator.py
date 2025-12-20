import json
import os
import logging
from typing import Any, Dict, List

import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class RecipeGenerator:
    def __init__(self):
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def generate(
        self,
        cuisine_style: str,
        meal_time_hkt: str,
        hkt_now_iso: str,
        member_constraints: str,
        inventory_context: str,
        count: int = 5,
    ) -> List[Dict[str, Any]]:
        prompt = self._build_prompt(cuisine_style, meal_time_hkt, hkt_now_iso, member_constraints, inventory_context, count)
        resp = self.model.generate_content(prompt)
        text = (resp.text or "").strip()
        if text.startswith("```json"):
            text = text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif text.startswith("```"):
            text = text.split("```", 1)[1].split("```", 1)[0].strip()
        data = json.loads(text)
        recipes = data.get("recipes", [])
        if not isinstance(recipes, list):
            return []
        return recipes

    def _build_prompt(
        self,
        cuisine_style: str,
        meal_time_hkt: str,
        hkt_now_iso: str,
        member_constraints: str,
        inventory_context: str,
        count: int,
    ) -> str:
        return (
            "Return ONLY valid JSON.\n"
            f"Generate exactly {count} recipes.\n"
            "Each recipe must satisfy ALL constraints.\n"
            "Prefer recipes that maximize ingredient usage from the inventory.\n"
            "\n"
            "JSON schema:\n"
            "{\n"
            '  "recipes": [\n'
            "    {\n"
            '      "name": "string",\n'
            '      "ingredients": [\n'
            '        {"name":"string","quantity":number,"unit":"string","required":true}\n'
            "      ],\n"
            '      "steps": ["string"]\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "\n"
            f"CUISINE_STYLE: {cuisine_style}\n"
            f"MEAL_TIME_HKT: {meal_time_hkt}\n"
            f"HKT_NOW_ISO: {hkt_now_iso}\n"
            "\n"
            "MEMBER_CONSTRAINTS:\n"
            f"{member_constraints}\n"
            "\n"
            "CURRENT_INVENTORY:\n"
            f"{inventory_context}\n"
        )


