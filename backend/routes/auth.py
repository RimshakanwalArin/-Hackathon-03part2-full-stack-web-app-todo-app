"""
Authentication API routes
Maps to @specs/features/authentication.md
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from typing import Optional

from db import get_session
from models import User
from schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    print("[DEBUG] auth:hash_password >> Starting password hashing")
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode(), salt).decode()
        print("[DEBUG] auth:hash_password >> Password hashed successfully")
        return hashed
    except Exception as e:
        print(f"[ERROR] auth:hash_password >> {type(e).__name__}: {str(e)}")
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    print("[DEBUG] auth:verify_password >> Starting password verification")
    try:
        result = bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
        print(f"[DEBUG] auth:verify_password >> Password verification completed | match={result}")
        return result
    except Exception as e:
        print(f"[ERROR] auth:verify_password >> {type(e).__name__}: {str(e)}")
        raise


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    print("[DEBUG] auth:create_access_token >> Starting JWT token creation")
    try:
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
            print(f"[DEBUG] auth:create_access_token >> Using custom expiration delta | minutes={expires_delta.total_seconds()/60}")
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            print(f"[DEBUG] auth:create_access_token >> Using default expiration | minutes={ACCESS_TOKEN_EXPIRE_MINUTES}")

        to_encode = {"user_id": user_id, "exp": expire}
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        print(f"[DEBUG] auth:create_access_token >> JWT token created successfully | user_id={user_id} | algorithm={ALGORITHM}")
        return encoded_jwt
    except Exception as e:
        print(f"[ERROR] auth:create_access_token >> {type(e).__name__}: {str(e)}")
        raise


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """
    Register a new user
    """
    print(f"[DEBUG] auth:register >> POST /api/auth/register endpoint called | email={request.email}")
    try:
        # Check if user already exists
        print(f"[DEBUG] auth:register >> Checking if user already exists | email={request.email}")
        existing_user = session.exec(
            select(User).where(User.email == request.email)
        ).first()

        if existing_user:
            print(f"[DEBUG] auth:register >> User already exists | email={request.email}")
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        # Create new user
        print(f"[DEBUG] auth:register >> Creating new user | email={request.email} | name={request.name}")
        new_user = User(
            email=request.email,
            name=request.name,
            password_hash=hash_password(request.password),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        print("[DEBUG] auth:register >> Adding user to database session")
        session.add(new_user)
        print("[DEBUG] auth:register >> Committing user to database")
        session.commit()
        print("[DEBUG] auth:register >> Refreshing user from database")
        session.refresh(new_user)
        print(f"[DEBUG] auth:register >> User created successfully | user_id={new_user.id}")

        # Generate token
        print(f"[DEBUG] auth:register >> Generating access token | user_id={new_user.id}")
        access_token = create_access_token(new_user.id)

        print(f"[DEBUG] auth:register >> Returning TokenResponse | user_id={new_user.id} | expires_in={ACCESS_TOKEN_EXPIRE_MINUTES * 60}s")
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except HTTPException:
        print(f"[DEBUG] auth:register >> HTTPException raised, re-raising")
        raise
    except Exception as e:
        print(f"[ERROR] auth:register >> {type(e).__name__}: {str(e)}")
        session.rollback()
        print("[DEBUG] auth:register >> Session rolled back due to error")
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """
    Login user and return JWT token
    """
    print(f"[DEBUG] auth:login >> POST /api/auth/login endpoint called | email={request.email}")
    try:
        # Find user
        print(f"[DEBUG] auth:login >> Querying database for user | email={request.email}")
        user = session.exec(
            select(User).where(User.email == request.email)
        ).first()

        if not user:
            print(f"[DEBUG] auth:login >> User not found in database | email={request.email}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        print(f"[DEBUG] auth:login >> User found, verifying password | email={request.email}")
        if not verify_password(request.password, user.password_hash):
            print(f"[ERROR] auth:login >> Password verification failed | email={request.email}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        print(f"[DEBUG] auth:login >> Password verified successfully | user_id={user.id}")
        # Generate token
        print(f"[DEBUG] auth:login >> Generating access token | user_id={user.id}")
        access_token = create_access_token(user.id)

        print(f"[DEBUG] auth:login >> Returning TokenResponse | user_id={user.id} | expires_in={ACCESS_TOKEN_EXPIRE_MINUTES * 60}s")
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except HTTPException:
        print(f"[DEBUG] auth:login >> HTTPException raised, re-raising")
        raise
    except Exception as e:
        print(f"[ERROR] auth:login >> {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    session: Session = Depends(get_session),
) -> UserResponse:
    """
    Get current user information
    In production, extract user_id from JWT token
    """
    print("[DEBUG] auth:get_current_user >> GET /api/auth/me endpoint called")
    try:
        # For development, return a mock user
        # In production, get user_id from token
        print("[DEBUG] auth:get_current_user >> Querying database for first user (development mode)")
        user = session.exec(
            select(User).limit(1)
        ).first()

        if not user:
            print("[DEBUG] auth:get_current_user >> No user found in database")
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

        print(f"[DEBUG] auth:get_current_user >> User found | user_id={user.id} | email={user.email}")
        print(f"[DEBUG] auth:get_current_user >> Returning UserResponse | user_id={user.id}")
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    except HTTPException:
        print("[DEBUG] auth:get_current_user >> HTTPException raised, re-raising")
        raise
    except Exception as e:
        print(f"[ERROR] auth:get_current_user >> {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user: {str(e)}",
        )
