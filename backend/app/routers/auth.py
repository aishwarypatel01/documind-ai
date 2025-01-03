from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET_KEY not set in environment variables")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/token")
async def login():
    token_data = {
        "sub": "dummy-user-id",
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(token_data, JWT_SECRET, algorithm="HS256")
    return TokenResponse(access_token=token) 