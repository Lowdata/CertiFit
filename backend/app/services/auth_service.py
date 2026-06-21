from sqlalchemy.orm import Session

from app.models.user import User

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


def register_user(
    db: Session,
    name: str,
    email: str,
    password: str,
    user_type: int
):

    if user_type not in (1, 2):
        raise ValueError(
            "Invalid user type"
        )

    existing = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing:
        raise ValueError(
            "Email already exists"
        )

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        user_type=user_type
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user


def login_user(
    db: Session,
    email: str,
    password: str
):

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        return None

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    token = create_access_token(
        user.id,
        user.user_type
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
