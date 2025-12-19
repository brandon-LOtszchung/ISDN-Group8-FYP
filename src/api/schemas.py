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

