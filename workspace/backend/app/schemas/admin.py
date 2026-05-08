from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AppraiserApplicationOut(BaseModel):
    user_id: str
    name: str
    email: str
    license_no: str
    license_image_url: str
    years_of_experience: int | None
    specialty: str | None
    bio: str | None
    status: Literal["pending", "approved", "rejected", "revoked"]
    rejection_reason: str | None
    approved_at: datetime | None


class BrokerApplicationOut(BaseModel):
    user_id: str
    name: str
    email: str
    office_name: str
    license_no: str
    office_address: str | None
    status: Literal["pending", "approved", "rejected"]
    approved_at: datetime | None


class RejectRequest(BaseModel):
    reason: str


class TransactionVerifyOut(BaseModel):
    id: str
    property_id: str
    sale_price: int
    platform_fee: int
    broker_fee: int
    appraiser_bonus_total: int
    total_fee: int
    status: str
