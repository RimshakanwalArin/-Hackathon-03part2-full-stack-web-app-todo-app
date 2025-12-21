"""
FastAPI application entry point for Todo App Backend
Phase II - Full-Stack Web Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import db setup
from db import create_db_and_tables

# Create FastAPI app
app = FastAPI(
    title="Todo App API",
    description="Task management API with authentication",
    version="1.0.0"
)

# Configure CORS
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure CORS
allowed_origins = [
    "https://frontend-jflp29lb-rimshakanwalarins-projects.vercel.app",
    "https://frontend-flax-two-72.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Startup event to create database tables
@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    print("[DEBUG] main:startup_event >> Application startup initiated")
    try:
        await create_db_and_tables()
        print("[DEBUG] main:startup_event >> Database tables created/verified successfully")
    except Exception as e:
        print(f"[ERROR] main:startup_event >> {type(e).__name__}: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    print("[DEBUG] main:health_check >> GET /health endpoint called")
    try:
        response = {"status": "healthy", "message": "Todo App API is running"}
        print("[DEBUG] main:health_check >> Health check passed | status=healthy")
        return JSONResponse(
            status_code=200,
            content=response
        )
    except Exception as e:
        print(f"[ERROR] main:health_check >> {type(e).__name__}: {str(e)}")
        raise

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    print("[DEBUG] main:root >> GET / endpoint called")
    try:
        response = {
            "message": "Todo App API",
            "version": "1.0.0",
            "docs": "/docs",
            "openapi": "/openapi.json"
        }
        print("[DEBUG] main:root >> Root endpoint returning API info | version=1.0.0")
        return response
    except Exception as e:
        print(f"[ERROR] main:root >> {type(e).__name__}: {str(e)}")
        raise

# Import and include routes
from routes import auth, tasks
app.include_router(auth.router)
app.include_router(tasks.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("BACKEND_PORT", "8000")),
        reload=True
    )
