import time
import sys
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from api.schemas import VideoProcessResponse, InitializeResponse
from services.video_flow_service import VideoFlowService
from services.initialization_service import InitializationService
from services.inventory_service import InventoryService
from utils.file_handler import FileHandler

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

FAMILY_ID = "00000000-0000-0000-0000-000000000001"

@router.post("/process-video", response_model=VideoProcessResponse)
async def process_video(video: UploadFile = File(...)):
    """
    Process video to detect hand entering/exiting fridge and update inventory
    
    Args:
        video: Video file upload
    
    Returns:
        VideoProcessResponse with moments, actions, and updated inventory
    """
    start_time = time.time()
    video_path = None
    
    try:
        # Validate file type
        if not video.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        allowed_extensions = ['.mp4', '.avi', '.mov', '.mkv']
        file_ext = os.path.splitext(video.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save video temporarily
        video_path = FileHandler.save_temp_file(video, prefix="video_")
        
        # Process video
        video_service = VideoFlowService()
        result = video_service.process_video(video_path)
        
        if not result.get("success"):
            return VideoProcessResponse(
                success=False,
                error=result.get("error", "Unknown error occurred"),
                processing_time=time.time() - start_time
            )
        
        processing_time = time.time() - start_time
        
        return VideoProcessResponse(
            success=True,
            actions=result.get("actions"),
            processing_time=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        return VideoProcessResponse(
            success=False,
            error=f"Processing error: {str(e)}",
            processing_time=time.time() - start_time
        )
    
    finally:
        # Cleanup
        if video_path:
            FileHandler.cleanup_files([video_path])


@router.post("/initialize", response_model=InitializeResponse)
async def initialize_inventory(images: List[UploadFile] = File(...)):
    """
    Initialize inventory from multiple fridge images.
    This will RESET existing inventory and add all detected items.
    
    Args:
        images: List of fridge image uploads
    
    Returns:
        InitializeResponse with detected items and updated inventory
    """
    start_time = time.time()
    image_paths = []
    
    try:
        # Validate at least one image
        if not images:
            raise HTTPException(status_code=400, detail="No images provided")
        
        # Validate file types
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        for img in images:
            if not img.filename:
                raise HTTPException(status_code=400, detail="Image filename missing")
            
            file_ext = os.path.splitext(img.filename)[1].lower()
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
                )
        
        # Save images temporarily
        image_paths = FileHandler.save_multiple_temp_files(images, prefix="fridge_")
        
        # Initialize services
        init_service = InitializationService()
        inventory_service = InventoryService(family_id=FAMILY_ID)
        
        # Step 1: Clear existing inventory (complete reset)
        existing_items = inventory_service.get_inventory()
        for item in existing_items:
            # Delete all existing items
            try:
                inventory_service.client.table('inventory_items').delete().eq('id', item['id']).execute()
            except Exception as e:
                print(f"Warning: Could not delete item {item.get('name')}: {e}")
        
        # Step 2: Analyze all fridge images
        detected_items = init_service.analyze_fridge_images(image_paths)
        
        if not detected_items:
            processing_time = time.time() - start_time
            return InitializeResponse(
                success=True,
                detected_items=[],
                processing_time=processing_time,
                warning="No items detected. Try taking clearer photos with better lighting."
            )
        
        # Step 3: Add all detected items to inventory
        for item in detected_items:
            inventory_service.upsert_item(
                name=item['name'],
                category=item['category'],
                quantity_delta=item['quantity']
            )
        
        processing_time = time.time() - start_time
        
        return InitializeResponse(
            success=True,
            detected_items=detected_items,
            processing_time=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        return InitializeResponse(
            success=False,
            error=f"Initialization error: {str(e)}",
            processing_time=time.time() - start_time
        )
    
    finally:
        # Cleanup
        if image_paths:
            FileHandler.cleanup_files(image_paths)

