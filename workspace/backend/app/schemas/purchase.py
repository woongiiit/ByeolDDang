from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

IntentStatus = Literal["submitted", "viewed", "accepted", "rejected", "withdrawn"]


class ReviewPurchaseOut(BaseModel):
    id: str
    review_id: str
    price_tokens: int
    platform_fee_tokens: int
    appraiser_payout_tokens: int
    unlocked_at: datetime
    wallet_balance: int


class IntentCreate(BaseModel):
    offered_price: int = Field(ge=0, description="의향가 (KRW)")
    desired_close_date: date | None = None
    message: str | None = None


class IntentOut(BaseModel):
    id: str
    property_id: str
    buyer_id: str
    broker_id: str
    offered_price: int
    desired_close_date: date | None
    message: str | None
    status: IntentStatus
    created_at: datetime
    updated_at: datetime
