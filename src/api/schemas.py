from pydantic import BaseModel, Field
from typing import List, Optional

# ── Shared ──────────────────────────────────────────────────────────────────

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

# ── Video (fridge camera) ────────────────────────────────────────────────────

class VideoProcessResponse(BaseModel):
    success: bool
    actions: Optional[ActionsSchema] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None

# ── Inventory initialize ─────────────────────────────────────────────────────

class InventoryItemSchema(BaseModel):
    """One row returned by POST /api/inventory/initialize. No nullable fields."""
    id: str        # server-generated UUID
    family_id: str
    name: str
    category: str
    quantity: float
    expiry_date: str   # ISO8601 always — Gemini estimates; code falls back by category

# ── Recipes ──────────────────────────────────────────────────────────────────

class RecommendRecipesRequest(BaseModel):
    family_id: str
    member_ids: List[str]
    cuisine_style: str

class RecipeCardSchema(BaseModel):
    """One entry in the POST /api/recipes/recommend response array."""
    saved_recipe_id: str
    name: str
    cuisine_style: str
    matched_count: int
    total_count: int
    missing_count: int
    calories: int   # per-serving kcal — Gemini always provides this

class RecipeIngredientSchema(BaseModel):
    name: str
    quantity: float
    unit: str
    required: bool = True

class MissingIngredientSchema(BaseModel):
    name: str
    quantity: float
    unit: str
    alternatives: List[str] = Field(default_factory=list)  # never null — [] when none

class RecipeDetailSchema(BaseModel):
    """Returned directly by GET /api/recipes/{id} — no wrapper."""
    saved_recipe_id: str
    name: str
    cuisine_style: str
    matched_count: int
    total_count: int
    calories: Optional[int] = None   # Optional — old recipes may lack this field
    ingredients: List[RecipeIngredientSchema]
    steps: List[str]
    missing_ingredients: List[MissingIngredientSchema]

# ── Shopping list ─────────────────────────────────────────────────────────────

class AddToShoppingListBody(BaseModel):
    family_id: str
