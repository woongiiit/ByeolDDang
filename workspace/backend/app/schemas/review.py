from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

MarketOutlook = Literal["bullish", "neutral", "bearish"]
ConfidenceLevel = Literal["low", "medium", "high"]


class ReviewAppraiserOut(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    years_of_experience: int | None = None
    specialty: str | None = None
    rating_avg: float | None = None


class ReviewListItem(BaseModel):
    id: str
    appraiser: ReviewAppraiserOut
    market_outlook: MarketOutlook
    price: int
    is_unlocked: bool
    purchased_at: datetime | None
    published_at: datetime | None
    rating_avg: float
    rating_count: int
    estimated_value_masked: str
    confidence_level: ConfidenceLevel | None
    estimated_value: int | None = None
    outlook_reason: str | None = None
    analysis_summary: str | None = None
    evidence_urls: list[str] | None = None
    disclaimer_field_visit: bool | None = None


class ReviewCreate(BaseModel):
    property_id: str
    estimated_value: int = Field(gt=0)
    confidence_level: ConfidenceLevel = "medium"
    market_outlook: MarketOutlook
    outlook_reason: str = Field(min_length=10)
    analysis_summary: str = Field(min_length=10)
    evidence_urls: list[str] = Field(default_factory=list, max_length=10)
    price: int = Field(ge=10000, le=1_000_000)
    disclaimer_field_visit: bool = False
    publish: bool = True
