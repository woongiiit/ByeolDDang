"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-08

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("avatar_url", sa.Text),
        sa.Column("email_verified_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_roles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.String(20), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role IN ('buyer','appraiser','broker','admin')", name="ck_user_roles_role"),
    )

    op.create_table(
        "appraiser_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("license_no", sa.String(50), nullable=False),
        sa.Column("license_image_url", sa.Text, nullable=False),
        sa.Column("years_of_experience", sa.Integer),
        sa.Column("specialty", sa.String(255)),
        sa.Column("bio", sa.Text),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True)),
        sa.Column("rejection_reason", sa.Text),
        sa.CheckConstraint("status IN ('pending','approved','rejected','revoked')", name="ck_appraiser_status"),
    )

    op.create_table(
        "broker_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("office_name", sa.String(200), nullable=False),
        sa.Column("license_no", sa.String(50), nullable=False),
        sa.Column("office_address", sa.String(255)),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('pending','approved','rejected')", name="ck_broker_status"),
    )

    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("broker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("title_en", sa.String(255)),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("address_detail", sa.String(255)),
        sa.Column("region_code", sa.String(10), nullable=False),
        sa.Column("latitude", sa.Numeric(10, 7)),
        sa.Column("longitude", sa.Numeric(10, 7)),
        sa.Column("price", sa.BigInteger, nullable=False),
        sa.Column("area_m2", sa.Numeric(10, 2), nullable=False),
        sa.Column("rooms", sa.Integer),
        sa.Column("bathrooms", sa.Integer),
        sa.Column("parking", sa.Integer),
        sa.Column("build_year", sa.Integer),
        sa.Column("description", sa.Text),
        sa.Column("checklist", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("is_premium", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("category IN ('apartment','villa','detached','officetel','commercial','land')", name="ck_property_category"),
        sa.CheckConstraint("status IN ('draft','active','sold','withdrawn')", name="ck_property_status"),
    )
    op.create_index("ix_properties_broker_id", "properties", ["broker_id"])
    op.create_index("ix_properties_category", "properties", ["category"])
    op.create_index("ix_properties_region", "properties", ["region_code"])
    op.create_index("ix_properties_price", "properties", ["price"])
    op.create_index("ix_properties_status", "properties", ["status"])

    op.create_table(
        "property_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("thumbnail_url", sa.Text),
        sa.Column("sort_order", sa.Integer, server_default="0"),
        sa.Column("is_main", sa.Boolean, server_default=sa.text("false")),
    )
    op.create_index("ix_property_images_property_id", "property_images", ["property_id"])

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("appraiser_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("estimated_value", sa.BigInteger, nullable=False),
        sa.Column("confidence_level", sa.String(20)),
        sa.Column("market_outlook", sa.String(20), nullable=False),
        sa.Column("outlook_reason", sa.Text, nullable=False),
        sa.Column("analysis_summary", sa.Text, nullable=False),
        sa.Column("evidence_urls", postgresql.ARRAY(sa.Text), nullable=False, server_default="{}"),
        sa.Column("price", sa.BigInteger, nullable=False),
        sa.Column("platform_fee_rate", sa.Numeric(4, 3), nullable=False, server_default="0.150"),
        sa.Column("disclaimer_field_visit", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("rating_avg", sa.Numeric(3, 2), server_default="0"),
        sa.Column("rating_count", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("property_id", "appraiser_id", name="uq_review_property_appraiser"),
        sa.CheckConstraint("market_outlook IN ('bullish','neutral','bearish')", name="ck_review_outlook"),
        sa.CheckConstraint("status IN ('draft','published','archived')", name="ck_review_status"),
    )
    op.create_index("ix_reviews_property_id", "reviews", ["property_id"])
    op.create_index("ix_reviews_appraiser_id", "reviews", ["appraiser_id"])

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("pg_provider", sa.String(20), nullable=False),
        sa.Column("pg_tx_id", sa.String(100)),
        sa.Column("purpose", sa.String(20), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.BigInteger, nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="KRW"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("failure_reason", sa.Text),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("refunded_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("pg_provider IN ('toss','portone','manual')", name="ck_payment_pg"),
        sa.CheckConstraint("purpose IN ('review','transaction_fee')", name="ck_payment_purpose"),
        sa.CheckConstraint("status IN ('pending','succeeded','failed','refunded')", name="ck_payment_status"),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_pg_tx_id", "payments", ["pg_tx_id"])

    op.create_table(
        "review_purchases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reviews.id"), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payments.id"), nullable=False),
        sa.Column("price", sa.BigInteger, nullable=False),
        sa.Column("platform_fee", sa.BigInteger, nullable=False),
        sa.Column("appraiser_payout", sa.BigInteger, nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("review_id", "buyer_id", name="uq_purchase_review_buyer"),
    )

    op.create_table(
        "purchase_intents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("broker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("offered_price", sa.BigInteger, nullable=False),
        sa.Column("desired_close_date", sa.Date),
        sa.Column("message", sa.Text),
        sa.Column("status", sa.String(20), nullable=False, server_default="submitted"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("property_id", "buyer_id", name="uq_intent_property_buyer"),
        sa.CheckConstraint("status IN ('submitted','viewed','accepted','rejected','withdrawn')", name="ck_intent_status"),
    )

    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("broker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("sale_price", sa.BigInteger, nullable=False),
        sa.Column("broker_fee", sa.BigInteger, nullable=False),
        sa.Column("platform_fee", sa.BigInteger, nullable=False),
        sa.Column("appraiser_bonus_total", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("total_fee", sa.BigInteger, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="reported"),
        sa.Column("contract_doc_url", sa.Text),
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.Column("verified_by", postgresql.UUID(as_uuid=True)),
        sa.Column("settled_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('reported','verified','settled','disputed')", name="ck_tx_status"),
    )

    op.create_table(
        "payouts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("transaction_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("transactions.id")),
        sa.Column("review_purchase_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("review_purchases.id")),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recipient_role", sa.String(20), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("amount", sa.BigInteger, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("recipient_role IN ('platform','broker','appraiser')", name="ck_payout_recipient"),
        sa.CheckConstraint("status IN ('pending','paid','failed')", name="ck_payout_status"),
        sa.CheckConstraint(
            "(transaction_id IS NOT NULL) <> (review_purchase_id IS NOT NULL)",
            name="ck_payout_one_source",
        ),
    )


def downgrade() -> None:
    op.drop_table("payouts")
    op.drop_table("transactions")
    op.drop_table("purchase_intents")
    op.drop_table("review_purchases")
    op.drop_table("payments")
    op.drop_table("reviews")
    op.drop_table("property_images")
    op.drop_table("properties")
    op.drop_table("broker_profiles")
    op.drop_table("appraiser_profiles")
    op.drop_table("user_roles")
    op.drop_table("users")
