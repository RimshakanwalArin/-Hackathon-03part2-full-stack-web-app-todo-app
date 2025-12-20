"""
Pydantic schemas for request/response validation
Maps to @specs/specification.md
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


# Authentication Schemas
class RegisterRequest(BaseModel):
    """User registration request"""
    email: str
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=255)

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class LoginRequest(BaseModel):
    """User login request"""
    email: str
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    name: str
    created_at: datetime
    updated_at: datetime


# Task Schemas
class TaskCreateRequest(BaseModel):
    """Create task request"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()


class TaskUpdateRequest(BaseModel):
    """Update task request"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None


class TaskResponse(BaseModel):
    """Task response model"""
    id: int
    user_id: str
    title: str
    description: Optional[str] = None
    completed: bool
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    """Task list response"""
    tasks: List[TaskResponse]
    total: int
    status_filter: Optional[str] = None
    sort_order: Optional[str] = None


class TaskCreateResponse(BaseModel):
    """Task creation response (for MCP tools)"""
    task_id: int
    status: str = "created"
    title: str


class TaskCompleteResponse(BaseModel):
    """Task completion response"""
    task_id: int
    status: str = "completed"
    title: str


class TaskDeleteResponse(BaseModel):
    """Task deletion response"""
    task_id: int
    status: str = "deleted"
    title: str


class TaskUpdateResponse(BaseModel):
    """Task update response"""
    task_id: int
    status: str = "updated"
    title: str
    completed: bool


# Error Schemas
class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: dict = Field(..., description="Error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra  = {
            "example": {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input provided"
                },
                "timestamp": "2025-12-08T10:30:00Z"
            }
        }


class SuccessResponse(BaseModel):
    """Success response wrapper"""
    success: bool = True
    data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"task_id": 1},
                "timestamp": "2025-12-08T10:30:00Z"
            }
        }

print("[DEBUG] schemas.py >> Updated schema_extra to json_schema_extra for SuccessResponse")
