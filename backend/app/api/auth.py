from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Response
import datetime

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
    response: Response,
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
    
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in prod with HTTPS
        max_age=60 * 60 * 24 * 7  # 7 days
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

@router.delete("/me")
def delete_me(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from app.models.candidate import Candidate
    
    try:
        # 1. Delete associated candidate profile (if any)
        candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
        if candidate:
            db.delete(candidate)
            
        # 2. Soft-delete the user
        timestamp = int(datetime.datetime.now().timestamp())
        current_user.email = f"deleted_{timestamp}_{current_user.id}_{current_user.email}"
        current_user.password_hash = "deleted"
        current_user.user_type = -1
        
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete account")
        
    return {"message": "Account deleted successfully"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False
    )
    return {"message": "Logged out successfully"}

