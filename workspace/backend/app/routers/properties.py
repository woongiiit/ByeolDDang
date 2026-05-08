from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.exceptions import Forbidden, NotFound
from app.deps.auth import get_current_user
from app.models.property import Property, PropertyImage
from app.models.user import User
from app.schemas.property import PropertyCreate, PropertyDetail, PropertyListItem
from app.services import property_service

router = APIRouter(prefix="/properties", tags=["properties"])


def _require_role(user: User, role: str) -> None:
    if role not in user.role_names:
        raise Forbidden(f"Requires role: {role}")


@router.get("", response_model=dict)
async def list_properties(
    q: str | None = None,
    category: str | None = None,
    region_code: str | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    items, total = await property_service.list_properties(
        session,
        q=q,
        category=category,
        region_code=region_code,
        price_min=price_min,
        price_max=price_max,
        page=page,
        size=size,
    )
    return {
        "data": [item.model_dump() for item in items],
        "meta": {"page": page, "size": size, "total": total},
    }


@router.get("/{property_id}", response_model=PropertyDetail)
async def get_property(property_id: str, session: AsyncSession = Depends(get_session)):
    return await property_service.get_property_detail(session, property_id)


@router.post("", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_role(user, "broker")
    prop = Property(
        broker_id=user.id,
        title=payload.title,
        title_en=payload.title_en,
        category=payload.category,
        address=payload.address,
        address_detail=payload.address_detail,
        region_code=payload.region_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        price=payload.price,
        area_m2=payload.area_m2,
        rooms=payload.rooms,
        bathrooms=payload.bathrooms,
        parking=payload.parking,
        build_year=payload.build_year,
        description=payload.description,
        checklist=payload.checklist,
        status="active",
        is_premium=False,
    )
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return await property_service.get_property_detail(session, str(prop.id))


@router.post("/{property_id}/images", status_code=201)
async def add_image_url(
    property_id: str,
    body: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """단순 URL 등록 엔드포인트 (S3 presign 흐름은 Phase 2)."""
    _require_role(user, "broker")
    prop = (
        await session.execute(select(Property).where(Property.id == property_id))
    ).scalar_one_or_none()
    if not prop:
        raise NotFound("Property not found")
    if prop.broker_id != user.id:
        raise Forbidden("Not your property")

    img = PropertyImage(
        property_id=prop.id,
        url=body["url"],
        thumbnail_url=body.get("thumbnail_url"),
        sort_order=body.get("sort_order", len(prop.images)),
        is_main=body.get("is_main", len(prop.images) == 0),
    )
    session.add(img)
    await session.commit()
    return {"id": str(img.id), "url": img.url, "is_main": img.is_main}


broker_router = APIRouter(prefix="/broker", tags=["broker"])


@broker_router.get("/properties", response_model=list[PropertyListItem])
async def my_listings(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_role(user, "broker")
    rows = (
        await session.execute(
            select(Property)
            .where(Property.broker_id == user.id, Property.deleted_at.is_(None))
            .order_by(Property.created_at.desc())
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
                rating_avg=round(
                    sum(float(r.rating_avg) for r in published_reviews) / len(published_reviews),
                    2,
                ) if published_reviews else 0.0,
                review_count=len(published_reviews),
            )
        )
    _ = datetime.now(UTC)  # noqa: F841
    return items
