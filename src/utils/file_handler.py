import os
import uuid
from pathlib import Path
from typing import List
from fastapi import UploadFile

class FileHandler:
    """Handle temporary file storage and cleanup"""
    
    @staticmethod
    def save_temp_file(file: UploadFile, prefix: str = "") -> str:
        """
        Save uploaded file to /tmp with unique filename
        
        Args:
            file: FastAPI UploadFile object
            prefix: Optional prefix for filename
        
        Returns:
            Full path to saved file
        """
        file_extension = Path(file.filename).suffix if file.filename else ""
        unique_filename = f"{prefix}{uuid.uuid4()}{file_extension}"
        temp_path = f"/tmp/{unique_filename}"
        
        with open(temp_path, "wb") as f:
            f.write(file.file.read())
        
        return temp_path
    
    @staticmethod
    def save_multiple_temp_files(files: List[UploadFile], prefix: str = "") -> List[str]:
        """
        Save multiple uploaded files to /tmp
        
        Args:
            files: List of FastAPI UploadFile objects
            prefix: Optional prefix for filenames
        
        Returns:
            List of full paths to saved files
        """
        paths = []
        for file in files:
            path = FileHandler.save_temp_file(file, prefix)
            paths.append(path)
        return paths
    
    @staticmethod
    def cleanup_files(file_paths: List[str]) -> None:
        """
        Delete temporary files
        
        Args:
            file_paths: List of file paths to delete
        """
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Warning: Could not delete {path}: {e}")

