from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFound
from app.models.property import Property, PropertyImage
from app.models.review import Review
from app.models.user import User
from app.schemas.property import (
    PropertyBrokerOut,
    PropertyDetail,
    PropertyImageOut,
    PropertyListItem,
    PropertyReviewSummary,
)

PYEONG_PER_M2 = 1 / 3.305785


async def list_properties(
    session: AsyncSession,
    *,
    q: str | None = None,
    category: str | None = None,
    region_code: str | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[PropertyListItem], int]:
    conditions = [Property.deleted_at.is_(None), Property.status == "active"]
    if q:
        conditions.append(Property.title.ilike(f"%{q}%"))
    if category:
        conditions.append(Property.category == category)
    if region_code:
        conditions.append(Property.region_code.startswith(region_code))
    if price_min is not None:
        conditions.append(Property.price >= price_min)
    if price_max is not None:
        conditions.append(Property.price <= price_max)

    base = select(Property).where(and_(*conditions))
    total = (await session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await session.execute(
            base.order_by(Property.created_at.desc()).limit(size).offset((page - 1) * size)
        )
    ).scalars().all()

    items: list[PropertyListItem] = []
    for p in rows:
        main_image = next((img for img in p.images if img.is_main), p.images[0] if p.images else None)
        published_reviews = [r for r in p.reviews if r.status == "published"]
        items.append(
            PropertyListItem(
                id=str(p.id),
                title=p.title,
                category=p.category,  # type: ignore[arg-type]
                address=p.address,
                price=p.price,
                area_m2=float(p.area_m2),
                rooms=p.rooms,
                bathrooms=p.bathrooms,
                is_premium=p.is_premium,
                main_image_url=main_image.url if main_image else None,
                rating_avg=_avg([float(r.rating_avg) for r in published_reviews]),
                review_count=len(published_reviews),
            )
        )
    return items, total


async def get_property_detail(session: AsyncSession, property_id: str) -> PropertyDetail:
    p = (
        await session.execute(
            select(Property).where(Property.id == property_id, Property.deleted_at.is_(None))
        )
    ).scalar_one_or_none()
    if not p:
        raise NotFound("Property not found")

    broker = (await session.execute(select(User).where(User.id == p.broker_id))).scalar_one()
    published_reviews = [r for r in p.reviews if r.status == "published"]

    return PropertyDetail(
        id=str(p.id),
        title=p.title,
        title_en=p.title_en,
        category=p.category,  # type: ignore[arg-type]
        address=p.address,
        address_detail=p.address_detail,
        region_code=p.region_code,
        latitude=float(p.latitude) if p.latitude is not None else None,
        longitude=float(p.longitude) if p.longitude is not None else None,
        price=p.price,
        area_m2=float(p.area_m2),
        area_pyeong=int(round(float(p.area_m2) * PYEONG_PER_M2)),
        rooms=p.rooms,
        bathrooms=p.bathrooms,
        parking=p.parking,
        build_year=p.build_year,
        description=p.description,
        checklist=p.checklist or {},
        status=p.status,  # type: ignore[arg-type]
        is_premium=p.is_premium,
        images=[
            PropertyImageOut(
                id=str(img.id),
                url=img.url,
                thumbnail_url=img.thumbnail_url,
                is_main=img.is_main,
                sort_order=img.sort_order,
            )
            for img in sorted(p.images, key=lambda i: (not i.is_main, i.sort_order))
        ],
        broker=PropertyBrokerOut(
            id=str(broker.id),
            name=broker.name,
            avatar_url=broker.avatar_url,
            office_name=broker.broker_profile.office_name if broker.broker_profile else None,
        ),
        reviews_summary=PropertyReviewSummary(
            count=len(published_reviews),
            min_price=min((r.price for r in published_reviews), default=None),
            max_price=max((r.price for r in published_reviews), default=None),
            avg_rating=_avg([float(r.rating_avg) for r in published_reviews]) or None,
        ),
    )


def _avg(values: list[float]) -> float:
    return round(sum(values) / len(values), 2) if values else 0.0
