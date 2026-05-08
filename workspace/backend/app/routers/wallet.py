from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.wallet import (
    ChargeRequest,
    ChargeResponse,
    TokenPackageOut,
    TokenTransactionOut,
    WalletOut,
)
from app.services import wallet_service

router = APIRouter(tags=["wallet"])


@router.get("/tokens/packages", response_model=list[TokenPackageOut])
async def list_token_packages(session: AsyncSession = Depends(get_session)):
    return await wallet_service.list_packages(session)


@router.get("/me/wallet", response_model=WalletOut)
async def get_my_wallet(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await wallet_service.get_my_wallet(session, str(user.id))


@router.get("/me/wallet/transactions", response_model=dict)
async def get_my_wallet_transactions(
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=100),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    items, total = await wallet_service.list_transactions(session, str(user.id), page, size)
    return {
        "data": [it.model_dump(mode="json") for it in items],
        "meta": {"page": page, "size": size, "total": total},
    }


@router.post("/tokens/charge", response_model=ChargeResponse, status_code=201)
async def charge_tokens(
    payload: ChargeRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await wallet_service.charge(session, str(user.id), payload.package_id)
