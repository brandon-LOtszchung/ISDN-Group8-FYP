import os
import uuid
from pathlib import Path
from typing import List
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)

class FileHandler:
    @staticmethod
    def save_temp_file(file: UploadFile, prefix: str = "") -> str:
        file_extension = Path(file.filename).suffix if file.filename else ""
        unique_filename = f"{prefix}{uuid.uuid4()}{file_extension}"
        temp_path = f"/tmp/{unique_filename}"
        
        with open(temp_path, "wb") as f:
            f.write(file.file.read())
        
        return temp_path
    
    @staticmethod
    def save_multiple_temp_files(files: List[UploadFile], prefix: str = "") -> List[str]:
        paths = []
        for file in files:
            path = FileHandler.save_temp_file(file, prefix)
            paths.append(path)
        return paths
    
    @staticmethod
    def cleanup_files(file_paths: List[str]) -> None:
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                logger.warning("Could not delete %s: %s", path, e)

