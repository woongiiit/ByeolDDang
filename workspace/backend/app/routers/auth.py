from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginIn, SignupIn, UserPublic
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupIn, session: AsyncSession = Depends(get_session)):
    return await auth_service.signup(session, payload)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginIn, session: AsyncSession = Depends(get_session)):
    return await auth_service.login(session, payload)


me_router = APIRouter(tags=["me"])


@me_router.get("/me", response_model=UserPublic)
async def get_me(user: User = Depends(get_current_user)):
    return UserPublic(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        roles=user.role_names,  # type: ignore[arg-type]
    )
