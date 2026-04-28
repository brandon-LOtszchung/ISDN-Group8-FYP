import logging
import os
import time
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from typing import List

from ..schemas import InventoryItemSchema, VideoProcessResponse
from src.services.video_flow_service import VideoFlowService
from src.services.initialization_service import InitializationService
from src.services.supabase_service import SupabaseService
from src.utils.auth import get_family_id
from src.utils.file_handler import FileHandler

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

logger = logging.getLogger("uvicorn.error")


def _resolve_family_id(request: Request) -> str:
    supa = SupabaseService()
    return get_family_id(request, supa.client)


@router.post("/process-video", response_model=VideoProcessResponse)
async def process_video(request: Request, video: UploadFile = File(...)):
    start_time = time.time()
    video_path = None
    try:
        if not video.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        allowed_extensions = [".mp4", ".avi", ".mov", ".mkv"]
        file_ext = os.path.splitext(video.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        video_path = FileHandler.save_temp_file(video, prefix="video_")
        family_id = _resolve_family_id(request)
        service = VideoFlowService(family_id=family_id)
        result = service.process_video(video_path)
        processing_time = time.time() - start_time
        if not result.get("success"):
            return VideoProcessResponse(success=False, error=result.get("error", "Unknown error"), processing_time=processing_time)
        return VideoProcessResponse(success=True, actions=result.get("actions"), processing_time=processing_time)
    except HTTPException:
        raise
    except Exception as e:
        return VideoProcessResponse(success=False, error=f"Processing error: {str(e)}", processing_time=time.time() - start_time)
    finally:
        if video_path:
            FileHandler.cleanup_files([video_path])


@router.post("/initialize", response_model=List[InventoryItemSchema])
async def initialize_inventory(
    request: Request,
    images: List[UploadFile] = File(...),
):
    image_paths = []
    try:
        if not images:
            raise HTTPException(status_code=400, detail="At least one image is required.")

        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
        for img in images:
            if not img.filename:
                raise HTTPException(status_code=400, detail="Image filename missing.")
            ext = os.path.splitext(img.filename)[1].lower()
            if ext not in allowed_extensions:
                raise HTTPException(status_code=400, detail=f"Invalid file type '{ext}'. Allowed: {', '.join(allowed_extensions)}")

        image_paths = FileHandler.save_multiple_temp_files(images, prefix="fridge_")
        family_id = _resolve_family_id(request)
        service = InitializationService()
        items = service.analyze_fridge_images(image_paths, family_id=family_id)

        if not items:
            raise HTTPException(status_code=422, detail="Could not identify any items in the provided images.")

        return items

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("initialize error: %s", e)
        raise HTTPException(status_code=500, detail=f"Initialization error: {str(e)}")
    finally:
        if image_paths:
            FileHandler.cleanup_files(image_paths)
