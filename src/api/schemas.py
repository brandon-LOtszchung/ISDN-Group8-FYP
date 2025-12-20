from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ItemSchema(BaseModel):
    name: str
    quantity: float
    category: str

class MomentSchema(BaseModel):
    frame_index: int
    sharpness: float
    items: List[ItemSchema]

class ActionsSchema(BaseModel):
    put: List[ItemSchema]
    taken: List[ItemSchema]

class VideoProcessResponse(BaseModel):
    success: bool
    actions: Optional[ActionsSchema] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None

class InitializeResponse(BaseModel):
    success: bool
    detected_items: Optional[List[ItemSchema]] = None
    processing_time: Optional[float] = None
    warning: Optional[str] = None
    error: Optional[str] = None

class RecommendRecipesRequest(BaseModel):
    member_ids: List[str]
    cuisine_style: str
    meal_time: str

class RecipeCardSchema(BaseModel):
    saved_recipe_id: str
    name: str
    cuisine_style: str
    matched_count: int
    total_count: int
    missing_count: int

class RecommendRecipesResponse(BaseModel):
    success: bool
    recipes: Optional[List[RecipeCardSchema]] = None
    error: Optional[str] = None

class RecipeIngredientSchema(BaseModel):
    name: str
    quantity: float
    unit: str
    required: bool = True

class MissingIngredientSchema(BaseModel):
    name: str
    quantity: float
    unit: str
    alternatives: Optional[List[str]] = None

class RecipeDetailSchema(BaseModel):
    saved_recipe_id: str
    name: str
    cuisine_style: str
    matched_count: int
    total_count: int
    ingredients: List[RecipeIngredientSchema]
    steps: List[str]
    missing_ingredients: List[MissingIngredientSchema]

class GetRecipeResponse(BaseModel):
    success: bool
    recipe: Optional[RecipeDetailSchema] = None
    error: Optional[str] = None

class AddToShoppingListResponse(BaseModel):
    success: bool
    added: Optional[List[MissingIngredientSchema]] = None
    error: Optional[str] = None

