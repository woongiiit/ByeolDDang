from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.exceptions import Forbidden, Unauthenticated
from app.core.security import decode_token
from app.models.user import User


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_session),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise Unauthenticated("Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise Unauthenticated(str(e)) from e
    if payload.get("type") != "access":
        raise Unauthenticated("Wrong token type")
    user_id = payload.get("sub")
    if not user_id:
        raise Unauthenticated("Invalid token subject")

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or user.deleted_at:
        raise Unauthenticated("User not found")
    return user


def require_roles(*required: str):
    async def _checker(user: User = Depends(get_current_user)) -> User:
        if not set(required).issubset(set(user.role_names)):
            raise Forbidden(f"Requires role: {', '.join(required)}")
        return user

    return _checker
