# app/schemas/auth.py
from pydantic import BaseModel
from pydantic import EmailStr


class RegisterRequest(
    BaseModel
):

    name: str

    email: EmailStr

    password: str

    user_type: int


class LoginRequest(
    BaseModel
):

    email: EmailStr

    password: str


class TokenResponse(
    BaseModel
):

    access_token: str

    token_type: str