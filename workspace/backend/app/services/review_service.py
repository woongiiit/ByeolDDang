from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import ReviewPurchase
from app.models.review import Review
from app.schemas.review import ReviewAppraiserOut, ReviewListItem


def mask_value(value: int) -> str:
    if value <= 0:
        return "-"
    eok = value / 100_000_000
    if eok >= 1:
        return f"{int(eok)}.X억원"
    cheonman = value / 10_000_000
    return f"{int(cheonman)}.X천만원"


async def list_property_reviews(
    session: AsyncSession, property_id: str, current_user_id: str | None
) -> list[ReviewListItem]:
    rows = (
        await session.execute(
            select(Review).where(
                and_(
                    Review.property_id == property_id,
                    Review.status == "published",
                    Review.deleted_at.is_(None),
                )
            )
        )
    ).scalars().all()

    purchases_by_review: dict[str, ReviewPurchase] = {}
    if current_user_id and rows:
        review_ids = [r.id for r in rows]
        purchases = (
            await session.execute(
                select(ReviewPurchase).where(
                    ReviewPurchase.review_id.in_(review_ids),
                    ReviewPurchase.buyer_id == current_user_id,
                )
            )
        ).scalars().all()
        purchases_by_review = {str(rp.review_id): rp for rp in purchases}

    items: list[ReviewListItem] = []
    for r in rows:
        rp = purchases_by_review.get(str(r.id))
        unlocked = rp is not None
        appraiser = r.appraiser
        appraiser_profile = appraiser.appraiser_profile

        item = ReviewListItem(
            id=str(r.id),
            appraiser=ReviewAppraiserOut(
                id=str(appraiser.id),
                name=appraiser.name,
                avatar_url=appraiser.avatar_url,
                years_of_experience=appraiser_profile.years_of_experience if appraiser_profile else None,
                specialty=appraiser_profile.specialty if appraiser_profile else None,
                rating_avg=float(r.rating_avg) if r.rating_avg else None,
            ),
            market_outlook=r.market_outlook,  # type: ignore[arg-type]
            price=r.price,
            is_unlocked=unlocked,
            purchased_at=rp.created_at if rp else None,
            published_at=r.published_at,
            rating_avg=float(r.rating_avg),
            rating_count=r.rating_count,
            estimated_value_masked=mask_value(r.estimated_value),
            confidence_level=r.confidence_level if unlocked else None,  # type: ignore[arg-type]
            estimated_value=r.estimated_value if unlocked else None,
            outlook_reason=r.outlook_reason if unlocked else None,
            analysis_summary=r.analysis_summary if unlocked else None,
            evidence_urls=list(r.evidence_urls) if unlocked else None,
            disclaimer_field_visit=r.disclaimer_field_visit if unlocked else None,
        )
        items.append(item)
    return items
