from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.exceptions import Forbidden, NotFound, Unprocessable
from app.core.security import decode_token
from app.deps.auth import get_current_user
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate
from app.services import review_service

router = APIRouter(tags=["reviews"])


async def _get_optional_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except ValueError:
        return None


@router.get("/properties/{property_id}/reviews")
async def list_reviews(
    property_id: str,
    session: AsyncSession = Depends(get_session),
    current_user_id: str | None = Depends(_get_optional_user_id),
):
    items = await review_service.list_property_reviews(session, property_id, current_user_id)
    return {"data": [item.model_dump(mode="json") for item in items]}


@router.post("/reviews", status_code=201)
async def create_review(
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if "appraiser" not in user.role_names:
        raise Forbidden("Requires role: appraiser")
    if not user.appraiser_profile or user.appraiser_profile.status != "approved":
        raise Forbidden("Appraiser not approved")

    existing = (
        await session.execute(
            select(Review).where(
                Review.property_id == payload.property_id,
                Review.appraiser_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise Unprocessable("이미 본 매물에 리뷰를 작성하셨습니다")

    now = datetime.now(UTC)
    review = Review(
        property_id=payload.property_id,
        appraiser_id=user.id,
        estimated_value=payload.estimated_value,
        confidence_level=payload.confidence_level,
        market_outlook=payload.market_outlook,
        outlook_reason=payload.outlook_reason,
        analysis_summary=payload.analysis_summary,
        evidence_urls=payload.evidence_urls,
        price=payload.price,
        platform_fee_rate=0.150,
        disclaimer_field_visit=payload.disclaimer_field_visit,
        status="published" if payload.publish else "draft",
        published_at=now if payload.publish else None,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return {"id": str(review.id), "status": review.status, "published_at": review.published_at}


appraiser_router = APIRouter(prefix="/appraiser", tags=["appraiser"])


@appraiser_router.get("/reviews")
async def my_reviews(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if "appraiser" not in user.role_names:
        raise Forbidden("Requires role: appraiser")
    rows = (
        await session.execute(
            select(Review)
            .where(Review.appraiser_id == user.id, Review.deleted_at.is_(None))
            .order_by(Review.created_at.desc())
        )
    ).scalars().all()
    return [
        {
            "id": str(r.id),
            "property_id": str(r.property_id),
            "estimated_value": r.estimated_value,
            "market_outlook": r.market_outlook,
            "price": r.price,
            "status": r.status,
            "published_at": r.published_at.isoformat() if r.published_at else None,
            "rating_avg": float(r.rating_avg),
            "rating_count": r.rating_count,
        }
        for r in rows
    ]
