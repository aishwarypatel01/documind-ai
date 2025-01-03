from fastapi import APIRouter, UploadFile, Depends, HTTPException
from ..services.pdf_processor import PDFProcessor
from ..dependencies import get_current_user
import os
import shutil

router = APIRouter()
pdf_processor = PDFProcessor()

@router.post("/upload")
async def upload_pdf(
    file: UploadFile,
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Create temp directory if it doesn't exist
    os.makedirs("temp", exist_ok=True)
    
    # Save file temporarily
    file_path = f"temp/temp_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        result = await pdf_processor.process_pdf(file_path, current_user["id"])
        
        return {"message": f"Successfully processed {file.filename}"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path) 