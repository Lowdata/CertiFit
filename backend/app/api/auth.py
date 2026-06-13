# app/api/auth.py
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest
)
from app.core.dependencies import (
    get_current_user
)

from app.services.auth_service import (
    register_user,
    login_user
)

router = APIRouter()

@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    try:

        user = register_user(
            db=db,
            name=data.name,
            email=data.email,
            password=data.password,
            user_type=data.user_type
        )

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "user_type": user.user_type
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    result = login_user(
        db=db,
        email=data.email,
        password=data.password
    )

    if not result:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": {
            "id": result["user"].id,
            "name": result["user"].name,
            "email": result["user"].email,
            "user_type": result["user"].user_type
        }
    }

@router.get("/me")
def me(
    current_user=Depends(
        get_current_user
    )
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "user_type": current_user.user_type
    }

