from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["buyer", "appraiser", "broker", "admin"]


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: str = Field(min_length=1, max_length=100)
    phone: str | None = None
    roles: list[Role] = Field(default_factory=lambda: ["buyer"])


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    avatar_url: str | None = None
    roles: list[Role]


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(TokenPair):
    user: UserPublic


class RefreshIn(BaseModel):
    refresh_token: str
