import os
import shutil
from datetime import datetime
from typing import Union

from fastapi import UploadFile

from app.core.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, UPLOAD_DIR

class FileService:
    """Handle file uploads and storage"""
    
    def __init__(self):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        os.makedirs(f"{UPLOAD_DIR}/pdfs", exist_ok=True)
        os.makedirs(f"{UPLOAD_DIR}/answers", exist_ok=True)
    
    async def save_pdf(self, file: UploadFile, subject_id: int) -> dict:
        """Save uploaded PYQ PDF"""
        return await self._save_file(file, "pdfs", subject_id)
    
    async def save_answer_image(self, file: UploadFile, exam_id: int, question_id: int) -> dict:
        """Save uploaded answer image"""
        return await self._save_file(file, "answers", f"{exam_id}_{question_id}")
    
    async def _save_file(self, file: UploadFile, subdir: str, identifier: Union[int, str]) -> dict:
        """Generic file save handler"""
        if not file.filename:
            raise ValueError("Filename is required")

        # Validate extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}")

        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
        if size > MAX_FILE_SIZE:
            raise ValueError(f"File too large. Max size is {MAX_FILE_SIZE} bytes")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_filename = f"{identifier}_{timestamp}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, subdir, new_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "filename": new_filename,
            "original_name": file.filename,
            "path": file_path,
            "size": os.path.getsize(file_path),
            "uploaded_at": timestamp
        }
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False

# Global instance
file_service = FileService()
