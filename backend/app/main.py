from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pdf, qa, auth
import os

app = FastAPI()

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*", "Authorization", "Content-Type"],
    expose_headers=["*"],
)

# Create necessary directories
os.makedirs("vector_stores", exist_ok=True)
os.makedirs("temp", exist_ok=True)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["pdf"])
app.include_router(qa.router, prefix="/api/qa", tags=["qa"]) 