from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.deps.auth import require_roles
from app.models.user import User
from app.schemas.admin import (
    AppraiserApplicationOut,
    BrokerApplicationOut,
    RejectRequest,
    TransactionVerifyOut,
)
from app.schemas.wallet import AdminAdjustRequest, WalletOut
from app.services import admin_service, wallet_service

router = APIRouter(prefix="/admin", tags=["admin"])

_AdminGuard = Depends(require_roles("admin"))


@router.get("/appraisers", response_model=list[AppraiserApplicationOut])
async def list_appraisers(
    status: str | None = Query(None),
    user: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    return await admin_service.list_appraisers(session, status=status)


@router.post("/appraisers/{user_id}/approve", status_code=204)
async def approve_appraiser(
    user_id: str,
    admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    await admin_service.approve_appraiser(session, user_id, str(admin.id))


@router.post("/appraisers/{user_id}/reject", status_code=204)
async def reject_appraiser(
    user_id: str,
    payload: RejectRequest,
    _admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    await admin_service.reject_appraiser(session, user_id, payload.reason)


@router.get("/brokers", response_model=list[BrokerApplicationOut])
async def list_brokers(
    status: str | None = Query(None),
    _admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    return await admin_service.list_brokers(session, status=status)


@router.post("/brokers/{user_id}/approve", status_code=204)
async def approve_broker(
    user_id: str,
    _admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    await admin_service.approve_broker(session, user_id)


@router.get("/transactions", response_model=list[TransactionVerifyOut])
async def list_pending_transactions(
    _admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    rows = await admin_service.list_pending_transactions(session)
    return [
        TransactionVerifyOut(
            id=str(t.id),
            property_id=str(t.property_id),
            sale_price=t.sale_price,
            platform_fee=t.platform_fee,
            broker_fee=t.broker_fee,
            appraiser_bonus_total=t.appraiser_bonus_total,
            total_fee=t.total_fee,
            status=t.status,
        )
        for t in rows
    ]


@router.post("/transactions/{tx_id}/verify", response_model=TransactionVerifyOut)
async def verify_transaction(
    tx_id: str,
    admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    t = await admin_service.verify_transaction(session, tx_id, str(admin.id))
    return TransactionVerifyOut(
        id=str(t.id),
        property_id=str(t.property_id),
        sale_price=t.sale_price,
        platform_fee=t.platform_fee,
        broker_fee=t.broker_fee,
        appraiser_bonus_total=t.appraiser_bonus_total,
        total_fee=t.total_fee,
        status=t.status,
    )


@router.post("/wallets/{user_id}/adjust", response_model=WalletOut)
async def admin_adjust_wallet(
    user_id: str,
    payload: AdminAdjustRequest,
    _admin: User = _AdminGuard,
    session: AsyncSession = Depends(get_session),
):
    return await wallet_service.admin_adjust(
        session, user_id=user_id, delta_tokens=payload.delta_tokens, memo=payload.memo
    )
