from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Conflict, Unauthenticated
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import AuthResponse, LoginIn, SignupIn, UserPublic


async def signup(session: AsyncSession, payload: SignupIn) -> AuthResponse:
    existing = (
        await session.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if existing:
        raise Conflict("Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        phone=payload.phone,
    )
    session.add(user)
    await session.flush()

    now = datetime.now(UTC)
    for role in payload.roles:
        session.add(UserRole(user_id=user.id, role=role, created_at=now))

    await session.commit()
    await session.refresh(user)
    return _build_auth_response(user)


async def login(session: AsyncSession, payload: LoginIn) -> AuthResponse:
    user = (
        await session.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if not user or user.deleted_at or not verify_password(payload.password, user.password_hash):
        raise Unauthenticated("Invalid credentials")
    return _build_auth_response(user)


def _build_auth_response(user: User) -> AuthResponse:
    roles = user.role_names
    return AuthResponse(
        access_token=create_access_token(str(user.id), roles),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserPublic(
            id=str(user.id),
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            roles=roles,  # type: ignore[arg-type]
        ),
    )
