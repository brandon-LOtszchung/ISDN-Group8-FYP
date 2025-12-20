import time
import logging
from fastapi import APIRouter, HTTPException

from ..schemas import (
    RecommendRecipesRequest,
    RecommendRecipesResponse,
    GetRecipeResponse,
    AddToShoppingListResponse,
)
from services.recipe_flow_service import RecipeFlowService

router = APIRouter(prefix="/api/recipes", tags=["recipes"])

logger = logging.getLogger(__name__)


@router.post("/recommend", response_model=RecommendRecipesResponse)
async def recommend_recipes(payload: RecommendRecipesRequest):
    start = time.time()
    try:
        if not payload.member_ids:
            raise HTTPException(status_code=400, detail="member_ids cannot be empty")
        if not payload.cuisine_style.strip():
            raise HTTPException(status_code=400, detail="cuisine_style cannot be empty")

        service = RecipeFlowService()
        recipes = service.recommend_and_save(
            member_ids=payload.member_ids,
            cuisine_style=payload.cuisine_style,
        )

        return RecommendRecipesResponse(success=True, recipes=recipes)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Recipe recommend error: %s", e)
        return RecommendRecipesResponse(success=False, error=str(e))


@router.get("/{saved_recipe_id}", response_model=GetRecipeResponse)
async def get_recipe(saved_recipe_id: str):
    try:
        service = RecipeFlowService()
        recipe = service.get_saved_recipe_detail(saved_recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return GetRecipeResponse(success=True, recipe=recipe)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Get recipe error: %s", e)
        return GetRecipeResponse(success=False, error=str(e))


@router.post("/{saved_recipe_id}/add-to-shopping-list", response_model=AddToShoppingListResponse)
async def add_to_shopping_list(saved_recipe_id: str):
    try:
        service = RecipeFlowService()
        added = service.add_missing_to_shopping_list(saved_recipe_id)
        if added is None:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return AddToShoppingListResponse(success=True, added=added)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Add to shopping list error: %s", e)
        return AddToShoppingListResponse(success=False, error=str(e))


