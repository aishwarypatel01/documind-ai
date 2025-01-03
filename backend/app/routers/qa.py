from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..services.qa_service import QAService
from ..dependencies import get_current_user

router = APIRouter()
qa_service = QAService()

class QuestionRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask_question(
    question: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    response = await qa_service.get_answer(
        question.question,
        current_user["id"]
    )
    return response 