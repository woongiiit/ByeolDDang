"""토큰 월렛 서비스. 모든 토큰 이동의 단일 진입점."""
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Conflict, NotFound, Unprocessable
from app.models.payment import Payment
from app.models.wallet import TokenPackage, TokenTransaction, Wallet
from app.schemas.wallet import (
    ChargeResponse,
    TokenPackageOut,
    TokenTransactionOut,
    WalletOut,
)

TokenTxType = Literal[
    "charge", "spend_review", "earn_review_sale", "refund", "admin_adjust"
]


async def get_or_create_wallet(session: AsyncSession, user_id: str) -> Wallet:
    wallet = (
        await session.execute(select(Wallet).where(Wallet.user_id == user_id))
    ).scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id)
        session.add(wallet)
        await session.flush()
    return wallet


async def list_packages(session: AsyncSession) -> list[TokenPackageOut]:
    rows = (
        await session.execute(
            select(TokenPackage).where(TokenPackage.is_active.is_(True)).order_by(TokenPackage.sort_order)
        )
    ).scalars().all()
    return [
        TokenPackageOut(
            id=str(p.id),
            code=p.code,
            name=p.name,
            price_krw=p.price_krw,
            tokens=p.tokens,
            bonus_tokens=p.bonus_tokens,
            sort_order=p.sort_order,
            description=p.description,
        )
        for p in rows
    ]


def _serialize_wallet(w: Wallet) -> WalletOut:
    return WalletOut(
        user_id=str(w.user_id),
        balance_tokens=w.balance_tokens,
        total_charged=w.total_charged,
        total_spent=w.total_spent,
        total_earned=w.total_earned,
        updated_at=w.updated_at,
    )


async def get_my_wallet(session: AsyncSession, user_id: str) -> WalletOut:
    w = await get_or_create_wallet(session, user_id)
    await session.commit()
    return _serialize_wallet(w)


async def list_transactions(
    session: AsyncSession, user_id: str, page: int = 1, size: int = 30
) -> tuple[list[TokenTransactionOut], int]:
    q = select(TokenTransaction).where(TokenTransaction.user_id == user_id)
    rows = (
        await session.execute(
            q.order_by(TokenTransaction.created_at.desc())
            .limit(size)
            .offset((page - 1) * size)
        )
    ).scalars().all()
    items = [
        TokenTransactionOut(
            id=str(r.id),
            direction=r.direction,  # type: ignore[arg-type]
            type=r.type,  # type: ignore[arg-type]
            tokens=r.tokens,
            balance_after=r.balance_after,
            related_id=str(r.related_id) if r.related_id else None,
            related_type=r.related_type,
            memo=r.memo,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return items, len(items)


async def _apply_movement(
    session: AsyncSession,
    user_id: str,
    direction: Literal["in", "out"],
    tx_type: TokenTxType,
    tokens: int,
    related_id: str | None = None,
    related_type: str | None = None,
    memo: str | None = None,
) -> Wallet:
    """잔액 이동 + ledger 1건. 호출자가 트랜잭션 commit 책임."""
    if tokens <= 0:
        raise Unprocessable("tokens must be positive")
    wallet = await get_or_create_wallet(session, user_id)

    if direction == "in":
        wallet.balance_tokens += tokens
        if tx_type == "charge":
            wallet.total_charged += tokens
        elif tx_type == "earn_review_sale":
            wallet.total_earned += tokens
    else:
        if wallet.balance_tokens < tokens:
            raise Unprocessable("Insufficient token balance")
        wallet.balance_tokens -= tokens
        if tx_type == "spend_review":
            wallet.total_spent += tokens

    session.add(
        TokenTransaction(
            user_id=user_id,
            direction=direction,
            type=tx_type,
            tokens=tokens,
            balance_after=wallet.balance_tokens,
            related_id=related_id,
            related_type=related_type,
            memo=memo,
        )
    )
    return wallet


async def charge(session: AsyncSession, user_id: str, package_id: str) -> ChargeResponse:
    pkg = (
        await session.execute(select(TokenPackage).where(TokenPackage.id == package_id))
    ).scalar_one_or_none()
    if not pkg or not pkg.is_active:
        raise NotFound("Token package not found")

    granted = pkg.tokens + pkg.bonus_tokens

    payment = Payment(
        user_id=user_id,
        pg_provider="manual",
        pg_tx_id=None,
        purpose="token_charge",
        target_id=pkg.id,
        amount=pkg.price_krw,
        currency="KRW",
        status="succeeded",
        paid_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )
    session.add(payment)
    await session.flush()

    wallet = await _apply_movement(
        session,
        user_id=user_id,
        direction="in",
        tx_type="charge",
        tokens=granted,
        related_id=str(payment.id),
        related_type="payment",
        memo=f"패키지 충전: {pkg.name}",
    )
    await session.commit()

    return ChargeResponse(
        payment_id=str(payment.id),
        package=TokenPackageOut(
            id=str(pkg.id),
            code=pkg.code,
            name=pkg.name,
            price_krw=pkg.price_krw,
            tokens=pkg.tokens,
            bonus_tokens=pkg.bonus_tokens,
            sort_order=pkg.sort_order,
            description=pkg.description,
        ),
        granted_tokens=granted,
        wallet=_serialize_wallet(wallet),
    )


async def admin_adjust(
    session: AsyncSession, user_id: str, delta_tokens: int, memo: str
) -> WalletOut:
    if delta_tokens == 0:
        raise Unprocessable("delta_tokens must not be zero")

    direction: Literal["in", "out"] = "in" if delta_tokens > 0 else "out"
    wallet = await _apply_movement(
        session,
        user_id=user_id,
        direction=direction,
        tx_type="admin_adjust",
        tokens=abs(delta_tokens),
        memo=memo,
    )
    await session.commit()
    return _serialize_wallet(wallet)


async def spend_for_review(
    session: AsyncSession,
    *,
    buyer_id: str,
    appraiser_id: str,
    review_id: str,
    price_tokens: int,
    platform_fee_rate: float,
) -> tuple[Wallet, int, int]:
    """리뷰 결제: 매수자 차감 + 평가사 적립.

    반환: (buyer_wallet, platform_fee_tokens, appraiser_payout_tokens)
    """
    if price_tokens <= 0:
        raise Unprocessable("price_tokens must be positive")

    platform_fee = round(price_tokens * platform_fee_rate)
    appraiser_payout = price_tokens - platform_fee

    if buyer_id == appraiser_id:
        raise Conflict("Cannot purchase your own review")

    buyer_wallet = await _apply_movement(
        session,
        user_id=buyer_id,
        direction="out",
        tx_type="spend_review",
        tokens=price_tokens,
        related_id=review_id,
        related_type="review_purchase",
        memo="리뷰 열람권 결제",
    )
    if appraiser_payout > 0:
        await _apply_movement(
            session,
            user_id=appraiser_id,
            direction="in",
            tx_type="earn_review_sale",
            tokens=appraiser_payout,
            related_id=review_id,
            related_type="review_purchase",
            memo="리뷰 판매 수익",
        )
    return buyer_wallet, platform_fee, appraiser_payout
