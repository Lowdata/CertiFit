# app/core/dependencies.py

from fastapi import Depends
from fastapi import HTTPException

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


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

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
    current_user=Depends(
        get_current_user
    )
):

    if current_user.user_type != 1:

        raise HTTPException(
            status_code=403,
            detail="Recruiter only"
        )

    return current_user


def get_current_candidate(
    current_user=Depends(
        get_current_user
    )
):

    if current_user.user_type != 2:

        raise HTTPException(
            status_code=403,
            detail="Candidate only"
        )

    return current_user

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