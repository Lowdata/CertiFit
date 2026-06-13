# app/schemas/auth.py
from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import Field


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

    email: EmailStr = Field(example="ayush@gmail.com")

    password: str = Field(example="ayush123")


class TokenResponse(
    BaseModel
):

    access_token: str

    token_type: str