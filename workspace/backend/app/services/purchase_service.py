from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Conflict, NotFound
from app.models.payment import ReviewPurchase
from app.models.property import Property, PurchaseIntent
from app.models.review import Review
from app.schemas.purchase import IntentCreate, IntentOut, ReviewPurchaseOut
from app.services import wallet_service


async def purchase_review(
    session: AsyncSession, *, buyer_id: str, review_id: str
) -> ReviewPurchaseOut:
    review = (
        await session.execute(select(Review).where(Review.id == review_id))
    ).scalar_one_or_none()
    if not review or review.status != "published":
        raise NotFound("Review not found")

    existing = (
        await session.execute(
            select(ReviewPurchase).where(
                ReviewPurchase.review_id == review_id,
                ReviewPurchase.buyer_id == buyer_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise Conflict("Already purchased")

    buyer_wallet, platform_fee, appraiser_payout = await wallet_service.spend_for_review(
        session,
        buyer_id=buyer_id,
        appraiser_id=str(review.appraiser_id),
        review_id=review_id,
        price_tokens=review.price,
        platform_fee_rate=float(review.platform_fee_rate),
    )

    purchase = ReviewPurchase(
        review_id=review.id,
        buyer_id=buyer_id,
        payment_id=None,
        price=review.price,
        platform_fee=platform_fee,
        appraiser_payout=appraiser_payout,
        viewed_at=None,
        created_at=datetime.now(UTC),
    )
    session.add(purchase)
    await session.flush()
    await session.commit()

    return ReviewPurchaseOut(
        id=str(purchase.id),
        review_id=str(review.id),
        price_tokens=review.price,
        platform_fee_tokens=platform_fee,
        appraiser_payout_tokens=appraiser_payout,
        unlocked_at=purchase.created_at,
        wallet_balance=buyer_wallet.balance_tokens,
    )


async def submit_intent(
    session: AsyncSession, *, buyer_id: str, property_id: str, payload: IntentCreate
) -> IntentOut:
    prop = (
        await session.execute(
            select(Property).where(Property.id == property_id, Property.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if not prop:
        raise NotFound("Property not found")

    existing = (
        await session.execute(
            select(PurchaseIntent).where(
                PurchaseIntent.property_id == property_id,
                PurchaseIntent.buyer_id == buyer_id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.offered_price = payload.offered_price
        existing.desired_close_date = payload.desired_close_date
        existing.message = payload.message
        existing.status = "submitted"
        intent = existing
    else:
        intent = PurchaseIntent(
            property_id=prop.id,
            buyer_id=buyer_id,
            broker_id=prop.broker_id,
            offered_price=payload.offered_price,
            desired_close_date=payload.desired_close_date,
            message=payload.message,
        )
        session.add(intent)

    await session.flush()
    await session.commit()
    return _intent_to_out(intent)


async def list_my_intents(session: AsyncSession, buyer_id: str) -> list[IntentOut]:
    rows = (
        await session.execute(
            select(PurchaseIntent)
            .where(PurchaseIntent.buyer_id == buyer_id)
            .order_by(PurchaseIntent.created_at.desc())
        )
    ).scalars().all()
    return [_intent_to_out(r) for r in rows]


async def list_broker_intents(session: AsyncSession, broker_id: str) -> list[IntentOut]:
    rows = (
        await session.execute(
            select(PurchaseIntent)
            .where(PurchaseIntent.broker_id == broker_id)
            .order_by(PurchaseIntent.created_at.desc())
        )
    ).scalars().all()
    return [_intent_to_out(r) for r in rows]


def _intent_to_out(i: PurchaseIntent) -> IntentOut:
    return IntentOut(
        id=str(i.id),
        property_id=str(i.property_id),
        buyer_id=str(i.buyer_id),
        broker_id=str(i.broker_id),
        offered_price=i.offered_price,
        desired_close_date=i.desired_close_date,
        message=i.message,
        status=i.status,  # type: ignore[arg-type]
        created_at=i.created_at,
        updated_at=i.updated_at,
    )
