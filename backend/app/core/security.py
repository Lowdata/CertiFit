from datetime import datetime
from datetime import timedelta
from datetime import timezone

from jose import jwt
from jose import JWTError

from pwdlib import PasswordHash

from app.core.config import SECRET_KEY


ALGORITHM = "HS256"

# Token expiration time in minutes (30 days) change it in production to 15 minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:

    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return password_hash.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
    user_id: int,
    user_type: int
) -> str:

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "user_type": user_type,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(
    token: str
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:

        return None