# app/core/dependencies.py

from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from typing import Optional

from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.models.user import User

from app.core.security import (
    decode_access_token
)

# =====================================
# OLD OAUTH VERSION
# =====================================

# from fastapi.security import OAuth2PasswordBearer

# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl="/auth/login"
# )

# =====================================
# NEW BEARER TOKEN VERSION
# =====================================

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        security_optional
    ),
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials
        
    if not token:
        return None
        
    try:
        payload = decode_access_token(token)
    except Exception:
        return None
        
    if not payload:
        return None

    user = (
        db.query(User)
        .filter(
            User.id == int(payload["sub"])
        )
        .first()
    )

    return user

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(
        security_optional
    ),
    db: Session = Depends(get_db)
):

    token = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials
        
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    payload = decode_access_token(
        token
    )

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = (
        db.query(User)
        .filter(
            User.id == int(payload["sub"])
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def get_current_recruiter(
    current_user: User = Depends(
        get_current_user
    )
):

    if current_user.user_type != 1:

        raise HTTPException(
            status_code=403,
            detail="Recruiter access required"
        )

    return current_user


def get_current_candidate(
    current_user: User = Depends(
        get_current_user
    )
):

    if current_user.user_type != 2:

        raise HTTPException(
            status_code=403,
            detail="Candidate only"
        )

    return current_user
