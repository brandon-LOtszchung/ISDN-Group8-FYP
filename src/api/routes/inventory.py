import time
import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from ..schemas import VideoProcessResponse, InitializeResponse
from src.services.video_flow_service import VideoFlowService
from src.services.initialization_service import InitializationService
from src.services.inventory_service import InventoryService
from src.utils.file_handler import FileHandler

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

FAMILY_ID = "00000000-0000-0000-0000-000000000001"

logger = logging.getLogger("uvicorn.error")

@router.post("/process-video", response_model=VideoProcessResponse)
async def process_video(video: UploadFile = File(...)):
    start_time = time.time()
    video_path = None
    
    try:
        if not video.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        allowed_extensions = ['.mp4', '.avi', '.mov', '.mkv']
        file_ext = os.path.splitext(video.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        video_path = FileHandler.save_temp_file(video, prefix="video_")
        
        video_service = VideoFlowService()
        result = video_service.process_video(video_path)
        
        if not result.get("success"):
            resp = VideoProcessResponse(
                success=False,
                error=result.get("error", "Unknown error occurred"),
                processing_time=time.time() - start_time
            )
            logger.info("process-video result: %s", resp.model_dump_json())
            return resp

        processing_time = time.time() - start_time

        resp = VideoProcessResponse(
            success=True,
            actions=result.get("actions"),
            processing_time=processing_time
        )
        logger.info("process-video result: %s", resp.model_dump_json())
        return resp

    except HTTPException:
        raise
    except Exception as e:
        resp = VideoProcessResponse(
            success=False,
            error=f"Processing error: {str(e)}",
            processing_time=time.time() - start_time
        )
        logger.info("process-video result: %s", resp.model_dump_json())
        return resp
    
    finally:
        if video_path:
            FileHandler.cleanup_files([video_path])


@router.post("/initialize", response_model=InitializeResponse)
async def initialize_inventory(images: List[UploadFile] = File(...)):
    start_time = time.time()
    image_paths = []
    
    try:
        if not images:
            raise HTTPException(status_code=400, detail="No images provided")
        
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
        
        image_paths = FileHandler.save_multiple_temp_files(images, prefix="fridge_")
        
        init_service = InitializationService()
        inventory_service = InventoryService(family_id=FAMILY_ID)
        
        existing_items = inventory_service.get_inventory()
        for item in existing_items:
            try:
                inventory_service.client.table('inventory_items').delete().eq('id', item['id']).execute()
            except Exception as e:
                logger.warning("Could not delete item %s: %s", item.get("name"), e)
        
        detected_items = init_service.analyze_fridge_images(image_paths)
        
        if not detected_items:
            processing_time = time.time() - start_time
            resp = InitializeResponse(
                success=True,
                detected_items=[],
                processing_time=processing_time,
                warning="No items detected. Try taking clearer photos with better lighting."
            )
            logger.info("initialize result: %s", resp.model_dump_json())
            return resp

        for item in detected_items:
            inventory_service.upsert_item(
                name=item['name'],
                category=item['category'],
                quantity_delta=item['quantity']
            )

        processing_time = time.time() - start_time

        resp = InitializeResponse(
            success=True,
            detected_items=detected_items,
            processing_time=processing_time
        )
        logger.info("initialize result: %s", resp.model_dump_json())
        return resp

    except HTTPException:
        raise
    except Exception as e:
        resp = InitializeResponse(
            success=False,
            error=f"Initialization error: {str(e)}",
            processing_time=time.time() - start_time
        )
        logger.info("initialize result: %s", resp.model_dump_json())
        return resp
    
    finally:
        if image_paths:
            FileHandler.cleanup_files(image_paths)

