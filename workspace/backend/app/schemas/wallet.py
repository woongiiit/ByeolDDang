from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TokenTxType = Literal[
    "charge",
    "spend_review",
    "earn_review_sale",
    "refund",
    "admin_adjust",
]


class TokenPackageOut(BaseModel):
    id: str
    code: str
    name: str
    price_krw: int
    tokens: int
    bonus_tokens: int
    sort_order: int
    description: str | None = None

    @property
    def total_tokens(self) -> int:
        return self.tokens + self.bonus_tokens


class WalletOut(BaseModel):
    user_id: str
    balance_tokens: int
    total_charged: int
    total_spent: int
    total_earned: int
    updated_at: datetime


class TokenTransactionOut(BaseModel):
    id: str
    direction: Literal["in", "out"]
    type: TokenTxType
    tokens: int
    balance_after: int
    related_id: str | None
    related_type: str | None
    memo: str | None
    created_at: datetime


class ChargeRequest(BaseModel):
    package_id: str = Field(..., description="token_packages.id")


class ChargeResponse(BaseModel):
    payment_id: str
    package: TokenPackageOut
    granted_tokens: int
    wallet: WalletOut


class AdminAdjustRequest(BaseModel):
    delta_tokens: int = Field(..., description="양수 = 지급, 음수 = 회수")
    memo: str = Field(min_length=2)
