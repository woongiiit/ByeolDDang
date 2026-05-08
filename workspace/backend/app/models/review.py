import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models._base import SoftDeleteMixin, TimestampMixin, UUIDPKMixin


class Review(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("property_id", "appraiser_id", name="uq_review_property_appraiser"),)

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True
    )
    appraiser_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    estimated_value: Mapped[int] = mapped_column(BigInteger, nullable=False)
    confidence_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    market_outlook: Mapped[str] = mapped_column(String(20), nullable=False)
    outlook_reason: Mapped[str] = mapped_column(Text, nullable=False)
    analysis_summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_urls: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    price: Mapped[int] = mapped_column(BigInteger, nullable=False)
    platform_fee_rate: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False, default=0.150)
    disclaimer_field_visit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rating_avg: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    property = relationship("Property", back_populates="reviews", lazy="joined")
    appraiser = relationship("User", lazy="joined")
