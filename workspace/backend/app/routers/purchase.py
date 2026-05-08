from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.exceptions import Forbidden
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.purchase import IntentCreate, IntentOut, ReviewPurchaseOut
from app.services import purchase_service

router = APIRouter(tags=["purchase"])


def _require_role(user: User, role: str) -> None:
    if role not in user.role_names:
        raise Forbidden(f"Requires role: {role}")


@router.post("/reviews/{review_id}/purchase", response_model=ReviewPurchaseOut, status_code=201)
async def purchase_review(
    review_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_role(user, "buyer")
    return await purchase_service.purchase_review(
        session, buyer_id=str(user.id), review_id=review_id
    )


@router.post("/properties/{property_id}/intents", response_model=IntentOut, status_code=201)
async def submit_intent(
    property_id: str,
    payload: IntentCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_role(user, "buyer")
    return await purchase_service.submit_intent(
        session, buyer_id=str(user.id), property_id=property_id, payload=payload
    )


@router.get("/me/intents", response_model=list[IntentOut])
async def get_my_intents(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await purchase_service.list_my_intents(session, str(user.id))


@router.get("/broker/intents", response_model=list[IntentOut])
async def get_broker_intents(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_role(user, "broker")
    return await purchase_service.list_broker_intents(session, str(user.id))
