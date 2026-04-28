import logging
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, Query, Request

from ..schemas import (
    AddToShoppingListBody,
    RecipeCardSchema,
    RecipeDetailSchema,
    RecommendRecipesRequest,
)
from src.services.recipe_flow_service import RecipeFlowService
from src.services.supabase_service import SupabaseService
from src.utils.auth import get_family_id, FALLBACK_FAMILY_ID

router = APIRouter(prefix="/api/recipes", tags=["recipes"])
logger = logging.getLogger(__name__)


def _validate_uuid(value: str) -> None:
    try:
        uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recipe ID format")


@router.post("/recommend", response_model=List[RecipeCardSchema])
async def recommend_recipes(payload: RecommendRecipesRequest):
    if not payload.member_ids:
        raise HTTPException(status_code=400, detail="member_ids cannot be empty")
    if not payload.cuisine_style.strip():
        raise HTTPException(status_code=400, detail="cuisine_style cannot be empty")
    if not payload.family_id.strip():
        raise HTTPException(status_code=400, detail="family_id cannot be empty")

    try:
        service = RecipeFlowService(family_id=payload.family_id)
        cards = service.recommend_and_save(
            member_ids=payload.member_ids,
            cuisine_style=payload.cuisine_style,
        )
        return cards
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Recipe recommend error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate recipe recommendations")


@router.get("/{saved_recipe_id}", response_model=RecipeDetailSchema)
async def get_recipe(
    saved_recipe_id: str,
    request: Request,
    family_id: str | None = Query(default=None),
):
    _validate_uuid(saved_recipe_id)
    try:
        if family_id and family_id.strip():
            resolved_family_id = family_id.strip()
        else:
            supa = SupabaseService()
            resolved_family_id = get_family_id(request, supa.client)
        service = RecipeFlowService(family_id=resolved_family_id)
        recipe = service.get_saved_recipe_detail(saved_recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail=f"No recipe found for id: {saved_recipe_id}")
        return recipe
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Get recipe error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve recipe")


@router.post("/{saved_recipe_id}/add-to-shopping-list")
async def add_to_shopping_list(saved_recipe_id: str, body: AddToShoppingListBody):
    _validate_uuid(saved_recipe_id)
    family_id = body.family_id.strip() or FALLBACK_FAMILY_ID
    try:
        service = RecipeFlowService(family_id=family_id)
        added = service.add_missing_to_shopping_list(saved_recipe_id)
        if added is None:
            raise HTTPException(status_code=404, detail=f"No recipe found for id: {saved_recipe_id}")
        return {"added_count": len(added)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Add to shopping list error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to add items to shopping list")
