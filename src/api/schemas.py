from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ItemSchema(BaseModel):
    """Schema for inventory item"""
    name: str
    quantity: float
    category: str

class MomentSchema(BaseModel):
    """Schema for moment detection"""
    frame_index: int
    sharpness: float
    items: List[ItemSchema]

class ActionsSchema(BaseModel):
    """Schema for PUT/TAKEN actions"""
    put: List[ItemSchema]
    taken: List[ItemSchema]

class VideoProcessResponse(BaseModel):
    """Response schema for video processing endpoint"""
    success: bool
    actions: Optional[ActionsSchema] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None

class InitializeResponse(BaseModel):
    """Response schema for initialization endpoint"""
    success: bool
    detected_items: Optional[List[ItemSchema]] = None
    processing_time: Optional[float] = None
    warning: Optional[str] = None
    error: Optional[str] = None

