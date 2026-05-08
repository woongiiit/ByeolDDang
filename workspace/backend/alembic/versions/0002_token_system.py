"""token system + payment alterations

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-08

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1) wallets
    op.create_table(
        "wallets",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("balance_tokens", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("total_charged", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("total_spent", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("total_earned", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("balance_tokens >= 0", name="ck_wallet_nonnegative"),
    )

    # 2) token_transactions (Ledger)
    op.create_table(
        "token_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("direction", sa.String(3), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("tokens", sa.BigInteger, nullable=False),
        sa.Column("balance_after", sa.BigInteger, nullable=False),
        sa.Column("related_id", postgresql.UUID(as_uuid=True)),
        sa.Column("related_type", sa.String(30)),
        sa.Column("memo", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("direction IN ('in','out')", name="ck_token_tx_direction"),
        sa.CheckConstraint("tokens > 0", name="ck_token_tx_positive"),
    )
    op.create_index("ix_token_tx_user_created", "token_transactions", ["user_id", "created_at"])
    op.create_index("ix_token_tx_related", "token_transactions", ["related_type", "related_id"])

    # 3) token_packages
    op.create_table(
        "token_packages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(30), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("price_krw", sa.Integer, nullable=False),
        sa.Column("tokens", sa.Integer, nullable=False),
        sa.Column("bonus_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("description", sa.Text),
    )

    # 4) payments: purpose CHECK 변경 (token_charge 추가, review 유지하되 사용 안함)
    op.drop_constraint("ck_payment_purpose", "payments", type_="check")
    op.create_check_constraint(
        "ck_payment_purpose",
        "payments",
        "purpose IN ('review','transaction_fee','token_charge')",
    )

    # 5) review_purchases: payment_id NULLABLE
    op.alter_column("review_purchases", "payment_id", nullable=True)


def downgrade() -> None:
    op.alter_column("review_purchases", "payment_id", nullable=False)

    op.drop_constraint("ck_payment_purpose", "payments", type_="check")
    op.create_check_constraint(
        "ck_payment_purpose",
        "payments",
        "purpose IN ('review','transaction_fee')",
    )

    op.drop_table("token_packages")
    op.drop_index("ix_token_tx_related", table_name="token_transactions")
    op.drop_index("ix_token_tx_user_created", table_name="token_transactions")
    op.drop_table("token_transactions")
    op.drop_table("wallets")
